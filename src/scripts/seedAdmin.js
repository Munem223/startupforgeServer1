import "dotenv/config";
import { auth } from "../config/auth.js";
import { connectDatabase, db, mongoClient } from "../config/db.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "StartupForge Admin";

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before running this script.");
  process.exit(1);
}

try {
  await connectDatabase();
  let user = await db.collection("users").findOne({ email });

  if (!user) {
    await auth.api.signUpEmail({ body: { name, email, password } });
    user = await db.collection("users").findOne({ email });
  }

  await db.collection("users").updateOne(
    { email },
    { $set: { role: "admin", isBlocked: false, updatedAt: new Date() } }
  );

  console.log(`✅ Admin ready: ${email}`);
} catch (error) {
  console.error("❌ Admin seed failed:", error);
  process.exitCode = 1;
} finally {
  await mongoClient.close();
}
