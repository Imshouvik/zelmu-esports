-- Remove the trigger since we're now handling user creation directly in code
-- This simplifies the flow and removes any potential issues

-- Remove the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: This won't affect any existing data, just removes the automatic trigger
-- The registration code now handles user creation directly 