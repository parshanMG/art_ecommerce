/* ─────────────────────────────────────────────────────────────────────
   SHOP MODE
   Loaded by index.js only when COMMERCE_ENABLED=true, so in portfolio
   mode neither Stripe nor PostgreSQL is ever loaded or needed.

   Adds:
     • /api/checkout/*        — reserve items, create the PaymentIntent
     • /api/webhooks/stripe   — record paid orders, release failed holds
     • listProducts()         — products with live availability from the
                                database, replacing the catalog file
───────────────────────────────────────────────────────────────────── */
import pool from "./db/pool.js";
import { releaseExpiredReservations } from "./db/reservations.js";
import checkoutRouter from "./routes/checkout.js";
import webhooksRouter from "./routes/webhooks.js";

export async function listProducts() {
  await releaseExpiredReservations(pool);

  const { rows } = await pool.query(
    `SELECT id, title, price, category, medium, dimensions,
            year, available, featured, image, thumbnail, description,
            title_fa, medium_fa, dimensions_fa, description_fa
     FROM products
     ORDER BY year DESC, title ASC`
  );
  return rows;
}

export function mountCommerce(app, { checkoutLimiter }) {
  app.use("/api/checkout", checkoutLimiter, checkoutRouter);
  app.use("/api/webhooks/stripe", webhooksRouter);
}
