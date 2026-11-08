/* ─────────────────────────────────────────────────────────────────────
   IMPORTS
───────────────────────────────────────────────────────────────────── */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts, getFeaturedProducts } from "../services/productsService";
import { useCanHover } from "../hooks/useCanHover";
import { COMMERCE_ENABLED } from "../config/features";
import { BasketToggle } from "../features/commerce/PurchaseButtons";
import { useLanguage } from "../i18n/LanguageContext";
import { formatPrice, formatDigits, productText } from "../i18n/format";

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────── */
/* Text in each language */
const COPY = {
  en: {
    eyebrow: "Featured Works",
    heading: "Recent Paintings",
    viewAll: "View All Works",
    prev: "Previous featured products",
    next: "Next featured products",
    goToSlide: (n) => `Go to slide ${n}`,
    size: "Size", medium: "Medium", year: "Year",
    sold: "Sold",
    enquire: "Enquire",
    loadError: "Couldn't load the paintings. Please try again later.",
    empty: "No featured paintings right now.",
  },
  fa: {
    eyebrow: "آثار منتخب",
    heading: "نقاشی‌های اخیر",
    viewAll: "مشاهده همه آثار",
    prev: "آثار قبلی",
    next: "آثار بعدی",
    goToSlide: (n) => `رفتن به اسلاید ${n}`,
    size: "اندازه", medium: "تکنیک", year: "سال",
    sold: "فروخته شد",
    enquire: "استعلام",
    loadError: "بارگذاری نقاشی‌ها ممکن نشد. لطفاً بعداً دوباره تلاش کنید.",
    empty: "در حال حاضر اثر منتخبی وجود ندارد.",
  },
};

// Returns how many cards to show per carousel slide based on viewport width.
// Defined outside the component so the resize useEffect never holds a stale reference.
const getPageSize = () => {
  if (window.innerWidth < 640)  return 1;   // phone
  if (window.innerWidth < 1024) return 2;   // tablet
  return 3;                                  // desktop
};

/* ─────────────────────────────────────────────────────────────────────
   FEATURED PRODUCTS CAROUSEL
   Displays products that have featured:true in products.json.
   Cards flip on hover to reveal details and an Enquire button (plus a
   basket button in shop mode).
   Touch screens can't hover, so there a tap flips the card instead;
   keyboard focus on a button on the back flips it too.

   Pagination:
     • pageSize controls how many cards show per slide (default 3)
     • Arrow buttons cycle through pages
     • Dot indicators jump to a specific page

   Shop mode adds a basket toggle — see
   src/features/commerce/PurchaseButtons.jsx
───────────────────────────────────────────────────────────────────── */
export default function FeaturedProductsCarousel() {
  const [products, setProducts]   = useState([]);
  const [pageIndex, setPageIndex] = useState(0);   // which slide page is currently visible
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState("");
  const [flippedId, setFlippedId] = useState(null); // card flipped by a tap (touch screens only)
  const canHover = useCanHover();
  const { lang, isRtl } = useLanguage();
  const c = COPY[lang];

  // Taps on the card's own links/buttons do their job without flipping it
  const handleTap = (e, productId) => {
    if (canHover || e.target.closest("a, button")) return;
    setFlippedId((prev) => (prev === productId ? null : productId));
  };

  /* ── Fetch featured products on mount ── */
  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const allProducts      = await fetchProducts();
        // getFeaturedProducts keeps featured:true items (sold ones show a SOLD badge)
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

  /* ── Responsive page size ───────────────────────────────────────
     < 640 px  (phone)   → 1 card per slide
     640–1023px (tablet) → 2 cards per slide
     ≥ 1024 px (desktop) → 3 cards per slide
     Resets the current page index to 0 whenever the size changes
     so we never land on a now-empty page.
  ─────────────────────────────────────────────────────────────── */
  const [pageSize, setPageSize] = useState(getPageSize);

  useEffect(() => {
    const onResize = () => {
      const next = getPageSize();
      setPageSize((prev) => {
        if (prev !== next) setPageIndex(0);
        return next;
      });
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Pagination ──────────────────────────────────────────────────
     Split the products array into chunks of pageSize.
  ─────────────────────────────────────────────────────────────── */
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < products.length; i += pageSize) {
      chunks.push(products.slice(i, i + pageSize));
    }
    return chunks;
  }, [products, pageSize]);

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
      <div className="flex flex-col sm:flex-row gap-6 md:gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 h-80 md:h-96 rounded-xl bg-[#E8DCD0] animate-pulse" />
        ))}
      </div>
    </div>
  );
  if (error)     return <div className="text-center py-10 text-red-600">{c.loadError}</div>;
  if (!products.length) return <div className="text-center py-10 text-gray-600">{c.empty}</div>;

  return (
    <div>

      {/* ── Section heading ─────────────────────────────────────────
          Mobile:  label + heading stacked, "View all" link sits below
                   in terracotta as a small text link.
          Tablet+: original side-by-side layout with the link right-aligned.
      ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-0 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#6F8F8B] mb-1">{c.eyebrow}</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#2F2A26]">{c.heading}</h2>
        </div>
        <Link
          to="/shop"
          className="self-start sm:self-auto text-xs sm:text-sm font-medium tracking-[0.15em] sm:tracking-wide uppercase sm:normal-case text-[#D98C7A] sm:text-[#2F2A26] hover:text-[#D98C7A] transition flex items-center gap-1.5 sm:pb-1"
        >
          {c.viewAll} <span aria-hidden="true" className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </div>

      {/* ── Carousel track + arrow buttons ──────────────────────── */}
      <div className="flex items-center justify-center gap-3 md:gap-6">

        {/* Previous arrow */}
        <button
          type="button"
          aria-label={c.prev}
          onClick={goPrev}
          className="shrink-0 w-10 h-10 md:w-12 md:h-12 hover:bg-[#E8DCD0] transition rounded-full flex items-center justify-center"
        >
          <img
            src="/images/Icons/arrow_back_ios_new_60dp_BLACK_FILL0_wght400_GRAD0_opsz48.png"
            alt=""
            className="w-5 h-5 md:w-6 md:h-6 rtl:-scale-x-100"
          />
        </button>

        {/* ── Sliding window ────────────────────────────────────────
            overflow-hidden clips the off-screen pages.
            The inner flex div shifts by pageIndex * 100% to reveal the
            correct page — leftwards in English, rightwards in Persian
            (right-to-left pages are laid out from the right).
            Off-screen pages are inert: otherwise Tab reaches their
            links and the browser scrolls this clipped box to show
            them, knocking the carousel out of line.
        ─────────────────────────────────────────────────────────── */}
        <div className="overflow-hidden flex-1">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(${isRtl ? "" : "-"}${pageIndex * 100}%)` }}
          >
            {pages.map((page, idx) => (
              <div
                key={idx}
                // React 18 has no boolean `inert` prop; "" sets the attribute
                inert={idx === pageIndex ? undefined : ""}
                className="w-full shrink-0 flex flex-col sm:flex-row gap-6 md:gap-8"
              >
                {page.map((product, cardIdx) => {
                  const delay = cardIdx * 120;
                  const isFlipped = flippedId === product.id;
                  return (
                  // ── Flip card ─────────────────────────────────────────
                  <article
                    key={product.id}
                    onClick={(e) => handleTap(e, product.id)}
                    className="group flex-1 [perspective:1000px] card-enter"
                    style={{ "--card-delay": `${delay}ms` }}
                  >
                    <div className={`relative h-80 md:h-96 w-full transition-transform duration-700 ease-in-out [transition-delay:0ms] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-hover:[transition-delay:500ms] group-focus-within:[transform:rotateY(180deg)] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>

                      {/* ── Card front ──────────────────────────────── */}
                      <div className="absolute inset-0 rounded-xl overflow-hidden [backface-visibility:hidden]">
                        {/* Touch-only cue that the card can be tapped for details */}
                        {!canHover && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-4 end-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                              <circle cx="12" cy="12" r="9" />
                              <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
                            </svg>
                          </span>
                        )}
                        {!product.available && (
                          <div className="absolute top-4 end-4 z-10 bg-[#2F2A26]/75 text-white text-sm font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full shadow-md">
                            {c.sold}
                          </div>
                        )}
                        <img
                          src={product.image}
                          alt={productText(product, "title", lang)}
                          className={`w-full h-full object-cover ${!product.available ? "[filter:grayscale(0.4)]" : ""}`}
                          loading="lazy"
                        />
                        {/* Title + price gradient overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent px-5 py-4">
                          <h3 className="text-white text-lg font-semibold leading-tight">{productText(product, "title", lang)}</h3>
                          <p className="text-white/80 text-sm mt-0.5">{formatPrice(product.price, lang)}</p>
                        </div>
                      </div>

                      {/* ── Card back ───────────────────────────────────
                          [transform:rotateY(180deg)] pre-rotates the back
                          so it faces away until the flip completes.
                          It only takes clicks while showing, so its
                          buttons can't be tapped through the front.
                      ─────────────────────────────────────────────── */}
                      <div className={`absolute inset-0 rounded-xl overflow-hidden bg-[#E8DCD0] px-6 py-7 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] ${isFlipped ? "" : "pointer-events-none group-hover:pointer-events-auto"}`}>
                        <div>
                          <h3 className="text-xl font-semibold text-[#2F2A26] mb-4 leading-snug">{productText(product, "title", lang)}</h3>

                          {/* Product metadata — only renders if the field exists */}
                          <dl className="space-y-2 text-sm">
                            {product.dimensions && (
                              <div className="flex gap-2">
                                <dt className="font-medium text-[#2F2A26] w-16 shrink-0">{c.size}</dt>
                                <dd className="text-gray-600"><bdi>{productText(product, "dimensions", lang)}</bdi></dd>
                              </div>
                            )}
                            {product.medium && (
                              <div className="flex gap-2">
                                <dt className="font-medium text-[#2F2A26] w-16 shrink-0">{c.medium}</dt>
                                <dd className="text-gray-600"><bdi>{productText(product, "medium", lang)}</bdi></dd>
                              </div>
                            )}
                            {product.year && (
                              <div className="flex gap-2">
                                <dt className="font-medium text-[#2F2A26] w-16 shrink-0">{c.year}</dt>
                                <dd className="text-gray-600">{formatDigits(product.year, lang)}</dd>
                              </div>
                            )}
                          </dl>

                          <p className="mt-5 text-xl font-semibold text-[#2F2A26]">{formatPrice(product.price, lang)}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {/* Add / Remove basket toggle — shop mode only */}
                          {COMMERCE_ENABLED && <BasketToggle product={product} />}
                          {/* Enquire button — always visible */}
                          <Link
                            to={`/contact?product=${product.id}`}
                            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-center transition bg-[#D98C7A] text-white hover:bg-[#bf7360]"
                          >
                            {c.enquire}
                          </Link>
                        </div>
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
          aria-label={c.next}
          onClick={goNext}
          className="shrink-0 w-10 h-10 md:w-12 md:h-12 hover:bg-[#E8DCD0] transition rounded-full flex items-center justify-center"
        >
          <img
            src="/images/Icons/arrow_forward_ios_60dp_BLACK_FILL0_wght400_GRAD0_opsz48.png"
            alt=""
            className="w-5 h-5 md:w-6 md:h-6 rtl:-scale-x-100"
          />
        </button>
      </div>

      {/* ── Dot indicators ──────────────────────────────────────────── */}
      <div className="mt-6 flex justify-center gap-2">
        {pages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPageIndex(idx)}
            aria-label={c.goToSlide(formatDigits(idx + 1, lang))}
            className={`w-2.5 h-2.5 rounded-full transition ${idx === pageIndex ? "bg-[#D98C7A]" : "bg-[#E8DCD0]"}`}
          />
        ))}
      </div>

    </div>
  );
}
