-- Contact-form messages are no longer stored: they are emailed to the
-- artist and the notification email records the visitor's consent.
-- Dropping the table also deletes any messages it still holds.

DROP TABLE IF EXISTS contact_submissions;
