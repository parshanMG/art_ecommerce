/* ─────────────────────────────────────────────────────────────────────
   CATALOG
   data/products.json is the source of truth for the artwork. In
   portfolio mode it's served as-is; in shop mode `npm run seed` copies
   it into the database, which then also tracks live reservations.

   The file is read once at startup — restart the server (or redeploy)
   after editing it.
───────────────────────────────────────────────────────────────────── */
import { readFileSync } from "fs";

const CATALOG_URL = new URL("./data/products.json", import.meta.url);

/* The fields GET /api/products returns, with the defaults the database
   would fill in, so both modes answer with the same shape. */
function toPublicProduct(p) {
  return {
    id:             p.id,
    title:          p.title,
    price:          p.price,
    category:       p.category,
    medium:         p.medium ?? null,
    dimensions:     p.dimensions ?? null,
    year:           p.year ?? null,
    available:      p.available ?? true,
    featured:       p.featured ?? false,
    image:          p.image ?? null,
    thumbnail:      p.thumbnail ?? null,
    description:    p.description ?? null,
    title_fa:       p.title_fa ?? null,
    medium_fa:      p.medium_fa ?? null,
    dimensions_fa:  p.dimensions_fa ?? null,
    description_fa: p.description_fa ?? null,
  };
}

/* Newest first, then by title — the same order as the database query
   (PostgreSQL puts a missing year first when sorting DESC). */
function compareProducts(a, b) {
  const yearA = a.year ?? Infinity;
  const yearB = b.year ?? Infinity;
  if (yearA !== yearB) return yearB - yearA;
  return a.title.localeCompare(b.title);
}

export function loadCatalog(url = CATALOG_URL) {
  const products = JSON.parse(readFileSync(url, "utf-8"));
  if (!Array.isArray(products)) {
    throw new Error(`${url.pathname} must contain an array of products.`);
  }
  return products;
}

const catalog = loadCatalog();
const publicProducts = catalog.map(toPublicProduct).sort(compareProducts);
const byId = new Map(catalog.map((p) => [p.id, p]));

export async function listCatalogProducts() {
  return publicProducts;
}

export function findCatalogProduct(id) {
  return byId.get(id) ?? null;
}
