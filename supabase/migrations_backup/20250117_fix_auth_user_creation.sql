-- Fix auth user creation issues
-- This migration checks for and fixes common issues preventing auth user creation

-- 1. Check if there are any problematic triggers on auth.users
DO $$
BEGIN
    -- Log what we're checking
    RAISE NOTICE 'Checking for auth.users triggers...';

    -- Check if handle_new_user trigger exists and might be causing issues
    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        RAISE NOTICE 'Found on_auth_user_created trigger';
    END IF;
END $$;

-- 2. Ensure public.handle_new_user function doesn't have errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Simple version that just creates a basic profile if needed
    -- Don't fail if app_users already exists
    INSERT INTO public.app_users (
        auth_user_id,
        email,
        name,
        created_at,
        updated_at,
        status
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        now(),
        now(),
        'pending'
    )
    ON CONFLICT (auth_user_id) DO NOTHING
    ON CONFLICT (email) DO UPDATE
        SET auth_user_id = new.id,
            updated_at = now();

    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger with proper error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;

-- 5. Ensure app_users table has proper constraints
ALTER TABLE app_users
    DROP CONSTRAINT IF EXISTS app_users_email_key;

ALTER TABLE app_users
    ADD CONSTRAINT app_users_email_key UNIQUE (email);

ALTER TABLE app_users
    DROP CONSTRAINT IF EXISTS app_users_auth_user_id_key;

ALTER TABLE app_users
    ADD CONSTRAINT app_users_auth_user_id_key UNIQUE (auth_user_id);

-- 6. Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'app_users'
                   AND column_name = 'organization_id') THEN
        ALTER TABLE app_users ADD COLUMN organization_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'app_users'
                   AND column_name = 'permissions') THEN
        ALTER TABLE app_users ADD COLUMN permissions JSONB DEFAULT '{"access_level": "organization", "site_ids": []}';
    END IF;
END $$;

-- 7. Clean up any orphaned or problematic records
-- Delete app_users records without auth_user_id that might be blocking
DELETE FROM app_users
WHERE auth_user_id IS NULL
AND email IN (
    SELECT email FROM app_users
    GROUP BY email
    HAVING COUNT(*) > 1
);

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Auth user creation fixes applied successfully';
END $$;