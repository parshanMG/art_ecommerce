import { Router } from "express";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();

/* POST /api/contact
   Sends the user's message to the owner via SES and
   replies to the user with a confirmation email. */
router.post(
  "/",
  [
    body("name").isString().trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("subject").isString().trim().notEmpty(),
    body("message").isString().trim().notEmpty(),
  ],
  validateRequest,
  async (req, res, next) => {
    // TODO: send owner notification email + user confirmation via SES
  }
);

export default router;
