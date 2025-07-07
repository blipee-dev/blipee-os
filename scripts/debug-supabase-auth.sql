-- Debug Script for Supabase Auth Issues
-- Run this in your Supabase SQL Editor to check the setup

-- 1. Check if auth schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- 2. Check if auth.users table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
AND table_name = 'users';

-- 3. Check for any existing users
SELECT COUNT(*) as user_count 
FROM auth.users;

-- 4. Check if email already exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'demo@blipee.com';

-- 5. Check auth configuration
SELECT * 
FROM auth.schema_migrations 
ORDER BY version DESC 
LIMIT 5;

-- 6. Alternative: Create user directly (if auth is properly set up)
-- This might work where the dashboard fails
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Generate a new UUID
    new_user_id := gen_random_uuid();
    
    -- Try to insert directly (this might fail due to RLS)
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
        is_super_admin,
        role
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'demo@blipee.com',
        crypt('demo123456', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Demo Admin"}',
        false,
        'authenticated'
    );
    
    RAISE NOTICE 'User created successfully with ID: %', new_user_id;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'User already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user: %', SQLERRM;
END $$;

-- 7. If user exists, just get the ID and set up profile
DO $$
DECLARE
    existing_user_id uuid;
BEGIN
    -- Find existing user
    SELECT id INTO existing_user_id
    FROM auth.users 
    WHERE email = 'demo@blipee.com'
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found existing user with ID: %', existing_user_id;
        
        -- Make sure they're confirmed
        UPDATE auth.users 
        SET email_confirmed_at = now()
        WHERE id = existing_user_id;
        
        -- Create/update profile
        INSERT INTO public.user_profiles (
            id,
            email,
            full_name,
            metadata
        ) VALUES (
            existing_user_id,
            'demo@blipee.com',
            'Demo Admin',
            '{"is_admin": true}'::jsonb
        ) ON CONFLICT (id) DO UPDATE SET
            metadata = '{"is_admin": true}'::jsonb;
            
        RAISE NOTICE 'Profile updated for user';
    END IF;
END $$;