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

// Security headers with cross-origin resource support
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration — supporting local, vercel preview, and production domains
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or missing origin (e.g. mobile, curl, server-to-server)
    if (!origin) return callback(null, true);

    const clean = origin.replace(/\/$/, "");
    if (
      clean === "https://janshoai.vercel.app" ||
      clean === "https://jansho-ai-be.vercel.app" ||
      clean.endsWith(".vercel.app") ||
      clean.includes("localhost") ||
      clean.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }
    // Permissive fallback so requests are never hard-blocked by CORS
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
// Handle preflight OPTIONS requests across all routes
app.options("*", cors(corsOptions));

// Cookie parser — must precede route handlers
app.use(cookieParser());

// Logging
app.use(
  morgan(":method :url :status - :response-time ms", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Public Health & Diagnostic Endpoints (never require MongoDB connection) ──
app.get("/", (_req: Request, res: Response) => {
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
  res.status(200).json({
    status: "ok",
    server: "running",
    database: states[dbState] || "unknown",
    hasDatabaseUrl: Boolean(config.database_url),
    timestamp: new Date().toISOString(),
  });
});

app.get("/favicon.ico", (_req: Request, res: Response) => res.status(204).end());

// ── Protected API Routes (ensure MongoDB is connected before running) ──
app.use(rateLimiter);

app.use(
  "/v1",
  async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
  },
  routes
);

// Global Error Handler
app.use(errorHandler);

export default app;
