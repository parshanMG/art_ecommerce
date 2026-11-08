/* ─────────────────────────────────────────────────────────────────────
   CONTACT FORM
   What POST /api/contact does, kept free of Express so the same code
   runs wherever the API is served: the Express server (routes/
   contact.js, for local development and the shop demo) and the
   Cloudflare Worker that serves the live site (worker/index.js).

   Emails the message to the artist via Resend, then sends the visitor a
   confirmation. Nothing is stored: the artist's email is the record,
   including when consent was given (in a header customers never see).
   If the artist's email can't be sent the visitor gets an
   error, so they know to try again.
   productId (optional) links the enquiry to an artwork — set when the
   visitor arrives from an "Enquire" button.
   lang ("en" | "fa") picks the language of the confirmation email.
   transferConsent must be true: messages go to the artist in Iran, which
   has no UK adequacy decision, so the transfer relies on the visitor's
   explicit consent (UK GDPR Article 49(1)(a)).
───────────────────────────────────────────────────────────────────── */
import { NAME_PATTERN, isEmail } from "./validation.js";
import { sendContactNotification, sendContactConfirmation } from "./services/email.js";
import { findCatalogProduct } from "./catalog.js";

export const CONTACT_SUBJECTS = [
  "Artwork Enquiry",
  "Commission Request",
  "Shipping Question",
  "Return / Refund",
  "General Enquiry",
];

const trim = (value) => (typeof value === "string" ? value.trim() : value);
const isText = (value) => typeof value === "string" && value !== "";

/* Returns the trimmed fields, or every problem found, in form order.
   The first message is the one the form shows. */
export function validateContact(body) {
  const input = body && typeof body === "object" ? body : {};
  const fields = {
    name: trim(input.name),
    email: trim(input.email),
    subject: trim(input.subject),
    message: trim(input.message),
    productId: trim(input.productId) || null,
    lang: input.lang ?? "en",
  };
  const errors = [];
  const fail = (path, msg) => errors.push({ path, msg });
  const { name, email, subject, message, productId, lang } = fields;

  if (!isText(name)) fail("name", "Please enter your name.");
  else if (name.length > 100) fail("name", "Name must be 100 characters or fewer.");
  else if (!NAME_PATTERN.test(name)) fail("name", "Name can only contain letters, spaces, apostrophes, hyphens and full stops.");

  /* Trimmed only — normalising would strip dots and +tags from Gmail
     addresses, so the artist would reply to a different-looking
     address from the one the visitor typed. */
  if (!isText(email) || !isEmail(email)) fail("email", "Please enter a valid email address.");
  else if (email.length > 254) fail("email", "Email must be 254 characters or fewer.");

  if (!CONTACT_SUBJECTS.includes(subject)) fail("subject", "Please choose a subject.");

  if (!isText(message)) fail("message", "Please enter a message.");
  else if (message.length > 5000) fail("message", "Message must be 5000 characters or fewer.");

  if (productId !== null && (typeof productId !== "string" || productId.length > 100)) {
    fail("productId", "Invalid artwork.");
  }
  if (lang !== "en" && lang !== "fa") fail("lang", "Invalid language.");

  if (input.transferConsent !== true) {
    fail("transferConsent", "Please confirm you're happy for your message to be sent to the artist in Iran.");
  }

  return errors.length ? { errors } : { fields };
}

/* Handles one submission and returns the HTTP status and JSON body to
   answer with. The email senders and the artwork lookup can be swapped
   out — the tests pass in fakes. */
export async function handleContact(
  body,
  {
    sendNotification = sendContactNotification,
    sendConfirmation = sendContactConfirmation,
    findProduct = findCatalogProduct,
  } = {}
) {
  const { errors, fields } = validateContact(body);
  if (errors) {
    return { status: 400, body: { error: errors[0].msg, errors } };
  }

  const { productId, ...rest } = fields;
  /* Look the artwork up rather than trusting a client-supplied title.
     An unknown id is ignored — the message itself still goes through. */
  const product = productId ? findProduct(productId) : null;
  const contact = { ...rest, product, consentAt: new Date() };

  /* The artist's copy first — the visitor is only told the message was
     received once it really has been sent */
  try {
    await sendNotification(contact);
  } catch (err) {
    console.error("Contact notification email failed:", err);
    return { status: 502, body: { error: "We couldn't send your message right now. Please try again in a few minutes." } };
  }

  // The message has reached the artist, so a failed confirmation is only logged
  await sendConfirmation(contact).catch((err) =>
    console.error("Contact confirmation email failed:", err)
  );

  return { status: 200, body: { success: true } };
}
