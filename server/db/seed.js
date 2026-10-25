/* ─────────────────────────────────────────────────────────────────────
   SEED SCRIPT
   Syncs products from public/data/products.json into the products
   table in PostgreSQL.

   Run after migrations, and again whenever products.json changes:
     cd server
     npm run seed

   Safe to re-run — existing rows are updated in place:
     • Catalog fields (title, price, category, medium, dimensions, year,
       featured, image, thumbnail, description, and the optional Persian
       title_fa / medium_fa / dimensions_fa / description_fa) always follow
       the JSON.
     • "available": false in the JSON marks a piece sold (e.g. sold at an
       exhibition). "available": true never revives a piece that was sold
       through the site — un-sell those by hand in the database.
     • Live reservation state is never touched.
   Products that exist in the database but not in the JSON are listed
   as a warning and left alone.
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
    await client.query("BEGIN");

    for (const p of products) {
      await client.query(
        `INSERT INTO products (
          id, title, price, category, medium, dimensions,
          year, available, reserved, featured, image, thumbnail, description,
          title_fa, medium_fa, dimensions_fa, description_fa
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, FALSE, $9, $10, $11, $12,
          $13, $14, $15, $16
        )
        ON CONFLICT (id) DO UPDATE SET
          title       = EXCLUDED.title,
          price       = EXCLUDED.price,
          category    = EXCLUDED.category,
          medium      = EXCLUDED.medium,
          dimensions  = EXCLUDED.dimensions,
          year        = EXCLUDED.year,
          featured    = EXCLUDED.featured,
          image       = EXCLUDED.image,
          thumbnail   = EXCLUDED.thumbnail,
          description = EXCLUDED.description,
          title_fa      = EXCLUDED.title_fa,
          medium_fa     = EXCLUDED.medium_fa,
          dimensions_fa = EXCLUDED.dimensions_fa,
          description_fa = EXCLUDED.description_fa,
          available   = products.available AND EXCLUDED.available`,
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
          p.title_fa      ?? null,
          p.medium_fa     ?? null,
          p.dimensions_fa ?? null,
          p.description_fa ?? null,
        ]
      );
      console.log(`  ✓ ${p.id}`);
    }

    const { rows: orphans } = await client.query(
      `SELECT id FROM products WHERE NOT (id = ANY($1::text[])) ORDER BY id`,
      [products.map((p) => p.id)]
    );

    await client.query("COMMIT");

    if (orphans.length) {
      console.warn(`Not in products.json (left untouched): ${orphans.map((r) => r.id).join(", ")}`);
    }
    console.log("Seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
