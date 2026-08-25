-- Migration: Create mentor_invitations table for pre-assignment interest workflow
CREATE TABLE IF NOT EXISTS mentor_invitations (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    message TEXT,
    invited_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    UNIQUE(project_id, mentor_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_invitations_mentor_id ON mentor_invitations(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_invitations_project_id ON mentor_invitations(project_id);
