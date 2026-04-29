import { Router } from "express";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
import { sendContactNotification, sendContactConfirmation } from "../services/email.js";

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
    try {
      const { name, email, subject, message } = req.body;
      await Promise.all([
        sendContactNotification({ name, email, subject, message }),
        sendContactConfirmation({ name, email }),
      ]);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
