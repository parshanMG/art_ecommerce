/* ─────────────────────────────────────────────────────────────────────
   IMPORTS
───────────────────────────────────────────────────────────────────── */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, getFeaturedProducts } from "../services/productsService";
import { useCart } from "../context/CartContext";
import { useInView } from "../hooks/useInView";
import { COMMERCE_ENABLED } from "../config/features";

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────── */
// Formats a number as a USD currency string e.g. 1500 → "$1,500.00"
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

/* ─────────────────────────────────────────────────────────────────────
   FEATURED PRODUCTS CAROUSEL
   Displays products that have featured:true in products.json.
   Cards flip on hover to reveal details + an add/remove basket button.

   Pagination:
     • pageSize controls how many cards show per slide (default 3)
     • Arrow buttons cycle through pages
     • Dot indicators jump to a specific page

   Cart integration:
     • "Add to Basket +" adds to CartContext and turns the button burgundy
     • Clicking "Added ✓" removes the item from the cart
───────────────────────────────────────────────────────────────────── */
export default function FeaturedProductsCarousel() {
  const [products, setProducts]   = useState([]);
  const [pageIndex, setPageIndex] = useState(0);   // which slide page is currently visible
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState("");

  // Cart actions and state from CartContext
  const { addToCart, removeFromCart, cartItems } = useCart();

  // Helper to check if a product is already in the cart
  const isInCart = (productId) => cartItems.some((item) => item.id === productId);

  /* ── Fetch featured products on mount ── */
  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const allProducts      = await fetchProducts();
        // getFeaturedProducts filters for available:true && featured:true
        const featuredProducts = getFeaturedProducts(allProducts);
        if (isMounted) setProducts(featuredProducts);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || "Failed to load products.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProducts();
    // Cleanup — prevents state updates if component unmounts before fetch completes
    return () => { isMounted = false; };
  }, []);

  /* ── Pagination ──────────────────────────────────────────────────
     Split the products array into chunks of pageSize.
     To show more/fewer cards per slide, change pageSize.
  ─────────────────────────────────────────────────────────────── */
  const pageSize = 3;
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < products.length; i += pageSize) {
      chunks.push(products.slice(i, i + pageSize));
    }
    return chunks;
  }, [products]);

  // Advance to the next page (wraps around)
  const goNext = () => {
    if (!pages.length) return;
    setPageIndex((prev) => (prev + 1) % pages.length);
  };

  // Go back to the previous page (wraps around)
  const goPrev = () => {
    if (!pages.length) return;
    setPageIndex((prev) => (prev - 1 + pages.length) % pages.length);
  };

  /* ── Loading / error / empty states ── */
  if (isLoading) return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="h-3 w-28 rounded bg-[#E8DCD0] animate-pulse mb-2" />
          <div className="h-8 w-52 rounded bg-[#E8DCD0] animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 h-80 md:h-96 rounded-xl bg-[#E8DCD0] animate-pulse" />
        ))}
      </div>
    </div>
  );
  if (error)     return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!products.length) return <div className="text-center py-10 text-gray-600">No featured products available right now.</div>;

  return (
    <div>

      {/* ── Section heading ─────────────────────────────────────────
          Left: small uppercase label + main title.
          Right: "VIEW ALL WORKS →" link — mirrors the reference layout.
      ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#6F8F8B] mb-1">Featured Works</p>
          <h2 className="text-3xl font-semibold text-[#2F2A26]">Recent Paintings</h2>
        </div>
        <Link
          to="/shop"
          className="text-sm font-medium text-[#2F2A26] hover:text-[#D98C7A] transition tracking-wide flex items-center gap-1.5 pb-1"
        >
          VIEW ALL WORKS <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* ── Carousel track + arrow buttons ──────────────────────── */}
      <div className="flex items-center justify-center gap-3 md:gap-6">

        {/* Previous arrow */}
        <button
          type="button"
          aria-label="Previous featured products"
          onClick={goPrev}
          className="shrink-0 w-10 h-10 md:w-12 md:h-12 hover:bg-[#E8DCD0] transition rounded-full flex items-center justify-center"
        >
          <img
            src="/images/Icons/arrow_back_ios_new_60dp_BLACK_FILL0_wght400_GRAD0_opsz48.png"
            alt="Previous"
            className="w-5 h-5 md:w-6 md:h-6"
          />
        </button>

        {/* ── Sliding window ────────────────────────────────────────
            overflow-hidden clips the off-screen pages.
            The inner flex div shifts left by pageIndex * 100% to
            reveal the correct page.
        ─────────────────────────────────────────────────────────── */}
        <div className="overflow-hidden flex-1">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${pageIndex * 100}%)` }}
          >
            {pages.map((page, idx) => (
              <div key={idx} className="w-full shrink-0 flex flex-col md:flex-row gap-6 md:gap-8">
                {page.map((product, cardIdx) => {
                  const delay = cardIdx * 120;
                  return (
                  // ── Flip card ─────────────────────────────────────────
                  <article
                    key={product.id}
                    className="group flex-1 [perspective:1000px] card-enter"
                    style={{ "--card-delay": `${delay}ms` }}
                  >
                    <div className="relative h-80 md:h-96 w-full transition-transform duration-700 ease-in-out [transition-delay:0ms] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-hover:[transition-delay:500ms]">

                      {/* ── Card front ──────────────────────────────── */}
                      <div className="absolute inset-0 rounded-xl overflow-hidden [backface-visibility:hidden]">
                        {!product.available && (
                          <div className="absolute top-4 right-4 z-10 bg-[#2F2A26]/75 text-white text-sm font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full shadow-md">
                            Sold
                          </div>
                        )}
                        <img
                          src={product.image}
                          alt={product.title}
                          className={`w-full h-full object-cover ${!product.available ? "[filter:grayscale(0.4)]" : ""}`}
                          loading="lazy"
                        />
                        {/* Title + price gradient overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent px-5 py-4">
                          <h3 className="text-white text-lg font-semibold leading-tight">{product.title}</h3>
                          <p className="text-white/80 text-sm mt-0.5">{formatCurrency(product.price)}</p>
                        </div>
                      </div>

                      {/* ── Card back ───────────────────────────────────
                          [transform:rotateY(180deg)] pre-rotates the back
                          so it faces away until the flip completes.
                      ─────────────────────────────────────────────── */}
                      <div className="absolute inset-0 rounded-xl overflow-hidden bg-[#E8DCD0] px-6 py-7 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div>
                          <h3 className="text-xl font-semibold text-[#2F2A26] mb-4 leading-snug">{product.title}</h3>

                          {/* Product metadata — only renders if the field exists */}
                          <dl className="space-y-2 text-sm">
                            {product.dimensions && (
                              <div className="flex gap-2">
                                <dt className="font-medium text-[#2F2A26] w-16 shrink-0">Size</dt>
                                <dd className="text-gray-600">{product.dimensions}</dd>
                              </div>
                            )}
                            {product.medium && (
                              <div className="flex gap-2">
                                <dt className="font-medium text-[#2F2A26] w-16 shrink-0">Medium</dt>
                                <dd className="text-gray-600">{product.medium}</dd>
                              </div>
                            )}
                            {product.year && (
                              <div className="flex gap-2">
                                <dt className="font-medium text-[#2F2A26] w-16 shrink-0">Year</dt>
                                <dd className="text-gray-600">{product.year}</dd>
                              </div>
                            )}
                          </dl>

                          <p className="mt-5 text-xl font-semibold text-[#2F2A26]">{formatCurrency(product.price)}</p>
                        </div>

                        {/* Add / Remove basket toggle button */}
                        {COMMERCE_ENABLED && (product.available ? (
                          <button
                            onClick={() => isInCart(product.id) ? removeFromCart(product.id) : addToCart(product)}
                            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition bg-[#D98C7A] hover:bg-[#bf7360] text-white"
                          >
                            {isInCart(product.id) ? "Added ✓" : "Add to Basket +"}
                          </button>
                        ) : (
                          <div className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-center bg-[#E8DCD0] text-[#A89E94] cursor-default">
                            Sold
                          </div>
                        ))}
                      </div>

                    </div>
                  </article>
                  // ── End flip card ─────────────────────────────────────
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Next arrow */}
        <button
          type="button"
          aria-label="Next featured products"
          onClick={goNext}
          className="shrink-0 w-10 h-10 md:w-12 md:h-12 hover:bg-[#E8DCD0] transition rounded-full flex items-center justify-center"
        >
          <img
            src="/images/Icons/arrow_forward_ios_60dp_BLACK_FILL0_wght400_GRAD0_opsz48.png"
            alt="Next"
            className="w-5 h-5 md:w-6 md:h-6"
          />
        </button>
      </div>

      {/* ── Dot indicators ──────────────────────────────────────────── */}
      <div className="mt-6 flex justify-center gap-2">
        {pages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPageIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition ${idx === pageIndex ? "bg-[#D98C7A]" : "bg-[#E8DCD0]"}`}
          />
        ))}
      </div>

    </div>
  );
}
