import { MongoClient } from "mongodb";
import { env } from "./env.js";

export const mongoClient = new MongoClient(env.MONGODB_URI);

let db = null;
let connected = false;

export async function connectDatabase() {
  if (connected) return;

  await mongoClient.connect();
  db = mongoClient.db(env.DB_NAME);

  await db.command({ ping: 1 });

  connected = true;
  console.log("✅ MongoDB connected");
}

export function getDB() {
  if (!db) {
    throw new Error("DB not initialized. Call connectDatabase first.");
  }
  return db;
}

export async function createIndexes() {
  const database = getDB();

  await Promise.all([
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("payments").createIndex({ stripe_session_id: 1 }, { unique: true })
  ]);

  console.log("✅ Indexes ready");
}