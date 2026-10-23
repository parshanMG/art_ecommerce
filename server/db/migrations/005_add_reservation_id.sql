-- Ties each reservation to the checkout attempt that made it, so
-- releasing or extending a hold only ever touches that buyer's items.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS reservation_id TEXT;
