-- Migration 035: Let an applicant attach any number of documents to their
-- application (resume, pitch deck, ID, ...), mirroring the pattern already
-- used for announcement_documents. Previously the public apply form had a
-- single file input that was validated client-side but never actually
-- uploaded anywhere -- this table is what the fixed endpoint now writes to.

CREATE TABLE IF NOT EXISTS application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    filename VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_documents_application_id
    ON application_documents(application_id);
