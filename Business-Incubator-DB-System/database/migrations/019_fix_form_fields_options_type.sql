-- The `options` column on form_fields was created as JSONB, but the app
-- never actually stores JSON there — the admin form builder saves a plain
-- comma-separated string (e.g. "Yes, No, Maybe"), and the public applicant
-- form reads it back with a plain `.split(',')`. Inserting that string into
-- a jsonb column fails since it isn't valid JSON. Switch the column to TEXT
-- to match how the app actually uses it.
ALTER TABLE form_fields
    ALTER COLUMN options TYPE TEXT USING options::TEXT;