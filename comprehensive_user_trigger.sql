-- COMPREHENSIVE USER TRIGGER - Handles all fields and profile completion logic

-- Step 1: Create a function to handle new user creation with all fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert basic user data into public.users
  -- For registration: metadata will have all fields (phone, country, state, city, zelmuname)
  -- For OAuth: metadata will only have basic info (name, avatar_url)
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    created_at, 
    role, 
    avatar_url,
    phone,
    country,
    state,
    city,
    zelmuname
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.created_at,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/adventurer/svg?seed=zelmu'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'zelmuname'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicates - if user exists, do nothing
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user in public.users: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger (only for NEW users, won't affect existing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated; 