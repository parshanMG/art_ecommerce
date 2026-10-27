-- Orders table
-- Saved by the Stripe webhook handler after a successful payment.

CREATE TABLE IF NOT EXISTS orders (
  id                     SERIAL      PRIMARY KEY,
  stripe_payment_intent  TEXT        NOT NULL UNIQUE,
  buyer_name             TEXT        NOT NULL,
  buyer_email            TEXT        NOT NULL,
  shipping_address       JSONB       NOT NULL,  -- { line1, city, country, postcode }
  items                  JSONB       NOT NULL,  -- array of { id, title, price }
  total                  NUMERIC(10,2) NOT NULL,
  status                 TEXT        NOT NULL DEFAULT 'paid',  -- 'paid' | 'shipped' | 'complete'
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
