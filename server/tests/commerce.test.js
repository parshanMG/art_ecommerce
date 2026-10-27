/* Shop mode's database logic, against a real PostgreSQL database — the
   race conditions it guards against can't be faked. Skipped unless
   TEST_DATABASE_URL is set (see helpers.js). */
import { test, before, beforeEach, after, describe } from "node:test";
import assert from "node:assert/strict";
import { reserveItems, recordPaidOrder } from "../commerce/orders.js";
import { TEST_DATABASE_URL, createTestDatabase } from "./helpers.js";

describe("shop mode: reservations and orders", { skip: !TEST_DATABASE_URL && "TEST_DATABASE_URL is not set" }, () => {
  let db;

  before(async () => {
    db = await createTestDatabase();
  });

  after(async () => {
    await db?.end();
  });

  beforeEach(async () => {
    await db.query("TRUNCATE orders, products");
    await db.query(
      `INSERT INTO products (id, title, price, category, available) VALUES
         ('poppies',  'Poppies',  120.00, 'watercolour', TRUE),
         ('irises',   'Irises',    80.00, 'watercolour', TRUE),
         ('sold-one', 'Sold One',  50.00, 'watercolour', FALSE)`
    );
  });

  const paymentIntent = (overrides = {}) => ({
    id: "pi_test_123",
    amount_received: 20000,
    metadata: {
      itemIds: "poppies,irises",
      buyerName: "Test Buyer",
      buyerEmail: "buyer@example.com",
      reservationId: "res-1",
      shippingLine1: "1 High Street",
      shippingCity: "London",
      shippingCountry: "GB",
      shippingPostcode: "SW1A 1AA",
    },
    ...overrides,
  });

  /* Runs two calls truly at the same time. Left alone, one usually
     finishes before the other starts and a missing lock goes unnoticed.
     So another connection locks the rows first, both calls are started
     and left waiting behind it, and only then is the lock let go. */
  async function race(ids, callA, callB) {
    const blocker = await db.connect();
    try {
      await blocker.query("BEGIN");
      await blocker.query("SELECT id FROM products WHERE id = ANY($1) FOR UPDATE", [ids]);

      const settled = Promise.allSettled([callA(), callB()]);
      await waitForLockWaiters(2);
      await blocker.query("COMMIT");
      return await settled;
    } finally {
      blocker.release();
    }
  }

  async function waitForLockWaiters(count) {
    for (let attempt = 0; attempt < 250; attempt++) {
      const { rows } = await db.query(
        `SELECT COUNT(*)::int AS n FROM pg_stat_activity
         WHERE datname = current_database() AND wait_event_type = 'Lock'`
      );
      if (rows[0].n >= count) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`Timed out waiting for ${count} queries to block`);
  }

  /* ── Reservations ───────────────────────────────────────────────── */

  test("two buyers checking out the same piece at once: only one gets it", async () => {
    const settled = await race(
      ["poppies"],
      () => reserveItems(db, ["poppies"], "buyer-a"),
      () => reserveItems(db, ["poppies"], "buyer-b"),
    );
    const results = settled.map((s) => s.value);

    const succeeded = results.filter((r) => r.rows);
    const refused = results.filter((r) => r.status === 409);
    assert.equal(succeeded.length, 1);
    assert.equal(refused.length, 1);
    assert.deepEqual(refused[0].body.unavailableIds, ["poppies"]);
  });

  test("a buyer can refresh their own hold", async () => {
    assert.ok((await reserveItems(db, ["poppies"], "buyer-a")).rows);
    assert.ok((await reserveItems(db, ["poppies"], "buyer-a")).rows);
  });

  test("an expired hold is released for the next buyer", async () => {
    await reserveItems(db, ["poppies"], "buyer-a");
    await db.query(`UPDATE products SET reserved_at = NOW() - INTERVAL '1 day' WHERE id = 'poppies'`);

    assert.ok((await reserveItems(db, ["poppies"], "buyer-b")).rows);
  });

  test("sold and unknown pieces can't be reserved", async () => {
    const sold = await reserveItems(db, ["sold-one"], "buyer-a");
    assert.equal(sold.status, 409);

    const unknown = await reserveItems(db, ["no-such-piece"], "buyer-a");
    assert.equal(unknown.status, 404);
  });

  /* ── Orders ─────────────────────────────────────────────────────── */

  test("a paid order is saved and its pieces marked sold", async () => {
    await reserveItems(db, ["poppies", "irises"], "res-1");
    const order = await recordPaidOrder(db, paymentIntent());

    assert.deepEqual(order.conflicts, []);
    assert.equal(order.total, "200.00", "the total is what Stripe charged");

    const { rows: products } = await db.query(
      `SELECT available, reserved FROM products WHERE id IN ('poppies', 'irises')`
    );
    assert.ok(products.every((p) => !p.available && !p.reserved));

    const { rows: orders } = await db.query(`SELECT status FROM orders`);
    assert.deepEqual(orders, [{ status: "paid" }]);
  });

  test("the same webhook delivered twice at once records one order", async () => {
    const settled = await race(
      ["poppies", "irises"],
      () => recordPaidOrder(db, paymentIntent()),
      () => recordPaidOrder(db, paymentIntent()),
    );

    assert.deepEqual(settled.map((s) => s.status), ["fulfilled", "fulfilled"], "neither delivery may fail");
    const results = settled.map((s) => s.value);
    assert.equal(results.filter(Boolean).length, 1, "exactly one delivery records the order");
    const { rows } = await db.query(`SELECT COUNT(*)::int AS n FROM orders`);
    assert.equal(rows[0].n, 1);
  });

  test("paying for a piece someone else bought first is flagged for review", async () => {
    const pi = paymentIntent({ metadata: { ...paymentIntent().metadata, itemIds: "poppies,sold-one" } });
    const order = await recordPaidOrder(db, pi);

    assert.deepEqual(order.conflicts.map((c) => c.id), ["sold-one"]);
    const { rows } = await db.query(`SELECT status FROM orders`);
    assert.deepEqual(rows, [{ status: "needs_review" }]);
  });
});
