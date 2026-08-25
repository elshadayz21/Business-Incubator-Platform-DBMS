-- Migration 019: Enhance announcements and applications schema for categories, team/individual applicant types, and custom forms.

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
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Call for Applications',
    ADD COLUMN IF NOT EXISTS applicant_type VARCHAR(50) DEFAULT 'both',
    ADD COLUMN IF NOT EXISTS deadline TIMESTAMP,
    ADD COLUMN IF NOT EXISTS document_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_open_call BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS capacity INTEGER,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS applicant_type VARCHAR(50) DEFAULT 'individual',
    ADD COLUMN IF NOT EXISTS team_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1;
