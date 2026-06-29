import { MongoClient } from "mongodb";
import { env } from "./env.js";

export const mongoClient = new MongoClient(env.MONGODB_URI);

let db = null;
let isConnected = false;

export async function connectDatabase() {
  if (isConnected) return;

  await mongoClient.connect();
  db = mongoClient.db(env.DB_NAME);
  isConnected = true;

  await db.command({ ping: 1 });

  console.log("✅ MongoDB connected:", env.DB_NAME);
}

export function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDatabase first.");
  }
  return db;
}

export async function createIndexes() {
  const database = getDB();

  await Promise.all([
    database.collection("startups").createIndex({ founder_email: 1 }, { unique: true }),
    database.collection("applications").createIndex({ applicant_email: 1 }),
    database.collection("payments").createIndex({ stripe_session_id: 1 }, { unique: true }),
  ]);

  console.log("✅ Database indexes ready");
}