# Maryam Mohseni — Art Portfolio

Portfolio and (optional) shop for watercolour artist Maryam Mohseni.

- **Frontend** — React 18 + Vite + Tailwind CSS v4 (repo root)
- **Backend** — Express + PostgreSQL + Stripe + AWS SES (`server/`)

The two are fully separate. In development Vite proxies `/api/*` to the backend on port 4000.

## Portfolio mode vs. shop mode

`COMMERCE_ENABLED` in `src/config/features.js` switches the purchase UI (cart, Add to Basket, Buy Now, `/checkout`) on or off. It is currently **off**.

Even in portfolio mode the site needs the backend and database for:

- the gallery — products come from `GET /api/products`
- the contact form — `POST /api/contact` saves the message and emails it via SES

The backend runs in portfolio mode when `STRIPE_SECRET_KEY` is blank: checkout and webhook routes answer `503`.

## Languages

The site is in English (default) and Persian. Visitors switch with the flags in the footer; Persian turns the whole layout right-to-left and uses the self-hosted Vazirmatn font.

- Every component keeps its text in a `COPY = { en: {...}, fa: {...} }` object at the top of the file — edit both languages together.
- `src/i18n/LanguageContext.jsx` holds the current language (`useLanguage()`), and `src/i18n/format.js` formats prices, numbers and product text.
- Use logical Tailwind classes (`ps-`/`pe-`, `ms-`/`me-`, `start-`/`end-`, `text-start`) instead of left/right ones so layouts mirror correctly, and `rtl:-scale-x-100` on arrow icons.
- Contact-form confirmation emails are sent in the language the visitor was using.

## Local setup

Requires Node 20+ and PostgreSQL.

```bash
# 1. Frontend dependencies
npm install

# 2. Backend dependencies
cd server
npm install

# 3. Configure — copy and fill in both env files
cp .env.example .env            # server/.env
cp ../.env.example ../.env      # frontend .env

# 4. Create the database (once), then build the schema and load products
createdb art_ecommerce
npm run migrate
npm run seed
```

Run both in separate terminals:

```bash
cd server && npm run dev   # API on http://localhost:4000
npm run dev                # site on http://localhost:5173
```

To test checkout locally, forward Stripe webhooks with the Stripe CLI and put the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

## Database

Migrations live in `server/db/migrations/` and are applied in filename order by `npm run migrate`, which records each one in `schema_migrations`. To change the schema, add a new numbered `.sql` file — never edit one that has already run.

| Table | Purpose |
|---|---|
| `products` | Catalog + live availability and checkout reservations |
| `orders` | Written by the Stripe webhook after a successful payment |
| `contact_submissions` | Every contact-form message, with the artwork it was about (if any) |

### Managing the catalog

`public/data/products.json` is the source for catalog details. After editing it, run `npm run seed` in `server/`:

- titles, prices, images, descriptions etc. are updated on existing rows
- `"available": false` marks a piece sold (e.g. sold at an exhibition)
- `"available": true` never revives a piece sold through the site — un-sell those in the database
- products removed from the JSON are listed as a warning, not deleted

Each product can also have Persian text — `title_fa`, `medium_fa` and `dimensions_fa`. Anything left out falls back to English on the Persian site.

Prices are formatted by `PRICE_CURRENCY` in `src/i18n/format.js` (`"USD"` now; set `"TOMAN"` once the catalog has toman prices).

Images go in `public/images/products/`. Gallery categories and their order are set by `CATEGORY_META` in `src/components/Shop.jsx`.

## Environment variables

**Frontend** (`.env`, see `.env.example`)

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | Leave blank when the API is served from the same origin |
| `VITE_PRODUCTS_ENDPOINT` | Usually `/api/products` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Only needed in shop mode |

**Backend** (`server/.env`, see `server/.env.example`) — database credentials are required; Stripe is optional; SES is required when `NODE_ENV=production`. `TRUST_PROXY` sets how many proxies sit in front of the API (see below).

## Deployment notes

- **SPA fallback** — the host must serve `index.html` for unknown paths so `/shop`, `/about` and `/contact` work on refresh (e.g. CloudFront custom error response 403/404 → `/index.html`, 200).
- **Docker** — `server/Dockerfile` builds the API image. `.dockerignore` keeps `.env` out of the image; pass secrets as runtime environment variables. Run `npm run migrate` against the production database before starting a new version.
- **Proxies** — behind a load balancer set `TRUST_PROXY` (ALB only → `1`, CloudFront + ALB → `2`) so rate limits apply per visitor. It defaults to `1` in production.
- **SES** — the sender address must be verified in SES (and the account out of the SES sandbox to email arbitrary visitors).
- **Stripe** — register `https://<api-host>/api/webhooks/stripe` for `payment_intent.succeeded`, `payment_intent.payment_failed` and `payment_intent.canceled`.

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```
