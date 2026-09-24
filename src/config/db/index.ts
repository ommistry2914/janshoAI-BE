// src/config/index.ts
import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export default {
  port: process.env.PORT || 5000,
  database_url: requireEnv("DATABASE_URL"),
  node_env: process.env.NODE_ENV || "development",
  ACCESS_SECRET: requireEnv("ACCESS_SECRET"),
  REFRESH_TOKEN_SECRET: requireEnv("REFRESH_TOKEN_SECRET"),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  // Super admin seed credentials — loaded exclusively from env
  SUPER_ADMIN_EMAIL: requireEnv("SUPER_ADMIN_EMAIL"),
  SUPER_ADMIN_PASSWORD: requireEnv("SUPER_ADMIN_PASSWORD"),
  SUPER_ADMIN_FIRST_NAME: process.env.SUPER_ADMIN_FIRST_NAME || "Super",
  SUPER_ADMIN_LAST_NAME: process.env.SUPER_ADMIN_LAST_NAME || "Admin",
};
