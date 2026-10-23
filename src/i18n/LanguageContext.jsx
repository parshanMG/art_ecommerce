import { createContext, useContext, useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────
   LANGUAGE
   The site is bilingual: English (default) and Persian. Each component
   keeps its own text in a COPY = { en: {...}, fa: {...} } object and
   picks the right one with useLanguage().

   Choosing a language (the flags in the footer):
     • sets <html lang> and <html dir> — Persian switches the whole
       layout to right-to-left
     • updates the browser tab title
     • remembers the choice in localStorage. It's only saved when the
       visitor picks a language themselves; storage the user explicitly
       asks for is exempt from cookie consent rules.
───────────────────────────────────────────────────────────────────── */
export const LANGUAGES = {
  en: { dir: "ltr", label: "English", title: "Maryam Mohseni — Watercolour Artist" },
  fa: { dir: "rtl", label: "فارسی",   title: "مریم محسنی — نقاش آبرنگ" },
};
export const DEFAULT_LANGUAGE = "en";

const STORAGE_KEY = "language";

function loadSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES[saved] ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(loadSavedLanguage);
  const { dir, title } = LANGUAGES[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.title = title;
  }, [lang, dir, title]);

  const setLang = (next) => {
    if (!LANGUAGES[next]) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable — the choice still applies for this visit
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, isRtl: dir === "rtl", setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

/* Example: const { lang, isRtl } = useLanguage(); const c = COPY[lang]; */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
