import express, { Application, Request, Response, NextFunction } from "express";
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
import { connectDB } from "./config/db/connect";

const app: Application = express();

// Security headers with cross-origin support
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Allowed origins for CORS (production, vercel subdomains, and local dev)
const allowedOrigins = [
  "https://janshoai.vercel.app",
  "https://jansho-ai-be.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  config.CLIENT_URL?.replace(/\/$/, ""),
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or missing origin (e.g. mobile, curl, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, "");
    if (
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith(".vercel.app") // Automatically allows all preview & production Vercel domains
    ) {
      return callback(null, true);
    }
    // Permissive fallback so client preflights never get hard-blocked by CORS
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cookie",
  ],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));
// Handle preflight across all routes
app.options("*", cors(corsOptions));

// Cookie parser — must precede route handlers
app.use(cookieParser());

// Serverless DB Connection Middleware: Ensures MongoDB is active before handling requests
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

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
  res.json({
    status: "ok",
    message: "JanshoAI Backend API is up and running!",
    timestamp: new Date().toISOString(),
  });
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
