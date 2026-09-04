-- Migration 034: Give each announcement document a human-readable, unique
-- slug, so a document's own public page can live at a descriptive URL like
-- /documents/business-plan-pdf instead of an opaque numeric id.
-- Mirrors migration 028's slug for announcements themselves, and the same
-- slugify() logic in admin-backend/announcements/announcements.js is used
-- going forward for newly attached documents.

ALTER TABLE announcement_documents
    ADD COLUMN IF NOT EXISTS slug VARCHAR(220);

-- Backfill existing rows with a slug derived from their filename (falling
-- back to the last path segment of their url, then to "document" if
-- neither yields anything usable), de-duplicated by appending "-<id>" on
-- collision -- same scheme as migration 028's announcement slug backfill.
WITH base AS (
    SELECT
        id,
        NULLIF(
            regexp_replace(
                regexp_replace(
                    lower(trim(COALESCE(NULLIF(filename, ''), regexp_replace(url, '^.*/', '')))),
                    '[^a-z0-9]+', '-', 'g'
                ),
                '(^-+|-+$)', '', 'g'
            ),
            ''
        ) AS base_slug
    FROM announcement_documents
    WHERE slug IS NULL
),
numbered AS (
    SELECT
        id,
        COALESCE(base_slug, 'document') AS base_slug,
        ROW_NUMBER() OVER (PARTITION BY COALESCE(base_slug, 'document') ORDER BY id) AS rn
    FROM base
)
UPDATE announcement_documents d
SET slug = CASE WHEN n.rn = 1 THEN n.base_slug ELSE n.base_slug || '-' || d.id END
FROM numbered n
WHERE d.id = n.id;

-- Enforce uniqueness going forward.
CREATE UNIQUE INDEX IF NOT EXISTS announcement_documents_slug_unique_idx ON announcement_documents (slug);
