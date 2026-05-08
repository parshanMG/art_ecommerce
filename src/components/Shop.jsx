import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProducts } from "../services/productsService";
import { useCart } from "../context/CartContext";
import { useInView } from "../hooks/useInView";

/* ─────────────────────────────────────────────────────────────────────
   CATEGORY METADATA
   Controls sidebar label and sort order. Add entries here as the
   collection grows — products.json category values must match these keys.
───────────────────────────────────────────────────────────────────── */
const CATEGORY_META = {
  watercolour:   { label: "Watercolour",   order: 1 },
  calligraphy:   { label: "Calligraphy",   order: 2 },
  oil:           { label: "Oil on Canvas", order: 3 },
  acrylic:       { label: "Acrylic",       order: 4 },
  "mixed-media": { label: "Mixed Media",   order: 5 },
  print:         { label: "Prints",        order: 6 },
};

// Height of each slot in the drum roller (3 slots are visible at once)
const ITEM_H = 112;

/* ─────────────────────────────────────────────────────────────────────
   SKELETON CARD
   Pulsing placeholder shown while products are fetching.
   Matches the aspect-ratio and border-radius of a real ProductCard.
───────────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="w-full max-w-[34rem] mx-auto rounded-2xl overflow-hidden animate-pulse bg-[#E8DCD0] h-[30rem] sm:h-[38rem] lg:h-[46rem]" />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PRODUCT CARD
   Renders a single artwork card in the masonry-style grid.
   Hovering dims the image and reveals the product info + action buttons.

   Props:
     product — a single product object from products.json
───────────────────────────────────────────────────────────────────── */
function ProductCard({ product, index = 0 }) {
  const { addToCart, removeFromCart, cartItems } = useCart();
  const navigate = useNavigate();
  const inCart = cartItems.some((item) => item.id === product.id);
  const isSold = !product.available;
  const [ref, isVisible] = useInView({ threshold: 0.1 });
  // Cap delay at 400 ms so late cards don't wait too long
  const delay = Math.min(index * 80, 400);

  return (
    <article
      ref={ref}
      className={`group relative w-full max-w-[34rem] mx-auto overflow-hidden rounded-2xl shadow-sm ${
        isVisible ? "card-enter" : "card-hidden"
      }`}
      style={{ "--card-delay": `${delay}ms` }}
    >

      {/* ── Product image ─────────────────────────────────────────
          Dims on hover to reveal the overlay below.
          To change card height, adjust h-[46rem].
      ─────────────────────────────────────────────────────────── */}
      {/* Persistent SOLD badge */}
      {isSold && (
        <div className="absolute top-4 right-4 z-10 bg-[#2F2A26]/75 text-white text-sm font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full pointer-events-none shadow-md">
          Sold
        </div>
      )}

      <img
        src={product.image}
        alt={product.title}
        className={`h-[30rem] sm:h-[38rem] lg:h-[46rem] w-full object-cover transition duration-300 group-hover:brightness-50 ${isSold ? "[filter:grayscale(0.4)]" : ""}`}
        loading="lazy"
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
            {isSold ? (
              <span className="text-white/70 text-sm italic">This piece has been sold</span>
            ) : (
              <>
                <button
                  onClick={() => { addToCart(product); navigate("/checkout"); }}
                  disabled={inCart}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    inCart
                      ? "bg-[#A89E94] text-white cursor-not-allowed opacity-60"
                      : "bg-[#D98C7A] text-white hover:bg-[#bf7360]"
                  }`}
                >
                  Buy Now
                </button>
                <button
                  onClick={() => inCart ? removeFromCart(product.id) : addToCart(product)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    inCart
                      ? "bg-[#D98C7A] text-white hover:bg-[#bf7360]"
                      : "bg-[#D98C7A] text-white hover:bg-[#bf7360]"
                  }`}
                >
                  {inCart ? "Added ✓" : "Add to Basket +"}
                </button>
              </>
            )}
            <Link
              to={`/contact?product=${product.id}`}
              className="rounded-lg bg-[#D98C7A] px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-[#bf7360]"
            >
              Enquire
            </Link>
          </div>

        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GALLERY PAGE
   Products are grouped by category. A sticky left sidebar (desktop)
   and a horizontal underline bar (mobile) let users jump to any
   category. Scrollspy highlights the active category as you scroll.
   The first card of each category briefly pulses with a terracotta
   ring to orient the user when that category becomes active.
───────────────────────────────────────────────────────────────────── */
export default function Gallery() {
  const [products, setProducts]           = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [flashCat, setFlashCat]           = useState(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const sectionRefs    = useRef({});
  const flashTimeout   = useRef(null);

  /* ── Fetch products ────────────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((data) => { if (active) setProducts(data); })
      .catch((err)  => { if (active) setError(err.message || "Failed to load products."); })
      .finally(()   => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  /* ── Group + sort by category ──────────────────────────────────── */
  const categories = useMemo(() => {
    const filtered = showAvailableOnly ? products.filter((p) => p.available) : products;
    const groups = {};
    filtered.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => (CATEGORY_META[a]?.order ?? 99) - (CATEGORY_META[b]?.order ?? 99)
    );
  }, [products, showAvailableOnly]);

  /* ── Default first category active on load ─────────────────────── */
  useEffect(() => {
    if (categories.length && activeCategory === null) {
      setActiveCategory(categories[0][0]);
    }
  }, [categories, activeCategory]);

  /* ── Trigger the beacon ring on the first card of a category ───── *
     Sets flashCat → wrapper div gets .category-beacon class →
     animation plays → class is removed after 2.4 s.
     requestAnimationFrame between null and new value ensures the
     class is removed+re-added even when re-triggering the same cat.
  ─────────────────────────────────────────────────────────────────── */
  const triggerFlash = (cat) => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    setFlashCat(null);
    requestAnimationFrame(() => {
      setFlashCat(cat);
      flashTimeout.current = setTimeout(() => setFlashCat(null), 2400);
    });
  };

  /* ── Scrollspy ─────────────────────────────────────────────────── *
     Observes the first card wrapper of every category.
     rootMargin "0px 0px -70% 0px" fires when the element enters
     the top 30 % of the viewport — natural while scrolling down.
  ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!categories.length) return;
    const observers = [];
    categories.forEach(([cat]) => {
      const el = sectionRefs.current[cat];
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveCategory(cat);
            triggerFlash(cat);
          }
        },
        { rootMargin: "0px 0px -70% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  /* ── Sidebar click ─────────────────────────────────────────────── */
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
    triggerFlash(cat);
  };

  /* ── Roller: 0-based index of the active category ─────────────── */
  const activeIndex = useMemo(
    () => Math.max(0, categories.findIndex(([cat]) => cat === activeCategory)),
    [categories, activeCategory]
  );

  return (
    <main className="min-h-screen bg-[#F6F1EB] pt-28 pb-20">

      {/* ── Page header ─────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 md:px-10 xl:px-16">
        <div className="mb-10 border-b border-[#E8DCD0] pb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="header-item text-sm uppercase tracking-[0.3em] text-[#D98C7A]" style={{ "--header-delay": "80ms" }}>Gallery</p>
              <h1 className="header-item mt-3 text-4xl font-semibold text-[#2F2A26]" style={{ "--header-delay": "200ms" }}>All Artwork</h1>
            </div>
            {/* ── Availability filter toggle ── */}
            <div className="header-item mt-auto pb-1 flex items-center gap-1.5 rounded-full border border-[#E8DCD0] bg-[#F6F1EB] p-1 shadow-sm" style={{ "--header-delay": "320ms" }}>
              <button
                onClick={() => setShowAvailableOnly(false)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                  !showAvailableOnly
                    ? "bg-[#D98C7A] text-white shadow"
                    : "text-[#A89E94] hover:text-[#6B6159]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setShowAvailableOnly(true)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                  showAvailableOnly
                    ? "bg-[#D98C7A] text-white shadow"
                    : "text-[#A89E94] hover:text-[#6B6159]"
                }`}
              >
                Available Only
              </button>
            </div>
          </div>
          <p className="header-item mt-4 max-w-2xl text-base text-gray-600" style={{ "--header-delay": "380ms" }}>
            Browse the full collection of original paintings and limited-edition prints.
          </p>
        </div>
      </section>

      {/* ── Mobile: horizontal underline category bar ───────────── */}
      {!isLoading && !error && (
        <div className="header-item lg:hidden sticky top-[72px] z-30 bg-[#F6F1EB]/95 backdrop-blur-sm border-b border-[#E8DCD0] px-6 py-3 mb-8" style={{ "--header-delay": "480ms" }}>
          <div className="flex gap-5 overflow-x-auto">
            {categories.map(([cat]) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`shrink-0 text-xs font-medium pb-1 transition-all duration-200 border-b-2 ${
                  activeCategory === cat
                    ? "text-[#2F2A26] border-[#D98C7A]"
                    : "text-[#A89E94] border-transparent hover:text-[#6B6159]"
                }`}
              >
                {CATEGORY_META[cat]?.label ?? cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Body: sidebar + product grid ────────────────────────── */}
      <div className="header-item mx-auto w-full max-w-7xl px-6 md:px-10 xl:px-16 flex gap-10 xl:gap-14 items-start" style={{ "--header-delay": "520ms" }}>

        {/* ── Roller: drum-style category navigator ─────────────────
            Sticky on the left, shows 3 slots at once:
              top    — previous category (faded, smaller)
              middle — active category   (full size, dark)
              bottom — next category     (faded, smaller)
            The inner strip slides vertically when activeCategory
            changes. Clicking any visible item jumps to it.
            Scrollspy updates activeCategory automatically.
        ────────────────────────────────────────────────────────── */}
        {!isLoading && !error && categories.length > 0 && (
          <aside
            className="hidden lg:flex w-56 shrink-0 sticky top-32 items-start"
          >
            {/* Roller wheel — clipped to exactly 3 slots.
                marginTop pushes the wheel center to true viewport center:
                50vh  (viewport mid)
                - 8rem  (aside sticky offset)
                - ITEM_H*1.5  (half the 3-slot window height)
            */}
            <div
              className="relative w-full"
              style={{ height: ITEM_H * 3, marginTop: `calc(50vh - 8rem - ${ITEM_H * 1.5}px)` }}
            >

              {/* ── Clipping window ── */}
              <div className="absolute inset-0 overflow-hidden">
                {/* ── Sliding strip — translates to keep active in center slot ── */}
                <div
                  style={{
                    transform:  `translateY(${(1 - activeIndex) * ITEM_H}px)`,
                    transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {categories.map(([cat], i) => {
                    const dist     = Math.abs(i - activeIndex);
                    const isActive = dist === 0;
                    const isNear   = dist === 1;
                    return (
                      <div
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className="flex items-center cursor-pointer select-none pl-6"
                        style={{ height: ITEM_H }}
                      >
                        <span
                          style={{
                            fontSize:      isActive ? "1.25rem" : "0.80rem",
                            fontWeight:    isActive ? 600       : 500,
                            color:         isActive ? "#2F2A26" : isNear ? "#6B6159" : "#A89E94",
                            opacity:       isActive ? 1         : isNear ? 0.9  : 0.08,
                            letterSpacing: isActive ? "0.01em"  : "0.04em",
                            transition:    "all 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
                          }}
                        >
                          {CATEGORY_META[cat]?.label ?? cat}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Center-slot frame: top + bottom rule lines ── */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top:          ITEM_H,
                  height:       ITEM_H,
                  borderTop:    "1px solid #E8DCD0",
                  borderBottom: "1px solid #E8DCD0",
                }}
              />
              {/* Terracotta accent bar on the left of the center slot */}
              <div
                className="absolute left-0 pointer-events-none"
                style={{
                  top:          ITEM_H + 20,
                  height:       ITEM_H - 40,
                  width:        3,
                  background:   "#D98C7A",
                  borderRadius: "0 2px 2px 0",
                }}
              />
              {/* ── Top fade mask — only covers the very edge so adjacent items stay readable ── */}
              <div
                className="absolute top-0 left-0 right-0 pointer-events-none z-10"
                style={{
                  height:     40,
                  background: "linear-gradient(to bottom, #F6F1EB, transparent)",
                }}
              />
              {/* ── Bottom fade mask ── */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                style={{
                  height:     40,
                  background: "linear-gradient(to top, #F6F1EB, transparent)",
                }}
              />
            </div>
          </aside>
        )}

        {/* ── Category groups ─────────────────────────────────────
            Products remain in the same two-column masonry layout.
            Each group's first card gets a wrapper ref (scrollspy)
            and the .category-beacon class when its category is active.
        ────────────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-12 md:space-y-20">
          {isLoading && (
            <div className="flex flex-col gap-1 md:flex-row">
              <div className="flex flex-1 flex-col gap-1">
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <div className="flex flex-1 flex-col gap-1 md:mt-[14rem]">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}
          {error     && <p className="text-center text-red-600 py-20">{error}</p>}

          {categories.map(([cat, items]) => {
            const leftItems  = items.filter((_, i) => i % 2 === 0);
            const rightItems = items.filter((_, i) => i % 2 === 1);
            return (
              <div key={cat} className="flex flex-col gap-1 md:flex-row">

                {/* Left column */}
                <div className="flex flex-1 flex-col gap-1">
                  {leftItems.map((product, colIdx) => {
                    const isFirst    = colIdx === 0;
                    const isFlashing = isFirst && flashCat === cat;
                    return (
                      <div
                        key={product.id}
                        ref={isFirst ? (el) => { sectionRefs.current[cat] = el; } : null}
                        className={`w-full max-w-[34rem] mx-auto rounded-2xl scroll-mt-36 ${isFlashing ? "category-beacon" : ""}`}
                      >
                        <ProductCard product={product} index={colIdx * 2} />
                      </div>
                    );
                  })}
                </div>

                {/* Right column — offset down when enough cards to stagger */}
                {rightItems.length > 0 && (
                  <div className={`flex flex-1 flex-col gap-1 ${items.length >= 3 ? "md:mt-[14rem]" : ""}`}>
                    {rightItems.map((product, colIdx) => (
                      <div key={product.id}>
                        <ProductCard product={product} index={colIdx * 2 + 1} />
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}
