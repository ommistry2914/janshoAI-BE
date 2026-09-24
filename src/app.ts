import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import logger from "./utils/logger";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { rateLimiter } from "./middlewares/rateLimiter";
import config from "./config/db";

const app: Application = express();

// Security headers
app.use(helmet());

// CORS — allow credentials so cookies are sent cross-origin
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Cookie parser — must come before route handlers
app.use(cookieParser());

app.use(rateLimiter);
app.use(
  morgan(":method :url :status - :response-time ms", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  logger.info("Root endpoint was called 🌐");
  res.send("API is up and running!!!");
});

app.get("/health", (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  logger.info("Health check endpoint was called !!!");
  res.status(200).json({
    status: "ok",
    server: "running",
    database: states[dbState] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

app.get("/favicon.ico", (_req: Request, res: Response) => res.status(204).end());
app.use("/v1", routes);

// Global Error Handler
app.use(errorHandler);

export default app;
