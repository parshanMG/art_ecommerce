import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const BRAND_NAME = "Maryam Mohseni Art";
const BRAND_ACCENT = "#D98C7A";
const BRAND_TEXT = "#2F2A26";
const BRAND_SURFACE = "#F6F1EB";
const BRAND_BORDER = "#E8DCD0";

// Lazily created so missing AWS_REGION doesn't crash the server on startup.
let _ses = null;
function getSES() {
  const region = process.env.AWS_REGION?.trim();

  if (!region) {
    throw new Error("AWS_REGION is not configured for SES.");
  }

  if (!_ses) _ses = new SESClient({ region });
  return _ses;
}

/* Escapes characters that have special meaning in HTML.
   Always call this on any user-supplied value before inserting
   it into an HTML email body to prevent XSS. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

function nl2br(str) {
  return escapeHtml(str).replace(/\n/g, "<br />");
}

/* dir="rtl" lays the email out right-to-left for Persian. Persian uses
   Tahoma — widely available in email clients and it has Persian glyphs —
   and no letter-spacing, which would break the joined script. */
function buildEmailHtml({ eyebrow, title, intro, body, footer, dir = "ltr" }) {
  const rtl = dir === "rtl";
  const fontFamily = rtl ? "Tahoma,Arial,sans-serif" : "Georgia,'Times New Roman',serif";
  const eyebrowSpacing = rtl ? "0" : "0.28em";
  return `
    <div dir="${dir}" style="margin:0;padding:32px 16px;background:${BRAND_SURFACE};font-family:${fontFamily};color:${BRAND_TEXT};text-align:${rtl ? "right" : "left"};">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid ${BRAND_BORDER};border-radius:20px;overflow:hidden;">
        <div style="padding:32px 32px 24px;border-bottom:1px solid ${BRAND_BORDER};">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:${eyebrowSpacing};text-transform:uppercase;color:${BRAND_ACCENT};">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;font-weight:600;color:${BRAND_TEXT};">${escapeHtml(title)}</h1>
          <p style="margin:16px 0 0;font-size:16px;line-height:1.7;color:#5f5650;">${intro}</p>
        </div>
        <div style="padding:28px 32px;font-size:15px;line-height:1.7;color:#5f5650;">
          ${body}
        </div>
        <div style="padding:20px 32px 28px;border-top:1px solid ${BRAND_BORDER};font-size:13px;line-height:1.7;color:#7b726a;">
          ${footer}
        </div>
      </div>
    </div>
  `;
}

function formatShippingAddress(address) {
  if (!address) return "";

  return [address.line1, address.city, address.postcode, address.country]
    .filter(Boolean)
    .join(", ");
}

/* Low-level helper — send a plain-text + HTML email via SES.
   All higher-level email functions (contact notification,
   order confirmation, etc.) call this. */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  const ses = getSES();
  const source = process.env.SES_FROM_ADDRESS?.trim();

  if (!source) {
    throw new Error("SES_FROM_ADDRESS is not configured.");
  }

  if (!to?.trim()) {
    throw new Error("Email recipient is required.");
  }

  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: html,
        },
        Text: {
          Charset: "UTF-8",
          Data: text,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: source,
  };

  if (replyTo?.length) {
    params.ReplyToAddresses = replyTo;
  }

  const command = new SendEmailCommand(params);
  await ses.send(command);
}

/* Sends the contact form message to the site owner */
export async function sendContactNotification({ name, email, subject, message, product, lang = "en" }) {
  const ownerEmail = process.env.SES_OWNER_ADDRESS?.trim();

  if (!ownerEmail) {
    throw new Error("SES_OWNER_ADDRESS is not configured.");
  }

  const emailSubject = `New contact enquiry: ${subject}${product ? ` — ${product.title}` : ""}`;
  const emailText = [
    "A new contact form message has been submitted.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    ...(product ? [`Artwork: ${product.title} (${product.id})`] : []),
    `Language: ${LANGUAGE_NAMES[lang]}`,
    "",
    "Message:",
    message,
  ].join("\n");
  const emailHtml = buildEmailHtml({
    eyebrow: "New Enquiry",
    title: subject,
    intro: `You received a new message from <strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}).`,
    body: `
      <p style="margin:0 0 18px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 18px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p style="margin:0 0 18px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      ${product ? `<p style="margin:0 0 18px;"><strong>Artwork:</strong> ${escapeHtml(product.title)} <span style="color:#7b726a;">(${escapeHtml(product.id)})</span></p>` : ""}
      <p style="margin:0 0 18px;"><strong>Language:</strong> ${LANGUAGE_NAMES[lang]}</p>
      <div style="padding:18px 20px;border:1px solid ${BRAND_BORDER};border-radius:16px;background:${BRAND_SURFACE};">
        <p style="margin:0 0 8px;font-weight:600;color:${BRAND_TEXT};">Message</p>
        <p dir="auto" style="margin:0;white-space:normal;">${nl2br(message)}</p>
      </div>
    `,
    footer: `Reply directly to this email to respond to ${escapeHtml(name)}.` ,
  });
  await sendEmail({
    to: ownerEmail,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
    replyTo: [email],
  });
}

const LANGUAGE_NAMES = { en: "English", fa: "Persian (فارسی)" };

/* Visitor-facing copy for the contact confirmation, per site language.
   Subject values arrive in English (they're validated against a fixed
   list), so the Persian copy maps them to their Persian labels. */
const CONFIRMATION_COPY = {
  en: {
    dir: "ltr",
    brand: BRAND_NAME,
    emailSubject: "We received your message",
    eyebrow: "Contact Confirmation",
    title: "Your message is on its way",
    greeting: (name) => `Hi ${name},`,
    intro: (name) => `Hi ${name}, thank you for getting in touch. This is a confirmation that your message has been received.`,
    thanks: "Thank you for reaching out. Your message has been received and a reply will follow as soon as possible.",
    replySoon: "A reply will follow as soon as possible.",
    subjectLabel: "Subject",
    artworkLabel: "Artwork",
    messageLabel: "Your message",
    messageCopyLabel: "Message copy:",
    signOff: "Best regards,",
    footer: "If you need to add anything else, simply reply to this email.",
    subjects: {},
    productTitle: (product) => product.title,
  },
  fa: {
    dir: "rtl",
    brand: "مریم محسنی",
    emailSubject: "پیام شما دریافت شد",
    eyebrow: "تأیید دریافت پیام",
    title: "پیام شما رسید",
    greeting: (name) => `${name} عزیز،`,
    intro: (name) => `${name} عزیز، از تماس شما سپاسگزاریم. این ایمیل تأیید می‌کند که پیام شما دریافت شده است.`,
    thanks: "از تماس شما سپاسگزاریم. پیام شما دریافت شد و به‌زودی پاسخ داده خواهد شد.",
    replySoon: "به‌زودی پاسخ داده خواهد شد.",
    subjectLabel: "موضوع",
    artworkLabel: "اثر",
    messageLabel: "پیام شما",
    messageCopyLabel: "رونوشت پیام:",
    signOff: "با احترام،",
    footer: "اگر نکته دیگری دارید، کافی است به همین ایمیل پاسخ دهید.",
    subjects: {
      "Artwork Enquiry": "استعلام اثر",
      "Commission Request": "سفارش اثر",
      "Shipping Question": "پرسش درباره ارسال",
      "Return / Refund": "مرجوعی / بازپرداخت",
      "General Enquiry": "پرسش عمومی",
    },
    productTitle: (product) => product.title_fa || product.title,
  },
};

/* Sends an acknowledgement back to the person who submitted the form,
   in the language they were using on the site */
export async function sendContactConfirmation({ name, email, subject, message, product, lang = "en" }) {
  const c = CONFIRMATION_COPY[lang] ?? CONFIRMATION_COPY.en;
  const subjectLabel = c.subjects[subject] ?? subject;
  const productTitle = product ? c.productTitle(product) : null;

  const emailText = [
    c.greeting(name),
    "",
    c.thanks,
    "",
    `${c.subjectLabel}: ${subjectLabel}`,
    ...(productTitle ? [`${c.artworkLabel}: ${productTitle}`] : []),
    "",
    c.messageCopyLabel,
    message,
    "",
    c.signOff,
    c.brand,
  ].join("\n");
  const emailHtml = buildEmailHtml({
    dir: c.dir,
    eyebrow: c.eyebrow,
    title: c.title,
    intro: escapeHtml(c.intro(name)),
    body: `
      <p style="margin:0 0 18px;">${escapeHtml(c.replySoon)}</p>
      <div style="padding:18px 20px;border:1px solid ${BRAND_BORDER};border-radius:16px;background:${BRAND_SURFACE};">
        <p style="margin:0 0 8px;font-weight:600;color:${BRAND_TEXT};">${escapeHtml(c.subjectLabel)}</p>
        <p style="margin:0 0 16px;">${escapeHtml(subjectLabel)}</p>
        ${productTitle ? `<p style="margin:0 0 8px;font-weight:600;color:${BRAND_TEXT};">${escapeHtml(c.artworkLabel)}</p>
        <p style="margin:0 0 16px;">${escapeHtml(productTitle)}</p>` : ""}
        <p style="margin:0 0 8px;font-weight:600;color:${BRAND_TEXT};">${escapeHtml(c.messageLabel)}</p>
        <p dir="auto" style="margin:0;">${nl2br(message)}</p>
      </div>
    `,
    footer: escapeHtml(c.footer),
  });
  await sendEmail({ to: email, subject: c.emailSubject, text: emailText, html: emailHtml });
}

/* Sends a purchase confirmation email to the buyer after successful payment */
export async function sendOrderConfirmation({
  buyerName,
  buyerEmail,
  items,
  total,
  shippingAddress,
  orderReference,
}) {
  const itemLines = items.map((item) => `- ${item.title}: ${formatCurrency(item.price)}`).join("\n");
  const shippingLine = formatShippingAddress(shippingAddress);
  const orderRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND_BORDER};color:${BRAND_TEXT};">${escapeHtml(item.title)}</td>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND_BORDER};text-align:right;color:${BRAND_TEXT};">${formatCurrency(item.price)}</td>
        </tr>
      `
    )
    .join("");
  const emailSubject = "Your order confirmation";
  const emailText = [
    `Hi ${buyerName},`,
    "",
    "Thank you for your purchase. Your order has been confirmed.",
    orderReference ? `Order reference: ${orderReference}` : "",
    "",
    "Items:",
    itemLines,
    "",
    `Total: ${formatCurrency(total)}`,
    shippingLine ? `Shipping address: ${shippingLine}` : "",
    "",
    `Best regards,`,
    BRAND_NAME,
  ]
    .filter(Boolean)
    .join("\n");
  const emailHtml = buildEmailHtml({
    eyebrow: "Order Confirmation",
    title: "Thank you for your purchase",
    intro: `Hi ${escapeHtml(buyerName)}, your order has been confirmed and these original works are now reserved for fulfilment.`,
    body: `
      ${orderReference ? `<p style="margin:0 0 18px;"><strong>Order reference:</strong> ${escapeHtml(orderReference)}</p>` : ""}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px;">
        <thead>
          <tr>
            <th align="left" style="padding:0 0 12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_ACCENT};">Artwork</th>
            <th align="right" style="padding:0 0 12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_ACCENT};">Price</th>
          </tr>
        </thead>
        <tbody>
          ${orderRows}
          <tr>
            <td style="padding:16px 0 0;font-weight:600;color:${BRAND_TEXT};">Total</td>
            <td style="padding:16px 0 0;text-align:right;font-weight:600;color:${BRAND_TEXT};">${formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>
      ${shippingLine ? `<p style="margin:0;"><strong>Shipping address:</strong> ${escapeHtml(shippingLine)}</p>` : ""}
    `,
    footer: `If you have any questions about your order, reply to this email and include your order reference if available.` ,
  });
  await sendEmail({ to: buyerEmail, subject: emailSubject, text: emailText, html: emailHtml });
}

/* Alerts the owner when a payment succeeded for a piece that had already
   been sold to someone else (the buyer's reservation lapsed before they
   paid). The buyer is not sent a confirmation in this case — the owner
   should contact them and refund the conflicting items from Stripe. */
export async function sendOrderReviewAlert({
  buyerName,
  buyerEmail,
  conflictingItems,
  orderReference,
}) {
  const ownerEmail = process.env.SES_OWNER_ADDRESS?.trim();

  if (!ownerEmail) {
    throw new Error("SES_OWNER_ADDRESS is not configured.");
  }

  const titles = conflictingItems.map((item) => item.title);
  const emailSubject = `Order needs review: ${titles.join(", ")} already sold`;
  const emailText = [
    "A payment succeeded for artwork that had already been sold.",
    "",
    `Buyer: ${buyerName} (${buyerEmail})`,
    `Stripe payment: ${orderReference}`,
    `Already sold: ${titles.join(", ")}`,
    "",
    "No confirmation was sent to the buyer. Please contact them and refund",
    "the conflicting items from the Stripe dashboard.",
  ].join("\n");
  const emailHtml = buildEmailHtml({
    eyebrow: "Needs Review",
    title: "A paid order includes a sold piece",
    intro: `A payment from <strong>${escapeHtml(buyerName)}</strong> (${escapeHtml(buyerEmail)}) succeeded, but some of the artwork had already been sold.`,
    body: `
      <p style="margin:0 0 18px;"><strong>Stripe payment:</strong> ${escapeHtml(orderReference)}</p>
      <p style="margin:0 0 18px;"><strong>Already sold:</strong> ${titles.map(escapeHtml).join(", ")}</p>
      <p style="margin:0;">No confirmation was sent to the buyer. Please contact them and refund the conflicting items from the Stripe dashboard.</p>
    `,
    footer: "Reply to this email to contact the buyer directly.",
  });
  await sendEmail({
    to: ownerEmail,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
    replyTo: [buyerEmail],
  });
}
