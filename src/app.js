import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";

import { initAuth } from "./config/auth.js";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { stripeWebhook } from "./controllers/paymentController.js";
import { asyncHandler } from "./utils/asyncHandler.js";

import publicRoutes from "./routes/publicRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import founderRoutes from "./routes/founderRoutes.js";
import collaboratorRoutes from "./routes/collaboratorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

export const app = express();
app.set("trust proxy", 1);

/**
 * ⚠️ IMPORTANT:
 * DO NOT call initAuth at import time in production systems
 * It must be initialized AFTER DB in server.js
 */
let authInstance;

// CORS
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === env.CLIENT_URL) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Stripe-Signature"],
  })
);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());

// Stripe webhook (raw body required)
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(stripeWebhook)
);

/**
 * ⚠️ FIX:
 * auth is attached AFTER initAuth() runs in server.js
 */
app.use("/api/auth", (req, res, next) => {
  if (!authInstance) {
    return res.status(503).json({ message: "Auth not initialized yet" });
  }
  return toNodeHandler(authInstance.handler)(req, res, next);
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiLimiter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "StartupForge API is healthy",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/public", publicRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/founder", founderRoutes);
app.use("/api/collaborator", collaboratorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Called from server.js AFTER DB is ready
 */
export function attachAuth(instance) {
  authInstance = instance;
}