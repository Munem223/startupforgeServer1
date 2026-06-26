import { rateLimit } from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please wait a moment and try again."
  }
});
