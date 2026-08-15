-- Applications for announcements (matches the schema used by public apply + admin submissions).
CREATE TABLE IF NOT EXISTS applications (
    id                SERIAL PRIMARY KEY,
    announcement_id   INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
    full_name         VARCHAR(255),
    email             VARCHAR(255),
    phone             VARCHAR(50),
    background        TEXT,
    startup_idea      TEXT,
    answers           JSONB,
    status            VARCHAR(50) NOT NULL DEFAULT 'Pending',
    invite_used       BOOLEAN     NOT NULL DEFAULT FALSE,
    invite_sent       BOOLEAN     NOT NULL DEFAULT FALSE,
    invite_token      VARCHAR(255),
    created_at        TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_announcement_id ON applications(announcement_id);
