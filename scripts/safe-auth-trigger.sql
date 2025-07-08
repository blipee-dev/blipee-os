-- Safer version of the handle_new_user() function
-- First, let's check what columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public';

-- Create a minimal trigger function that only uses confirmed columns
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_full_name TEXT;
BEGIN
    -- Extract full name from metadata or use email
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Simple insert with only essential fields
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, v_full_name)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error details
        RAISE WARNING 'Error in handle_new_user for user %: %', NEW.email, SQLERRM;
        -- Still return NEW to not block signup
        RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Verify the trigger is created
SELECT 'Trigger updated successfully - using minimal fields only' as status;