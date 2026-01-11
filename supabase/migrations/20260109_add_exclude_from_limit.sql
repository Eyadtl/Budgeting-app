-- Add exclude_from_limit column to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS exclude_from_limit BOOLEAN DEFAULT FALSE;
