import { app } from "./app.js";
import { connectDatabase, createIndexes, mongoClient } from "./config/db.js";
import { env } from "./config/env.js";

let server;

async function start() {
  try {
    // ✅ STEP 1: DB FIRST
    await connectDatabase();
    await createIndexes();

    // ✅ STEP 2: START SERVER AFTER DB READY
    server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log("🚀 API running:", env.SERVER_URL);
    });

  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => server?.close());
process.on("SIGINT", () => server?.close());

start();