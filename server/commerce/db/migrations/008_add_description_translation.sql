-- Persian description, shown in the gallery's artwork viewer.
-- Optional: when empty, the Persian site falls back to the English text.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description_fa TEXT;
