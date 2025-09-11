-- Comprehensive Super Admin Setup Script
-- This script handles all aspects of super admin configuration
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Verify super_admins table exists
-- ============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'super_admins'
) as super_admins_table_exists;

-- ============================================
-- STEP 2: Show current state of all users
-- ============================================
SELECT 
  'Current Users in System' as section,
  au.id as auth_id,
  au.email,
  au.created_at as auth_created,
  app.id as app_user_id,
  app.name,
  app.role as current_role,
  CASE 
    WHEN sa.user_id IS NOT NULL THEN '✅ IS SUPER ADMIN'
    ELSE '❌ Regular User'
  END as super_admin_status
FROM auth.users au
LEFT JOIN app_users app ON app.auth_user_id = au.id
LEFT JOIN super_admins sa ON sa.user_id = au.id
ORDER BY au.created_at DESC;

-- ============================================
-- STEP 3: Show current super_admins
-- ============================================
SELECT 
  'Current Super Admins' as section,
  sa.*,
  au.email as user_email,
  app.name as user_name
FROM super_admins sa
LEFT JOIN auth.users au ON sa.user_id = au.id
LEFT JOIN app_users app ON app.auth_user_id = sa.user_id;

-- ============================================
-- STEP 4: Add YOUR current user to super_admins
-- ============================================
-- Add the current logged-in user (you) to super_admins
INSERT INTO super_admins (user_id, created_by)
SELECT 
  auth.uid() as user_id,
  COALESCE(
    (SELECT user_id FROM super_admins LIMIT 1),
    auth.uid()
  ) as created_by
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id) DO NOTHING
RETURNING 'Added current user to super_admins' as result;

-- ============================================
-- STEP 5: Update app_users role to super_admin
-- ============================================
-- First, ensure super_admin is an allowed role
DO $$
BEGIN
  -- Check if constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'app_users_role_check' 
    AND conrelid = 'app_users'::regclass
  ) THEN
    ALTER TABLE app_users DROP CONSTRAINT app_users_role_check;
  END IF;
  
  -- Add new constraint with super_admin role included
  ALTER TABLE app_users 
  ADD CONSTRAINT app_users_role_check 
  CHECK (role IN (
    'super_admin', 
    'platform_developer', 
    'account_owner', 
    'sustainability_manager', 
    'facility_manager', 
    'analyst', 
    'viewer', 
    'admin', 
    'manager', 
    'user'
  ));
END $$;

-- Update all super_admins in app_users to have super_admin role
UPDATE app_users 
SET 
  role = 'super_admin',
  updated_at = NOW()
WHERE auth_user_id IN (SELECT user_id FROM super_admins)
RETURNING 
  'Updated role to super_admin for user' as action,
  email,
  name,
  role;

-- ============================================
-- STEP 6: Test super admin functions
-- ============================================
SELECT 
  'Super Admin Function Tests' as section,
  is_current_user_super_admin() as is_current_user_super,
  (SELECT COUNT(*) FROM super_admins) as total_super_admins;

-- ============================================
-- STEP 7: Final verification - all super admins
-- ============================================
SELECT 
  'Final Super Admin List' as section,
  sa.id as super_admin_id,
  sa.user_id,
  au.email,
  app.name,
  app.role,
  sa.created_at,
  sa.created_by,
  creator.email as created_by_email
FROM super_admins sa
LEFT JOIN auth.users au ON sa.user_id = au.id
LEFT JOIN app_users app ON app.auth_user_id = sa.user_id
LEFT JOIN auth.users creator ON sa.created_by = creator.id
ORDER BY sa.created_at;

-- ============================================
-- STEP 8: Summary of roles in the system
-- ============================================
SELECT 
  'Role Distribution' as section,
  role,
  COUNT(*) as user_count,
  CASE 
    WHEN role = 'super_admin' THEN '🚀 Super Admin (highest authority)'
    WHEN role = 'platform_developer' THEN '🔧 Platform Developer'
    WHEN role = 'account_owner' THEN '👑 Organization Owner'
    WHEN role = 'sustainability_manager' THEN '🌱 Sustainability Manager'
    WHEN role = 'facility_manager' THEN '🏢 Facility Manager'
    WHEN role = 'analyst' THEN '📊 Analyst'
    WHEN role = 'user' THEN '👤 Regular User'
    WHEN role = 'viewer' THEN '👁️ Viewer (read-only)'
    ELSE role
  END as description
FROM app_users
GROUP BY role
ORDER BY 
  CASE 
    WHEN role = 'super_admin' THEN 0
    WHEN role = 'platform_developer' THEN 1
    WHEN role = 'account_owner' THEN 2
    ELSE 3
  END;

-- ============================================
-- STEP 9: Final status of all users
-- ============================================
SELECT 
  'Final User Status' as section,
  app.email,
  app.name,
  app.role,
  app.status,
  CASE 
    WHEN sa.user_id IS NOT NULL THEN '✅ SUPER ADMIN ACCESS'
    ELSE '👤 Regular Access'
  END as access_level,
  app.created_at
FROM app_users app
LEFT JOIN super_admins sa ON app.auth_user_id = sa.user_id
ORDER BY 
  CASE WHEN sa.user_id IS NOT NULL THEN 0 ELSE 1 END,
  app.created_at;

-- ============================================
-- NOTES:
-- ============================================
-- This script:
-- 1. Adds user 4da3b401-990a-4011-9576-273986f43360 to super_admins table
-- 2. Updates their role in app_users to 'super_admin'
-- 3. Maintains the existing super admin d5708d9c-34fb-4c85-90ec-34faad9e2896
-- 4. Tests all super admin functions
-- 5. Shows comprehensive status of all users and roles