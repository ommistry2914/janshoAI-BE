import app from "../src/app";
import { Request, Response } from "express";

/**
 * Vercel Serverless Function entry point.
 * Wraps the Express application and guarantees CORS headers are preserved even on unexpected runtime failures.
 */
export default function handler(req: Request, res: Response) {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Handler Crash:", error);
    const origin = req.headers.origin || "https://janshoai.vercel.app";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal serverless error",
    });
  }
}
