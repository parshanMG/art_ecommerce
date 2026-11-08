# Maryam Mohseni — Art Portfolio

A bilingual (English / Persian) portfolio site for the watercolour artist Maryam Mohseni, with a complete Stripe shop built in and switched off by one setting.

The live site runs in **portfolio mode**: visitors browse the gallery and send enquiries, and sales are arranged directly with the artist. **Shop mode** adds a cart, Stripe checkout and order handling backed by PostgreSQL. It's kept working and tested so it can be turned on for a demo or a future store.

- **Frontend:** React 18, Vite, Tailwind CSS v4, React Router
- **Backend:** Node 20+, Express, Resend email service; in shop mode also PostgreSQL and Stripe
- **Tests:** Node's built-in test runner, against a real PostgreSQL database in CI

## Highlights

- **No double-selling.** Each painting exists once. Checkout reserves the pieces inside a transaction with `SELECT … FOR UPDATE`, so two buyers paying at the same moment can't both get the same piece. Reservations expire if checkout is abandoned and are re-checked right before the card is charged.
- **The server sets the price.** The amount charged is worked out from database prices, never from anything the browser sends.
- **Duplicate-safe webhooks.** Stripe can deliver the same event more than once, even concurrently; the webhook records one order either way. If a buyer pays after their reservation lapsed and someone else bought the piece, the order is flagged for a refund instead of overselling.
- **Tests that prove the locking works.** The race-condition tests hold a row lock until both competing calls are waiting, then release them together. Remove the `FOR UPDATE` locks and those tests fail.
- **One switch, two products.** In portfolio mode the server never loads Stripe or the database driver, and the frontend build leaves out all shop code, Stripe.js included.
- **Bilingual and right-to-left.** Persian mirrors the whole layout using logical CSS properties, with self-hosted fonts and Persian digits.
- **Privacy by design.** No cookies, analytics or third-party requests. Contact messages are emailed rather than stored (the email provider deletes its copy after 30 days), the visitor's confirmation doesn't repeat their message, and sending them to the artist in Iran requires the visitor's explicit consent under UK GDPR Article 49(1)(a).

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    SPA["React app<br/>(src/)"]
  end

  subgraph Server["Express API (server/)"]
    Core["Core<br/>/api/products · /api/contact"]
    Commerce["commerce/ — shop mode only<br/>/api/checkout · /api/webhooks/stripe"]
  end

  Catalog[("data/products.json")]
  Email["Resend<br/>(email)"]
  PG[("PostgreSQL<br/>products · orders")]
  Stripe["Stripe"]

  SPA --> Core
  SPA -. shop mode .-> Commerce
  SPA -. card details .-> Stripe
  Core -- portfolio mode --> Catalog
  Core --> Email
  Commerce --> PG
  Commerce --> Stripe
  Stripe -- webhook --> Commerce
  Commerce --> Email
```

### The two modes

| | Portfolio mode (default) | Shop mode |
|---|---|---|
| Switch | — | `COMMERCE_ENABLED=true` (server) and `VITE_COMMERCE_ENABLED=true` (frontend) |
| Products | `server/data/products.json` | PostgreSQL, seeded from the same file, with live availability |
| Contact form | Emailed via Resend | Emailed via Resend |
| Checkout | Off (routes answer 503) | Cart, Stripe Payment Element, reservations, order emails |
| Needs | Resend | Resend, PostgreSQL, a Stripe account |

### Checkout flow (shop mode)

1. **Details:** the buyer enters their address. `POST /api/checkout/create-payment-intent` reserves the pieces (row-locked), calculates the total from the database and creates a Stripe PaymentIntent.
2. **Payment:** right before confirming, `POST /api/checkout/hold` re-checks that the pieces are still the buyer's and restarts the reservation clock. If they're gone, the PaymentIntent is cancelled before any money moves.
3. **Webhook:** `payment_intent.succeeded` records the order and marks the pieces sold, in one transaction. Failed or cancelled payments release the hold.

### Why payments are off on the live site

The artist lives in Iran, and card processors including Stripe don't permit Iran-linked sales. So the live site takes enquiries only, and buyers arrange payment directly with the artist. The shop code stays complete and tested for demos and for any future setup where online payment is allowed.

## Project structure

```
src/
  components/           pages and sections (gallery, contact, about, privacy…)
  features/commerce/    shop mode: Checkout, cart context, cart menu, buy buttons
  i18n/                 language context and number/price formatting
  config/features.js    COMMERCE_ENABLED, read from VITE_COMMERCE_ENABLED
server/
  index.js              checks the environment, picks the mode, starts the server
  app.js                builds the Express app (also used by the tests)
  catalog.js            reads data/products.json
  data/products.json    the artwork catalog — the source of truth
  routes/               products, contact
  services/email.js     Resend sender, email layout, contact emails
  commerce/             shop mode only, loaded on demand
    index.js            mounts the routes, products from the database
    orders.js           reservations and order recording
    routes/             checkout, Stripe webhook
    db/                 connection pool, migrations, seed script
  tests/                API, catalog and shop tests
```

## Running locally

Requires Node 20+.

### Portfolio mode

No database needed.

```bash
npm install
cd server && npm install
cp .env.example .env            # fill in the Resend settings to send email
cp ../.env.example ../.env
```

Run the API and the site in separate terminals:

```bash
cd server && npm run dev   # API on http://localhost:4000
npm run dev                # site on http://localhost:5173 (proxies /api to the API)
```

### Shop mode

Also needs PostgreSQL and a Stripe account (test keys are fine).

1. Set `COMMERCE_ENABLED=true`, the `DB_*` and `STRIPE_*` settings in `server/.env`, and `VITE_COMMERCE_ENABLED=true` and `VITE_STRIPE_PUBLISHABLE_KEY` in `.env`.
2. Create the database and load the catalog:

   ```bash
   createdb art_ecommerce
   cd server
   npm run migrate
   npm run seed
   ```

3. Forward Stripe webhooks, and put the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`:

   ```bash
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```

Pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC.

## Tests

```bash
cd server
npm test
```

The API and catalog tests need nothing else. The shop tests run when `TEST_DATABASE_URL` points to a PostgreSQL database whose name ends in `_test`; they wipe and rebuild it, so the name check stops them touching a real database:

```bash
createdb art_ecommerce_test
TEST_DATABASE_URL=postgres://user:password@localhost:5432/art_ecommerce_test npm test
```

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) builds the site in both modes and runs every test, with a PostgreSQL service, on each push and pull request.

## Managing content

### Catalog

`server/data/products.json` holds the artwork. Images go in `public/images/products/`. The catalog tests check for unique ids, required fields and missing images.

Ids are numbers in quotes (`"id": "14"`). A new product takes the next number after the highest one. Never reuse the id of a removed product: old links and shop orders still point to it.

### Images

Put originals in `public/images/products/`; they're never changed. `npm run images` makes web copies in `public/images/products-optimized/`: WebP at 480, 800, 1200 and 1600px wide (quality 90), skipping any size larger than the original, plus the original file itself as the largest size. Originals wider than 2560px are scaled down to 2560 instead. Copies get web-safe names (`Rose Garden.JPG` → `rose-garden-800.webp`), and two originals that would get the same name stop the run with an error.

- It runs before every `npm run dev` and `npm run build`, so the copies are made locally and on the host at deploy. They're not committed: only the originals are.
- `npm run images:watch` keeps running and makes copies as soon as an image is added. Deleting an original deletes its copies.
- sharp is pinned to an exact version so the host makes the same copies as your machine.
- `manifest.json` in the output folder lists every copy and its width. Unchanged images are skipped, and changing a setting in [scripts/optimize-images.js](scripts/optimize-images.js) redoes them all.

- **Portfolio mode:** restart the API (or redeploy) after editing the file.
- **Shop mode:** run `npm run seed` in `server/`. It updates titles, prices, images and so on. `"available": false` marks a piece sold, for example at an exhibition. `"available": true` never revives a piece sold through the site; un-sell those in the database. Products removed from the file are listed as a warning, not deleted.

Each product can have Persian text in `title_fa`, `medium_fa`, `dimensions_fa` and `description_fa`; anything left out falls back to English. Prices are formatted by `PRICE_CURRENCY` in `src/i18n/format.js`. Gallery categories and their order are set by `CATEGORY_META` in `src/components/Shop.jsx`.

### Languages

The site is in English (default) and Persian; visitors switch with the flags in the footer.

- Every component keeps its text in a `COPY = { en: {...}, fa: {...} }` object at the top of the file. Edit both languages together.
- Use logical Tailwind classes (`ps-`/`pe-`, `ms-`/`me-`, `start-`/`end-`, `text-start`) so layouts mirror correctly, and `rtl:-scale-x-100` on arrow icons.
- Contact confirmation emails go out in the language the visitor was using.

### Database (shop mode)

Migrations live in `server/commerce/db/migrations/` and run in filename order with `npm run migrate`, which records each in `schema_migrations`. To change the schema, add a new numbered `.sql` file. Never edit one that has already run.

| Table | Purpose |
|---|---|
| `products` | The catalog, plus live availability and checkout reservations |
| `orders` | Written by the Stripe webhook after a successful payment |

## Environment variables

**Frontend** (`.env`, see [.env.example](.env.example))

| Variable | Notes |
|---|---|
| `VITE_COMMERCE_ENABLED` | `true` builds the shop; leave blank for the portfolio site |
| `VITE_API_BASE_URL` | Leave blank when the API is served from the same origin |
| `VITE_PRODUCTS_ENDPOINT` | Usually `/api/products` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Shop mode only |

**Backend** (`server/.env`, see [server/.env.example](server/.env.example))

| Variable | Notes |
|---|---|
| `COMMERCE_ENABLED` | `true` for shop mode |
| `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_OWNER_ADDRESS` | Required when `NODE_ENV=production` |
| `DB_*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESERVATION_TTL_MINUTES` | Shop mode only |
| `TRUST_PROXY` | Proxies in front of the API (see below) |

## Deployment

### Live site: Cloudflare Workers (portfolio mode)

The live site is one Cloudflare Worker ([worker/index.js](worker/index.js), configured in [wrangler.jsonc](wrangler.jsonc)). It serves the built site and the portfolio-mode API (`/api/products`, `/api/contact`, `/api/health`) on the same domain, so there's no separate API server and no CORS to set up. The catalog, contact-form checks and emails are the same modules the Express server uses ([server/catalog.js](server/catalog.js), [server/contactForm.js](server/contactForm.js), [server/services/email.js](server/services/email.js)).

1. **Workers & Pages → Create application → GitHub**, then pick this repo. The Worker's name must be `art-ecommerce`, matching `name` in `wrangler.jsonc`, or the build fails.
2. **Build command:** `npm run build:cloudflare` (it installs `server/`'s packages too, which the Worker bundles). Leave the deploy command as `npx wrangler deploy`. Node 22 comes from `.node-version`.
3. **Settings → Variables & Secrets:** add `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` and `EMAIL_OWNER_ADDRESS` as secrets. Leave `VITE_COMMERCE_ENABLED` and `VITE_API_BASE_URL` unset.
4. **Settings → Domains & Routes → Add → Custom Domain:** add the domain. Cloudflare creates the DNS record and certificate.
5. Check `https://<domain>/api/health` shows `"emailConfigured":true`, then send a test message through the contact form.

Every push to `main` redeploys. Contact messages are limited to 3 a minute per address (`CONTACT_LIMITER`); Cloudflare counts these per location, so the limit is approximate.

To run the Worker locally, copy `.dev.vars.example` to `.dev.vars`, fill it in, and run `npm run worker:dev` (http://localhost:8787).

### Express server (shop mode and Docker)

Shop mode needs the Express server and PostgreSQL, which the Worker doesn't run. These notes apply to hosting it.

- **SPA fallback:** the host must serve `index.html` for unknown paths so `/shop`, `/about` and `/contact` work on refresh (for example a CloudFront custom error response 403/404 → `/index.html`, 200).
- **Docker:** `server/Dockerfile` builds the API image, including the catalog. `.dockerignore` keeps `.env` out of the image; pass secrets as runtime environment variables. In shop mode, run `npm run migrate` against the production database before starting a new version.
- **Proxies:** behind a load balancer set `TRUST_PROXY` (ALB only → `1`, CloudFront + ALB → `2`) so rate limits apply per visitor. It defaults to `1` in production.
- **Resend:** verify the sending domain in Resend (SPF and DKIM DNS records) and use an API key with sending access only. Keep open and click tracking off for the domain, as the privacy policy promises no tracking. Until a domain is verified, Resend only delivers to the account owner's own address.
- **Stripe (shop mode):** register `https://<api-host>/api/webhooks/stripe` for `payment_intent.succeeded`, `payment_intent.payment_failed` and `payment_intent.canceled`.

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```
