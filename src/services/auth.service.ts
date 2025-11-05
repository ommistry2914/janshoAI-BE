import { Request } from "express";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError";
import { UserModel } from "../models/user.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

export const AuthService = {
  async register(req: Request) {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      throw new ApiError(400, "Name, email, and password are required");

    const existing = await UserModel.findOne({ email });
    if (existing) throw new ApiError(400, "User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken({ id: user._id, email });
    const refreshToken = generateRefreshToken({ id: user._id, email });

    user.refreshToken = refreshToken;
    await user.save();

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    return { user: safeUser, accessToken, refreshToken };
  },

  async login(req: Request) {
    const { email, password } = req.body;

    if (!email || !password)
      throw new ApiError(400, "Email and password are required");

    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(401, "Invalid email or password");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new ApiError(401, "Invalid email or password");

    const accessToken = generateAccessToken({ id: user._id, email });
    const refreshToken = generateRefreshToken({ id: user._id, email });

    user.refreshToken = refreshToken;
    await user.save();

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    return { user: safeUser, accessToken, refreshToken };
  },

  async refreshToken(req: Request) {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, "Refresh token required");

    const user = await UserModel.findOne({ refreshToken });
    if (!user) throw new ApiError(401, "Invalid refresh token");

    try {
      const decoded = verifyRefreshToken(refreshToken) as {
        id: string;
        email: string;
      };

      const newAccessToken = generateAccessToken({
        id: decoded.id,
        email: decoded.email,
      });
      const newRefreshToken = generateRefreshToken({
        id: decoded.id,
        email: decoded.email,
      });

      user.refreshToken = newRefreshToken;
      await user.save();

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
  },

  async logout(req: Request) {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, "Refresh token required");

    const user = await UserModel.findOne({ refreshToken });
    if (!user) throw new ApiError(400, "Invalid token");

    user.refreshToken = undefined;
    await user.save();

    return { message: "Logged out successfully" };
  },
};
