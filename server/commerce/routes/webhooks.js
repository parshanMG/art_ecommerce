import { Router } from "express";
import stripe from "../stripe.js";
import pool from "../db/pool.js";
import { releaseReservation } from "../db/reservations.js";
import { sendOrderConfirmation, sendOrderReviewAlert } from "../emails.js";

const router = Router();

/* POST /api/webhooks/stripe
   Receives and verifies Stripe events.
   Body must be the raw Buffer — set in index.js before this router.

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
      await recordPaidOrder(event.data.object);
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

/* Saves the order, marks its items sold, and emails the buyer.
   Idempotent — Stripe may deliver the same event more than once. */
async function recordPaidOrder(pi) {
  const itemIds = pi.metadata.itemIds ? pi.metadata.itemIds.split(",") : [];
  const { buyerEmail, buyerName } = pi.metadata;
  const shippingAddress = {
    line1:    pi.metadata.shippingLine1,
    city:     pi.metadata.shippingCity,
    country:  pi.metadata.shippingCountry,
    postcode: pi.metadata.shippingPostcode,
  };
  /* What Stripe actually charged, not a recalculation from current prices */
  const total = (pi.amount_received / 100).toFixed(2);

  let items;
  let conflicts;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* Lock the items first so a concurrent delivery of this same event
       waits here, then sees the committed order below and stops. */
    ({ rows: items } = await client.query(
      `SELECT id, title, price, available
       FROM products
       WHERE id = ANY($1::text[])
       FOR UPDATE`,
      [itemIds]
    ));

    const { rows: existing } = await client.query(
      `SELECT 1 FROM orders WHERE stripe_payment_intent = $1`,
      [pi.id]
    );
    if (existing.length > 0) {
      await client.query("ROLLBACK");
      return;
    }

    /* A piece already marked sold went to someone else — only possible if
       this buyer's hold lapsed and they paid anyway. Whoever paid first
       keeps it; this order is flagged so the owner can refund. */
    conflicts = items.filter((r) => !r.available);
    const soldIds = items.filter((r) => r.available).map((r) => r.id);

    /* Mark items as permanently sold */
    await client.query(
      `UPDATE products
       SET available = FALSE, reserved = FALSE, reserved_at = NULL, reservation_id = NULL
       WHERE id = ANY($1::text[])`,
      [soldIds]
    );

    await client.query(
      `INSERT INTO orders
         (stripe_payment_intent, buyer_name, buyer_email, shipping_address, items, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        pi.id,
        buyerName,
        buyerEmail,
        JSON.stringify(shippingAddress),
        JSON.stringify(items.map(({ id, title, price }) => ({ id, title, price }))),
        total,
        conflicts.length > 0 ? "needs_review" : "paid",
      ]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  /* Emails are non-fatal if SES is unreachable */
  if (conflicts.length > 0) {
    console.error(`Order ${pi.id} needs review — already sold: ${conflicts.map((r) => r.id).join(", ")}`);
    sendOrderReviewAlert({
      buyerName,
      buyerEmail,
      conflictingItems: conflicts,
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
