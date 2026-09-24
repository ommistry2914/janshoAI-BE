import mongoose from "mongoose";
import config from "./index";
import logger from "../../utils/logger";
import { ApiError } from "../../utils/ApiError";

let isConnecting = false;

/**
 * Reusable, serverless-optimized MongoDB connection manager.
 * In Vercel serverless environments, connections are reused across invocations.
 */
export const connectDB = async (): Promise<void> => {
  // If connection is already open (readyState === 1), reuse it
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!config.database_url) {
    logger.error("❌ DATABASE_URL environment variable is missing!");
    throw new ApiError(500, "DATABASE_URL is not configured in environment variables.");
  }

  // If already connecting (readyState === 2), wait for it to complete
  if (isConnecting || mongoose.connection.readyState === 2) {
    let attempts = 0;
    while (mongoose.connection.readyState === 2 && attempts < 25) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    if ((mongoose.connection.readyState as number) === 1) return;
  }

  isConnecting = true;
  try {
    const conn = await mongoose.connect(config.database_url, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5s timeout to fail fast and prevent 504 on Vercel
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error("❌ MongoDB connection failed: " + (error?.message || error));
    throw new ApiError(500, `MongoDB connection failed: ${error?.message || "Please check MongoDB Network Access (whitelist 0.0.0.0/0)"}`);
  } finally {
    isConnecting = false;
  }
};
