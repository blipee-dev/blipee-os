-- Test the JWT claims hook function
-- Run this in Supabase SQL Editor to see if there's an error

-- 1. Check if function exists
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'custom_access_token_hook';

-- 2. Check function permissions
SELECT
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'custom_access_token_hook';

-- 3. Test the function with a sample event
-- Replace 'YOUR_USER_ID' with an actual auth user ID from your database
SELECT public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', 'YOUR_USER_ID',  -- Replace with actual user UUID
    'claims', '{}'::jsonb
  )
);

-- 4. Check if organization_members table has the required structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organization_members'
ORDER BY ordinal_position;

-- 5. Check if app_users table exists and has auth_user_id column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND column_name = 'auth_user_id';
