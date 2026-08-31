-- Up Migration: Add approved column

ALTER TABLE "projects"
  ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT FALSE;

