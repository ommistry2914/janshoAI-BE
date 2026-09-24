import mongoose from "mongoose";
import config from "./index";
import logger from "../../utils/logger";

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

  // If already connecting (readyState === 2), wait for it to complete
  if (isConnecting || mongoose.connection.readyState === 2) {
    let attempts = 0;
    while (mongoose.connection.readyState === 2 && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    if ((mongoose.connection.readyState as number) === 1) return;
  }

  isConnecting = true;
  try {
    const conn = await mongoose.connect(config.database_url, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error("❌ MongoDB connection failed: " + error);
    throw error;
  } finally {
    isConnecting = false;
  }
};
