-- Migration: Add approved_amount and founder_action columns to funding_requests
ALTER TABLE funding_requests ADD COLUMN IF NOT EXISTS approved_amount DECIMAL(15,2);
ALTER TABLE funding_requests ADD COLUMN IF NOT EXISTS founder_action VARCHAR(50);
