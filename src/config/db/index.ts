// src/config/index.ts
import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, fallback = ""): string => {
  return process.env[key] || fallback;
};

const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

export default {
  port: process.env.PORT || 5000,
  database_url: getEnv("DATABASE_URL"),
  node_env: isProd ? "production" : "development",
  ACCESS_SECRET: getEnv("ACCESS_SECRET", "jansho_access_secret_key_default_2026"),
  REFRESH_TOKEN_SECRET: getEnv("REFRESH_TOKEN_SECRET", "jansho_refresh_secret_key_default_2026"),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  CLIENT_URL: getEnv("CLIENT_URL", "https://janshoai.vercel.app"),
  // Super admin seed credentials — loaded from env
  SUPER_ADMIN_EMAIL: getEnv("SUPER_ADMIN_EMAIL", "omkmistry2914@gmail.com"),
  SUPER_ADMIN_PASSWORD: getEnv("SUPER_ADMIN_PASSWORD", "Omkmistry@2914"),
  SUPER_ADMIN_FIRST_NAME: process.env.SUPER_ADMIN_FIRST_NAME || "Super",
  SUPER_ADMIN_LAST_NAME: process.env.SUPER_ADMIN_LAST_NAME || "Admin",
};
