import { Router } from "express";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
import { sendContactNotification, sendContactConfirmation } from "../services/email.js";
import pool from "../db/index.js";

const router = Router();

/* POST /api/contact
   Sends the user's message to the owner via SES and
   replies to the user with a confirmation email. */
router.post(
  "/",
  [
    body("name").isString().trim().notEmpty().isLength({ max: 100 })
      .matches(/^[\p{L}\s'.\-]+$/u),
    body("email").isEmail().normalizeEmail().isLength({ max: 254 }),
    body("subject")
      .isString()
      .trim()
      .isIn([
        "Artwork Enquiry",
        "Commission Request",
        "Shipping Question",
        "Return / Refund",
        "General Enquiry",
      ]),
    body("message").isString().trim().notEmpty().isLength({ max: 5000 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, email, subject, message } = req.body;

      const { rows } = await pool.query(
        `INSERT INTO contact_submissions (name, email, subject, message)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [name, email, subject, message]
      );

      const submissionId = rows[0].id;
      const emailResults = await Promise.allSettled([
        sendContactNotification({ name, email, subject, message }),
        sendContactConfirmation({ name, email, subject, message }),
      ]);

      const [ownerEmailResult, customerEmailResult] = emailResults;
      const ownerNotified = ownerEmailResult.status === "fulfilled";
      const customerConfirmed = customerEmailResult.status === "fulfilled";

      await pool.query(
        `UPDATE contact_submissions
         SET owner_notified_at = CASE WHEN $2 THEN NOW() ELSE owner_notified_at END,
             customer_confirmed_at = CASE WHEN $3 THEN NOW() ELSE customer_confirmed_at END
         WHERE id = $1`,
        [submissionId, ownerNotified, customerConfirmed]
      );

      if (!ownerNotified) {
        console.error("Contact owner notification email failed:", ownerEmailResult.reason);
      }

      if (!customerConfirmed) {
        console.error("Contact confirmation email failed:", customerEmailResult.reason);
      }

      if (!ownerNotified || !customerConfirmed) {
        return res.status(202).json({
          success: true,
          warning: "Your message was saved, but one or more emails could not be sent right away.",
        });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
