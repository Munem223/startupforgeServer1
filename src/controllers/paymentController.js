import { env } from "../config/env.js";
import { success } from "../utils/response.js";
import { HttpError } from "../utils/httpError.js";
import { persistSuccessfulPayment, requireStripe } from "../services/paymentService.js";

export async function createCheckoutSession(req, res) {
  const stripe = requireStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: req.user.email,
    client_reference_id: req.user.id,
    line_items: [
      {
        price_data: {
          currency: env.STRIPE_CURRENCY,
          product_data: {
            name: "StartupForge Premium Founder",
            description: "Publish unlimited opportunities for one year"
          },
          unit_amount: env.STRIPE_PRICE_CENTS
        },
        quantity: 1
      }
    ],
    metadata: {
      userEmail: req.user.email,
      userId: req.user.id,
      package: "premium-founder-annual"
    },
    success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/payment/cancelled`
  });

  return success(res, { url: session.url, sessionId: session.id }, "Checkout session created", 201);
}

export async function verifyCheckoutSession(req, res) {
  const stripe = requireStripe();
  const sessionId = String(req.query.session_id || "");
  if (!sessionId) throw new HttpError(400, "session_id is required");

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userEmail !== req.user.email && session.customer_email !== req.user.email) {
    throw new HttpError(403, "This payment does not belong to your account");
  }

  const payment = await persistSuccessfulPayment(session);
  return success(res, {
    paid: session.payment_status === "paid",
    payment,
    sessionId: session.id
  });
}

export async function stripeWebhook(req, res) {
  const stripe = requireStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new HttpError(503, "Stripe webhook secret is not configured");
  }

  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    throw new HttpError(400, `Webhook signature verification failed: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    await persistSuccessfulPayment(event.data.object);
  }

  return res.status(200).json({ received: true });
}
