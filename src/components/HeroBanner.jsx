/* ──────────────────────────────────────────────────────────────────
   HERO BANNER
   Ken Burns image slideshow — replaces the Vimeo background video.
   Each page load picks SLIDE_COUNT paintings at random from
   HERO_IMAGES and cycles them with smooth crossfades and cinematic
   zoom / pan animations.

   ── HOW TO CUSTOMISE ──────────────────────────────────────────────

   Which images can show
     Edit the HERO_IMAGES array. Each entry needs:
       src      — path to the image (relative to /public/)
       alt      — screen-reader alt text
       portrait — true for upright paintings, false for wide ones
     The banner fills the whole screen, so a painting is cropped hard:
     on a wide monitor an upright painting shows only a band across its
     middle, and on a phone a wide painting loses its sides. Add one
     only if its subject sits near the centre with nothing important
     at the edges, and the file is large — ideally 2000px+ on the long
     side, since the banner zooms in on top of filling the screen.

   Which movement each slide gets
     Assigned automatically (see pickSlides) so the slides all move
     differently: upright paintings get the vertical drift first, wide
     ones the pull-back or sideways drift. The three movements:
       "kb-zoom-out"   slow pull-back (starts zoomed in)
       "kb-pan-lr"     lateral drift at constant zoom
       "kb-pan-tb"     vertical drift top → bottom

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

/* ── Hero images ──────────────────────────────────────────────────────
   The paintings the banner picks from. Checked at full-screen crop on
   desktop and phone; art7 and art8 are left out because their crops
   lose the subject. See "Which images can show" above before adding.
─────────────────────────────────────────────────────────────────── */
const HERO_IMAGES = [
  { src: "/images/products/art1.jpeg",  alt: "Chromatic Drift",        portrait: true },
  { src: "/images/products/art2.jpeg",  alt: "Blossoms of Emotion",    portrait: true },
  { src: "/images/products/art3.jpeg",  alt: "A Glimpse of Spring",    portrait: true },
  { src: "/images/products/art4.jpeg",  alt: "The Mystery of Objects", portrait: true },
  { src: "/images/products/art5.jpeg",  alt: "Crimson Signature",      portrait: true },
  { src: "/images/products/art6.jpeg",  alt: "Urban Mask",             portrait: true },
  { src: "/images/products/art9.jpeg",  alt: "Persian Echo",           portrait: false },
  { src: "/images/products/art10.jpeg", alt: "Indigo Reverie",         portrait: true },
  { src: "/images/products/art11.jpeg", alt: "Saffron Rise",           portrait: false },
  { src: "/images/products/art12.jpeg", alt: "Still Waters",           portrait: true },
  { src: "/images/products/art13.jpeg", alt: "Shadow of History",      portrait: true },
];

/* How many paintings one visit cycles through. Every slide is loaded
   with the page, so keep this small. */
const SLIDE_COUNT = 3;

/* Picks SLIDE_COUNT paintings at random and gives each a movement no
   other slide is using, preferring the one that suits its shape */
function pickSlides() {
  const pool = [...HERO_IMAGES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const unused = new Set(["kb-zoom-out", "kb-pan-lr", "kb-pan-tb"]);
  return pool.slice(0, SLIDE_COUNT).map((image) => {
    const preferred = image.portrait
      ? ["kb-pan-tb", "kb-zoom-out", "kb-pan-lr"]
      : ["kb-zoom-out", "kb-pan-lr", "kb-pan-tb"];
    const anim = preferred.find((a) => unused.has(a)) ?? preferred[0];
    unused.delete(anim);
    return { ...image, anim };
  });
}

/* ──────────────────────────────────────────────────────────────────
   HERO BANNER COMPONENT
─────────────────────────────────────────────────────────────────── */
export default function HeroBanner() {
  const [slides]                  = useState(pickSlides); // fixed for this visit
  const [active, setActive]       = useState(0);
  const [textVisible, setTextVisible] = useState(false); // controls text slide-up
  const hoverTimer = useRef(null);
  const imgRefs    = useRef([]);
  const { lang } = useLanguage();
  const overlay = OVERLAY_COPY[lang];

  // On touch devices there is no hover event, so always show the overlay.
  const isTouchDevice = !useCanHover();
  // Derived: show the overlay if hovered on desktop OR always on touch
  const showOverlay = isTouchDevice || textVisible;

  /* ── Advance to the next slide every SLIDE_DURATION_S seconds ── */
  useEffect(() => {
    const id = setInterval(
      () => setActive((prev) => (prev + 1) % slides.length),
      SLIDE_DURATION_S * 1000
    );
    return () => clearInterval(id); // cleanup on unmount
  }, [slides.length]);

  /* ── Restart the Ken Burns move each time a slide comes into view ──
     The outgoing slide is left alone so it keeps moving while it fades
     out, then holds its last frame until it's shown again.
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    imgRefs.current[active]?.getAnimations().forEach((animation) => {
      animation.currentTime = 0;
      animation.play();
    });
  }, [active]);

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

          Each runs once, for SLIDE_DURATION_S + CROSSFADE_S seconds
          — the time its slide is on screen including the fade-out —
          and is restarted from 0% when the slide comes back into view.

          To tweak zoom: change the scale() numbers.
          To tweak pan:  change the translate / translateX values.

          scale(1) already covers the whole banner (object-cover), so
          lower zoom shows more of the painting. A pan must stay inside
          the spare edge the zoom creates, or the image's edge shows:
            translate % ≤ (scale − 1) ÷ (2 × scale) × 100
          e.g. scale(1.03) allows up to 1.4%, scale(1.04) up to 1.9%.
      ─────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Tablet and desktop (≥ 640px) — barely zoomed, so as much of
           the painting shows as can while still filling the banner ── */
        @keyframes kb-zoom-out {
          0%   { transform: scale(1.05) translate( 0.8%, 0.5%); }
          100% { transform: scale(1.00) translate( 0%,   0%); }
        }
        @keyframes kb-pan-lr {
          0%   { transform: scale(1.03) translateX(-1.4%); }
          100% { transform: scale(1.03) translateX( 1.4%); }
        }
        @keyframes kb-pan-tb {
          0%   { transform: scale(1.04) translateY(-1.9%); }
          100% { transform: scale(1.04) translateY( 1.9%); }
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
        {slides.map((slide, i) => (
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
                The Ken Burns animation lasts until the slide has fully
                faded out, then holds its last frame ("both"), so it
                never jumps back to the start while still visible.
                The effect above restarts it when the slide returns.
                transformOrigin: center keeps zooming centred on the
                middle of the image.
            ─────────────────────────────────────────────────────── */}
            <img
              ref={(el) => { imgRefs.current[i] = el; }}
              src={slide.src}
              alt={slide.alt}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                animation:       `${slide.anim} ${SLIDE_DURATION_S + CROSSFADE_S}s ease-in-out both`,
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
