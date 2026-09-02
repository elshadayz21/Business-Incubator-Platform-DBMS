-- Migration 030: Group application questions into named sections.
--
-- The public apply form used to dump every question onto one long page.
-- `section` lets an admin cluster related questions (e.g. "Personal
-- Information", "Your Idea", "Team") so the apply form can render them as
-- separate steps with a progress indicator instead of one big wall of
-- fields. Fields with no section (or the same section as the field before
-- them) are grouped together in question order — nothing breaks for forms
-- that never set this.

ALTER TABLE form_fields
    ADD COLUMN IF NOT EXISTS section VARCHAR(100) NOT NULL DEFAULT 'General Information';
