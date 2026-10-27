import { Router } from "express";
import { body } from "express-validator";
import { validateRequest, NAME_PATTERN } from "../middleware/validateRequest.js";
import { sendContactNotification, sendContactConfirmation } from "../services/email.js";
import pool from "../db/index.js";

const router = Router();

/* POST /api/contact
   Emails the message to the artist via SES, then sends the visitor a
   confirmation. Nothing is stored: the notification email (and the
   optional SES_COPY_ADDRESS copy) is the record, including when consent
   was given. If the artist's email can't be sent the visitor gets an
   error, so they know to try again.
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
    /* Trimmed only — normalizeEmail() would strip dots and +tags from
       Gmail addresses, so the artist would reply to a different-looking
       address from the one the visitor typed. */
    body("email")
      .trim()
      .isEmail().withMessage("Please enter a valid email address.")
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

      const contact = { name, email, subject, message, product, lang, consentAt: new Date() };

      /* The artist's copy first — the visitor is only told the message was
         received once it really has been sent */
      try {
        await sendContactNotification(contact);
      } catch (err) {
        console.error("Contact notification email failed:", err);
        return res.status(502).json({ error: "We couldn't send your message right now. Please try again in a few minutes." });
      }

      // The message has reached the artist, so a failed confirmation is only logged
      await sendContactConfirmation(contact).catch((err) =>
        console.error("Contact confirmation email failed:", err)
      );

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
