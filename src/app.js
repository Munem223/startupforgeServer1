import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";

export const app = express();
app.set("trust proxy", 1);

// middleware
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true
}));

app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

app.use(express.json());

// AUTH (SAFE)
app.use("/api/auth", (req, res, next) => {
  const auth = req.app.get("auth");

  if (!auth) {
    return res.status(503).json({ message: "Auth not ready" });
  }

  return toNodeHandler(auth.handler)(req, res, next);
});

// routes placeholder
app.get("/health", (req, res) => {
  res.json({ ok: true });
});