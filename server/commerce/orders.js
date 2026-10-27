/* ─────────────────────────────────────────────────────────────────────
   RESERVATIONS AND ORDERS
   The database side of checkout, kept apart from the HTTP routes so it
   can be tested against a real PostgreSQL database
   (tests/commerce.test.js). Every function takes the pool to use.
───────────────────────────────────────────────────────────────────── */
import { releaseExpiredReservations } from "./db/reservations.js";

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
export async function reserveItems(db, itemIds, reservationId) {
  const client = await db.connect();

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

/* Saves the order for a succeeded PaymentIntent and marks its items sold.
   Idempotent — Stripe may deliver the same event more than once, even
   concurrently: a repeat returns null instead of saving a second order.
   Otherwise returns what the confirmation emails need, with `conflicts`
   listing items someone else had already bought. */
export async function recordPaidOrder(db, pi) {
  const itemIds = pi.metadata.itemIds ? pi.metadata.itemIds.split(",") : [];
  const { buyerEmail, buyerName } = pi.metadata;
  const shippingAddress = {
    line1:    pi.metadata.shippingLine1,
    city:     pi.metadata.shippingCity,
    country:  pi.metadata.shippingCountry,
    postcode: pi.metadata.shippingPostcode,
  };
  /* What Stripe actually charged, not a recalculation from current prices */
  const total = (pi.amount_received / 100).toFixed(2);

  let items;
  let conflicts;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    /* Lock the items first so a concurrent delivery of this same event
       waits here, then sees the committed order below and stops. */
    ({ rows: items } = await client.query(
      `SELECT id, title, price, available
       FROM products
       WHERE id = ANY($1::text[])
       FOR UPDATE`,
      [itemIds]
    ));

    const { rows: existing } = await client.query(
      `SELECT 1 FROM orders WHERE stripe_payment_intent = $1`,
      [pi.id]
    );
    if (existing.length > 0) {
      await client.query("ROLLBACK");
      return null;
    }

    /* A piece already marked sold went to someone else — only possible if
       this buyer's hold lapsed and they paid anyway. Whoever paid first
       keeps it; this order is flagged so the owner can refund. */
    conflicts = items.filter((r) => !r.available);
    const soldIds = items.filter((r) => r.available).map((r) => r.id);

    /* Mark items as permanently sold */
    await client.query(
      `UPDATE products
       SET available = FALSE, reserved = FALSE, reserved_at = NULL, reservation_id = NULL
       WHERE id = ANY($1::text[])`,
      [soldIds]
    );

    await client.query(
      `INSERT INTO orders
         (stripe_payment_intent, buyer_name, buyer_email, shipping_address, items, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        pi.id,
        buyerName,
        buyerEmail,
        JSON.stringify(shippingAddress),
        JSON.stringify(items.map(({ id, title, price }) => ({ id, title, price }))),
        total,
        conflicts.length > 0 ? "needs_review" : "paid",
      ]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return { buyerName, buyerEmail, items, conflicts, total, shippingAddress };
}
