import "dotenv/config";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import productsRouter  from "./routes/products.js";
import checkoutRouter  from "./routes/checkout.js";
import contactRouter   from "./routes/contact.js";
import webhooksRouter  from "./routes/webhooks.js";
import { errorHandler } from "./middleware/errorHandler.js";

/* Rate limiters */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const app  = express();
const BOOT_ID = crypto.randomUUID();
const STARTED_AT = new Date().toISOString();
const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const requiredEnv = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "STRIPE_SECRET_KEY"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]?.trim());
const requiredEmailEnv = ["AWS_REGION", "SES_FROM_ADDRESS", "SES_OWNER_ADDRESS"];
const missingEmailEnv = requiredEmailEnv.filter((name) => !process.env[name]?.trim());

if (missingEnv.length > 0) {
  console.error(
    `[boot ${BOOT_ID}] Missing required environment variables: ${missingEnv.join(", ")}`
  );
  process.exit(1);
}

if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
  console.warn(
    `[boot ${BOOT_ID}] STRIPE_WEBHOOK_SECRET is not set. Stripe webhooks will fail verification until it is configured.`
  );
}

if (missingEmailEnv.length > 0) {
  const emailConfigMessage =
    `[boot ${BOOT_ID}] Missing SES environment variables: ${missingEmailEnv.join(", ")}. ` +
    "Contact notifications and order confirmation emails will fail until they are configured.";

  if (process.env.NODE_ENV === "production") {
    console.error(emailConfigMessage);
    process.exit(1);
  }

  console.warn(emailConfigMessage);
}

/* ── Security headers ───────────────────────────────────────────────── */
app.use(helmet());

/* ── JSON body parser — stores raw Buffer for webhook verification ── */
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/* ── CORS ───────────────────────────────────────────────────────────── */
app.use(cors({ origin: CLIENT_ORIGIN }));

/* ── Health endpoint ─────────────────────────────────────────────────── */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    bootId: BOOT_ID,
    pid: process.pid,
    startedAt: STARTED_AT,
    config: {
      clientOrigin: CLIENT_ORIGIN,
      stripeWebhookSecretLoaded: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
      sesConfigured: missingEmailEnv.length === 0,
      reservationTtlMinutes: Number(process.env.RESERVATION_TTL_MINUTES) || 30,
    },
  });
});

/* ── Routes ─────────────────────────────────────────────────────────── */
app.use("/api/products",         productsRouter);
app.use("/api/checkout",         checkoutLimiter, checkoutRouter);
app.use("/api/contact",          contactLimiter,  contactRouter);
app.use("/api/webhooks/stripe",  webhooksRouter);

/* ── Global error handler ───────────────────────────────────────────── */
app.use(errorHandler);

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
