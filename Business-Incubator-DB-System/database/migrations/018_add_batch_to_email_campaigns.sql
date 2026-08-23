-- Migration: Track which announcement (batch / open call) a mass-email campaign targeted
-- Lets admins send acceptance/decline waves per batch instead of across all batches,
-- and keeps an audit trail of which batch each campaign belonged to.
ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS announcement_id INTEGER REFERENCES announcements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_campaigns_announcement ON email_campaigns(announcement_id);
