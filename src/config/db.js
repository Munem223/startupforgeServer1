import { MongoClient } from "mongodb";
import { env } from "./env.js";

export const mongoClient = new MongoClient(env.MONGODB_URI, {
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
});

let db;

/**
 * Connect DB safely before using anywhere
 */
export async function connectDatabase() {
  try {
    await mongoClient.connect();

    db = mongoClient.db(env.DB_NAME);

    await db.command({ ping: 1 });

    console.log(`✅ MongoDB connected: ${env.DB_NAME}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

/**
 * Export DB getter (IMPORTANT)
 */
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
    database.collection("startups").createIndex({ status: 1, createdAt: -1 }),
    database.collection("opportunities").createIndex({ createdAt: -1 }),
    database.collection("opportunities").createIndex({ role_title: 1 }),
    database.collection("opportunities").createIndex({ required_skills: 1 }),
    database.collection("opportunities").createIndex({ work_type: 1, industry: 1 }),
    database.collection("applications").createIndex(
      { opportunity_id: 1, applicant_email: 1 },
      { unique: true }
    ),
    database.collection("applications").createIndex({ founder_email: 1, applied_at: -1 }),
    database.collection("applications").createIndex({ applicant_email: 1, applied_at: -1 }),
    database.collection("payments").createIndex({ stripe_session_id: 1 }, { unique: true }),
    database.collection("payments").createIndex({ paid_at: -1 }),
  ]);

  console.log("✅ Database indexes ready");
}