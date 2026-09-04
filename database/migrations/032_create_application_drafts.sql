-- In-progress ("draft") applications. Saved automatically as the applicant
-- fills the public apply form, keyed by (announcement_id, email) so an
-- applicant can close the tab, come back later — even on a different
-- device/browser — and pick up exactly where they left off. Also lets a
-- scheduled job find drafts that have gone stale and email a one-time
-- reminder to finish.
CREATE TABLE IF NOT EXISTS application_drafts (
    id                SERIAL PRIMARY KEY,
    announcement_id   INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    email             VARCHAR(255) NOT NULL,
    resume_token      VARCHAR(64) NOT NULL UNIQUE,
    full_name         VARCHAR(255),
    phone             VARCHAR(50),
    background        TEXT,
    startup_idea      TEXT,
    answers           JSONB NOT NULL DEFAULT '{}',
    current_page      INTEGER NOT NULL DEFAULT 0,
    -- 'in_progress' until either submitted (via /apply) or the open call
    -- closes; only 'in_progress' drafts are resumable or reminder-eligible.
    status            VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    reminder_sent_at  TIMESTAMP,
    reminder_count    INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (announcement_id, email)
);

CREATE INDEX IF NOT EXISTS idx_application_drafts_announcement_id ON application_drafts(announcement_id);
-- Speeds up the reminder job's "who's gone stale" scan.
CREATE INDEX IF NOT EXISTS idx_application_drafts_reminder_scan ON application_drafts(status, reminder_count, updated_at);
