/* ──────────────────────────────────────────────────────────────────
   HERO BANNER
   Ken Burns image slideshow — replaces the Vimeo background video.
   Three product images cycle with smooth crossfades and cinematic
   zoom / pan animations.

   ── HOW TO CUSTOMISE ──────────────────────────────────────────────

   Which images show
     Edit the SLIDES array. Each entry needs:
       src  — path to the image (relative to /public/)
       alt  — screen-reader alt text
       anim — animation name; pick one of:
                "kb-zoom-out"   slow pull-back (starts zoomed in)
                "kb-pan-lr"     lateral drift at constant zoom
                "kb-pan-tb"     vertical drift top → bottom (great for portrait images)

   Slide speed
     Change SLIDE_DURATION_S (seconds each slide stays on screen).

   Crossfade duration
     Change CROSSFADE_S (how long the fade between slides takes).

   Zoom level  ← most common tweak
     In the @keyframes below, adjust the scale() values:
       1.0  = full image, nothing cropped
       1.15 = lightly zoomed in  (gentle)
       1.40 = moderately zoomed  (cinematic)
       1.60 = heavily zoomed in  (dramatic close-up)
     The START scale sets how zoomed in the image is at the
     beginning of the slide; the END scale is where it finishes.
     Raise both to zoom in more overall; widen the gap between
     them for more visible movement.

   Pan distance
     Adjust translateX / translateY percentages in @keyframes.
       0%  = no drift
       3%  = subtle
       6%  = noticeable pan
       10% = strong sweep

   Hover text overlay
     Edit OVERLAY_COPY below to change the text.
     HOVER_DELAY_MS controls how long the user must hover before the
     text slides up (default 600 ms). Set to 0 for instant reveal.
─────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCanHover } from "../hooks/useCanHover";
import { useLanguage } from "../i18n/LanguageContext";

/* ── Timing constants ─────────────────────────────────────────────── */
const SLIDE_DURATION_S = 6;    // ← seconds each slide is shown
const CROSSFADE_S      = 0.9;  // ← overlap duration for the crossfade

/* ── Hover overlay text ───────────────────────────────────────────────
   Change these strings (English and Persian) to update what appears on hover.
─────────────────────────────────────────────────────────────────── */
const OVERLAY_COPY = {
  en: {
    title:    "Timeless Beauty,\nCaptured in Watercolor",
    subtitle: "Delicate florals, gentle stories, and\nfleeting moments — painted with water and light.",
    cta:      "Explore Gallery",
  },
  fa: {
    title:    "زیبایی جاودانه،\nبه زبان آبرنگ",
    subtitle: "گل‌های لطیف، داستان‌های آرام و\nلحظه‌های گذرا — نقاشی‌شده با آب و نور.",
    cta:      "دیدن گالری",
  },
};

/* ── Hover delay (ms) ────────────────────────────────────────────────
   How long the user must hover before the text slides into view.
   Increase for a longer wait; set to 0 for an instant reveal.
─────────────────────────────────────────────────────────────────── */
const HOVER_DELAY_MS = 500;

/* ── Slides ───────────────────────────────────────────────────────────
   Change src to swap which products appear in the banner.
   The three anim names each give a different cinematic movement.
─────────────────────────────────────────────────────────────────── */
const SLIDES = [
  {
    src:  "/images/products/art9.jpeg",
    alt:  "Persian Echo",
    anim: "kb-zoom-out",    // starts zoomed in, slowly pulls back
  },
  {
    src:  "/images/products/art11.jpeg",
    alt:  "Saffron Rise",
    anim: "kb-pan-lr",      // drifts left → right at constant zoom
  },
  {
    src:  "/images/products/art1.jpeg",
    alt:  "Chromatic Drift",
    anim: "kb-pan-tb",     // wide zoom, drifts top → bottom (great for portrait images)
  },
];

/* ──────────────────────────────────────────────────────────────────
   HERO BANNER COMPONENT
─────────────────────────────────────────────────────────────────── */
export default function HeroBanner() {
  const [active, setActive]       = useState(0);
  const [textVisible, setTextVisible] = useState(false); // controls text slide-up
  const hoverTimer = useRef(null);
  const { lang } = useLanguage();
  const overlay = OVERLAY_COPY[lang];

  // On touch devices there is no hover event, so always show the overlay.
  const isTouchDevice = !useCanHover();
  // Derived: show the overlay if hovered on desktop OR always on touch
  const showOverlay = isTouchDevice || textVisible;

  /* ── Advance to the next slide every SLIDE_DURATION_S seconds ── */
  useEffect(() => {
    const id = setInterval(
      () => setActive((prev) => (prev + 1) % SLIDES.length),
      SLIDE_DURATION_S * 1000
    );
    return () => clearInterval(id); // cleanup on unmount
  }, []);

  /* ── Hover handlers ──────────────────────────────────────────────
     onMouseEnter: starts a timer; text appears after HOVER_DELAY_MS.
     onMouseLeave: cancels the timer and hides the text immediately.
  ─────────────────────────────────────────────────────────────── */
  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setTextVisible(true), HOVER_DELAY_MS);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setTextVisible(false);
  };

  return (
    <>
      {/* ── Ken Burns keyframe definitions ────────────────────────────
          Injected as a <style> tag so these complex animations don't
          need Tailwind config changes.

          All three run for exactly SLIDE_DURATION_S seconds with
          infinite repeat, so they always restart from their 0%
          state the moment their slide comes back into view.

          To tweak zoom: change the scale() numbers.
          To tweak pan:  change the translate / translateX values.
      ─────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Desktop (≥ 1024px) — cinematic zoom & pan ── */
        @keyframes kb-zoom-out {
          0%   { transform: scale(1.30) translate( 2%,  1%); }
          100% { transform: scale(1.10) translate( 0%,  0%); }
        }
        @keyframes kb-pan-lr {
          0%   { transform: scale(1.10) translateX(-4%); }
          100% { transform: scale(1.10) translateX( 4%); }
        }
        @keyframes kb-pan-tb {
          0%   { transform: scale(1.30) translateY(-8%); }
          100% { transform: scale(1.30) translateY( 8%); }
        }

        /* ── Tablet (640px – 1023px) — reduced zoom so more art shows ── */
        @media (max-width: 1023px) {
          @keyframes kb-zoom-out {
            0%   { transform: scale(1.15) translate( 1%,  0.5%); }
            100% { transform: scale(1.05) translate( 0%,  0%); }
          }
          @keyframes kb-pan-lr {
            0%   { transform: scale(1.08) translateX(-2.5%); }
            100% { transform: scale(1.08) translateX( 2.5%); }
          }
          @keyframes kb-pan-tb {
            0%   { transform: scale(1.12) translateY(-4%); }
            100% { transform: scale(1.12) translateY( 4%); }
          }
        }

        /* ── Mobile (< 640px) — near-no zoom, full artwork visible ── */
        @media (max-width: 639px) {
          @keyframes kb-zoom-out {
            0%   { transform: scale(1.06) translate( 0.5%,  0.5%); }
            100% { transform: scale(1.00) translate( 0%,    0%); }
          }
          @keyframes kb-pan-lr {
            0%   { transform: scale(1.04) translateX(-1.5%); }
            100% { transform: scale(1.04) translateX( 1.5%); }
          }
          @keyframes kb-pan-tb {
            0%   { transform: scale(1.06) translateY(-2%); }
            100% { transform: scale(1.06) translateY( 2%); }
          }
        }
      `}</style>

      {/* ── Banner container ──────────────────────────────────────────
          h-screen fills the full viewport on every device — phones,
          tablets (including iPad Pro portrait), and desktop monitors.
          overflow-hidden clips the edges of zoomed images.
          onMouseEnter/Leave drive the hover text overlay.
      ─────────────────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden h-screen"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {SLIDES.map((slide, i) => (
          /* ── Slide wrapper ──────────────────────────────────────────
              CSS opacity + transition = smooth crossfade.
              z-index 1 on the active slide keeps it above others
              while they finish fading out.
          ─────────────────────────────────────────────────────── */
          <div
            key={slide.src}
            className="absolute inset-0"
            style={{
              opacity:    i === active ? 1 : 0,
              zIndex:     i === active ? 1 : 0,
              transition: `opacity ${CROSSFADE_S}s ease-in-out`,
            }}
          >
            {/* ── Product image ──────────────────────────────────────
                object-cover fills the container without distortion.
                The Ken Burns animation runs for SLIDE_DURATION_S so
                it always resets to its 0% state when the slide cycles
                back into view (SLIDE_DURATION_S × SLIDES.length = one
                full rotation = exactly n Ken Burns iterations).
                transformOrigin: center keeps zooming centred on the
                middle of the image.
            ─────────────────────────────────────────────────────── */}
            <img
              src={slide.src}
              alt={slide.alt}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                animation:       `${slide.anim} ${SLIDE_DURATION_S}s ease-in-out infinite`,
                transformOrigin: "center center",
              }}
              loading={i === 0 ? "eager" : "lazy"}
              fetchpriority={i === 0 ? "high" : "low"}
            />
          </div>
        ))}

        {/* ── Hover darkening overlay ────────────────────────────────
            A semi-transparent black layer that fades in on hover to
            ensure the text is readable against any image.
            To adjust darkness: change the opacity value (0–1) on
            the from-black/XX gradient classes.
        ─────────────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/10 transition-opacity duration-700"
          style={{
            opacity: showOverlay ? 1 : 0,
            zIndex:  10,
            pointerEvents: "none",
          }}
        />

        {/* ── Text overlay ──────────────────────────────────────────
            Slides up from below the banner when textVisible is true.
            translateY(100%) = hidden below; translateY(0) = in place.
            Delay matches HOVER_DELAY_MS so it fires after the timer.

            To change text: edit OVERLAY_COPY above.
            To change slide speed: adjust the transition-duration (700ms).
            To change position: swap items-end to items-center/items-start.
        ─────────────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 flex items-end pb-12 md:pb-16 px-6 md:px-10 lg:px-20"
          style={{
            zIndex:    11,
            transform: showOverlay ? "translateY(0)" : "translateY(6%)",
            opacity:   showOverlay ? 1 : 0,
            transition: "transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms ease",
            pointerEvents: showOverlay ? "auto" : "none",
          }}
        >
          <div>
            {/* Thin accent rule above the title */}
            <div
              className="mb-4 h-px w-10 bg-[#D98C7A]"
              style={{ opacity: showOverlay ? 1 : 0, transition: "opacity 500ms ease 200ms" }}
            />
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-light leading-tight whitespace-pre-line mb-4">
              {overlay.title}
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-xs leading-relaxed whitespace-pre-line mb-8">
              {overlay.subtitle}
            </p>
            <Link
              to="/shop"
              className="inline-block border border-white/70 text-white text-xs uppercase tracking-widest px-6 py-3 transition hover:bg-[#D98C7A] hover:border-[#D98C7A]"
            >
              {overlay.cta}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
