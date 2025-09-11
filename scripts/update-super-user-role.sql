-- Update super user to have account_owner role
-- Run this in Supabase SQL Editor

-- First, check which user is the super user (4da3b401-990a-4011-9576-273986f43360)
SELECT 
  id,
  auth_user_id,
  email,
  name,
  role,
  status
FROM app_users 
WHERE auth_user_id = '4da3b401-990a-4011-9576-273986f43360';

-- Update the super user's role to account_owner
UPDATE app_users 
SET 
  role = 'account_owner',
  updated_at = NOW()
WHERE auth_user_id = '4da3b401-990a-4011-9576-273986f43360';

-- Verify the update
SELECT 
  id,
  auth_user_id,
  email,
  name,
  role,
  status,
  organization_id,
  created_at,
  updated_at
FROM app_users 
WHERE auth_user_id = '4da3b401-990a-4011-9576-273986f43360';

-- Show all users with their roles
SELECT 
  id,
  auth_user_id,
  email,
  name,
  role,
  status
FROM app_users
ORDER BY 
  CASE 
    WHEN role = 'account_owner' THEN 1
    WHEN role = 'admin' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- Count summary after update
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'account_owner' THEN 1 END) as owners,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
FROM app_users;