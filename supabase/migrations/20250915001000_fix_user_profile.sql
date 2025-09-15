-- Fix user profile for pedro@blipee.com
-- This ensures the user can see all organizations and their metrics

DO $$
DECLARE
  v_user_id UUID := 'd5708d9c-34fb-4c85-90ec-34faad9e2896';
  v_plmj_id UUID := '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
BEGIN
  -- Create or update profile to be super_admin
  INSERT INTO profiles (
    id,
    email,
    full_name,
    display_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'pedro@blipee.com',
    'Pedro',
    'Pedro',
    'super_admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = 'super_admin',
    email = 'pedro@blipee.com',
    updated_at = NOW();

  -- Also add user as member of PLMJ organization with account_owner role
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    joined_at
  )
  VALUES (
    v_plmj_id,
    v_user_id,
    'account_owner',
    NOW()
  )
  ON CONFLICT (organization_id, user_id) DO UPDATE
  SET
    role = 'account_owner',
    updated_at = NOW();

  RAISE NOTICE 'User profile fixed - set as super_admin and PLMJ account_owner';
END $$;

-- Verify the fix
SELECT
  p.id,
  p.email,
  p.role as profile_role,
  om.role as org_role,
  o.name as organization
FROM profiles p
LEFT JOIN organization_members om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE p.id = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';