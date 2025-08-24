-- SAFETY CHECK QUERIES - Run these BEFORE implementing the trigger

-- 1. Check how many users exist in auth.users vs public.users
SELECT 
  'auth.users' as table_name, 
  COUNT(*) as user_count 
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name, 
  COUNT(*) as user_count 
FROM public.users;

-- 2. Find users who exist in auth.users but NOT in public.users
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'full_name' as name_from_metadata,
  au.raw_user_meta_data->>'provider' as auth_provider
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- 3. Check existing triggers on auth.users table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- 4. Check for any duplicate emails that might cause issues
SELECT 
  email, 
  COUNT(*) as count
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 5. Sample of existing user metadata to understand structure
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
LIMIT 5; 