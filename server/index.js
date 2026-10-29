import "dotenv/config";
import crypto from "crypto";
import { createApp } from "./app.js";

/* ── Mode ───────────────────────────────────────────────────────────────
   COMMERCE_ENABLED=true  — shop mode: checkout, Stripe webhooks, and
                            products from PostgreSQL (see commerce/).
   anything else          — portfolio mode: products from
                            data/products.json and the contact form.
                            No database or Stripe account needed.
─────────────────────────────────────────────────────────────────────── */
const COMMERCE_ENABLED = process.env.COMMERCE_ENABLED === "true";

const BOOT_ID = crypto.randomUUID();
const STARTED_AT = new Date().toISOString();
const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const isMissing = (name) => !process.env[name]?.trim();
const requiredEmailEnv = ["RESEND_API_KEY", "EMAIL_FROM_ADDRESS", "EMAIL_OWNER_ADDRESS"];
const missingEmailEnv = requiredEmailEnv.filter(isMissing);

// Shop mode also needs the database and Stripe
const requiredCommerceEnv = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "STRIPE_SECRET_KEY"];

if (COMMERCE_ENABLED) {
  const missingCommerceEnv = requiredCommerceEnv.filter(isMissing);

  if (missingCommerceEnv.length > 0) {
    console.error(
      `[boot ${BOOT_ID}] COMMERCE_ENABLED=true but these are missing: ${missingCommerceEnv.join(", ")}`
    );
    process.exit(1);
  }

  if (isMissing("STRIPE_WEBHOOK_SECRET")) {
    console.warn(
      `[boot ${BOOT_ID}] STRIPE_WEBHOOK_SECRET is not set. Stripe webhooks will fail verification until it is configured.`
    );
  }
} else {
  console.log(`[boot ${BOOT_ID}] Portfolio mode: checkout is off and no database is used.`);
}

if (missingEmailEnv.length > 0) {
  const emailConfigMessage =
    `[boot ${BOOT_ID}] Missing email environment variables: ${missingEmailEnv.join(", ")}. ` +
    "Contact and order emails will fail until they are configured.";

  if (process.env.NODE_ENV === "production") {
    console.error(emailConfigMessage);
    process.exit(1);
  }

  console.warn(emailConfigMessage);
}

/* Shop mode is imported only after its settings were checked above, so
   portfolio mode never loads Stripe or the PostgreSQL driver. */
const commerce = COMMERCE_ENABLED ? await import("./commerce/index.js") : null;

const app = createApp({
  clientOrigin: CLIENT_ORIGIN,
  commerce,
  health: {
    bootId: BOOT_ID,
    pid: process.pid,
    startedAt: STARTED_AT,
    config: {
      emailConfigured: missingEmailEnv.length === 0,
      ...(COMMERCE_ENABLED && {
        stripeWebhookSecretLoaded: !isMissing("STRIPE_WEBHOOK_SECRET"),
        reservationTtlMinutes: Number(process.env.RESERVATION_TTL_MINUTES) || 30,
      }),
    },
  },
});

const server = app.listen(PORT, () => {
  console.log(`[boot ${BOOT_ID}] Server running on port ${PORT} (pid ${process.pid})`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[boot ${BOOT_ID}] Port ${PORT} is already in use. Stop the old backend process before restarting.`
    );
    process.exit(1);
  }

  throw err;
});
