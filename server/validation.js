/* Checks shared by the contact form and checkout. Kept free of Express
   so the Cloudflare Worker (worker/index.js) can use them too. */
import isEmail from "validator/lib/isEmail.js";

/* Letters (any script, incl. combining accents), spaces, straight and
   curly apostrophes (iOS types ’ by default), full stops, hyphens, and
   the zero-width non-joiner used inside Persian names (e.g. نیک‌نام). */
export const NAME_PATTERN = /^[\p{L}\p{M}\s'’.\-‌]+$/u;

export { isEmail };
