import { Router } from "express";
import { body } from "express-validator";
import { validateRequest, NAME_PATTERN } from "../middleware/validateRequest.js";
import { sendContactNotification, sendContactConfirmation } from "../services/email.js";
import pool from "../db/index.js";

const router = Router();

/* POST /api/contact
   Sends the user's message to the owner via SES and
   replies to the user with a confirmation email.
   productId (optional) links the enquiry to an artwork — set when the
   visitor arrives from an "Enquire" button.
   lang ("en" | "fa") picks the language of the confirmation email.
   transferConsent must be true: messages go to the artist in Iran, which
   has no UK adequacy decision, so the transfer relies on the visitor's
   explicit consent (UK GDPR Article 49(1)(a)). */
router.post(
  "/",
  [
    body("name")
      .isString().trim().notEmpty().withMessage("Please enter your name.")
      .isLength({ max: 100 }).withMessage("Name must be 100 characters or fewer.")
      .matches(NAME_PATTERN).withMessage("Name can only contain letters, spaces, apostrophes, hyphens and full stops."),
    body("email")
      .isEmail().withMessage("Please enter a valid email address.")
      .normalizeEmail()
      .isLength({ max: 254 }).withMessage("Email must be 254 characters or fewer."),
    body("subject")
      .isString()
      .trim()
      .isIn([
        "Artwork Enquiry",
        "Commission Request",
        "Shipping Question",
        "Return / Refund",
        "General Enquiry",
      ]).withMessage("Please choose a subject."),
    body("message")
      .isString().trim().notEmpty().withMessage("Please enter a message.")
      .isLength({ max: 5000 }).withMessage("Message must be 5000 characters or fewer."),
    body("productId").optional({ values: "falsy" }).isString().trim().isLength({ max: 100 }),
    body("lang").optional().isIn(["en", "fa"]),
    body("transferConsent")
      .custom((value) => value === true)
      .withMessage("Please confirm you're happy for your message to be sent to the artist in Iran."),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, email, subject, message, productId } = req.body;
      const lang = req.body.lang ?? "en";

      /* Look the artwork up rather than trusting a client-supplied title.
         An unknown id is ignored — the message itself still goes through. */
      let product = null;
      if (productId) {
        const { rows } = await pool.query(`SELECT id, title, title_fa FROM products WHERE id = $1`, [productId]);
        product = rows[0] ?? null;
      }

      const { rows } = await pool.query(
        `INSERT INTO contact_submissions
           (name, email, subject, message, product_id, language, transfer_consent_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [name, email, subject, message, product?.id ?? null, lang]
      );

      const submissionId = rows[0].id;
      const emailResults = await Promise.allSettled([
        sendContactNotification({ name, email, subject, message, product, lang }),
        sendContactConfirmation({ name, email, subject, message, product, lang }),
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
