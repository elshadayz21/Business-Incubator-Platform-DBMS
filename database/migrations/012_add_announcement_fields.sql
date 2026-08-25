-- Add announcement publishing fields used by the announcements CMS and public open-calls.
ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS deadline      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS document_url  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_open_call  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS capacity      INTEGER;
