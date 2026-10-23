/* ─────────────────────────────────────────────────────────────────────
   ABOUT THE ARTIST SECTION
   A three-column strip:
     Left   — painting / portrait image
     Centre — label, heading, accent rule, bio text, "Learn More" link
     Right  — decorative botanical image (optional)

   ── HOW TO CUSTOMISE ──────────────────────────────────────────────
   ARTIST_IMAGE   — swap to any image in /public/images/
   COPY           — label, heading, bio and link text, in English and
                    Persian
   LEARN_MORE_URL — where "LEARN MORE →" links to
─────────────────────────────────────────────────────────────────── */

import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

/* ── Editable constants ──────────────────────────────────────────── */
const ARTIST_IMAGE    = "/images/products/maryam.jpeg";
const LEARN_MORE_URL  = "/about";

const COPY = {
  en: {
    label:     "About the Artist",
    heading:   "Painting the Poetry\nof Everyday Life",
    bio:       "My watercolors are inspired by nature, memories, and the quiet beauty found in everyday moments.",
    learnMore: "Learn More",
    imageAlt:  "A painting by Maryam Mohseni",
  },
  fa: {
    label:     "درباره هنرمند",
    heading:   "نقاشیِ شعرِ\nزندگیِ روزمره",
    bio:       "آبرنگ‌های من از طبیعت، خاطره‌ها و زیبایی آرامِ لحظه‌های روزمره الهام می‌گیرند.",
    learnMore: "بیشتر بخوانید",
    imageAlt:  "نقاشی‌ای از مریم محسنی",
  },
};

// Drop any image into /public/images/ and update this path.
// Set to null to hide the decoration entirely.
// Keep it self-hosted: loading it from another site (it used to come from
// svgsilh.com) sends every visitor's IP address to that site.
const BOTANICAL_IMAGE = null; // e.g. "/images/botanical.svg"

/* ── Component ───────────────────────────────────────────────────── */
export default function AboutArtist() {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <section className="bg-[#F6F1EB] py-12 md:py-16 overflow-hidden">
      <div className="container mx-auto px-4 md:px-16 xl:px-32">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-8 md:gap-12 items-center">

          {/* ── Start: painting image ────────────────────────────────
              Change ARTIST_IMAGE above to swap the photo.
              The fixed w/h creates a square crop — adjust if needed.
          ─────────────────────────────────────────────────────── */}
          <div className="flex justify-center md:justify-start">
            <div className="w-56 h-56 md:w-64 md:h-64 flex-shrink-0 overflow-hidden shadow-md">
              <img
                src={ARTIST_IMAGE}
                alt={c.imageAlt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* ── Centre: text block ───────────────────────────────────
              Change COPY and LEARN_MORE_URL above.
          ─────────────────────────────────────────────────────── */}
          <div className="text-center md:text-start max-w-sm mx-auto md:mx-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6F8F8B] mb-3 font-medium">
              {c.label}
            </p>
            <h2 className="text-3xl md:text-4xl text-[#2F2A26] leading-tight font-light whitespace-pre-line mb-4">
              {c.heading}
            </h2>
            {/* Accent rule */}
            <div className="w-8 h-px bg-[#D98C7A] mb-5 mx-auto md:mx-0" />
            <p className="text-[#2F2A26]/75 text-sm md:text-base leading-relaxed mb-7">
              {c.bio}
            </p>
            <Link
              to={LEARN_MORE_URL}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#2F2A26] font-medium transition-colors hover:text-[#D98C7A]"
            >
              {c.learnMore}
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 rtl:-scale-x-100" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* ── End: botanical decoration ───────────────────────────
              Drop an image into /public/images/ and set
              BOTANICAL_IMAGE at the top of this file.
              The column disappears on mobile automatically.
          ─────────────────────────────────────────────────────── */}
          {BOTANICAL_IMAGE && (
            <div className="hidden md:flex justify-end items-center w-27 xl:w-37 select-none pointer-events-none me-4">
              <img
                src={BOTANICAL_IMAGE}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain opacity-50"
              />
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
