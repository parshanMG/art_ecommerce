CREATE TABLE IF NOT EXISTS contact_submissions (
  id                      SERIAL PRIMARY KEY,
  name                    TEXT        NOT NULL,
  email                   TEXT        NOT NULL,
  subject                 TEXT        NOT NULL,
  message                 TEXT        NOT NULL,
  owner_notified_at       TIMESTAMPTZ,
  customer_confirmed_at   TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);