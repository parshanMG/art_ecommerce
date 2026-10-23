import { validationResult } from "express-validator";

/* Letters (any script, incl. combining accents), spaces, straight and
   curly apostrophes (iOS types ’ by default), full stops, hyphens, and
   the zero-width non-joiner used inside Persian names (e.g. نیک‌نام).
   Shared by the contact and checkout validators. */
export const NAME_PATTERN = /^[\p{L}\p{M}\s'’.\-‌]+$/u;

/* Run after express-validator checks. Returns 400 with all errors
   if validation failed, otherwise calls next(). `error` carries the
   first message so the frontend can show it directly. */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array();
    return res.status(400).json({ error: list[0].msg, errors: list });
  }
  next();
}
