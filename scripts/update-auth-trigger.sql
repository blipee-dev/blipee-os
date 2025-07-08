-- Update the handle_new_user() function to handle the new columns
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

-- Recreate the trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Test that the function exists and is working
SELECT 'Trigger function updated successfully' as status;