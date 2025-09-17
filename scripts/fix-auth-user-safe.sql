-- Safe version that works with user permissions
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new

-- Step 1: Check what's blocking user creation
SELECT
    'Checking for issues in app_users table...' as status;

-- Check for duplicate emails in app_users
SELECT
    email,
    COUNT(*) as count,
    array_agg(id) as duplicate_ids,
    array_agg(auth_user_id) as auth_ids,
    array_agg(name) as names
FROM app_users
WHERE email IN ('diogo.veiga@plmj.pt', 'test@example.com')
   OR email LIKE '%diogo%'
GROUP BY email;

-- Step 2: Check current handle_new_user function
SELECT
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 3: Create a SAFER handle_new_user function that won't block auth creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Safely attempt to create app_users entry
    BEGIN
        -- Check if user already exists before inserting
        IF NOT EXISTS (
            SELECT 1 FROM public.app_users
            WHERE email = NEW.email OR auth_user_id = NEW.id
        ) THEN
            INSERT INTO public.app_users (
                auth_user_id,
                email,
                name,
                organization_id,
                created_at,
                updated_at,
                status,
                role,
                permissions
            ) VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
                (NEW.raw_user_meta_data->>'organization_id')::uuid,
                now(),
                now(),
                'pending',
                COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
                '{"access_level": "organization", "site_ids": []}'::jsonb
            );
        ELSE
            -- Update existing record if it doesn't have auth_user_id
            UPDATE public.app_users
            SET
                auth_user_id = NEW.id,
                updated_at = now()
            WHERE email = NEW.email
            AND auth_user_id IS NULL;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but DON'T fail - this is critical!
            RAISE LOG 'handle_new_user error for %: %', NEW.email, SQLERRM;
    END;

    -- ALWAYS return NEW so auth user creation succeeds
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Clean up any problematic app_users entries
-- Remove any duplicate entries without auth_user_id
DELETE FROM app_users
WHERE email = 'diogo.veiga@plmj.pt'
AND auth_user_id IS NULL
AND id NOT IN (
    SELECT MIN(id)
    FROM app_users
    WHERE email = 'diogo.veiga@plmj.pt'
    GROUP BY email
);

-- Step 5: Check if the function was updated
SELECT
    'Function updated. Now try creating user in Supabase Dashboard' as next_step;

-- Step 6: If dashboard still fails, try this manual creation
-- Uncomment and run this block:
/*
DO $$
DECLARE
    new_user_id uuid;
    org_id uuid;
BEGIN
    -- Get PLMJ organization ID
    SELECT id INTO org_id
    FROM organizations
    WHERE slug = 'plmj-ymlknd'
    LIMIT 1;

    IF org_id IS NULL THEN
        RAISE NOTICE 'Organization not found';
        RETURN;
    END IF;

    new_user_id := gen_random_uuid();

    -- First ensure app_users entry exists
    INSERT INTO app_users (
        id,
        email,
        name,
        role,
        organization_id,
        status,
        created_at,
        updated_at,
        permissions
    ) VALUES (
        gen_random_uuid(),
        'diogo.veiga@plmj.pt',
        'Diogo Veiga',
        'member',
        org_id,
        'pending',
        now(),
        now(),
        '{"access_level": "organization", "site_ids": []}'::jsonb
    )
    ON CONFLICT (email) DO UPDATE
    SET
        name = EXCLUDED.name,
        organization_id = EXCLUDED.organization_id,
        updated_at = now();

    -- Now create auth user
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'diogo.veiga@plmj.pt',
        crypt('Diogo123!@#', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'full_name', 'Diogo Veiga',
            'organization_id', org_id
        ),
        'authenticated',
        'authenticated'
    );

    -- Update app_users with auth_user_id
    UPDATE app_users
    SET
        auth_user_id = new_user_id,
        status = 'active',
        updated_at = now()
    WHERE email = 'diogo.veiga@plmj.pt';

    RAISE NOTICE 'SUCCESS! User created';
    RAISE NOTICE 'Email: diogo.veiga@plmj.pt';
    RAISE NOTICE 'Password: Diogo123!@#';
    RAISE NOTICE 'User ID: %', new_user_id;

EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'User already exists in auth.users';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'SQL State: %', SQLSTATE;
END $$;
*/

-- Step 7: Alternative - Create with different email
-- If diogo.veiga@plmj.pt is somehow blocked, try this:
/*
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'dveiga@plmj.pt',  -- Alternative email
    crypt('Diogo123!@#', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Diogo Veiga"}'::jsonb,
    'authenticated',
    'authenticated'
);
*/