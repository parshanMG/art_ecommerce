/* Checks data/products.json itself, so a mistake made while editing the
   catalog fails the build instead of breaking the gallery. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "fs";
import { loadCatalog, findCatalogProduct } from "../catalog.js";

const catalog = loadCatalog();
const PUBLIC_DIR = new URL("../../public/", import.meta.url);

test("every product has an id, title, price and category", () => {
  for (const p of catalog) {
    assert.ok(p.id && typeof p.id === "string", `product without an id: ${JSON.stringify(p)}`);
    // A number in quotes ("14"): a new product takes the next one up
    assert.match(p.id, /^[1-9]\d*$/, `${p.id} is not a numbered id like "14"`);
    assert.ok(p.title, `${p.id} has no title`);
    assert.ok(typeof p.price === "number" && p.price > 0, `${p.id} has no valid price`);
    assert.ok(p.category, `${p.id} has no category`);
  }
});

test("product ids are unique", () => {
  const ids = catalog.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every image the catalog points to exists in public/", () => {
  for (const p of catalog) {
    for (const path of [p.image, p.thumbnail].filter(Boolean)) {
      assert.ok(existsSync(new URL(path.replace(/^\//, ""), PUBLIC_DIR)), `${p.id}: ${path} is missing`);
    }
  }
});

test("findCatalogProduct looks artwork up by id", () => {
  const first = catalog[0];
  assert.equal(findCatalogProduct(first.id).title, first.title);
  assert.equal(findCatalogProduct("no-such-artwork"), null);
});
