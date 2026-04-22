/* ─────────────────────────────────────────────────────────────────────
   IMPORTS
───────────────────────────────────────────────────────────────────── */
import { useEffect, useState } from "react";
import { fetchProducts } from "../services/productsService";
import { useCart } from "../context/CartContext";

/* ─────────────────────────────────────────────────────────────────────
   PRODUCT CARD
   Renders a single artwork card in the masonry-style grid.
   Hovering dims the image and reveals the product info + action buttons.

   Props:
     product — a single product object from products.json
───────────────────────────────────────────────────────────────────── */
function ProductCard({ product }) {
  const { addToCart, removeFromCart, cartItems } = useCart();
  // Check once whether this product is already in the cart
  const inCart = cartItems.some((item) => item.id === product.id);

  return (
    <article className="group relative w-full max-w-[34rem] mx-auto overflow-hidden rounded-2xl shadow-sm">

      {/* ── Product image ─────────────────────────────────────────
          Dims on hover to reveal the overlay below.
          To change card height, adjust h-[46rem].
      ─────────────────────────────────────────────────────────── */}
      <img
        src={product.image}
        alt={product.title}
        className="h-[46rem] w-full object-cover transition duration-300 group-hover:brightness-50"
      />

      {/* ── Hover overlay ─────────────────────────────────────────
          Gradient overlay fades in on hover (opacity-0 → opacity-100).
          pointer-events-none on the wrapper, pointer-events-auto on
          the inner div so buttons remain clickable.
      ─────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/35 to-transparent p-6 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="pointer-events-auto w-full text-white">

          {/* Product info */}
          <div className="mb-4">
            <p className="text-2xl font-semibold">{product.title}</p>
            <p className="mt-1 text-sm text-white/90">Size: {product.dimensions}</p>
            <p className="text-sm text-white/90">Type: {product.medium}</p>
            <p className="mt-1 text-base font-medium">${product.price.toFixed(2)}</p>
          </div>

          {/* ── Action buttons ──────────────────────────────────────
              Buy Now     — placeholder, wire up to checkout later
              Add/Remove  — toggles the item in/out of the cart;
                            turns burgundy and shows "Added ✓" when in cart
              Enquire     — links to the enquiry form with product id
          ─────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            {/* TODO: wire Buy Now to the checkout / payment flow */}
            <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/50 transition hover:bg-[#800020]">
              Buy Now
            </button>
            <button
              onClick={() => inCart ? removeFromCart(product.id) : addToCart(product)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ring-1 transition ${
                inCart
                  ? "bg-[#800020] ring-[#800020] text-white hover:bg-red-800"
                  : "bg-white/10 ring-white/50 hover:bg-[#800020]"
              }`}
            >
              {inCart ? "Added ✓" : "Add to Basket +"}
            </button>
            <a
              href={`/enquiry?product=${product.id}`}
              className="rounded-lg bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/50 transition hover:bg-[#800020]"
            >
              Enquire
            </a>
          </div>

        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SHOP PAGE
   Rendered at the "/shop" route. Fetches all available products and
   lays them out in a two-column staggered (masonry-style) grid.

   Layout logic:
     Left column  — even-indexed products (0, 2, 4 …)
     Right column — odd-indexed products  (1, 3, 5 …), offset down 14rem
───────────────────────────────────────────────────────────────────── */
export default function Shop() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState("");

  // Fetch products on mount; filter to only available ones
  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((data) => {
        if (active) setProducts(data.filter((p) => p.available));
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load products.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    // Cleanup — prevents state updates if the component unmounts mid-fetch
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen relative bg-white pt-28 pb-16">

      {/* ── Page header ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 md:px-10 xl:px-16">
        <div className="mb-10 border-b border-gray-200 pb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[#800020]">Shop</p>
          <h1 className="mt-3 text-4xl font-semibold text-black">All Artwork</h1>
          <p className="mt-4 max-w-2xl text-base text-gray-600">
            Browse the full collection of original paintings and limited-edition prints.
          </p>
        </div>
      </section>

      {/* ── Product grid ──────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10 xl:px-16">
        {isLoading && <p className="text-center text-gray-500">Loading…</p>}
        {error     && <p className="text-center text-red-600">{error}</p>}

        <div className="flex flex-col gap-1 md:flex-row">

          {/* Left column — even-indexed products */}
          <div className="flex flex-1 flex-col gap-1">
            {products.filter((_, i) => i % 2 === 0).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Right column — odd-indexed products, pushed down for stagger effect */}
          <div className="flex flex-1 flex-col gap-1 md:mt-[14rem]">
            {products.filter((_, i) => i % 2 === 1).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

        </div>
      </section>
    </main>
  );
}
