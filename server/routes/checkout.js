import { Router } from "express";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
import pool from "../db/index.js";
import { releaseExpiredReservations } from "../db/reservations.js";
import stripe from "../services/stripe.js";

const router = Router();

router.get(
  "/payment-status/:paymentIntentId",
  [param("paymentIntentId").isString().trim().notEmpty()],
  validateRequest,
  async (req, res, next) => {
    try {
      const { paymentIntentId } = req.params;

      const { rows } = await pool.query(
        `SELECT id, status, created_at
         FROM orders
         WHERE stripe_payment_intent = $1
         LIMIT 1`,
        [paymentIntentId]
      );

      if (rows.length > 0) {
        return res.json({
          orderRecorded: true,
          orderId: rows[0].id,
          orderStatus: rows[0].status,
          createdAt: rows[0].created_at,
        });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return res.status(202).json({
        orderRecorded: false,
        paymentStatus: paymentIntent.status,
      });
    } catch (err) {
      next(err);
    }
  }
);

/* POST /api/checkout/create-payment-intent
   1. Atomically checks all items are still available
   2. Reserves them in the DB
   3. Creates and returns a Stripe PaymentIntent client secret */
router.post(
  "/create-payment-intent",
  [
    body("items").isArray({ min: 1 }),
    body("items.*.id").isString().notEmpty(),
    body("buyerEmail").isEmail(),
    body("buyerName").isString().trim().notEmpty(),
    body("shippingAddress.line1").isString().trim().notEmpty(),
    body("shippingAddress.city").isString().trim().notEmpty(),
    body("shippingAddress.country").isString().trim().notEmpty(),
    body("shippingAddress.postcode").isString().trim().notEmpty(),
  ],
  validateRequest,
  async (req, res, next) => {
    const { items, buyerEmail, buyerName, shippingAddress } = req.body;
    const itemIds = items.map((i) => i.id);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      /* Release stale reservations before checking current availability. */
      await releaseExpiredReservations(client);

      /* Lock rows to prevent concurrent reservations */
      const { rows } = await client.query(
        `SELECT id, title, price, available, reserved
         FROM products
         WHERE id = ANY($1::text[])
         FOR UPDATE`,
        [itemIds]
      );

      /* Ensure all requested items exist */
      if (rows.length !== itemIds.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "One or more items not found." });
      }

      /* Ensure all items are still available and not reserved */
      const unavailable = rows.filter((r) => !r.available || r.reserved);
      if (unavailable.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "Some items are no longer available.",
          unavailableIds: unavailable.map((r) => r.id),
        });
      }

      /* Reserve items */
      await client.query(
        `UPDATE products
         SET reserved = TRUE, reserved_at = NOW()
         WHERE id = ANY($1::text[])`,
        [itemIds]
      );

      await client.query("COMMIT");

      /* Calculate total from DB prices — never trust client-supplied amounts */
      const totalCents = rows.reduce(
        (sum, r) => sum + Math.round(Number(r.price) * 100),
        0
      );

      /* Store everything the webhook needs in metadata */
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: "usd",
        receipt_email: buyerEmail,
        metadata: {
          buyerEmail,
          buyerName,
          itemIds: itemIds.join(","),
          shippingLine1: shippingAddress.line1,
          shippingCity: shippingAddress.city,
          shippingCountry: shippingAddress.country,
          shippingPostcode: shippingAddress.postcode,
        },
      });

      return res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      client.release();
    }
  }
);

export default router;
