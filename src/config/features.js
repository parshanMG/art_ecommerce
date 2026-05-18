/* ─────────────────────────────────────────────────────────────────────
   FEATURE FLAGS
   Toggle site-wide features from one place.

   COMMERCE_ENABLED
     true  — full shop mode: cart icon, Add to Basket, Buy Now,
             and the /checkout route are all active.
     false — portfolio-only mode: all purchase UI is hidden.
             The underlying code and CartContext remain intact so
             you can flip this back to true when you're ready to sell.
─────────────────────────────────────────────────────────────────── */
export const COMMERCE_ENABLED = false;
