/* ─────────────────────────────────────────────────────────────────────
   LANGUAGE SWITCHER
   Two flag buttons (shown in the footer). Pressing one switches the
   whole site to that language — see src/i18n/LanguageContext.jsx.

   Flags are inline SVG so nothing is loaded from another site.
     • English — split diagonally: UK top-left, US bottom-right
     • Persian — the plain green/white/red tricolour, deliberately
       without an emblem: both the current state emblem and the older
       Lion-and-Sun are politically loaded, and the artist lives in Iran.
───────────────────────────────────────────────────────────────────── */
import { useId } from "react";
import { LANGUAGES, useLanguage } from "../i18n/LanguageContext";

function UkUsFlag() {
  const id = useId();
  return (
    <svg viewBox="0 0 30 20" className="h-4 w-6 rounded-[2px]" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-uk`}><path d="M0 0H30L0 20Z" /></clipPath>
        <clipPath id={`${id}-us`}><path d="M30 0V20H0Z" /></clipPath>
        <clipPath id={`${id}-x`}><path d="M30 15h30v15zv15h-30zh-30v-15zv-15h30z" /></clipPath>
      </defs>

      {/* United Kingdom (drawn on the standard 60×30 grid, scaled to fill) */}
      <g clipPath={`url(#${id}-uk)`}>
        <svg x="0" y="0" width="30" height="20" viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
          <path d="M0 0v30h60V0z" fill="#012169" />
          <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
          <path d="M0 0l60 30m0-30L0 30" clipPath={`url(#${id}-x)`} stroke="#C8102E" strokeWidth="4" />
          <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
          <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      </g>

      {/* United States */}
      <g clipPath={`url(#${id}-us)`}>
        <rect width="30" height="20" fill="#fff" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} y={(i * 2 * 20) / 13} width="30" height={20 / 13} fill="#B22234" />
        ))}
        <rect width="12" height={(7 * 20) / 13} fill="#3C3B6E" />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={1.5 + (i % 4) * 3} cy={1.6 + Math.floor(i / 4) * 3.2} r="0.55" fill="#fff" />
        ))}
      </g>
    </svg>
  );
}

function IranFlag() {
  return (
    <svg viewBox="0 0 30 20" className="h-4 w-6 rounded-[2px]" aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#239F40" />
      <rect y="13.33" width="30" height="6.67" fill="#DA0000" />
    </svg>
  );
}

const FLAGS = { en: UkUsFlag, fa: IranFlag };

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Language / زبان">
      {Object.entries(LANGUAGES).map(([code, { label }]) => {
        const Flag = FLAGS[code];
        const isActive = lang === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => setLang(code)}
            aria-pressed={isActive}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              isActive
                ? "border-[#D98C7A] text-white"
                : "border-[#3E3832] text-[#A89E94] hover:border-[#6B6159] hover:text-white"
            }`}
          >
            <Flag />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
