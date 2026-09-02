-- Migration 027: Let admins override how much horizontal space a question
-- takes on the public application form.
--
-- The apply form renders questions in a 2-column grid and picks a sensible
-- default width from field_type (textarea = full row, short choice lists
-- with >3 options = full row, everything else = half row). That heuristic
-- covers most cases, but an admin may still want a specific short-text or
-- select question (e.g. one with a long label or long option text) to take
-- the full row. `width` lets them say so explicitly — 'auto' (the default)
-- keeps the existing type-based behavior.

ALTER TABLE form_fields
    ADD COLUMN IF NOT EXISTS width VARCHAR(10) NOT NULL DEFAULT 'auto';

ALTER TABLE form_fields DROP CONSTRAINT IF EXISTS form_fields_width_check;
ALTER TABLE form_fields
    ADD CONSTRAINT form_fields_width_check
    CHECK (width IN ('auto', 'half', 'full'));
