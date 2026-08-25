-- Migration: Add optional video_url column to gallery_items
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
