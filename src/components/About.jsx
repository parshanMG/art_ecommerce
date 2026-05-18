/* ─────────────────────────────────────────────────────────────────────
   ABOUT PAGE
   A full-page portrait of the artist broken into four sections:

     1. Hero        — large portrait + name, tagline, quote
     2. My Story    — written biography with accent rule
     3. The Process — three-column "how I work" strip
     4. CTA         — links to Gallery and Contact

   ── HOW TO CUSTOMISE ──────────────────────────────────────────────
   • Edit the constants just below the imports.
   • Swap ARTIST_PHOTO for any image in /public/images/.
   • Replace the PROCESS_STEPS array to describe your own workflow.
─────────────────────────────────────────────────────────────────── */

import { Link } from "react-router-dom";
import { useInView } from "../hooks/useInView";

/* ── Editable constants ──────────────────────────────────────────── */
const ARTIST_PHOTO = "/images/products/maryam.jpeg";

const TAGLINE = "Painting the Poetry\nof Everyday Life";

const QUOTE = "Water and light are my language — I try to speak only in the quiet moments between them.";

const STORY_PARAGRAPHS = [
  "My name is Maryam Mohseni, and I paint in watercolour — a medium that rewards patience, surrender, and a certain willingness to be surprised. I grew up surrounded by gardens and old illustrated books, and I think both of those things live somewhere in every piece I make.",
  "I studied fine art and have been working as a full-time painter for over a decade. My practice centres on florals, botanicals, and the small ceremonies of daily life — a teacup on a windowsill, light moving through curtains, the last few petals on a vase. I am drawn to fragility; watercolour feels like the right material for it.",
  "Each painting begins with long hours of observation before a single brushstroke is laid down. I work on cold-press cotton paper with professional-grade pigments so that the colours remain as vivid fifty years from now as they are the day the painting leaves my studio.",
];

const PROCESS_STEPS = [
  {
    number: "01",
    title:  "Observe",
    body:   "Every painting begins not with a brush but with looking — sometimes for days. I collect light, shadow, and mood before I mix a single colour.",
  },
  {
    number: "02",
    title:  "Lay the Wash",
    body:   "Large, fluid washes establish the atmosphere first. Watercolour must flow; I guide it rather than control it, letting the water do half the work.",
  },
  {
    number: "03",
    title:  "Build & Refine",
    body:   "Details are added in thin, deliberate layers once each wash is bone-dry. The final marks are the quietest — a single stroke can make or break a piece.",
  },
];

/* ── Fade-in wrapper (reuses the useInView hook) ─────────────────── */
function FadeIn({ children, className = "" }) {
  const [ref, isVisible] = useInView({ threshold: 0.12 });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Component ───────────────────────────────────────────────────── */
export default function About() {
  return (
    <main className="bg-[#F6F1EB]">

      {/* ════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          Full-width warm strip: portrait left, text right on desktop;
          stacked on mobile.
      ════════════════════════════════════════════════════════════ */}
      <section className="pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="container mx-auto px-6 md:px-16 xl:px-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

            {/* Portrait */}
            <div className="flex justify-center md:justify-end">
              <div className="w-72 h-80 md:w-80 md:h-[26rem] xl:w-96 xl:h-[30rem] overflow-hidden shadow-lg">
                <img
                  src={ARTIST_PHOTO}
                  alt="Maryam Mohseni in her studio"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Text */}
            <div className="text-center md:text-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#6F8F8B] mb-4 font-medium">
                About the Artist
              </p>
              <h1 className="text-4xl md:text-5xl xl:text-6xl text-[#2F2A26] font-light leading-tight whitespace-pre-line mb-6">
                {TAGLINE}
              </h1>
              <div className="w-10 h-px bg-[#D98C7A] mb-6 mx-auto md:mx-0" />
              <blockquote className="text-[#2F2A26]/60 text-base md:text-lg leading-relaxed italic max-w-md mx-auto md:mx-0">
                "{QUOTE}"
              </blockquote>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2 — MY STORY
          Centred text column with a tinted background panel.
      ════════════════════════════════════════════════════════════ */}
      <section className="bg-[#EDE7DF] py-16 md:py-20">
        <div className="container mx-auto px-6 md:px-16 xl:px-32 max-w-3xl">
          <FadeIn>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#6F8F8B] mb-3 font-medium text-center">
              In Her Own Words
            </p>
            <h2 className="text-3xl md:text-4xl text-[#2F2A26] font-light text-center mb-8">
              My Story
            </h2>
            <div className="w-8 h-px bg-[#D98C7A] mx-auto mb-10" />
            <div className="space-y-6">
              {STORY_PARAGRAPHS.map((p, i) => (
                <p key={i} className="text-[#2F2A26]/80 text-sm md:text-base leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 3 — THE PROCESS
          Three numbered steps in a horizontal grid.
      ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 md:px-16 xl:px-32">
          <FadeIn>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#6F8F8B] mb-3 font-medium text-center">
              Behind the Painting
            </p>
            <h2 className="text-3xl md:text-4xl text-[#2F2A26] font-light text-center mb-8">
              The Process
            </h2>
            <div className="w-8 h-px bg-[#D98C7A] mx-auto mb-12" />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {PROCESS_STEPS.map((step, i) => (
              <FadeIn key={i}>
                <div className="flex flex-col items-center text-center md:items-start md:text-left">
                  <span className="text-5xl font-light text-[#D98C7A]/30 leading-none mb-4 select-none">
                    {step.number}
                  </span>
                  <div className="w-6 h-px bg-[#D98C7A] mb-4" />
                  <h3 className="text-lg font-medium text-[#2F2A26] mb-3 tracking-wide">
                    {step.title}
                  </h3>
                  <p className="text-[#2F2A26]/70 text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 4 — CTA STRIP
          Two side-by-side calls to action.
      ════════════════════════════════════════════════════════════ */}
      <section className="bg-[#2F2A26] py-16 md:py-20">
        <FadeIn>
          <div className="container mx-auto px-6 md:px-16 xl:px-32 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center">

            <div className="flex flex-col items-center gap-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#6F8F8B] font-medium">
                Explore the Work
              </p>
              <p className="text-[#D6CFC6] text-sm max-w-xs leading-relaxed">
                Browse the full collection — originals, prints, and available commissions.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white border border-white/30 px-6 py-3 rounded-full transition hover:bg-white hover:text-[#2F2A26]"
              >
                View Gallery
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-24 bg-white/10" />
            <div className="block md:hidden w-24 h-px bg-white/10" />

            <div className="flex flex-col items-center gap-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#6F8F8B] font-medium">
                Get in Touch
              </p>
              <p className="text-[#D6CFC6] text-sm max-w-xs leading-relaxed">
                Questions about a piece, commission ideas, or just want to say hello?
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white border border-white/30 px-6 py-3 rounded-full transition hover:bg-white hover:text-[#2F2A26]"
              >
                Contact Me
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

          </div>
        </FadeIn>
      </section>

    </main>
  );
}
