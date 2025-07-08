-- Check if user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'pedro@blipee.com';

-- Check user profile
SELECT * FROM user_profiles WHERE email = 'pedro@blipee.com';

-- Check organization memberships
SELECT 
  om.*,
  o.name as org_name,
  o.slug as org_slug
FROM organization_members om
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id IN (SELECT id FROM auth.users WHERE email = 'pedro@blipee.com');

-- Check all organizations
SELECT * FROM organizations;