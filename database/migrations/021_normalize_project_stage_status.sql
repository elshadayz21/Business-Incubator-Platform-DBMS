-- Migration: Normalize legacy project stage/status values
-- Description: Maps old/variant labels (MVP, Scale-Up, Idea, Pending...) to the
--              canonical lowercase values used by admin filters and stats:
--                stage/status: idea | in-progress | completed
--              Safe to run multiple times.

ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_stage;

UPDATE projects SET
  stage = CASE LOWER(TRIM(stage))
    WHEN 'mvp' THEN 'in-progress'
    WHEN 'in progress' THEN 'in-progress'
    WHEN 'inprogress' THEN 'in-progress'
    WHEN 'scale-up' THEN 'completed'
    WHEN 'scaleup' THEN 'completed'
    WHEN 'scale up' THEN 'completed'
    ELSE LOWER(TRIM(stage))
  END,
  status = CASE LOWER(TRIM(status))
    WHEN 'mvp' THEN 'in-progress'
    WHEN 'in progress' THEN 'in-progress'
    WHEN 'inprogress' THEN 'in-progress'
    WHEN 'scale-up' THEN 'completed'
    WHEN 'scaleup' THEN 'completed'
    WHEN 'scale up' THEN 'completed'
    ELSE LOWER(TRIM(status))
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE stage IS NOT NULL AND status IS NOT NULL;

-- Rows created before the pipeline existed: default them from their stage.
UPDATE projects SET status = stage WHERE status IS NULL AND stage IS NOT NULL;
UPDATE projects SET stage = status WHERE stage IS NULL AND status IS NOT NULL;

-- Final alignment: keep both pipeline columns identical (the admin "advance"
-- buttons and stats treat them as one pipeline). Rows with review-only values
-- like 'Pending'/'Approved' get their stage's value instead.
UPDATE projects
SET status = stage,
    updated_at = CURRENT_TIMESTAMP
WHERE stage IN ('idea', 'in-progress', 'completed')
  AND status IS DISTINCT FROM stage;

ALTER TABLE projects ADD CONSTRAINT chk_stage CHECK (stage IN ('idea', 'in-progress', 'completed'));
