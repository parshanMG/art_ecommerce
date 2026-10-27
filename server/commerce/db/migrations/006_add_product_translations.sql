-- Persian (fa) versions of the catalog text shown on the site.
-- Optional: when empty, the Persian site falls back to the English value.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS title_fa      TEXT,
  ADD COLUMN IF NOT EXISTS medium_fa     TEXT,
  ADD COLUMN IF NOT EXISTS dimensions_fa TEXT;
