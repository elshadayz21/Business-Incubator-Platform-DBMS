-- Add entrepreneur_reply, reply_at, mentor_response, and mentor_response_at to mentor_sessions table
ALTER TABLE mentor_sessions 
ADD COLUMN IF NOT EXISTS entrepreneur_reply TEXT,
ADD COLUMN IF NOT EXISTS reply_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS mentor_response TEXT,
ADD COLUMN IF NOT EXISTS mentor_response_at TIMESTAMP;
