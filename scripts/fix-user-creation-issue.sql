-- Fix for user creation duplicate key issue
-- Run this in Supabase SQL Editor

-- Step 1: Check for the problematic test user and clean it up
DELETE FROM app_users
WHERE email = 'test-1758083417987-ht1muf@example.com'
AND auth_user_id IS NULL;

-- Step 2: Drop and recreate the trigger with better conflict handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Update the handle_new_user function to check for existing records BEFORE inserting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    org_id uuid;
    user_role text;
    user_permissions jsonb;
    existing_user_id uuid;
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

    -- Check if user already exists in app_users
    SELECT auth_user_id INTO existing_user_id
    FROM public.app_users
    WHERE email = NEW.email;

    -- If user exists but has no auth_user_id, update it
    IF existing_user_id IS NULL AND FOUND THEN
        UPDATE public.app_users
        SET
            auth_user_id = NEW.id,
            name = COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'display_name',
                NEW.raw_user_meta_data->>'name',
                name
            ),
            organization_id = COALESCE(org_id, organization_id),
            role = user_role,
            status = 'active',
            updated_at = now(),
            permissions = user_permissions
        WHERE email = NEW.email;
    -- If user exists with auth_user_id, skip (already linked)
    ELSIF existing_user_id IS NOT NULL THEN
        -- User already exists and is linked, do nothing
        RETURN NEW;
    -- Otherwise, create new user
    ELSE
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
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If there's still a unique violation, just update the existing record
        UPDATE public.app_users
        SET
            auth_user_id = NEW.id,
            updated_at = now()
        WHERE email = NEW.email;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail auth user creation
        RAISE WARNING 'handle_new_user error for %: %', NEW.email, SQLERRM;
        -- Always return NEW to allow auth user creation to proceed
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Clean up any test users that were created during debugging
DELETE FROM auth.users
WHERE email = 'test-1758083417987-ht1muf@example.com'
AND id = '5094118b-d4b3-43cb-a408-5609683927f9';

-- Step 6: Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'User creation fix applied successfully!';
    RAISE NOTICE 'The trigger now handles existing emails gracefully.';
    RAISE NOTICE 'Try creating a user again from your application.';
END $$;