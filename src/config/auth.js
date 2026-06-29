import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoClient, getDB } from "./db.js";
import { env, isProduction } from "./env.js";

export function createAuth() {
  return betterAuth({
    appName: "StartupForge",
    baseURL: env.SERVER_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.CLIENT_URL],

    database: mongodbAdapter(getDB(), {
      client: mongoClient
    }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      autoSignIn: true
    },

    session: {
      modelName: "sessions"
    },

    advanced: {
      cookiePrefix: "startupforge",
      useSecureCookies: isProduction || env.COOKIE_SECURE
    }
  });
}