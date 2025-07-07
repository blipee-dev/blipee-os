-- Check Table Columns Script
-- Run this to see the actual structure of your tables

-- 1. Check user_profiles columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Check organizations columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'organizations'
ORDER BY ordinal_position;

-- 3. Check organization_members columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'organization_members'
ORDER BY ordinal_position;

-- 4. Check if user exists
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_app_meta_data->>'role' as role
FROM auth.users
WHERE email = 'demo@blipee.com';

-- 5. Check existing profiles
SELECT 
    id,
    email,
    full_name,
    preferences->>'is_admin' as is_admin
FROM public.user_profiles
WHERE email = 'demo@blipee.com';