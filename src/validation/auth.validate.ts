// src/validations/auth.validation.ts
import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName:  z.string().trim().min(2, "Last name must be at least 2 characters"),
  email:     z.string().trim().email("Invalid email format"),
  password:  z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/,  "Password must contain at least one uppercase letter")
    .regex(/[a-z]/,  "Password must contain at least one lowercase letter")
    .regex(/[0-9]/,  "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export const loginSchema = z.object({
  email:    z.string().trim().email("Invalid email format"),
  password: z.string().trim().min(1, "Password is required"),
});

// refresh and logout now use the HttpOnly cookie — no body validation required
