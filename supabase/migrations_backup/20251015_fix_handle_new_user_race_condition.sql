-- Fix race condition in handle_new_user trigger
-- The issue: Manual app_users creation can race with the trigger
-- Solution: Add UNIQUE constraint on auth_user_id and improve conflict handling

-- Step 1: Add unique constraint on auth_user_id if it doesn't exist
DO $$
BEGIN
    -- Check if constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'app_users_auth_user_id_key'
    ) THEN
        -- Add unique constraint
        ALTER TABLE public.app_users
        ADD CONSTRAINT app_users_auth_user_id_key UNIQUE (auth_user_id);

        RAISE NOTICE 'Added unique constraint on auth_user_id';
    ELSE
        RAISE NOTICE 'Unique constraint on auth_user_id already exists';
    END IF;
END $$;

-- Step 2: Improve handle_new_user function with better conflict handling
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

    -- Check if user already exists with this auth_user_id
    SELECT id INTO existing_user_id
    FROM public.app_users
    WHERE auth_user_id = NEW.id;

    IF existing_user_id IS NOT NULL THEN
        -- User already exists with this auth_user_id, just update it
        UPDATE public.app_users
        SET
            email = NEW.email,
            name = COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'display_name',
                NEW.raw_user_meta_data->>'name',
                name, -- Keep existing name if no new one provided
                split_part(NEW.email, '@', 1)
            ),
            organization_id = COALESCE(org_id, organization_id),
            role = user_role,
            status = 'active',
            updated_at = now(),
            permissions = user_permissions
        WHERE id = existing_user_id;

        RAISE LOG 'Updated existing app_user % for auth_user %', existing_user_id, NEW.id;
        RETURN NEW;
    END IF;

    -- Try to insert new record with conflict handling
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
        'pending', -- Start as pending, will be activated on first login
        now(),
        now(),
        user_permissions
    )
    ON CONFLICT (email) DO UPDATE
    SET
        auth_user_id = EXCLUDED.auth_user_id,
        name = COALESCE(EXCLUDED.name, app_users.name),
        organization_id = COALESCE(EXCLUDED.organization_id, app_users.organization_id),
        role = EXCLUDED.role,
        status = CASE
            WHEN app_users.auth_user_id IS NULL THEN 'pending'
            ELSE app_users.status
        END,
        updated_at = now(),
        permissions = EXCLUDED.permissions
    WHERE
        -- Only update if no auth_user_id exists OR it's the same user
        app_users.auth_user_id IS NULL
        OR app_users.auth_user_id = NEW.id;

    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle unique constraint violation gracefully
        -- This can happen if manual creation races with trigger
        RAISE LOG 'Unique violation for auth_user %, user already exists', NEW.id;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail auth user creation
        RAISE WARNING 'handle_new_user error for %: % (SQLSTATE: %)',
            NEW.email, SQLERRM, SQLSTATE;
        -- Always return NEW to allow auth user creation to proceed
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update comment
COMMENT ON FUNCTION public.handle_new_user() IS
'Handles auth user creation and updates by syncing with app_users table.
Prevents race conditions with unique constraint on auth_user_id.
Extracts role, organization, and permissions from user metadata.
Uses ON CONFLICT to gracefully handle existing emails.
Never fails to prevent blocking auth operations.';

-- Step 4: Verify the setup
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    -- Check if unique constraint exists
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'app_users_auth_user_id_key'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        RAISE NOTICE '✅ handle_new_user trigger improved successfully';
        RAISE NOTICE '✅ Unique constraint on auth_user_id active';
        RAISE NOTICE '✅ Race condition protection enabled';
    ELSE
        RAISE WARNING '⚠️  Unique constraint creation failed';
    END IF;
END $$;
