-- Migration: Enhanced Projects Schema
-- Created: 2026-02-14

ALTER TABLE "projects" 
  ADD COLUMN "title" VARCHAR(255),
  ADD COLUMN "short_description" VARCHAR(150),
  ADD COLUMN "problem" TEXT,
  ADD COLUMN "solution" TEXT,
  ADD COLUMN "tech_stack" VARCHAR(500),
  ADD COLUMN "github_url" VARCHAR(500),
  ADD COLUMN "demo_url" VARCHAR(500),
  ADD COLUMN "team_type" VARCHAR(50),
  ADD COLUMN "looking_for_cofounders" BOOLEAN DEFAULT FALSE,
  ADD COLUMN "funding_stage" VARCHAR(50),
  ADD COLUMN "target_market" VARCHAR(255);

ALTER TABLE "projects" 
  ALTER COLUMN "stage" SET DEFAULT 'idea',
  ALTER COLUMN "status" SET DEFAULT 'in-progress';



CREATE INDEX idx_projects_domain ON "projects"("domain");
CREATE INDEX idx_projects_stage ON "projects"("stage");
CREATE INDEX idx_projects_team_type ON "projects"("team_type");
CREATE INDEX idx_projects_funding_stage ON "projects"("funding_stage");

ALTER TABLE "projects"
  ADD CONSTRAINT chk_stage CHECK (stage IN ('idea', 'in-progress', 'completed')),
  ADD CONSTRAINT chk_team_type CHECK (team_type IN ('individual', 'team', 'large-team')),
  ADD CONSTRAINT chk_funding_stage CHECK (funding_stage IN ('pre-seed', 'seed', 'bootstrapped'));