/* ─────────────────────────────────────────────────────────────────────
   SEED SCRIPT
   Reads products from public/data/products.json and inserts them into
   the products table in PostgreSQL.

   Run once after migrations:
     cd server
     node db/seed.js

   Safe to re-run — uses INSERT ... ON CONFLICT DO NOTHING so existing
   rows are left untouched (their live availability flags are preserved).
───────────────────────────────────────────────────────────────────── */
import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import pool from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const productsPath = resolve(__dirname, "../../public/data/products.json");
const products = JSON.parse(readFileSync(productsPath, "utf-8"));

async function seed() {
  const client = await pool.connect();

  try {
    console.log(`Seeding ${products.length} products…`);

    for (const p of products) {
      await client.query(
        `INSERT INTO products (
          id, title, price, category, medium, dimensions,
          year, available, reserved, featured, image, thumbnail, description
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, FALSE, $9, $10, $11, $12
        )
        ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.title,
          p.price,
          p.category,
          p.medium      ?? null,
          p.dimensions  ?? null,
          p.year        ?? null,
          p.available   ?? true,
          p.featured    ?? false,
          p.image       ?? null,
          p.thumbnail   ?? null,
          p.description ?? null,
        ]
      );
      console.log(`  ✓ ${p.id}`);
    }

    console.log("Seed complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
