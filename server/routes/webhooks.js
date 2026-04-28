import { Router } from "express";

const router = Router();

/* POST /api/webhooks/stripe
   Receives and verifies Stripe events.
   Body must be the raw Buffer — set in index.js before this router.

   Handles:
     payment_intent.succeeded  → save order, confirm items sold, send order confirmation email
     payment_intent.payment_failed → release reserved items back to available */
router.post("/", async (req, res, next) => {
  // TODO: verify Stripe signature, handle payment_intent.succeeded and payment_intent.payment_failed
});

export default router;
