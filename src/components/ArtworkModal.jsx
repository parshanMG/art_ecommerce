/* ─────────────────────────────────────────────────────────────────────
   ARTWORK MODAL
   Full-screen viewer opened by clicking a piece in the gallery.
     • Whole artwork, uncropped (object-contain), on a dark stage
     • Details panel: category, title, availability, size, medium,
       year, price, description and an Enquire button
     • Previous / next through the gallery (buttons, ← → keys, swipe)
     • Closes with ✕, Esc, or a click on the backdrop

   Accessibility: role="dialog" with aria-modal, focus moves to the
   close button on open, Tab stays inside the dialog, and focus
   returns to whatever opened it on close. Page scrolling is locked
   while it's open.

   Rendered into document.body through a portal: the page wrapper keeps
   a CSS transform from its entrance animation, which would otherwise
   trap position:fixed inside it.

   Props:
     product        — the artwork to show
     categoryLabel  — its category name, already in the current language
     position/total — "3 / 13" counter (1-based position)
     onClose        — close the viewer
     onPrev/onNext  — step through the gallery (omit to hide the arrows)
───────────────────────────────────────────────────────────────────── */
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { formatDigits, formatPrice, productText } from "../i18n/format";

/* ── Text in each language ───────────────────────────────────────── */
const COPY = {
  en: {
    close: "Close",
    prev: "Previous artwork",
    next: "Next artwork",
    size: "Size",
    medium: "Medium",
    year: "Year",
    price: "Price",
    available: "Available",
    sold: "Sold",
    enquire: "Enquire about this piece",
    enquireSold: "Ask about similar work",
    soldNote: "This piece has found a home. You can still get in touch about similar work or a commission.",
  },
  fa: {
    close: "بستن",
    prev: "اثر قبلی",
    next: "اثر بعدی",
    size: "اندازه",
    medium: "تکنیک",
    year: "سال",
    price: "قیمت",
    available: "موجود",
    sold: "فروخته شد",
    enquire: "استعلام درباره این اثر",
    enquireSold: "پرسش درباره آثار مشابه",
    soldNote: "این اثر فروخته شده است. همچنان می‌توانید درباره آثار مشابه یا سفارش اثر با ما در تماس باشید.",
  },
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SWIPE_MIN_PX = 50;

function Chevron({ direction }) {
  // Drawn pointing towards "next"; flipped for "prev" and again for right-to-left
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`h-5 w-5 ${direction === "prev" ? "-scale-x-100 rtl:scale-x-100" : "rtl:-scale-x-100"}`}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function ArtworkModal({ product, categoryLabel, position, total, onClose, onPrev, onNext }) {
  const { lang, isRtl } = useLanguage();
  const c = COPY[lang];
  const titleId = useId();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const touchStartX = useRef(null);
  const [loadedId, setLoadedId] = useState(null);

  const title = productText(product, "title", lang);
  const description = productText(product, "description", lang);
  const isSold = !product.available;
  const imageLoaded = loadedId === product.id;

  /* ── Lock page scroll, move focus in, restore both on close ── */
  useEffect(() => {
    const opener = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    // Keep the page from shifting sideways when its scrollbar disappears
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  /* ── Keyboard: Esc closes, arrows step (mirrored in RTL), Tab is trapped ── */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const forward = (e.key === "ArrowRight") !== isRtl;
        const step = forward ? onNext : onPrev;
        if (step) {
          e.preventDefault();
          step();
        }
      } else if (e.key === "Tab") {
        const nodes = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [])];
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const inside = dialogRef.current.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === first || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext, isRtl]);

  /* ── Swipe on the image to step (touch screens) ── */
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_MIN_PX) return;
    // Swiping left moves forward in English, backward in Persian
    const forward = (dx < 0) !== isRtl;
    (forward ? onNext : onPrev)?.();
  };

  const details = [
    { label: c.size,   value: productText(product, "dimensions", lang) },
    { label: c.medium, value: productText(product, "medium", lang) },
    { label: c.year,   value: product.year ? formatDigits(product.year, lang) : null },
  ].filter((d) => d.value);

  const navButtonClass =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6">

      {/* Backdrop — click to close */}
      <div
        className="modal-backdrop absolute inset-0 bg-[#1E1A17]/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-panel relative flex h-full w-full min-w-0 flex-col overflow-y-auto bg-[#F6F1EB] shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl lg:h-[88vh] lg:flex-row lg:overflow-hidden"
      >

        {/* ── Close ── */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={c.close}
          className="absolute top-3 end-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F1EB]/90 text-[#2F2A26] shadow-md transition hover:bg-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* ── Image stage ─────────────────────────────────────────────
            The whole artwork, never cropped. Fixed height on phones
            and tablets so the details sit just below; full panel
            height beside the details on desktop.
        ─────────────────────────────────────────────────────────── */}
        <div
          className="relative flex h-[62vh] shrink-0 items-center justify-center bg-[#2F2A26] p-3 sm:h-[60vh] sm:p-6 lg:h-full lg:min-w-0 lg:flex-1"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[#3E3832]" aria-hidden="true" />}
          <img
            key={product.id}
            src={product.image}
            alt={title}
            onLoad={() => setLoadedId(product.id)}
            className={`relative max-h-full max-w-full object-contain shadow-2xl transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            } ${isSold ? "grayscale-40" : ""}`}
          />

          {onPrev && (
            <button type="button" onClick={onPrev} aria-label={c.prev} className={`${navButtonClass} start-3`}>
              <Chevron direction="prev" />
            </button>
          )}
          {onNext && (
            <button type="button" onClick={onNext} aria-label={c.next} className={`${navButtonClass} end-3`}>
              <Chevron direction="next" />
            </button>
          )}

          {total > 1 && (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/90">
              {formatDigits(position, lang)} / {formatDigits(total, lang)}
            </span>
          )}
        </div>

        {/* ── Details panel ── */}
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:pt-16">
          <div>
            {categoryLabel && (
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#6F8F8B]">{categoryLabel}</p>
            )}
            {/* <bdi> keeps English fallback text in order without breaking the panel's alignment */}
            <h2 id={titleId} className="text-3xl font-semibold leading-tight text-[#2F2A26]">
              <bdi>{title}</bdi>
            </h2>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                isSold ? "bg-[#2F2A26] text-white" : "bg-[#6F8F8B]/15 text-[#4F6B67]"
              }`}
            >
              {isSold ? c.sold : c.available}
            </span>
          </div>

          <div className="h-px w-10 bg-[#D98C7A]" />

          {details.length > 0 && (
            <dl className="space-y-3 text-sm">
              {details.map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-20 shrink-0 font-medium text-[#2F2A26]">{label}</dt>
                  <dd className="text-[#6B6159]"><bdi>{value}</bdi></dd>
                </div>
              ))}
              {!isSold && (
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 font-medium text-[#2F2A26]">{c.price}</dt>
                  <dd className="font-semibold text-[#2F2A26]">{formatPrice(product.price, lang)}</dd>
                </div>
              )}
            </dl>
          )}

          {description && (
            <p className="text-sm leading-relaxed text-[#2F2A26]/80"><bdi>{description}</bdi></p>
          )}

          {isSold && (
            <p className="text-sm italic leading-relaxed text-[#6B6159]">{c.soldNote}</p>
          )}

          <Link
            to={`/contact?product=${product.id}`}
            className="mt-auto block rounded-xl bg-[#D98C7A] px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#bf7360]"
          >
            {isSold ? c.enquireSold : c.enquire}
          </Link>
        </div>

      </div>
    </div>,
    document.body
  );
}
