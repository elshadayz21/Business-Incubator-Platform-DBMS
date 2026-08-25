-- ============================================
-- ADD EXPERTISE, COMPANY, BIO AND STATUS TO USERS TABLE
-- Created: 2026-02-17
-- Description: Add missing columns to users table for mentors profile
-- ============================================

ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "expertise" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "company" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'active';
