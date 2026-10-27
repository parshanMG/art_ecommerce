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

const requiredEnv = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]?.trim());
const requiredEmailEnv = ["AWS_REGION", "SES_FROM_ADDRESS", "SES_OWNER_ADDRESS"];
const missingEmailEnv = requiredEmailEnv.filter((name) => !process.env[name]?.trim());
// Without a Stripe key the server runs in portfolio mode: products + contact only
const commerceConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());

if (missingEnv.length > 0) {
  console.error(
    `[boot ${BOOT_ID}] Missing required environment variables: ${missingEnv.join(", ")}`
  );
  process.exit(1);
}

if (!commerceConfigured) {
  console.warn(
    `[boot ${BOOT_ID}] STRIPE_SECRET_KEY is not set. Checkout and Stripe webhooks are disabled (portfolio mode).`
  );
} else if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
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

/* ── Proxy trust ────────────────────────────────────────────────────────
   Behind the AWS load balancer every request arrives from the LB's own
   IP. Trusting the proxy hops makes req.ip the real visitor IP, so the
   rate limiters count each visitor separately instead of the whole site
   sharing one limit.
   TRUST_PROXY = number of proxies in front of the app
   (ALB only → 1, CloudFront + ALB → 2). Defaults to 1 in production,
   0 locally.
─────────────────────────────────────────────────────────────────────── */
app.set(
  "trust proxy",
  Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === "production" ? 1 : 0)) || 0
);

/* ── Security headers ───────────────────────────────────────────────── */
app.use(helmet());

/* ── HTTPS enforcement (production only) ───────────────────────────────
   AWS ALB / CloudFront terminates TLS and forwards the original scheme
   in the X-Forwarded-Proto header. In production we trust that header
   and redirect plain-HTTP requests before they go any further.
   In development this middleware is skipped entirely.
─────────────────────────────────────────────────────────────────────── */
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] === "http") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

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
      commerceConfigured,
      stripeWebhookSecretLoaded: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
      sesConfigured: missingEmailEnv.length === 0,
      reservationTtlMinutes: Number(process.env.RESERVATION_TTL_MINUTES) || 30,
    },
  });
});

/* ── Routes ─────────────────────────────────────────────────────────── */
app.use("/api/products",         productsRouter);
app.use("/api/contact",          contactLimiter,  contactRouter);

if (commerceConfigured) {
  app.use("/api/checkout",         checkoutLimiter, checkoutRouter);
  app.use("/api/webhooks/stripe",  webhooksRouter);
} else {
  app.use(["/api/checkout", "/api/webhooks/stripe"], (_req, res) => {
    res.status(503).json({ error: "Checkout is not available." });
  });
}

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
