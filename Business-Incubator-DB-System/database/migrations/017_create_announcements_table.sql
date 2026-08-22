-- The `announcements` table was never actually created by a migration —
-- migration 012 only ALTERs it, assuming it already exists. This migration
-- creates it properly for fresh installs, and patches any already-existing
-- but incomplete `announcements` table (e.g. missing `content`) for
-- installs that had it created ad hoc.

CREATE TABLE IF NOT EXISTS announcements (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    content       TEXT,
    is_published  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Patch columns onto an existing table that may be missing some of these
-- (covers the case where the table was created manually/partially before).
ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS title        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS content      TEXT,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN   NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP NOT NULL DEFAULT NOW();

-- Fields added by migration 012 (deadline, document_url, is_open_call,
-- capacity) are re-applied here too so this migration is self-sufficient
-- and safe to run even on a database that skipped 012.
ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS deadline      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS document_url  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_open_call  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS capacity      INTEGER;