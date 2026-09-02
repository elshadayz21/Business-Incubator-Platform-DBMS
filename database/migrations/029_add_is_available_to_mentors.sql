-- ============================================
-- ADD MENTOR AVAILABILITY TOGGLE
-- Description: Adds a real "is_available" flag so admins can mark a
-- mentor as available/unavailable for booking, independent of their
-- account status (active/inactive). Added to both "users" (source of
-- truth for the public mentors page) and "mentors" (source of truth
-- for the admin mentor management panel) so the two stay in sync the
-- same way "status" already does.
-- ============================================

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN DEFAULT true;

ALTER TABLE "mentors"
ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN DEFAULT true;
