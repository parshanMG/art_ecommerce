import { Router } from "express";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
import pool from "../db/index.js";
import { releaseExpiredReservations } from "../db/reservations.js";
import stripe from "../services/stripe.js";

/* ── Country-aware postcode patterns ────────────────────────────────
   Keyed by ISO 3166-1 alpha-2 country code.
   To add a new country: append one line here and add it to the
   COUNTRIES list in src/components/Checkout.jsx.
   Countries absent from this map skip postcode format validation
   so shipping to unlisted destinations still works.
──────────────────────────────────────────────────────────────────── */
const POSTCODE_PATTERNS = {
  GB: /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i,          // e.g. SW1A 1AA
  US: /^\d{5}(-\d{4})?$/,                                        // e.g. 90210 or 90210-1234
  CA: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i, // e.g. M5V 2T6
  AU: /^\d{4}$/,                                                  // e.g. 2000
  IE: /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/i,                           // Eircode e.g. D02 XY45
  NZ: /^\d{4}$/,                                                  // e.g. 6011
  DE: /^\d{5}$/,                                                  // e.g. 10115
  FR: /^\d{5}$/,                                                  // e.g. 75001
  NL: /^\d{4}\s?[A-Z]{2}$/i,                                    // e.g. 1234 AB
  BE: /^\d{4}$/,                                                  // e.g. 1000
  IT: /^\d{5}$/,                                                  // e.g. 00100
  ES: /^\d{5}$/,                                                  // e.g. 28001
  PT: /^\d{4}-\d{3}$/,                                           // e.g. 1000-001
  SE: /^\d{3}\s?\d{2}$/,                                        // e.g. 111 22
  NO: /^\d{4}$/,                                                  // e.g. 0150
  DK: /^\d{4}$/,                                                  // e.g. 1050
  FI: /^\d{5}$/,                                                  // e.g. 00100
  AT: /^\d{4}$/,                                                  // e.g. 1010
  CH: /^\d{4}$/,                                                  // e.g. 8001
  SG: /^\d{6}$/,                                                  // e.g. 018956
  JP: /^\d{3}-?\d{4}$/,                                          // e.g. 100-0001
  PL: /^\d{2}-\d{3}$/,                                           // e.g. 00-001
};

const router = Router();

router.get(
  "/payment-status/:paymentIntentId",
  [
    param("paymentIntentId").isString().trim().notEmpty().isLength({ max: 100 }),
  ],
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
    body("items").isArray({ min: 1, max: 50 }),
    body("items.*.id").isString().notEmpty().isLength({ max: 100 }),
    body("buyerEmail").isEmail().normalizeEmail().isLength({ max: 254 }),
    // Unicode letter class (\p{L}) covers international names (accented, CJK, etc.)
    body("buyerName").isString().trim().notEmpty().isLength({ max: 200 })
      .matches(/^[\p{L}\s'.\-]+$/u),
    body("shippingAddress.line1").isString().trim().notEmpty().isLength({ max: 200 }),
    body("shippingAddress.city").isString().trim().notEmpty().isLength({ max: 100 })
      .matches(/^[\p{L}\s'.\-]+$/u),
    // ISO 3166-1 alpha-2 code (e.g. "GB", "US") — enforced by the frontend dropdown
    body("shippingAddress.country").isISO31661Alpha2(),
    // Format checked against POSTCODE_PATTERNS[country]; unknown countries pass through
    body("shippingAddress.postcode")
      .isString().trim().notEmpty().isLength({ max: 20 })
      .custom((postcode, { req }) => {
        const country = req.body?.shippingAddress?.country?.toUpperCase();
        const pattern = POSTCODE_PATTERNS[country];
        if (pattern && !pattern.test(postcode.trim())) {
          throw new Error(`Invalid postcode format for ${country}.`);
        }
        return true;
      }),
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
