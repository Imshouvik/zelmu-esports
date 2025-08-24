-- SCRIPT TO FIX EXISTING USERS
-- Run this AFTER implementing the safe trigger

-- Step 1: Insert missing users from auth.users to public.users
INSERT INTO public.users (id, email, name, created_at, role, avatar_url, phone, country, state, city, zelmuname)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', '') as name,
  au.created_at,
  'user' as role,
  COALESCE(au.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/adventurer/svg?seed=zelmu') as avatar_url,
  au.raw_user_meta_data->>'phone' as phone,
  au.raw_user_meta_data->>'country' as country,
  au.raw_user_meta_data->>'state' as state,
  au.raw_user_meta_data->>'city' as city,
  au.raw_user_meta_data->>'zelmuname' as zelmuname
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL -- Only insert users who don't exist in public.users
  AND au.email_confirmed_at IS NOT NULL -- Only confirmed users
ON CONFLICT (id) DO NOTHING; -- Safety check - don't overwrite existing users

-- Step 2: Check the results
SELECT 'Migration completed. Users added:' as message, COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NOT NULL 
  AND au.email_confirmed_at IS NOT NULL;

-- Step 3: Show any remaining unmatched users (should be 0 or very few)
SELECT 
  'Remaining unmatched users:' as message,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL; 