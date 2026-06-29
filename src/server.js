import { app } from "./app.js";
import { connectDatabase, createIndexes } from "./config/db.js";
import { createAuth } from "./config/auth.js";
import { env } from "./config/env.js";

let server;
let auth;

async function start() {
  try {
    // 1. DB FIRST
    await connectDatabase();
    await createIndexes();

    // 2. INIT AUTH AFTER DB
    auth = createAuth();

    // 3. ATTACH AUTH TO APP
    app.set("auth", auth);

    // 4. START SERVER
    server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`🚀 API running at ${env.SERVER_URL}`);
    });

  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => server?.close());
process.on("SIGTERM", () => server?.close());

start();