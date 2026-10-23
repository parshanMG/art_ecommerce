import crypto from "crypto";
import { Router } from "express";
import { body, param } from "express-validator";
import { validateRequest, NAME_PATTERN } from "../middleware/validateRequest.js";
import pool from "../db/index.js";
import { releaseExpiredReservations, releaseReservation } from "../db/reservations.js";
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

/* PaymentIntent statuses that can still be cancelled — the buyer hasn't paid yet */
const CANCELABLE_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/* Looks up the PaymentIntent behind a client secret ("pi_123_secret_abc")
   and checks the secret really belongs to it. Only the buyer who started
   the checkout ever receives the secret, so it doubles as proof of
   ownership. Returns null for an unknown or mismatched secret. */
async function retrieveOwnedPaymentIntent(clientSecret) {
  const paymentIntentId = clientSecret.split("_secret_")[0];

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.client_secret === clientSecret ? paymentIntent : null;
  } catch (err) {
    if (err.type === "StripeInvalidRequestError") return null;
    throw err;
  }
}

/* Cancels a buyer's earlier checkout attempt and frees the items it held.
   Leaves the hold alone if that attempt is already processing or paid. */
async function cancelPreviousAttempt(clientSecret) {
  const paymentIntent = await retrieveOwnedPaymentIntent(clientSecret);
  if (!paymentIntent) return;

  if (CANCELABLE_STATUSES.has(paymentIntent.status)) {
    await stripe.paymentIntents.cancel(paymentIntent.id);
  } else if (paymentIntent.status !== "canceled") {
    return;
  }

  await releaseReservation(pool, paymentIntent.metadata.reservationId);
}

function unavailableResponse(items) {
  const titles = items.map((r) => `“${r.title}”`).join(", ");
  return {
    error: `Sorry — ${titles} ${items.length === 1 ? "is" : "are"} no longer available.`,
    unavailableIds: items.map((r) => r.id),
  };
}

/* Locks the requested rows, checks every item can be sold, and holds
   them for reservationId (restarting the reservation clock). Items
   already held by the same reservationId pass, so this both creates
   and refreshes a hold.
   Returns { rows } on success, or { status, body } to refuse with. */
async function reserveItems(itemIds, reservationId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* Release stale reservations before checking current availability. */
    await releaseExpiredReservations(client);

    /* Lock rows to prevent concurrent reservations */
    const { rows } = await client.query(
      `SELECT id, title, price, available, reserved, reservation_id
       FROM products
       WHERE id = ANY($1::text[])
       FOR UPDATE`,
      [itemIds]
    );

    if (rows.length !== itemIds.length) {
      await client.query("ROLLBACK");
      return { status: 404, body: { error: "One or more items not found." } };
    }

    const unavailable = rows.filter(
      (r) => !r.available || (r.reserved && r.reservation_id !== reservationId)
    );
    if (unavailable.length > 0) {
      await client.query("ROLLBACK");
      return { status: 409, body: unavailableResponse(unavailable) };
    }

    await client.query(
      `UPDATE products
       SET reserved = TRUE, reserved_at = NOW(), reservation_id = $2
       WHERE id = ANY($1::text[])`,
      [itemIds, reservationId]
    );

    await client.query("COMMIT");
    return { rows };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

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
   1. Cancels the buyer's previous attempt if they came back from the
      payment step (replacesClientSecret) — otherwise their own hold
      would block them
   2. Atomically checks all items are still available and reserves them
   3. Creates and returns a Stripe PaymentIntent client secret */
router.post(
  "/create-payment-intent",
  [
    body("items").isArray({ min: 1, max: 50 }).withMessage("Your cart is empty."),
    body("items.*.id").isString().notEmpty().isLength({ max: 100 }),
    body("buyerEmail")
      .isEmail().withMessage("Please enter a valid email address.")
      .normalizeEmail()
      .isLength({ max: 254 }).withMessage("Email must be 254 characters or fewer."),
    body("buyerName")
      .isString().trim().notEmpty().withMessage("Please enter your name.")
      .isLength({ max: 200 }).withMessage("Name must be 200 characters or fewer.")
      .matches(NAME_PATTERN).withMessage("Name can only contain letters, spaces, apostrophes, hyphens and full stops."),
    body("shippingAddress.line1")
      .isString().trim().notEmpty().withMessage("Please enter your street address.")
      .isLength({ max: 200 }).withMessage("Street address must be 200 characters or fewer."),
    body("shippingAddress.city")
      .isString().trim().notEmpty().withMessage("Please enter your city.")
      .isLength({ max: 100 }).withMessage("City must be 100 characters or fewer.")
      .matches(NAME_PATTERN).withMessage("City can only contain letters, spaces, apostrophes, hyphens and full stops."),
    // ISO 3166-1 alpha-2 code (e.g. "GB", "US") — enforced by the frontend dropdown
    body("shippingAddress.country").isISO31661Alpha2().withMessage("Please choose a country."),
    // Format checked against POSTCODE_PATTERNS[country]; unknown countries pass through
    body("shippingAddress.postcode")
      .isString().trim().notEmpty().withMessage("Please enter your postcode.")
      .isLength({ max: 20 }).withMessage("Postcode must be 20 characters or fewer.")
      .custom((postcode, { req }) => {
        const country = req.body?.shippingAddress?.country?.toUpperCase();
        const pattern = POSTCODE_PATTERNS[country];
        if (pattern && !pattern.test(postcode.trim())) {
          throw new Error(`Invalid postcode format for ${country}.`);
        }
        return true;
      }),
    body("replacesClientSecret").optional().isString().isLength({ max: 300 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { items, buyerEmail, buyerName, shippingAddress, replacesClientSecret } = req.body;
      const itemIds = [...new Set(items.map((i) => i.id))];

      if (replacesClientSecret) {
        await cancelPreviousAttempt(replacesClientSecret).catch((err) =>
          console.warn("Could not release previous checkout attempt:", err.message)
        );
      }

      const reservationId = crypto.randomUUID();
      const result = await reserveItems(itemIds, reservationId);
      if (result.status) {
        return res.status(result.status).json(result.body);
      }

      /* Calculate total from DB prices — never trust client-supplied amounts */
      const totalCents = result.rows.reduce(
        (sum, r) => sum + Math.round(Number(r.price) * 100),
        0
      );

      /* Store everything the webhook needs in metadata */
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: totalCents,
          currency: "usd",
          receipt_email: buyerEmail,
          /* Cards and wallets only — redirect-based methods would send the
             buyer away mid-checkout with nothing to bring them back. */
          automatic_payment_methods: { enabled: true, allow_redirects: "never" },
          metadata: {
            buyerEmail,
            buyerName,
            itemIds: itemIds.join(","),
            reservationId,
            shippingLine1: shippingAddress.line1,
            shippingCity: shippingAddress.city,
            shippingCountry: shippingAddress.country,
            shippingPostcode: shippingAddress.postcode,
          },
        });
      } catch (err) {
        /* Don't leave the items held for the full TTL if Stripe refused */
        await releaseReservation(pool, reservationId);
        throw err;
      }

      return res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      next(err);
    }
  }
);

/* POST /api/checkout/hold
   Called just before the buyer confirms payment. Re-checks the items
   are still theirs and restarts the reservation clock, so a buyer who
   lingered past the reservation window can't pay for a piece that has
   since been sold. If the items are gone, the PaymentIntent is cancelled. */
router.post(
  "/hold",
  [body("clientSecret").isString().notEmpty().isLength({ max: 300 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const paymentIntent = await retrieveOwnedPaymentIntent(req.body.clientSecret);
      const reservationId = paymentIntent?.metadata.reservationId;

      if (!reservationId || !CANCELABLE_STATUSES.has(paymentIntent.status)) {
        return res.status(409).json({ error: "This checkout has expired. Please go back and start again." });
      }

      const itemIds = paymentIntent.metadata.itemIds.split(",");
      const result = await reserveItems(itemIds, reservationId);
      if (result.status) {
        await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
        return res.status(result.status).json(result.body);
      }

      res.json({ held: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
