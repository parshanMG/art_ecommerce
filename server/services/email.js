import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION });

/* Low-level helper — send a plain-text + HTML email via SES.
   All higher-level email functions (contact notification,
   order confirmation, etc.) call this. */
export async function sendEmail({ to, subject, text, html }) {
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
    Source: process.env.EMAIL_SOURCE,
  };

  const command = new SendEmailCommand(params);
  await ses.send(command);
}

/* Sends the contact form message to the site owner */
export async function sendContactNotification({ name, email, subject, message }) {
  // TODO: call sendEmail with owner address and formatted body
  const ownerEmail = process.env.OWNER_EMAIL;
  const emailSubject = `New contact form submission: ${subject}`;
  const emailText = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;
  const emailHtml = `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`;
  await sendEmail({ to: ownerEmail, subject: emailSubject, text: emailText, html: emailHtml });
}

/* Sends an acknowledgement back to the person who submitted the form */
export async function sendContactConfirmation({ name, email }) {
  // TODO: call sendEmail with user address and confirmation body
  const emailSubject = "Thank you for contacting us!";
  const emailText = `Hi ${name},\n\nThank you for reaching out! We have received your message and will get back to you as soon as possible.\n\nBest regards,\nThe Team`;
  const emailHtml = `<p>Hi ${name},</p><p>Thank you for reaching out! We have received your message and will get back to you as soon as possible.</p><p>Best regards,<br>The Team</p>`;
  await sendEmail({ to: email, subject: emailSubject, text: emailText, html: emailHtml });
}

/* Sends a purchase confirmation email to the buyer after successful payment */
export async function sendOrderConfirmation({ buyerName, buyerEmail, items, total }) {
  // TODO: call sendEmail with order summary body
  const emailSubject = "Order Confirmation";
  const emailText = `Hi ${buyerName},\n\nThank you for your purchase! Here is a summary of your order:\n\n${items.map(item => `- ${item.name}: ${item.quantity} x $${item.price}`).join("\n")}\n\nTotal: $${total}\n\nBest regards,\nThe Team`;
  const emailHtml = `<p>Hi ${buyerName},</p><p>Thank you for your purchase! Here is a summary of your order:</p><ul>${items.map(item => `<li>${item.name}: ${item.quantity} x $${item.price}</li>`).join("")}</ul><p><strong>Total:</strong> $${total}</p><p>Best regards,<br>The Team</p>`;
  await sendEmail({ to: buyerEmail, subject: emailSubject, text: emailText, html: emailHtml });
}
