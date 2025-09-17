-- Fix handle_new_user trigger to properly handle existing app_users entries
-- This prevents auth user creation from failing when email already exists in app_users

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create improved handle_new_user function that handles conflicts properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    org_id uuid;
BEGIN
    -- Get organization_id from metadata if provided
    org_id := (NEW.raw_user_meta_data->>'organization_id')::uuid;

    -- Use INSERT ... ON CONFLICT to handle existing emails gracefully
    INSERT INTO public.app_users (
        auth_user_id,
        email,
        name,
        organization_id,
        role,
        status,
        created_at,
        updated_at,
        permissions
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        org_id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
        'active',
        now(),
        now(),
        COALESCE(
            NEW.raw_user_meta_data->'permissions',
            '{"access_level": "organization", "site_ids": []}'::jsonb
        )
    )
    ON CONFLICT (email) DO UPDATE
    SET
        auth_user_id = EXCLUDED.auth_user_id,
        name = COALESCE(app_users.name, EXCLUDED.name),
        organization_id = COALESCE(app_users.organization_id, EXCLUDED.organization_id),
        status = 'active',
        updated_at = now()
    WHERE app_users.auth_user_id IS NULL; -- Only update if no auth_user_id exists

    -- If conflict and auth_user_id already exists, log it but don't fail
    IF NOT FOUND THEN
        RAISE LOG 'User % already has an auth_user_id, skipping update', NEW.email;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail auth user creation
        RAISE WARNING 'handle_new_user error for %: %', NEW.email, SQLERRM;
        -- Always return NEW to allow auth user creation to proceed
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Add comment explaining the function
COMMENT ON FUNCTION public.handle_new_user() IS
'Handles new auth user creation by creating or updating corresponding app_users entry.
Uses ON CONFLICT to gracefully handle existing emails. Never fails to prevent blocking auth user creation.';

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'handle_new_user trigger has been updated to handle conflicts properly';
    RAISE NOTICE 'Auth user creation will no longer fail due to existing app_users entries';
END $$;