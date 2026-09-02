-- Adds a human-readable, unique slug to announcements so public URLs like
-- /apply/7 can become /apply/summer-2026-founder-cohort instead.
-- The slug is generated once (on creation) and never changes afterwards,
-- so links that have already been shared keep working even if the
-- announcement's title is edited later.

ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS slug VARCHAR(160);

-- Backfill existing rows with a slug derived from their title, falling
-- back to "-<id>" whenever that would collide with another row's slug.
WITH base AS (
    SELECT
        id,
        NULLIF(
            regexp_replace(
                regexp_replace(lower(trim(title)), '[^a-z0-9]+', '-', 'g'),
                '(^-+|-+$)', '', 'g'
            ),
            ''
        ) AS base_slug
    FROM announcements
    WHERE slug IS NULL
),
numbered AS (
    SELECT
        id,
        COALESCE(base_slug, 'announcement') AS base_slug,
        ROW_NUMBER() OVER (PARTITION BY COALESCE(base_slug, 'announcement') ORDER BY id) AS rn
    FROM base
)
UPDATE announcements a
SET slug = CASE WHEN n.rn = 1 THEN n.base_slug ELSE n.base_slug || '-' || a.id END
FROM numbered n
WHERE a.id = n.id;

-- Enforce uniqueness going forward.
CREATE UNIQUE INDEX IF NOT EXISTS announcements_slug_unique_idx ON announcements (slug);
