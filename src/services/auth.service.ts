import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError";
import { UserModel } from "../models/user.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_MAX_AGE_MS,
} from "../utils/jwt";
import config from "../config/db";

/** Cookie options for the HttpOnly refresh token cookie */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,                                                         // Not accessible via JS
  secure: config.node_env === "production",                              // HTTPS-only in prod
  sameSite: config.node_env === "production" ? ("none" as const) : ("lax" as const), // Lax for local dev, none for cross-site prod
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  path: "/",
};

/** Strips the password and refreshToken fields before sending user data */
const sanitizeUser = (user: InstanceType<typeof UserModel>) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
});

export const AuthService = {
  /**
   * Register a new user.
   * Returns: { user, accessToken }
   * Sets: refresh token as HttpOnly cookie
   */
  async register(req: Request, res: Response) {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password)
      throw new ApiError(400, "First name, last name, email, and password are required");

    const existing = await UserModel.findOne({ email });
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken({ id: user._id, email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, email, role: user.role });

    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token as a secure HttpOnly cookie
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    return { user: sanitizeUser(user), accessToken };
  },

  /**
   * Login an existing user.
   * Returns: { user, accessToken }
   * Sets: refresh token as HttpOnly cookie
   */
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password)
      throw new ApiError(400, "Email and password are required");

    // Use select("+password") to explicitly include the hashed password field
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) throw new ApiError(401, "Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(401, "Invalid email or password");

    const accessToken = generateAccessToken({ id: user._id, email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, email, role: user.role });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    return { user: sanitizeUser(user), accessToken };
  },

  /**
   * Refresh the access token using the HttpOnly refresh token cookie.
   * Returns: { accessToken }
   * Rotates: the refresh token cookie (refresh token rotation)
   */
  async refreshToken(req: Request, res: Response) {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) throw new ApiError(401, "No refresh token. Please log in again.");

    // Find user by stored refresh token (ties token to exact user record)
    const user = await UserModel.findOne({ refreshToken: token });
    if (!user) {
      // Possible token reuse — clear the cookie defensively
      res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
      throw new ApiError(401, "Invalid refresh token. Please log in again.");
    }

    try {
      const decoded = verifyRefreshToken(token) as { id: string; email: string; role: string };

      // Token rotation: issue new pair on every refresh
      const newAccessToken = generateAccessToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      });
      const newRefreshToken = generateRefreshToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      });

      user.refreshToken = newRefreshToken;
      await user.save();

      res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

      return {
        user: sanitizeUser(user),
        accessToken: newAccessToken,
      };
    } catch {
      // Token is expired or tampered — clear it
      res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
      throw new ApiError(401, "Refresh token expired. Please log in again.");
    }
  },

  /**
   * Logout: clears the refresh token from DB and cookie.
   */
  async logout(req: Request, res: Response) {
    const token = req.cookies?.refreshToken as string | undefined;

    if (token) {
      // Invalidate the refresh token in the database
      await UserModel.findOneAndUpdate(
        { refreshToken: token },
        { $unset: { refreshToken: "" } }
      );
    }

    res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
    return {};
  },

  /**
   * Returns the currently authenticated user's profile.
   * Requires authenticate middleware.
   */
  async getMe(req: Request) {
    const { id } = (req as any).user;
    const user = await UserModel.findById(id);
    if (!user) throw new ApiError(404, "User not found");
    return { user: sanitizeUser(user) };
  },
};
