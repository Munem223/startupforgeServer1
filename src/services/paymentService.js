import Stripe from "stripe";
import { getDB } from "../config/db.js";
import { env } from "../config/env.js";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

export async function persistSuccessfulPayment(session) {
  const db = getDB(); // SAFE now

  if (session.payment_status !== "paid") return;

  const email = session.metadata?.userEmail || session.customer_email;
  if (!email) throw new Error("Missing email");

  await db.collection("payments").insertOne({
    email,
    stripe_session_id: session.id,
    amount: session.amount_total
  });

  await db.collection("users").updateOne(
    { email },
    { $set: { isPremium: true } }
  );
}