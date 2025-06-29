-- Add unique constraint to prevent users from creating multiple clubs
-- Run this in your Supabase SQL Editor

-- 1. Check current constraints on clubs table
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'clubs'::regclass;

-- 2. Add unique constraint on owner_id to prevent multiple clubs per user
ALTER TABLE clubs ADD CONSTRAINT clubs_owner_id_unique UNIQUE (owner_id);

-- 3. Verify the constraint was added
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'clubs'::regclass 
AND conname = 'clubs_owner_id_unique';

-- 4. Test the constraint (this should fail if user already has a club)
-- INSERT INTO clubs (name, owner_id) VALUES ('Test Club', 'user-uuid-here'); 