import { Resend } from "resend";

export const BRAND_NAME = "Maryam Mohseni Art";
export const BRAND_ACCENT = "#D98C7A";
export const BRAND_TEXT = "#2F2A26";
export const BRAND_SURFACE = "#F6F1EB";
export const BRAND_BORDER = "#E8DCD0";

// Lazily created so a missing RESEND_API_KEY doesn't crash the server on startup.
let _resend = null;
function getResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

/* Escapes characters that have special meaning in HTML.
   Always call this on any user-supplied value before inserting
   it into an HTML email body to prevent XSS. */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(str) {
  return escapeHtml(str).replace(/\n/g, "<br />");
}

/* dir="rtl" lays the email out right-to-left for Persian. Persian uses
   Tahoma — widely available in email clients and it has Persian glyphs —
   and no letter-spacing, which would break the joined script. */
export function buildEmailHtml({ eyebrow, title, intro, body, footer, dir = "ltr" }) {
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

/* Low-level helper — send a plain-text + HTML email via Resend.
   All higher-level email functions call this: the contact emails below
   and the order emails in commerce/emails.js. Swapping email provider
   only means changing this function and getResend(). */
export async function sendEmail({ to, subject, text, html, replyTo, bcc, headers }) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM_ADDRESS?.trim();

  if (!from) {
    throw new Error("EMAIL_FROM_ADDRESS is not configured.");
  }

  if (!to?.trim()) {
    throw new Error("Email recipient is required.");
  }

  // Resend reports failures in `error` rather than throwing
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
    ...(replyTo?.length && { replyTo }),
    ...(bcc?.length && { bcc }),
    ...(headers && { headers }),
  });

  if (error) {
    throw new Error(`Resend could not send the email: ${error.message}`);
  }
}

/* Sends the contact form message to the artist (EMAIL_OWNER_ADDRESS),
   with Reply-To set to the visitor so she can simply press Reply.
   Her reply quotes this email back to the visitor, so it's kept short
   and plain, in the visitor's language: their message, who sent it and
   nothing addressed to the artist.
   Messages aren't stored, so this email is the record that the visitor
   consented to it being sent to Iran (UK GDPR Art. 49(1)(a)). The time
   goes in the X-Contact-Consent header: kept with the email in the
   artist's inbox (Gmail: "Show original"), but never shown or quoted. */
export async function sendContactNotification({ name, email, subject, message, product, lang = "en", consentAt }) {
  const ownerEmail = process.env.EMAIL_OWNER_ADDRESS?.trim();

  if (!ownerEmail) {
    throw new Error("EMAIL_OWNER_ADDRESS is not configured.");
  }

  const c = CONTACT_COPY[lang] ?? CONTACT_COPY.en;
  const subjectLabel = c.subjects[subject] ?? subject;
  const productTitle = product ? c.productTitle(product) : null;
  const rtl = c.dir === "rtl";

  const emailSubject = `${subjectLabel}${productTitle ? `: ${productTitle}` : ""} · ${c.brand}`;
  const emailText = [
    message,
    "",
    `${name} <${email}>`,
    ...(productTitle ? [`${c.artworkLabel}: ${productTitle}`] : []),
    c.sentVia,
  ].join("\n");
  const emailHtml = `
    <div dir="${c.dir}" style="font-family:${rtl ? "Tahoma,Arial,sans-serif" : "Arial,Helvetica,sans-serif"};font-size:15px;line-height:1.6;color:${BRAND_TEXT};text-align:${rtl ? "right" : "left"};">
      <p dir="auto" style="margin:0 0 20px;">${nl2br(message)}</p>
      <p style="margin:0;font-size:13px;color:#7b726a;">
        ${escapeHtml(name)} <span dir="ltr">&lt;${escapeHtml(email)}&gt;</span><br />
        ${productTitle ? `${escapeHtml(c.artworkLabel)}: ${escapeHtml(productTitle)}<br />` : ""}
        ${escapeHtml(c.sentVia)}
      </p>
    </div>
  `;
  await sendEmail({
    to: ownerEmail,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
    replyTo: [email],
    headers: {
      "X-Contact-Consent": `Transfer to the artist in Iran agreed ${consentAt.toISOString()} (UK GDPR Art. 49(1)(a))`,
    },
  });
}

/* Visitor-facing copy for the contact emails, per site language: the
   confirmation, and the notification the artist's reply quotes back.
   Subject values arrive in English (they're validated against a fixed
   list), so the Persian copy maps them to their Persian labels. */
const CONTACT_COPY = {
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
    sentVia: "Sent through the website contact form",
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
    sentVia: "ارسال‌شده از طریق فرم تماس وب‌سایت",
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
   in the language they were using on the site.
   It deliberately doesn't repeat the message: the email provider keeps
   a copy of every email it sends, so leaving the text out means only the
   artist's notification holds it. It also gives spammers nothing to
   gain from typing someone else's address into the form. */
export async function sendContactConfirmation({ name, email, subject, product, lang = "en" }) {
  const c = CONTACT_COPY[lang] ?? CONTACT_COPY.en;
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
        <p style="margin:0;">${escapeHtml(subjectLabel)}</p>
        ${productTitle ? `<p style="margin:16px 0 8px;font-weight:600;color:${BRAND_TEXT};">${escapeHtml(c.artworkLabel)}</p>
        <p style="margin:0;">${escapeHtml(productTitle)}</p>` : ""}
      </div>
    `,
    footer: escapeHtml(c.footer),
  });
  await sendEmail({ to: email, subject: c.emailSubject, text: emailText, html: emailHtml });
}
