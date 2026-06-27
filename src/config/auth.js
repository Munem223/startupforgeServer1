import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDB, mongoClient } from "./db.js";
import { env, isProduction } from "./env.js";

const socialProviders =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          prompt: "select_account",
        },
      }
    : {};

export const auth = betterAuth({
  appName: "StartupForge",
  baseURL: env.SERVER_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CLIENT_URL],

  database: mongodbAdapter(getDB(), { client: mongoClient }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
  },

  socialProviders,

  user: {
    modelName: "users",
    additionalFields: {
      role: {
        type: ["founder", "collaborator", "admin"],
        defaultValue: "collaborator",
      },
      isBlocked: { type: "boolean", defaultValue: false },
      isPremium: { type: "boolean", defaultValue: false },
      skills: { type: "string", defaultValue: "" },
      bio: { type: "string", defaultValue: "" },
      premiumUntil: { type: "string", defaultValue: "" },
    },
  },

  session: {
    modelName: "sessions",
    expiresIn: 60 * 60 * 24 * 7,
  },

  account: {
    modelName: "accounts",
  },

  verification: {
    modelName: "verifications",
  },

  advanced: {
    cookiePrefix: "startupforge",
    useSecureCookies: isProduction || env.COOKIE_SECURE,
  },
});