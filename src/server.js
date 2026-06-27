import { app } from "./app.js";
import { connectDatabase, createIndexes, mongoClient } from "./config/db.js";
import { env } from "./config/env.js";
import { auth } from "./config/auth.js";

let server;

async function start() {
  try {
    // 1. DB FIRST
    await connectDatabase();
    await createIndexes();

    // 2. Start server
    server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`🚀 API running at ${env.SERVER_URL}`);
    });

  } catch (error) {
    console.error("❌ Startup failed:", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal) {
  console.log(`${signal} received`);

  if (server) {
    await new Promise((res) => server.close(res));
  }

  await mongoClient.close();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

start();