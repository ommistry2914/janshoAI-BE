import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/sendResponse";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { AuthService } from "../services/auth.service";

/**
 * Auth routes pass `res` to the service so it can set/clear cookies directly.
 */

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AuthService.register(req, res);
    sendResponse(res, data, "User registered successfully", 201);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AuthService.login(req, res);
    sendResponse(res, data, "Login successful", 200);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
});

export const refresh = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AuthService.refreshToken(req, res);
    sendResponse(res, data, "Token refreshed successfully", 200);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
});

export const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AuthService.logout(req, res);
    sendResponse(res, data, "Logged out successfully", 200);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
});

export const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AuthService.getMe(req);
    sendResponse(res, data, "User fetched successfully", 200);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
});
