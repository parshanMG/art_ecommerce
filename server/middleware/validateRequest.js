import { validationResult } from "express-validator";

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
