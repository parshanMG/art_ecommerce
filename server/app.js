import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import createProductsRouter from "./routes/products.js";
import createContactRouter from "./routes/contact.js";
import { listCatalogProducts } from "./catalog.js";
import { errorHandler } from "./middleware/errorHandler.js";

function limiter(max) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
}

/* ─────────────────────────────────────────────────────────────────────
   createApp
   Builds the Express app without starting it — index.js checks the
   environment and listens; the tests build their own apps.

   Options:
     clientOrigin — allowed CORS origin
     commerce     — the commerce/index.js module in shop mode, else null
     contact      — overrides for the contact route's dependencies
                    (the tests swap in fake email senders)
     health       — extra fields for GET /api/health
───────────────────────────────────────────────────────────────────── */
export function createApp({
  clientOrigin = "http://localhost:5173",
  commerce = null,
  contact = {},
  health = {},
} = {}) {
  const app = express();

  /* ── Proxy trust ──────────────────────────────────────────────────────
     Behind the AWS load balancer every request arrives from the LB's own
     IP. Trusting the proxy hops makes req.ip the real visitor IP, so the
     rate limiters count each visitor separately instead of the whole site
     sharing one limit.
     TRUST_PROXY = number of proxies in front of the app
     (ALB only → 1, CloudFront + ALB → 2). Defaults to 1 in production,
     0 locally.
  ───────────────────────────────────────────────────────────────────── */
  app.set(
    "trust proxy",
    Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === "production" ? 1 : 0)) || 0
  );

  /* ── Security headers ─────────────────────────────────────────────── */
  app.use(helmet());

  /* ── HTTPS enforcement (production only) ─────────────────────────────
     AWS ALB / CloudFront terminates TLS and forwards the original scheme
     in the X-Forwarded-Proto header. In production we trust that header
     and redirect plain-HTTP requests before they go any further.
     In development this middleware is skipped entirely.
  ───────────────────────────────────────────────────────────────────── */
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

  /* ── CORS ─────────────────────────────────────────────────────────── */
  app.use(cors({ origin: clientOrigin }));

  /* ── Health endpoint ───────────────────────────────────────────────── */
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      ...health,
      config: {
        clientOrigin,
        mode: commerce ? "shop" : "portfolio",
        ...health.config,
      },
    });
  });

  /* ── Routes ───────────────────────────────────────────────────────── */
  app.use("/api/products", createProductsRouter(commerce?.listProducts ?? listCatalogProducts));
  app.use("/api/contact",  limiter(10), createContactRouter(contact));

  if (commerce) {
    commerce.mountCommerce(app, { checkoutLimiter: limiter(30) });
  } else {
    app.use(["/api/checkout", "/api/webhooks/stripe"], (_req, res) => {
      res.status(503).json({ error: "Checkout is not available." });
    });
  }

  /* ── Global error handler ─────────────────────────────────────────── */
  app.use(errorHandler);

  return app;
}
