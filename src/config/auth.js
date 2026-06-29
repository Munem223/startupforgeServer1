import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoClient } from "./db.js";
import { env, isProduction } from "./env.js";

function getDBSafe() {
  // lazy import fix
  return mongoClient.db(env.DB_NAME);
}

export const auth = betterAuth({
  appName: "StartupForge",
  baseURL: env.SERVER_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CLIENT_URL],

  database: mongodbAdapter(getDBSafe(), {
    client: mongoClient,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
  },

  user: {
    modelName: "users",
  },

  session: {
    modelName: "sessions",
  },

  advanced: {
    cookiePrefix: "startupforge",
    useSecureCookies: isProduction || env.COOKIE_SECURE,
  },
});