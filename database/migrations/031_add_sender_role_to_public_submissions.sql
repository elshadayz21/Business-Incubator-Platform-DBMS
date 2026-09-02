-- 031: Add sender_role to public_submissions so admins can identify
-- mentors, investors, and partners among contact messages.

ALTER TABLE public_submissions
    ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'other';