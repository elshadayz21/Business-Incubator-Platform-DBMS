-- Migration 026: Separate the form field's WIDGET type from what database
-- column it feeds. Previously a question's answer was matched to an
-- `applications` column either via magic field_type values ('name', 'idea',
-- ...) or, in a later patch, by guessing from substrings in the question's
-- label text (label contains "email" -> email column, etc). Both approaches
-- are fragile: a label like "What's your nickname?" would wrongly overwrite
-- full_name, and admins had no explicit way to say "this question is the
-- applicant's email."
--
-- This migration adds an explicit `maps_to` column that plays that linking
-- role instead, and normalizes existing rows so field_type only ever
-- contains a real widget type.

ALTER TABLE form_fields
    ADD COLUMN IF NOT EXISTS maps_to VARCHAR(30);

-- Backfill legacy pseudo-types into (clean widget type, maps_to) pairs.
UPDATE form_fields SET field_type = 'text',     maps_to = 'full_name'    WHERE field_type = 'name';
UPDATE form_fields SET field_type = 'textarea', maps_to = 'startup_idea' WHERE field_type = 'idea';
UPDATE form_fields SET field_type = 'tel',      maps_to = 'phone'        WHERE field_type = 'Phone number';
UPDATE form_fields SET field_type = 'textarea', maps_to = 'background'   WHERE field_type = 'Background';
UPDATE form_fields SET maps_to = 'email'                                  WHERE field_type = 'email' AND maps_to IS NULL;

-- Best-effort backfill for rows saved under the label-substring-matching
-- patch: infer maps_to from the label text the same way that code did, so
-- existing forms keep working once the label-guessing code is removed.
UPDATE form_fields SET maps_to = 'email'        WHERE maps_to IS NULL AND lower(label) LIKE '%email%';
UPDATE form_fields SET maps_to = 'full_name'     WHERE maps_to IS NULL AND lower(label) LIKE '%name%';
UPDATE form_fields SET maps_to = 'startup_idea'  WHERE maps_to IS NULL AND (lower(label) LIKE '%idea%' OR lower(label) LIKE '%startup%');
UPDATE form_fields SET maps_to = 'background'    WHERE maps_to IS NULL AND lower(label) LIKE '%background%';
UPDATE form_fields SET maps_to = 'phone'         WHERE maps_to IS NULL AND lower(label) LIKE '%phone%';

-- Keep maps_to restricted to the normalized columns applications actually has.
ALTER TABLE form_fields DROP CONSTRAINT IF EXISTS form_fields_maps_to_check;
ALTER TABLE form_fields
    ADD CONSTRAINT form_fields_maps_to_check
    CHECK (maps_to IS NULL OR maps_to IN ('full_name', 'email', 'phone', 'startup_idea', 'background'));
