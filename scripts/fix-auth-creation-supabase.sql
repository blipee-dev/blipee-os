-- Run this script in Supabase SQL Editor to diagnose and fix auth user creation issues
-- https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new

-- Step 1: Check what triggers exist on auth.users
SELECT
    'Trigger: ' || tgname as info,
    'Function: ' || n.nspname || '.' || p.proname as function_name,
    CASE
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- Step 2: Check if handle_new_user function has errors
-- Look at the function definition
SELECT
    proname as function_name,
    prosrc as function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 3: Temporarily disable the trigger to test
-- IMPORTANT: Only run this if Step 1 shows a handle_new_user trigger
/*
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
*/

-- Step 4: Try creating a test user to see the actual error
-- This should give you a more detailed error message
/*
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    test_user_id := gen_random_uuid();

    -- Try to insert a test user
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
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        'test_' || extract(epoch from now()) || '@example.com',
        crypt('TestPassword123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Test User"}'::jsonb,
        'authenticated',
        'authenticated'
    );

    RAISE NOTICE 'Success! User created with ID: %', test_user_id;

    -- Clean up test user
    DELETE FROM auth.users WHERE id = test_user_id;
    RAISE NOTICE 'Test user cleaned up';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user: % - %', SQLSTATE, SQLERRM;
        RAISE NOTICE 'Detail: %', SQLSTATE;
END $$;
*/

-- Step 5: Check if app_users table has issues
SELECT
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
AND c.table_name = 'app_users'
ORDER BY c.ordinal_position;

-- Step 6: Check constraints on app_users
SELECT
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
JOIN pg_namespace nsp ON nsp.oid = con.connamespace
JOIN pg_class cls ON cls.oid = con.conrelid
WHERE cls.relname = 'app_users'
AND nsp.nspname = 'public';

-- Step 7: Check for duplicate email entries that might be causing issues
SELECT
    email,
    COUNT(*) as count,
    string_agg(id::text, ', ') as user_ids
FROM app_users
GROUP BY email
HAVING COUNT(*) > 1;

-- Step 8: Fix the handle_new_user function to not fail auth creation
-- Run this to create a safer version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    org_id uuid;
BEGIN
    -- Try to get organization_id from metadata
    org_id := (NEW.raw_user_meta_data->>'organization_id')::uuid;

    -- Only try to insert if email doesn't already exist
    INSERT INTO public.app_users (
        auth_user_id,
        email,
        name,
        organization_id,
        created_at,
        updated_at,
        status,
        role
    )
    SELECT
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        org_id,
        now(),
        now(),
        'pending',
        COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
    WHERE NOT EXISTS (
        SELECT 1 FROM public.app_users
        WHERE email = NEW.email
        OR auth_user_id = NEW.id
    );

    -- If user already exists, just update the auth_user_id
    UPDATE public.app_users
    SET
        auth_user_id = NEW.id,
        updated_at = now()
    WHERE email = NEW.email
    AND auth_user_id IS NULL;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'handle_new_user error for %: %', NEW.email, SQLERRM;
        -- Return NEW to allow auth user creation to continue
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Re-enable the trigger if it was disabled
/*
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
*/

-- Step 10: Now try creating diogo.veiga@plmj.pt manually
-- After running the fixes above, try this:
/*
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    new_user_id := gen_random_uuid();

    -- Create the auth user
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
        crypt('Password123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Diogo Veiga"}'::jsonb,
        'authenticated',
        'authenticated'
    );

    -- Update app_users with the auth_user_id
    UPDATE app_users
    SET
        auth_user_id = new_user_id,
        status = 'active',
        updated_at = now()
    WHERE email = 'diogo.veiga@plmj.pt';

    RAISE NOTICE 'Success! User created with ID: %', new_user_id;
    RAISE NOTICE 'User can login with email: diogo.veiga@plmj.pt and password: Password123!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: % - %', SQLSTATE, SQLERRM;
END $$;
*/