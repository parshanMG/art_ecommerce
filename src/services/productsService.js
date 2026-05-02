const PRODUCTS_ENDPOINT = import.meta.env.VITE_PRODUCTS_ENDPOINT || "/data/products.json";

export async function fetchProducts() {
  const response = await fetch(PRODUCTS_ENDPOINT, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load products: ${response.status}`);
  }

  const products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error("Invalid products payload. Expected an array.");
  }

  // PostgreSQL returns NUMERIC columns as strings — normalise to JS number
  return products.map((p) => ({ ...p, price: parseFloat(p.price) }));
}

export function getFeaturedProducts(products) {
  return products.filter((product) => product.featured);
}
