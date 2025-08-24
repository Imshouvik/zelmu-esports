-- DEBUG QUERIES - Run these to understand what's happening

-- 1. Check if trigger exists and is active
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

-- 2. Check recent auth.users entries and their metadata
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data,
  raw_user_meta_data->>'phone' as metadata_phone,
  raw_user_meta_data->>'country' as metadata_country,
  raw_user_meta_data->>'state' as metadata_state,
  raw_user_meta_data->>'city' as metadata_city,
  raw_user_meta_data->>'zelmuname' as metadata_zelmuname
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check corresponding entries in public.users
SELECT 
  pu.id,
  pu.email,
  pu.name,
  pu.phone,
  pu.country,
  pu.state,
  pu.city,
  pu.zelmuname,
  pu.created_at
FROM public.users pu
JOIN auth.users au ON pu.id = au.id
ORDER BY pu.created_at DESC 
LIMIT 5;

-- 4. Find any mismatches between auth and public users
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'phone' as auth_phone,
  pu.phone as public_phone,
  au.raw_user_meta_data->>'country' as auth_country,
  pu.country as public_country,
  CASE 
    WHEN au.raw_user_meta_data->>'phone' IS NOT NULL AND pu.phone IS NULL THEN 'Missing phone in public'
    WHEN au.raw_user_meta_data->>'country' IS NOT NULL AND pu.country IS NULL THEN 'Missing country in public'
    ELSE 'OK'
  END as status
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.created_at > NOW() - INTERVAL '1 day'
ORDER BY au.created_at DESC; 