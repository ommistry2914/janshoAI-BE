import { Router } from "express";
import { login, register, refresh, logout, getMe } from "../controllers/auth.controller";
import { validate } from "../validation/validate";
import { loginSchema, registerSchema } from "../validation/auth.validate";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public routes — no auth required
router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);

// Refresh — reads refresh token from HttpOnly cookie (no body schema needed)
router.post("/refresh", refresh);

// Logout — reads refresh token from HttpOnly cookie
router.post("/logout", logout);

// Protected — returns the current user from the access token
router.get("/me", authenticate, getMe);

export default router;
