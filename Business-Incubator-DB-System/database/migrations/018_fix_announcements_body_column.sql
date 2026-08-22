-- The announcements table has a legacy `body` column (NOT NULL, no default)
-- left over from before the app switched to using `content`. The
-- application code never writes to `body`, so every INSERT was failing
-- the NOT NULL constraint. Drop the constraint so it stops blocking inserts.
ALTER TABLE announcements
    ALTER COLUMN body DROP NOT NULL;