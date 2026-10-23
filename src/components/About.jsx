/* ─────────────────────────────────────────────────────────────────────
   ABOUT PAGE
   A full-page portrait of the artist broken into four sections:

     1. Hero        — large portrait + name, tagline, quote
     2. My Story    — written biography with accent rule
     3. The Process — three-column "how I work" strip
     4. CTA         — links to Gallery and Contact

   ── HOW TO CUSTOMISE ──────────────────────────────────────────────
   • Edit COPY below — every piece of text exists in English (en) and
     Persian (fa). Keep the two in step when you change one.
   • Swap ARTIST_PHOTO for any image in /public/images/.
   • The story paragraphs are placeholder text — confirm them with the
     artist before launch.
─────────────────────────────────────────────────────────────────── */

import { Link } from "react-router-dom";
import { useInView } from "../hooks/useInView";
import { useLanguage } from "../i18n/LanguageContext";
import { formatDigits } from "../i18n/format";

/* ── Editable constants ──────────────────────────────────────────── */
const ARTIST_PHOTO = "/images/products/maryam.jpeg";

const COPY = {
  en: {
    photoAlt: "Maryam Mohseni in her studio",
    label: "About the Artist",
    tagline: "Painting the Poetry\nof Everyday Life",
    quote: "Water and light are my language — I try to speak only in the quiet moments between them.",
    storyLabel: "In Her Own Words",
    storyHeading: "My Story",
    story: [
      "My name is Maryam Mohseni, and I paint in watercolour — a medium that rewards patience, surrender, and a certain willingness to be surprised. I grew up surrounded by gardens and old illustrated books, and I think both of those things live somewhere in every piece I make.",
      "I studied fine art and have been working as a full-time painter for over a decade. My practice centres on florals, botanicals, and the small ceremonies of daily life — a teacup on a windowsill, light moving through curtains, the last few petals on a vase. I am drawn to fragility; watercolour feels like the right material for it.",
      "Each painting begins with long hours of observation before a single brushstroke is laid down. I work on cold-press cotton paper with professional-grade pigments so that the colours remain as vivid fifty years from now as they are the day the painting leaves my studio.",
    ],
    processLabel: "Behind the Painting",
    processHeading: "The Process",
    steps: [
      { title: "Observe",        body: "Every painting begins not with a brush but with looking — sometimes for days. I collect light, shadow, and mood before I mix a single colour." },
      { title: "Lay the Wash",   body: "Large, fluid washes establish the atmosphere first. Watercolour must flow; I guide it rather than control it, letting the water do half the work." },
      { title: "Build & Refine", body: "Details are added in thin, deliberate layers once each wash is bone-dry. The final marks are the quietest — a single stroke can make or break a piece." },
    ],
    exploreLabel: "Explore the Work",
    exploreText: "Browse the full collection — originals, prints, and available commissions.",
    exploreCta: "View Gallery",
    contactLabel: "Get in Touch",
    contactText: "Questions about a piece, commission ideas, or just want to say hello?",
    contactCta: "Contact Me",
  },
  fa: {
    photoAlt: "مریم محسنی در کارگاهش",
    label: "درباره هنرمند",
    tagline: "نقاشیِ شعرِ\nزندگیِ روزمره",
    quote: "آب و نور زبان من‌اند — می‌کوشم تنها در لحظه‌های آرامِ میان آن‌ها سخن بگویم.",
    storyLabel: "به روایت خودش",
    storyHeading: "داستان من",
    story: [
      "من مریم محسنی هستم و با آبرنگ نقاشی می‌کنم؛ رسانه‌ای که به صبر، رها کردن و پذیرفتنِ غافلگیری پاداش می‌دهد. در میان باغ‌ها و کتاب‌های مصورِ قدیمی بزرگ شدم و فکر می‌کنم هر دوی آن‌ها جایی در تک‌تک آثارم زنده‌اند.",
      "هنرهای تجسمی خوانده‌ام و بیش از یک دهه است که به‌طور حرفه‌ای نقاشی می‌کنم. کارم بر گل‌ها، گیاهان و آیین‌های کوچکِ زندگی روزمره متمرکز است — فنجانی کنار پنجره، نوری که از لای پرده می‌گذرد، آخرین گلبرگ‌های یک گلدان. شکنندگی مرا به خود می‌کشد و آبرنگ برای آن ماده‌ای درست است.",
      "هر نقاشی پیش از نخستین ضربه قلم‌مو با ساعت‌ها مشاهده آغاز می‌شود. روی کاغذ پنبه‌ای کلدپرس و با رنگدانه‌های حرفه‌ای کار می‌کنم تا رنگ‌ها پنجاه سال بعد هم به همان درخششِ روزی باشند که نقاشی کارگاهم را ترک می‌کند.",
    ],
    processLabel: "پشت هر نقاشی",
    processHeading: "روند کار",
    steps: [
      { title: "مشاهده",           body: "هر نقاشی نه با قلم‌مو، که با نگاه کردن آغاز می‌شود — گاهی چند روز. پیش از آمیختن نخستین رنگ، نور، سایه و حال‌وهوا را گرد می‌آورم." },
      { title: "لایه‌های رنگ",      body: "لایه‌های روان و گسترده ابتدا فضای اثر را می‌سازند. آبرنگ باید جاری باشد؛ من آن را هدایت می‌کنم نه مهار، و می‌گذارم آب نیمی از کار را انجام دهد." },
      { title: "پرداخت و جزئیات",  body: "جزئیات در لایه‌های نازک و سنجیده، پس از خشک شدنِ کامل هر لایه، افزوده می‌شوند. آخرین ضربه‌ها آرام‌ترین‌اند — یک ضربه می‌تواند اثری را بسازد یا خراب کند." },
    ],
    exploreLabel: "دیدن آثار",
    exploreText: "مجموعه کامل را ببینید — آثار اصل، چاپ‌ها و سفارش‌ها.",
    exploreCta: "دیدن گالری",
    contactLabel: "در تماس باشید",
    contactText: "پرسشی درباره یک اثر دارید، ایده‌ای برای سفارش، یا فقط می‌خواهید سلام کنید؟",
    contactCta: "تماس با من",
  },
};

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

/* Arrow used in the CTA links — mirrored for right-to-left */
function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 rtl:-scale-x-100" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────────────── */
export default function About() {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <main className="bg-[#F6F1EB]">

      {/* ════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          Full-width warm strip: portrait at the start, text at the
          end on desktop; stacked on mobile.
      ════════════════════════════════════════════════════════════ */}
      <section className="pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="container mx-auto px-6 md:px-16 xl:px-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

            {/* Portrait */}
            <div className="flex justify-center md:justify-end">
              <div className="w-72 h-80 md:w-80 md:h-[26rem] xl:w-96 xl:h-[30rem] overflow-hidden shadow-lg">
                <img
                  src={ARTIST_PHOTO}
                  alt={c.photoAlt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Text */}
            <div className="text-center md:text-start">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#6F8F8B] mb-4 font-medium">
                {c.label}
              </p>
              <h1 className="text-4xl md:text-5xl xl:text-6xl text-[#2F2A26] font-light leading-tight whitespace-pre-line mb-6">
                {c.tagline}
              </h1>
              <div className="w-10 h-px bg-[#D98C7A] mb-6 mx-auto md:mx-0" />
              <blockquote className="text-[#2F2A26]/60 text-base md:text-lg leading-relaxed italic max-w-md mx-auto md:mx-0">
                {lang === "fa" ? `«${c.quote}»` : `"${c.quote}"`}
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
              {c.storyLabel}
            </p>
            <h2 className="text-3xl md:text-4xl text-[#2F2A26] font-light text-center mb-8">
              {c.storyHeading}
            </h2>
            <div className="w-8 h-px bg-[#D98C7A] mx-auto mb-10" />
            <div className="space-y-6">
              {c.story.map((p, i) => (
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
              {c.processLabel}
            </p>
            <h2 className="text-3xl md:text-4xl text-[#2F2A26] font-light text-center mb-8">
              {c.processHeading}
            </h2>
            <div className="w-8 h-px bg-[#D98C7A] mx-auto mb-12" />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {c.steps.map((step, i) => (
              <FadeIn key={i}>
                <div className="flex flex-col items-center text-center md:items-start md:text-start">
                  <span className="text-5xl font-light text-[#D98C7A]/30 leading-none mb-4 select-none">
                    {formatDigits(i + 1, lang).padStart(2, formatDigits(0, lang))}
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
                {c.exploreLabel}
              </p>
              <p className="text-[#D6CFC6] text-sm max-w-xs leading-relaxed">
                {c.exploreText}
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white border border-white/30 px-6 py-3 rounded-full transition hover:bg-white hover:text-[#2F2A26]"
              >
                {c.exploreCta}
                <Arrow />
              </Link>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-24 bg-white/10" />
            <div className="block md:hidden w-24 h-px bg-white/10" />

            <div className="flex flex-col items-center gap-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#6F8F8B] font-medium">
                {c.contactLabel}
              </p>
              <p className="text-[#D6CFC6] text-sm max-w-xs leading-relaxed">
                {c.contactText}
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white border border-white/30 px-6 py-3 rounded-full transition hover:bg-white hover:text-[#2F2A26]"
              >
                {c.contactCta}
                <Arrow />
              </Link>
            </div>

          </div>
        </FadeIn>
      </section>

    </main>
  );
}
