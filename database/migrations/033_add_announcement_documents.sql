-- Migration 033: Support multiple document attachments per announcement.
--
-- Announcements previously stored a single attachment in
-- announcements.document_url. This adds a proper child table so an admin
-- can attach any number of documents to an announcement, and backfills any
-- existing single attachment into it so nothing already published loses
-- its document. announcements.document_url is left in place (untouched)
-- purely for backward compatibility with old rows/tools; new code reads
-- and writes announcement_documents instead.

CREATE TABLE IF NOT EXISTS announcement_documents (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    filename VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcement_documents_announcement_id
    ON announcement_documents(announcement_id);

-- Backfill: copy any existing single document_url into the new table so
-- it keeps showing up once the app switches to reading from here. Only
-- runs once per announcement thanks to the NOT EXISTS guard.
INSERT INTO announcement_documents (announcement_id, url, filename)
SELECT a.id, a.document_url, NULL
FROM announcements a
WHERE a.document_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM announcement_documents d WHERE d.announcement_id = a.id
  );
