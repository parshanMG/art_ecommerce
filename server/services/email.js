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

function buildEmailHtml({ eyebrow, title, intro, body, footer }) {
  return `
    <div style="margin:0;padding:32px 16px;background:${BRAND_SURFACE};font-family:Georgia,'Times New Roman',serif;color:${BRAND_TEXT};">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid ${BRAND_BORDER};border-radius:20px;overflow:hidden;">
        <div style="padding:32px 32px 24px;border-bottom:1px solid ${BRAND_BORDER};">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND_ACCENT};">${escapeHtml(eyebrow)}</p>
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
export async function sendContactNotification({ name, email, subject, message }) {
  const ownerEmail = process.env.SES_OWNER_ADDRESS?.trim();

  if (!ownerEmail) {
    throw new Error("SES_OWNER_ADDRESS is not configured.");
  }

  const emailSubject = `New contact enquiry: ${subject}`;
  const emailText = [
    "A new contact form message has been submitted.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
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
      <div style="padding:18px 20px;border:1px solid ${BRAND_BORDER};border-radius:16px;background:${BRAND_SURFACE};">
        <p style="margin:0 0 8px;font-weight:600;color:${BRAND_TEXT};">Message</p>
        <p style="margin:0;white-space:normal;">${nl2br(message)}</p>
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

/* Sends an acknowledgement back to the person who submitted the form */
export async function sendContactConfirmation({ name, email, subject, message }) {
  const emailSubject = "We received your message";
  const emailText = [
    `Hi ${name},`,
    "",
    "Thank you for reaching out. Your message has been received and a reply will follow as soon as possible.",
    "",
    `Subject: ${subject}`,
    "",
    "Message copy:",
    message,
    "",
    `Best regards,`,
    BRAND_NAME,
  ].join("\n");
  const emailHtml = buildEmailHtml({
    eyebrow: "Contact Confirmation",
    title: "Your message is on its way",
    intro: `Hi ${escapeHtml(name)}, thank you for getting in touch. This is a confirmation that your message has been received.`,
    body: `
      <p style="margin:0 0 18px;">A reply will follow as soon as possible.</p>
      <div style="padding:18px 20px;border:1px solid ${BRAND_BORDER};border-radius:16px;background:${BRAND_SURFACE};">
        <p style="margin:0 0 8px;font-weight:600;color:${BRAND_TEXT};">Subject</p>
        <p style="margin:0 0 16px;">${escapeHtml(subject)}</p>
        <p style="margin:0 0 8px;font-weight:600;color:${BRAND_TEXT};">Your message</p>
        <p style="margin:0;">${nl2br(message)}</p>
      </div>
    `,
    footer: `If you need to add anything else, simply reply to this email.` ,
  });
  await sendEmail({ to: email, subject: emailSubject, text: emailText, html: emailHtml });
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
