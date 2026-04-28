import { validationResult } from "express-validator";

/* Run after express-validator checks. Returns 400 with all errors
   if validation failed, otherwise calls next(). */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}
