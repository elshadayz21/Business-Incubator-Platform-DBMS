-- Migration: Add profile_image column to users table
-- Description: Adds a profile_image column to store the user's profile image path

ALTER TABLE "users" ADD COLUMN "profile_image" varchar(255);
