/* Shared test helpers — not a test file itself (node --test only runs
   *.test.js here). */
import { readdirSync, readFileSync } from "fs";
import pg from "pg";

/* Starts an Express app on a free port. Returns its base URL and a
   close() to stop it. */
export async function serve(app) {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

/* ── Test database ──────────────────────────────────────────────────────
   The shop tests need PostgreSQL. They run when TEST_DATABASE_URL is set
   (CI sets it) and are skipped otherwise. The database's name must end
   in "_test": setup wipes it, so it must never be a real one.
─────────────────────────────────────────────────────────────────────── */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL?.trim() || null;

const MIGRATIONS_DIR = new URL("../commerce/db/migrations/", import.meta.url);

export async function createTestDatabase() {
  const dbName = new URL(TEST_DATABASE_URL).pathname.slice(1);
  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to wipe "${dbName}": the test database's name must end in _test.`);
  }

  const pool = new pg.Pool({ connectionString: TEST_DATABASE_URL });

  // Fresh schema, built by the same migrations as production
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await pool.query(readFileSync(new URL(file, MIGRATIONS_DIR), "utf-8"));
  }

  return pool;
}
