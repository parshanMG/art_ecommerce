/* ─────────────────────────────────────────────────────────────────────
   MIGRATION RUNNER
   Applies every .sql file in db/migrations/ that hasn't run yet, in
   filename order, each inside its own transaction. Applied files are
   recorded in the schema_migrations table.

   Run from the server folder:
     npm run migrate

   Every migration is idempotent (IF NOT EXISTS), so a database that was
   set up by hand before this runner existed can safely replay them.
───────────────────────────────────────────────────────────────────── */
import "dotenv/config";
import { readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import pool from "./pool.js";

const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), "migrations");

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         filename    TEXT        PRIMARY KEY,
         applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );

    const { rows } = await client.query("SELECT filename FROM schema_migrations");
    const applied = new Set(rows.map((r) => r.filename));
    const pending = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql") && !applied.has(file))
      .sort();

    if (!pending.length) {
      console.log("Database is up to date.");
      return;
    }

    for (const file of pending) {
      const sql = readFileSync(resolve(migrationsDir, file), "utf-8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  ✓ ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`${file}: ${err.message}`);
      }
    }

    console.log("Migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
