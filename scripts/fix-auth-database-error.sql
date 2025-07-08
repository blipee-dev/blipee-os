-- Fix Database Error for User Creation
-- Run this in Supabase SQL Editor

-- 1. Check if auth schema and tables exist
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) as auth_users_exists;

-- 2. Check for any existing user with this email
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'demo@blipee.com';

-- 3. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 4. Ensure user_profiles table can accept new users
ALTER TABLE public.user_profiles 
ALTER COLUMN email DROP NOT NULL;

-- 5. Check and fix RLS policies
-- Temporarily disable RLS to test
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings DISABLE ROW LEVEL SECURITY;

-- 6. Create a simple test to verify auth is working
DO $$
BEGIN
    -- Test if we can query auth.users
    PERFORM COUNT(*) FROM auth.users;
    RAISE NOTICE 'Auth schema is accessible';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Auth schema error: %', SQLERRM;
END $$;

-- 7. Alternative: Create user directly via SQL (Development only!)
-- WARNING: Only use this for local development
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Generate new UUID
    new_user_id := gen_random_uuid();
    
    -- Try direct insert (this bypasses Supabase Auth)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'demo@blipee.com',
        crypt('demo123456', gen_salt('bf')),
        now(),
        null,
        null,
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) ON CONFLICT (email) DO NOTHING;
    
    -- Also create the profile
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'demo@blipee.com',
        'Demo User',
        now(),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'User created with ID: %', new_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'This might mean the user already exists or there is a deeper issue';
END $$;

-- 8. Check auth.users constraints
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'auth' 
AND tc.table_name = 'users'
ORDER BY tc.constraint_type;

-- 9. Re-enable RLS (Important for production!)
-- Uncomment these when ready to re-enable security
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;