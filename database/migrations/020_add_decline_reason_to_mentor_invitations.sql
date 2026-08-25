-- Migration: Add decline_reason to mentor_invitations
-- Description: Stores the reason a mentor gives when declining a project invitation,
--              so admins can see why and pick another mentor.
ALTER TABLE mentor_invitations
ADD COLUMN IF NOT EXISTS decline_reason TEXT;
