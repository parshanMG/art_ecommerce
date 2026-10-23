/* ─────────────────────────────────────────────────────────────────────
   LANGUAGE-AWARE FORMATTING
   Numbers, prices and product text in the visitor's language.
   Persian uses Persian digits (۰۱۲۳…) and separators.
───────────────────────────────────────────────────────────────────── */

/* Currency the prices in products.json are written in.
     "USD"   — shown as $1,500.00
     "TOMAN" — shown as 12,000,000 Toman / ۱۲٬۰۰۰٬۰۰۰ تومان
   Switch to "TOMAN" once the catalog has real toman prices. */
export const PRICE_CURRENCY = "USD";

const LOCALES = { en: "en-US", fa: "fa-IR" };

export function formatPrice(amount, lang) {
  if (PRICE_CURRENCY === "TOMAN") {
    const value = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 0 }).format(amount);
    return lang === "fa" ? `${value} تومان` : `${value} Toman`;
  }

  return new Intl.NumberFormat(LOCALES[lang], {
    style: "currency",
    currency: PRICE_CURRENCY,
  }).format(amount);
}

/* Digits only, no thousands separators — for years, slide numbers etc. */
export function formatDigits(value, lang) {
  return new Intl.NumberFormat(LOCALES[lang], { useGrouping: false }).format(value);
}

/* Product text in the visitor's language. Persian values come from the
   optional title_fa / medium_fa / dimensions_fa fields in products.json;
   anything not translated yet falls back to English. */
export function productText(product, field, lang) {
  if (lang === "fa" && product[`${field}_fa`]) return product[`${field}_fa`];
  return product[field];
}
