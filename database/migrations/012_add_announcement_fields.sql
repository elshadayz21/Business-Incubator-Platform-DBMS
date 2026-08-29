-- Add announcement publishing fields used by the announcements CMS and public open-calls.
-- The announcements table itself is also created here so this migration is
-- self-contained (it was previously created much later in migration 019, which
-- caused "relation announcements does not exist" errors on fresh databases).
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'Call for Applications',
    applicant_type VARCHAR(50) DEFAULT 'both',
    deadline TIMESTAMP,
    document_url VARCHAR(255),
    is_open_call BOOLEAN NOT NULL DEFAULT FALSE,
    capacity INTEGER,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS deadline      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS document_url  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_open_call  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS capacity      INTEGER;
