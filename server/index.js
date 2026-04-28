import "dotenv/config";
import express from "express";
import cors from "cors";

import productsRouter  from "./routes/products.js";
import checkoutRouter  from "./routes/checkout.js";
import contactRouter   from "./routes/contact.js";
import webhooksRouter  from "./routes/webhooks.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app  = express();
const PORT = process.env.PORT || 4000;

/* ── Raw body for Stripe webhook signature verification ────────────── */
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

/* ── JSON body for all other routes ────────────────────────────────── */
app.use(express.json());

/* ── CORS ───────────────────────────────────────────────────────────── */
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));

/* ── Routes ─────────────────────────────────────────────────────────── */
app.use("/api/products",         productsRouter);
app.use("/api/checkout",         checkoutRouter);
app.use("/api/contact",          contactRouter);
app.use("/api/webhooks/stripe",  webhooksRouter);

/* ── Global error handler ───────────────────────────────────────────── */
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
