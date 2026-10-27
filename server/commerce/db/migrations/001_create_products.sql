-- Products table
-- Mirrors public/data/products.json but lives in the database
-- so availability can be updated at runtime after a sale.

CREATE TABLE IF NOT EXISTS products (
  id           TEXT        PRIMARY KEY,          -- e.g. "chromatic-drift"
  title        TEXT        NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  category     TEXT        NOT NULL,             -- "print" | "original"
  medium       TEXT,
  dimensions   TEXT,
  year         SMALLINT,
  available    BOOLEAN     NOT NULL DEFAULT TRUE,
  reserved     BOOLEAN     NOT NULL DEFAULT FALSE,
  reserved_at  TIMESTAMPTZ,                      -- set when checkout begins; cleared on failure
  featured     BOOLEAN     NOT NULL DEFAULT FALSE,
  image        TEXT,
  thumbnail    TEXT,
  description  TEXT
);
