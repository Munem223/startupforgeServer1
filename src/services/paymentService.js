import Stripe from "stripe";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

export function requireStripe() {
  if (!stripe) {
    throw new HttpError(503, "Stripe is not configured on the server");
  }
  return stripe;
}

export async function persistSuccessfulPayment(session) {
  if (session.payment_status !== "paid") return null;

  const userEmail = session.metadata?.userEmail || session.customer_email;
  if (!userEmail) throw new HttpError(400, "Stripe session is missing the user email");

  const existing = await db.collection("payments").findOne({ stripe_session_id: session.id });
  if (existing) return existing;

  const paidAt = new Date();
  const premiumUntil = new Date();
  premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);

  const payment = {
    user_email: userEmail,
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || env.STRIPE_CURRENCY,
    transaction_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || session.id,
    stripe_session_id: session.id,
    payment_status: session.payment_status,
    paid_at: paidAt
  };

  try {
    await db.collection("payments").insertOne(payment);
  } catch (error) {
    // A webhook and success-page verification can arrive simultaneously.
    if (error?.code === 11000) {
      return db.collection("payments").findOne({ stripe_session_id: session.id });
    }
    throw error;
  }

  await db.collection("users").updateOne(
    { email: userEmail },
    {
      $set: {
        isPremium: true,
        premiumUntil: premiumUntil.toISOString(),
        updatedAt: new Date()
      }
    }
  );

  return payment;
}
