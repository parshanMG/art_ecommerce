import { Router } from "express";
import stripe from "../services/stripe.js";
import pool from "../db/index.js";
import { sendOrderConfirmation } from "../services/email.js";

const router = Router();

/* POST /api/webhooks/stripe
   Receives and verifies Stripe events.
   Body must be the raw Buffer — set in index.js before this router.

   Handles:
     payment_intent.succeeded      → save order, mark items sold, send confirmation email
     payment_intent.payment_failed → release reserved items back to available */
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
      const pi = event.data.object;
      const itemIds = pi.metadata.itemIds ? pi.metadata.itemIds.split(",") : [];
      const { buyerEmail, buyerName } = pi.metadata;
      const shippingAddress = {
        line1:    pi.metadata.shippingLine1,
        city:     pi.metadata.shippingCity,
        country:  pi.metadata.shippingCountry,
        postcode: pi.metadata.shippingPostcode,
      };

      /* Fetch items for the order record */
      const { rows: items } = await pool.query(
        `SELECT id, title, price FROM products WHERE id = ANY($1::text[])`,
        [itemIds]
      );

      const total = items.reduce((sum, r) => sum + Number(r.price), 0);

      /* Mark items as permanently sold */
      await pool.query(
        `UPDATE products
         SET available = FALSE, reserved = FALSE, reserved_at = NULL
         WHERE id = ANY($1::text[])`,
        [itemIds]
      );

      /* Save order — ON CONFLICT makes this idempotent for Stripe retries */
      await pool.query(
        `INSERT INTO orders
           (stripe_payment_intent, buyer_name, buyer_email, shipping_address, items, total)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (stripe_payment_intent) DO NOTHING`,
        [
          pi.id,
          buyerName,
          buyerEmail,
          JSON.stringify(shippingAddress),
          JSON.stringify(items),
          total.toFixed(2),
        ]
      );

      /* Send confirmation email — non-fatal if SES is unreachable */
      sendOrderConfirmation({
        buyerName,
        buyerEmail,
        items,
        total: total.toFixed(2),
        shippingAddress,
        orderReference: pi.id,
      }).catch((err) => console.error("Order confirmation email failed:", err));
    } else if (event.type === "payment_intent.payment_failed" ||
               event.type === "payment_intent.canceled") {
      const pi = event.data.object;
      const itemIds = pi.metadata.itemIds ? pi.metadata.itemIds.split(",") : [];

      if (itemIds.length) {
        await pool.query(
          `UPDATE products
           SET reserved = FALSE, reserved_at = NULL
           WHERE id = ANY($1::text[])`,
          [itemIds]
        );
      }
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

export default router;
