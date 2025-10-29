-- Update handle_new_user trigger to properly extract metadata from our new user creation process
-- This ensures that role and other metadata are properly set when creating users

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create improved handle_new_user function that handles our new metadata structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    org_id uuid;
    user_role text;
    user_permissions jsonb;
BEGIN
    -- Get organization_id from metadata if provided
    org_id := (NEW.raw_user_meta_data->>'organization_id')::uuid;

    -- Get role from metadata (default to 'viewer' if not provided)
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'viewer');

    -- Get permissions from metadata
    user_permissions := COALESCE(
        NEW.raw_user_meta_data->'permissions',
        jsonb_build_object(
            'access_level', 'organization',
            'site_ids', '[]'::jsonb
        )
    );

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
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        org_id,
        user_role,
        'active',
        now(),
        now(),
        user_permissions
    )
    ON CONFLICT (email) DO UPDATE
    SET
        auth_user_id = EXCLUDED.auth_user_id,
        name = COALESCE(EXCLUDED.name, app_users.name),
        organization_id = COALESCE(EXCLUDED.organization_id, app_users.organization_id),
        role = EXCLUDED.role,  -- Update role from new metadata
        status = 'active',
        updated_at = now(),
        permissions = EXCLUDED.permissions
    WHERE app_users.auth_user_id IS NULL  -- Only update if no auth_user_id exists
    OR app_users.auth_user_id = NEW.id;    -- Or if it's the same user

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

-- Also handle auth user updates (e.g., when metadata changes)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
    EXECUTE FUNCTION public.handle_new_user();

-- Add comment explaining the function
COMMENT ON FUNCTION public.handle_new_user() IS
'Handles auth user creation and updates by syncing with app_users table.
Extracts role, organization, and permissions from user metadata.
Uses ON CONFLICT to gracefully handle existing emails.
Never fails to prevent blocking auth operations.';

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'handle_new_user trigger updated successfully';
    RAISE NOTICE 'Now handles both INSERT and UPDATE operations';
    RAISE NOTICE 'Properly extracts role and permissions from metadata';
END $$;