-- Check the current structure of club_invites table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'club_invites' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if realtime is enabled
SELECT * FROM pg_publication_tables WHERE tablename = 'club_invites';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'club_invites'; 