import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./config/auth.js";
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

// ================= CORS =================
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === env.CLIENT_URL) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Stripe-Signature"],
  })
);

// ================= BASIC MIDDLEWARE =================
app.use(helmet());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());

// ================= HEALTH ROUTE =================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "StartupForge API running 🚀",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API healthy",
    env: env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

// ================= STRIPE WEBHOOK (RAW BODY) =================
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(stripeWebhook)
);

// ================= AUTH =================
app.all("/api/auth/*splat", toNodeHandler(auth));

// ================= PARSERS =================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= RATE LIMIT =================
app.use("/api", apiLimiter);

// ================= ROUTES =================
app.use("/api/public", publicRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/founder", founderRoutes);
app.use("/api/collaborator", collaboratorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

// ================= ERROR HANDLING =================
app.use(notFoundHandler);
app.use(errorHandler);