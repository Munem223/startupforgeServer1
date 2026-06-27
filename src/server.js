import { app } from "./app.js";
import { connectDatabase, createIndexes, mongoClient } from "./config/db.js";
import { env } from "./config/env.js";

let server;

async function start() {
  try {
    await connectDatabase();
    await createIndexes();
    server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`🚀 StartupForge API running at ${env.SERVER_URL}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n${signal} received. Closing gracefully...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoClient.close();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

start();
