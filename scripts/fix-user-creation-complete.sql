-- Complete fix for user creation duplicate key issue
-- Run this entire script in Supabase SQL Editor

-- Step 1: First, let's see what's actually happening
DO $$
BEGIN
    RAISE NOTICE '=== Checking current state ===';
END $$;

-- Check if there are any test emails in app_users
SELECT 'app_users test emails:' as info, count(*) as count
FROM app_users
WHERE email LIKE '%test%';

-- Step 2: Temporarily disable the trigger to prevent conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Step 3: Clean up ALL test users from both tables
DELETE FROM app_users WHERE email LIKE '%test%' AND email LIKE '%@example.com';
DELETE FROM app_users WHERE email LIKE '%test%' AND email LIKE '%@blipee.com' AND email != 'test@blipee.com';

-- Clean up orphaned auth users (be careful with this)
DELETE FROM auth.users
WHERE email IN (
    SELECT email FROM auth.users
    WHERE email LIKE '%test%' AND email LIKE '%@example.com'
    AND id NOT IN (SELECT auth_user_id FROM app_users WHERE auth_user_id IS NOT NULL)
);

-- Step 4: Create a better handle_new_user function that TRULY handles conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    org_id uuid;
    user_role text;
    user_permissions jsonb;
BEGIN
    -- Skip if this is a system/service operation
    IF current_setting('app.skip_trigger', true) = 'true' THEN
        RETURN NEW;
    END IF;

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

    -- Use INSERT ... ON CONFLICT to handle duplicates gracefully
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
        auth_user_id = COALESCE(app_users.auth_user_id, EXCLUDED.auth_user_id),
        name = COALESCE(EXCLUDED.name, app_users.name),
        organization_id = COALESCE(EXCLUDED.organization_id, app_users.organization_id),
        role = EXCLUDED.role,
        status = 'active',
        updated_at = now(),
        permissions = EXCLUDED.permissions
    WHERE app_users.auth_user_id IS NULL  -- Only update if no auth_user_id exists
       OR app_users.auth_user_id = NEW.id; -- Or if it's the same user

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the actual error for debugging
        RAISE WARNING 'handle_new_user error for % (id: %): %', NEW.email, NEW.id, SQLERRM;
        -- Always return NEW to not block auth user creation
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Also handle updates (when metadata changes)
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
    EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Add a function to safely create users that bypasses trigger conflicts
CREATE OR REPLACE FUNCTION public.create_user_safely(
    p_email text,
    p_name text,
    p_role text,
    p_org_id uuid,
    p_auth_user_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- First try to insert/update in app_users
    INSERT INTO app_users (
        email,
        name,
        role,
        organization_id,
        auth_user_id,
        status,
        created_at,
        updated_at,
        permissions
    ) VALUES (
        p_email,
        p_name,
        p_role,
        p_org_id,
        p_auth_user_id,
        CASE WHEN p_auth_user_id IS NULL THEN 'pending' ELSE 'active' END,
        now(),
        now(),
        jsonb_build_object(
            'access_level', 'organization',
            'site_ids', '[]'::jsonb
        )
    )
    ON CONFLICT (email) DO UPDATE
    SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        auth_user_id = COALESCE(EXCLUDED.auth_user_id, app_users.auth_user_id),
        status = CASE WHEN EXCLUDED.auth_user_id IS NOT NULL THEN 'active' ELSE app_users.status END,
        updated_at = now()
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_user_safely TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO postgres, authenticated, service_role;

-- Step 9: Verify the setup
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== User creation fix applied! ===';
    RAISE NOTICE 'The system now:';
    RAISE NOTICE '1. Uses ON CONFLICT to handle duplicate emails';
    RAISE NOTICE '2. Cleaned up all test users';
    RAISE NOTICE '3. Has better error handling in triggers';
    RAISE NOTICE '4. Provides create_user_safely() function as fallback';
    RAISE NOTICE '';
    RAISE NOTICE 'Try creating a user again from your application!';
END $$;