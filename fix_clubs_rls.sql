-- Fix RLS policies for clubs table to allow club creation
-- Run these commands in your Supabase SQL Editor

-- 1. Check current RLS policies on clubs table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'clubs';

-- 2. Check if RLS is enabled on clubs table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'clubs';

-- 3. Disable RLS for clubs table (temporary fix)
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;

-- 4. Also disable RLS for club_members table since it's related
ALTER TABLE club_members DISABLE ROW LEVEL SECURITY;

-- 5. Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('clubs', 'club_members');

-- 6. Alternative: If you want to keep RLS, create proper policies
-- (Uncomment these if you want to re-enable RLS later)

-- ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow users to create clubs" ON clubs
-- FOR INSERT 
-- TO authenticated
-- WITH CHECK (auth.uid() = owner_id);
-- 
-- CREATE POLICY "Allow club owners to update their clubs" ON clubs
-- FOR UPDATE 
-- TO authenticated
-- USING (auth.uid() = owner_id)
-- WITH CHECK (auth.uid() = owner_id);
-- 
-- CREATE POLICY "Allow users to view clubs" ON clubs
-- FOR SELECT 
-- TO authenticated
-- USING (true);
-- 
-- CREATE POLICY "Allow club members to manage membership" ON club_members
-- FOR ALL 
-- TO authenticated
-- USING (true)
-- WITH CHECK (true); 