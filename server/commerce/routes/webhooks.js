import { Router } from "express";
import stripe from "../stripe.js";
import pool from "../db/pool.js";
import { releaseReservation } from "../db/reservations.js";
import { sendOrderConfirmation, sendOrderReviewAlert } from "../emails.js";
import { recordPaidOrder } from "../orders.js";

const router = Router();

/* POST /api/webhooks/stripe
   Receives and verifies Stripe events.
   Body must be the raw Buffer — set in app.js before this router.

   Handles:
     payment_intent.succeeded      → save order, mark items sold, send confirmation email
     payment_intent.payment_failed → release this checkout's reserved items
     payment_intent.canceled       → same as payment_failed */
router.post("/", async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const order = await recordPaidOrder(pool, event.data.object);
      if (order) sendOrderEmails(event.data.object, order);
    } else if (event.type === "payment_intent.payment_failed" ||
               event.type === "payment_intent.canceled") {
      /* Only frees this attempt's own hold. After a declined card the buyer
         can retry — /api/checkout/hold re-reserves the items if still free. */
      await releaseReservation(pool, event.data.object.metadata.reservationId);
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

/* Emails the buyer, or alerts the owner when part of the order had
   already been sold. Non-fatal if SES is unreachable. */
function sendOrderEmails(pi, order) {
  const { buyerName, buyerEmail, items, total, shippingAddress } = order;

  if (order.conflicts.length > 0) {
    console.error(`Order ${pi.id} needs review — already sold: ${order.conflicts.map((r) => r.id).join(", ")}`);
    sendOrderReviewAlert({
      buyerName,
      buyerEmail,
      conflictingItems: order.conflicts,
      orderReference: pi.id,
    }).catch((err) => console.error("Order review alert email failed:", err));
  } else {
    sendOrderConfirmation({
      buyerName,
      buyerEmail,
      items,
      total,
      shippingAddress,
      orderReference: pi.id,
    }).catch((err) => console.error("Order confirmation email failed:", err));
  }
}

export default router;
