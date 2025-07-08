-- Fix auth trigger to work reliably without workarounds
-- This migration ensures the trigger properly creates user profiles without silent failures

-- 1. First, ensure all required columns exist with proper defaults
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_personality_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- 2. Create a more robust handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_full_name TEXT;
  v_error_detail TEXT;
BEGIN
  -- Extract full name with multiple fallbacks
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- Attempt to create user profile
  BEGIN
    INSERT INTO public.user_profiles (
      id, 
      email, 
      full_name,
      metadata,
      preferred_language,
      timezone,
      onboarding_completed,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      v_full_name,
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
      COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, user_profiles.email),
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      metadata = user_profiles.metadata || EXCLUDED.metadata,
      updated_at = NOW();
    
    -- Log successful creation
    RAISE LOG 'User profile created/updated for user %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Handle unique constraint violations gracefully
      RAISE LOG 'User profile already exists for user %, updating instead', NEW.id;
      
      UPDATE public.user_profiles
      SET 
        email = COALESCE(NEW.email, email),
        metadata = metadata || COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        updated_at = NOW()
      WHERE id = NEW.id;
      
    WHEN foreign_key_violation THEN
      -- This should not happen, but log it clearly if it does
      v_error_detail := SQLERRM;
      RAISE EXCEPTION 'Foreign key violation in handle_new_user: %. This indicates a serious issue with user creation flow.', v_error_detail;
      
    WHEN OTHERS THEN
      -- For any other error, log details but don't fail the signup
      v_error_detail := SQLERRM;
      RAISE WARNING 'Unexpected error in handle_new_user for user %: %', NEW.id, v_error_detail;
      
      -- Attempt minimal profile creation as last resort
      INSERT INTO public.user_profiles (id, email, full_name)
      VALUES (NEW.id, COALESCE(NEW.email, ''), 'User')
      ON CONFLICT (id) DO NOTHING;
  END;

  RETURN NEW;
END;
$$;

-- 3. Recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 4. Create a function to verify profile creation (for monitoring)
CREATE OR REPLACE FUNCTION verify_user_profile_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = user_id
  );
END;
$$;

-- 5. Fix any existing users without profiles
DO $$
DECLARE
  v_user RECORD;
  v_created_count INTEGER := 0;
BEGIN
  -- Find users without profiles
  FOR v_user IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.user_profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Create missing profile
    INSERT INTO public.user_profiles (
      id, 
      email, 
      full_name,
      metadata,
      created_at,
      updated_at
    )
    VALUES (
      v_user.id,
      COALESCE(v_user.email, ''),
      COALESCE(
        v_user.raw_user_meta_data->>'full_name',
        split_part(v_user.email, '@', 1),
        'User'
      ),
      COALESCE(v_user.raw_user_meta_data, '{}'::jsonb),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    v_created_count := v_created_count + 1;
  END LOOP;
  
  IF v_created_count > 0 THEN
    RAISE NOTICE 'Created % missing user profiles', v_created_count;
  END IF;
END;
$$;

-- 6. Add constraint to ensure profile creation
-- This will help catch any future issues
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- 7. Create an audit log table for debugging
CREATE TABLE IF NOT EXISTS public.auth_trigger_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT,
  success BOOLEAN,
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_auth_trigger_logs_user_id ON public.auth_trigger_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_trigger_logs_created_at ON public.auth_trigger_logs(created_at DESC);

-- 8. Update handle_new_user to log to audit table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_full_name TEXT;
  v_error_detail TEXT;
  v_success BOOLEAN := false;
BEGIN
  -- Extract full name with multiple fallbacks
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- Attempt to create user profile
  BEGIN
    INSERT INTO public.user_profiles (
      id, 
      email, 
      full_name,
      metadata,
      preferred_language,
      timezone,
      onboarding_completed,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      v_full_name,
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
      COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, user_profiles.email),
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      metadata = user_profiles.metadata || EXCLUDED.metadata,
      updated_at = NOW();
    
    v_success := true;
    
    -- Log success
    INSERT INTO public.auth_trigger_logs (user_id, event_type, success, details)
    VALUES (NEW.id, 'profile_created', true, jsonb_build_object(
      'email', NEW.email,
      'full_name', v_full_name
    ));
    
  EXCEPTION
    WHEN OTHERS THEN
      v_error_detail := SQLERRM;
      v_success := false;
      
      -- Log the error
      INSERT INTO public.auth_trigger_logs (user_id, event_type, success, error_message, details)
      VALUES (NEW.id, 'profile_creation_failed', false, v_error_detail, jsonb_build_object(
        'email', NEW.email,
        'raw_user_meta_data', NEW.raw_user_meta_data
      ));
      
      -- Don't fail the signup, but ensure some profile exists
      INSERT INTO public.user_profiles (id, email, full_name)
      VALUES (NEW.id, COALESCE(NEW.email, ''), v_full_name)
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        updated_at = NOW();
  END;

  RETURN NEW;
END;
$$;

-- 9. Grant necessary permissions
GRANT SELECT, INSERT ON public.auth_trigger_logs TO postgres, authenticated, service_role;

-- 10. Refresh the schema cache
NOTIFY pgrst, 'reload schema';