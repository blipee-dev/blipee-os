-- Final fix for auth trigger with proper column handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create user profile with all available fields
  INSERT INTO user_profiles (
    id, 
    email, 
    full_name,
    metadata,
    preferred_language,
    timezone,
    onboarding_completed,
    ai_personality_settings,
    preferences,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    false,
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Test the function by checking it was created
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user'
LIMIT 1;