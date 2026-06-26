import { MongoClient } from "mongodb";
import { env } from "./env.js";

export const mongoClient = new MongoClient(env.MONGODB_URI, {
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000
});

export const db = mongoClient.db(env.DB_NAME);

export async function connectDatabase() {
  await mongoClient.connect();
  await db.command({ ping: 1 });
  console.log(`✅ MongoDB connected: ${env.DB_NAME}`);
}

export async function createIndexes() {
  await Promise.all([
    db.collection("startups").createIndex({ founder_email: 1 }, { unique: true }),
    db.collection("startups").createIndex({ status: 1, createdAt: -1 }),
    db.collection("opportunities").createIndex({ createdAt: -1 }),
    db.collection("opportunities").createIndex({ role_title: 1 }),
    db.collection("opportunities").createIndex({ required_skills: 1 }),
    db.collection("opportunities").createIndex({ work_type: 1, industry: 1 }),
    db.collection("applications").createIndex(
      { opportunity_id: 1, applicant_email: 1 },
      { unique: true }
    ),
    db.collection("applications").createIndex({ founder_email: 1, applied_at: -1 }),
    db.collection("applications").createIndex({ applicant_email: 1, applied_at: -1 }),
    db.collection("payments").createIndex({ stripe_session_id: 1 }, { unique: true }),
    db.collection("payments").createIndex({ paid_at: -1 })
  ]);
  console.log("✅ Database indexes ready");
}
