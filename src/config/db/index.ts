// src/config/index.ts
import dotenv from "dotenv";

dotenv.config();

/**
 * Validates and retrieves required environment variables.
 * Fails fast with a clear error message if any critical configuration is missing.
 */
const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Please check your .env file or deployment settings.`);
  }
  return value;
};

const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

export default {
  port: process.env.PORT || 5000,
  database_url: requireEnv("DATABASE_URL"),
  node_env: isProd ? "production" : "development",
  ACCESS_SECRET: requireEnv("ACCESS_SECRET"),
  REFRESH_TOKEN_SECRET: requireEnv("REFRESH_TOKEN_SECRET"),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  CLIENT_URL: process.env.CLIENT_URL || "https://janshoai.vercel.app",
  // Super admin seed credentials — strictly loaded from environment variables
  SUPER_ADMIN_EMAIL: requireEnv("SUPER_ADMIN_EMAIL"),
  SUPER_ADMIN_PASSWORD: requireEnv("SUPER_ADMIN_PASSWORD"),
  SUPER_ADMIN_FIRST_NAME: process.env.SUPER_ADMIN_FIRST_NAME || "Super",
  SUPER_ADMIN_LAST_NAME: process.env.SUPER_ADMIN_LAST_NAME || "Admin",
};
