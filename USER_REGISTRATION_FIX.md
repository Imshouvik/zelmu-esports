# User Registration Fix Guide

## Problem
Users are being created in Supabase Auth but not in the custom `users` table, causing "access denied" errors after email confirmation.

## Root Cause
The registration flow was trying to manually insert users into the `users` table immediately after Supabase Auth creation, but this approach has timing issues and can fail.

## Solution

### 1. Database Trigger (Primary Solution)
Run the SQL in `create_user_trigger.sql` in your Supabase SQL editor:

```sql
-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.created_at,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/adventurer/svg?seed=zelmu')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.users_id_seq TO anon, authenticated;
```

### 2. Code Changes Made

#### Registration Page (`src/app/register/page.tsx`)
- Removed manual user table insertion
- Changed to update existing user record (created by trigger) with additional fields
- Better error handling that doesn't fail registration

#### OAuth Callback (`src/app/oauth-callback/page.tsx`)
- Added fallback user creation for OAuth users
- Better error handling

#### AuthSyncProvider (`src/app/AuthSyncProvider.tsx`)
- Added automatic user creation if user doesn't exist in users table
- Ensures users are always created when they authenticate

### 3. How It Works Now

1. **User registers** → Supabase Auth creates user
2. **Database trigger fires** → Automatically creates user in `users` table
3. **Registration code updates** → Adds additional fields (phone, country, etc.)
4. **User confirms email** → Can now access the app
5. **AuthSyncProvider** → Ensures user exists in users table on every auth check

### 4. Benefits

- ✅ **Automatic**: No manual intervention needed
- ✅ **Reliable**: Database trigger ensures consistency
- ✅ **Fallback**: Multiple layers of user creation
- ✅ **OAuth Support**: Works with social login
- ✅ **Error Resilient**: Registration doesn't fail if user table insert fails

### 5. Testing

1. Register a new user with email
2. Check Supabase Auth dashboard - user should be created
3. Check your `users` table - user should be created automatically
4. Confirm email - user should be able to login
5. Test OAuth login - should also create user in table

### 6. Troubleshooting

If users still aren't being created:

1. **Check trigger exists**: Run `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`
2. **Check permissions**: Ensure the trigger function has proper permissions
3. **Check logs**: Look for any database errors in Supabase logs
4. **Manual creation**: The AuthSyncProvider will create missing users automatically

### 7. Additional Notes

- The trigger creates basic user records
- Additional fields (phone, country, etc.) are updated by the registration code
- OAuth users will be redirected to complete profile if they don't have a phone number
- All existing functionality remains the same 