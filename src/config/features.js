/* ─────────────────────────────────────────────────────────────────────
   FEATURE FLAGS
   Toggle site-wide features from one place.

   COMMERCE_ENABLED — set VITE_COMMERCE_ENABLED in .env
     "true"  — shop mode: cart icon, Add to Basket, Buy Now and the
               /checkout route are all active. The server must run with
               COMMERCE_ENABLED=true too.
     unset   — portfolio mode: all purchase UI is hidden.

   The shop's code lives in src/features/commerce. Vite replaces the
   env value at build time, so in portfolio mode every
   `COMMERCE_ENABLED && …` branch is removed and none of that code
   (Stripe.js included) ends up in the bundle.
─────────────────────────────────────────────────────────────────── */
export const COMMERCE_ENABLED = import.meta.env.VITE_COMMERCE_ENABLED === "true";
