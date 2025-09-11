-- Fix app_users table and add super user
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'app_users' 
ORDER BY ordinal_position;

-- Step 2: Check existing constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'app_users';

-- Step 3: Add unique constraint on auth_user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'app_users' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'app_users_auth_user_id_key'
    ) THEN
        ALTER TABLE app_users ADD CONSTRAINT app_users_auth_user_id_key UNIQUE (auth_user_id);
    END IF;
END $$;

-- Step 4: Check if user already exists in app_users
SELECT * FROM app_users WHERE auth_user_id = '4da3b401-990a-4011-9576-273986f43360';

-- Step 5: Delete existing entry if needed (to start fresh)
DELETE FROM app_users WHERE auth_user_id = '4da3b401-990a-4011-9576-273986f43360';

-- Step 6: Insert the super user
INSERT INTO public.app_users (
  auth_user_id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at
)
SELECT 
  '4da3b401-990a-4011-9576-273986f43360',
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1),
    'Super Admin'
  ),
  'account_owner',
  'active',
  NOW(),
  NOW()
FROM auth.users 
WHERE id = '4da3b401-990a-4011-9576-273986f43360';

-- Step 7: Verify the user was added
SELECT 
  id,
  auth_user_id,
  email,
  name,
  role,
  status,
  organization_id,
  created_at
FROM app_users 
WHERE auth_user_id = '4da3b401-990a-4011-9576-273986f43360';

-- Step 8: Add other users from auth.users (without ON CONFLICT)
INSERT INTO public.app_users (
  auth_user_id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'User'
  ),
  'user',
  'active',
  COALESCE(au.created_at, NOW()),
  COALESCE(au.updated_at, NOW())
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = au.id
);

-- Step 9: Show all users in app_users
SELECT 
  id,
  auth_user_id,
  email,
  name,
  role,
  status,
  organization_id,
  created_at
FROM app_users
ORDER BY created_at DESC;

-- Step 10: Count summary
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'account_owner' THEN 1 END) as owners,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
FROM app_users;