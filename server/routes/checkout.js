import { Router } from "express";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();

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
  ],
  validateRequest,
  async (req, res, next) => {
    // TODO: implement availability check, reservation, and Stripe intent creation
  }
);

export default router;
