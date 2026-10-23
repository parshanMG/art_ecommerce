-- Links a contact enquiry to the artwork it was sent about
-- (the "Enquire" buttons in the gallery and featured carousel).

ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS product_id TEXT REFERENCES products(id) ON DELETE SET NULL;
