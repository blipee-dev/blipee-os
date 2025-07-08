-- Fix for Supabase auth.signUp 500 error
-- The issue is that the handle_new_user() trigger is trying to update 
-- user_profiles.metadata column which doesn't exist

-- 1. First, add the missing metadata column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Add missing columns that might be referenced
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- 3. Re-add the foreign key constraint to auth.users (was dropped in migration 011)
-- This ensures referential integrity
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_id_fkey'
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Update the handle_new_user() function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create user profile if it doesn't exist
  INSERT INTO user_profiles (
    id, 
    email, 
    full_name,
    metadata,
    preferred_language,
    timezone,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    metadata = user_profiles.metadata || EXCLUDED.metadata,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 5. Recreate the trigger (drop and create to ensure it's using the updated function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 6. Refresh the schema cache
NOTIFY pgrst, 'reload schema';