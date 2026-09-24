import jwt from "jsonwebtoken";
import config from "../config/db/index";

const ACCESS_SECRET = config.ACCESS_SECRET;
const REFRESH_SECRET = config.REFRESH_TOKEN_SECRET;

// Short-lived access token (in memory / Bearer header)
const ACCESS_EXPIRES = "15m";

// Long-lived refresh token (HttpOnly secure cookie)
const REFRESH_EXPIRES = "7d";

export const generateAccessToken = (payload: object): string =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });

export const generateRefreshToken = (payload: object): string =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, ACCESS_SECRET);

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, REFRESH_SECRET);

/**
 * Returns the max-age for the refresh cookie in milliseconds.
 * Must match REFRESH_EXPIRES (7 days).
 */
export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
