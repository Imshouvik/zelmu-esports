-- Fix RLS policies for all tables to allow proper functionality
-- Run these commands in your Supabase SQL Editor

-- 1. Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clubs', 'club_members', 'tournaments', 'teams', 'registrations');

-- 2. Disable RLS for all tables that might cause issues
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE club_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE club_tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE club_invites DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clubs', 'club_members', 'tournaments', 'teams', 'registrations', 'club_tournaments', 'matches', 'club_invites');

-- 4. Check current policies (should be empty after disabling RLS)
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clubs', 'club_members', 'tournaments', 'teams', 'registrations'); 