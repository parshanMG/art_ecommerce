/* ─────────────────────────────────────────────────────────────────────
   ORDER EMAILS (shop mode only)
   Sent by the Stripe webhook. Built from the same layout and SES sender
   as the contact emails in services/email.js.
───────────────────────────────────────────────────────────────────── */
import {
  sendEmail,
  buildEmailHtml,
  escapeHtml,
  BRAND_NAME,
  BRAND_ACCENT,
  BRAND_TEXT,
  BRAND_BORDER,
} from "../services/email.js";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

function formatShippingAddress(address) {
  if (!address) return "";

  return [address.line1, address.city, address.postcode, address.country]
    .filter(Boolean)
    .join(", ");
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
