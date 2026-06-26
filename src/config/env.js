import "dotenv/config";
import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  DB_NAME: z.string().min(1).default("startupforge"),
  CLIENT_URL: z.string().url(),
  SERVER_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_COOKIE_NAME: z.string().default("sf_access"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  IMGBB_API_KEY: z.string().optional().default(""),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PRICE_CENTS: z.coerce.number().int().positive().default(1900),
  STRIPE_CURRENCY: z.string().length(3).default("usd"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_SECURE: booleanFromString.default("false")
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid server environment variables:");
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const env = result.data;
export const isProduction = env.NODE_ENV === "production";
