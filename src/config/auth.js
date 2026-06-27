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

let authInstance = null;

export function initAuth() {
  if (authInstance) return authInstance;

  const db = getDB(); // ONLY CALLED AFTER DB READY

  authInstance = betterAuth({
    appName: "StartupForge",
    baseURL: env.SERVER_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.CLIENT_URL],

    database: mongodbAdapter(db, { client: mongoClient }),

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
          required: true,
          defaultValue: "collaborator",
          input: false,
        },
        isBlocked: { type: "boolean", required: true, defaultValue: false, input: false },
        skills: { type: "string", required: false, defaultValue: "", input: false },
        bio: { type: "string", required: false, defaultValue: "", input: false },
        isPremium: { type: "boolean", required: true, defaultValue: false, input: false },
        premiumUntil: { type: "string", required: false, defaultValue: "", input: false },
      },
    },

    session: {
      modelName: "sessions",
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    account: {
      modelName: "accounts",
      encryptOAuthTokens: true,
    },

    verification: {
      modelName: "verifications",
    },

    rateLimit: {
      enabled: true,
      window: 60,
      max: 120,
      storage: "database",
      modelName: "authRateLimits",
    },

    advanced: {
      cookiePrefix: "startupforge",
      useSecureCookies: isProduction || env.COOKIE_SECURE,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: isProduction || env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        path: "/",
      },
    },
  });

  return authInstance;
}

export function getAuth() {
  if (!authInstance) {
    throw new Error("Auth not initialized. Call initAuth AFTER DB connection.");
  }
  return authInstance;
}