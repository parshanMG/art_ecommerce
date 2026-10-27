import Stripe from "stripe";

/* null when STRIPE_SECRET_KEY isn't set — the server then runs in
   portfolio mode and index.js answers checkout/webhook routes with 503. */
const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripe = secretKey ? new Stripe(secretKey) : null;

export default stripe;
