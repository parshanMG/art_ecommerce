-- Records which language the visitor used, and when they gave explicit
-- consent for their message to be sent to the artist in Iran
-- (UK GDPR Article 49(1)(a) — Iran has no UK adequacy decision).

ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS language            TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS transfer_consent_at TIMESTAMPTZ;
