-- Fix infinite recursion in RLS policies
-- Create helper function and rewrite policies to avoid recursion

-- ============================================
-- DROP PROBLEMATIC POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view members from their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can insert members to their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can update members in their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can delete members from their organization" ON organization_members;

DROP POLICY IF EXISTS "Users can view sites from their organization" ON sites;
DROP POLICY IF EXISTS "Users can insert sites to their organization" ON sites;
DROP POLICY IF EXISTS "Users can update sites in their organization" ON sites;
DROP POLICY IF EXISTS "Users can delete sites from their organization" ON sites;

DROP POLICY IF EXISTS "Owners and admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Only owners can delete organization" ON organizations;
DROP POLICY IF EXISTS "Owners can insert organizations" ON organizations;

-- ============================================
-- CREATE HELPER FUNCTION (SECURITY DEFINER)
-- ============================================

-- This function runs with the owner's privileges, bypassing RLS
CREATE OR REPLACE FUNCTION user_organization_ids(user_uuid UUID)
RETURNS TABLE(organization_id UUID, role TEXT, is_owner BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    om.organization_id,
    om.role::TEXT,
    om.is_owner
  FROM organization_members om
  WHERE om.user_id = user_uuid
    AND om.deleted_at IS NULL;
END;
$$;

-- ============================================
-- SITES TABLE - SIMPLIFIED POLICIES
-- ============================================

-- View: All members of the organization
CREATE POLICY "sites_select_policy"
ON sites
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM user_organization_ids(auth.uid())
  )
);

-- Insert: Only owners and admins
CREATE POLICY "sites_insert_policy"
ON sites
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true OR role IN ('account_owner', 'admin')
  )
);

-- Update: Only owners and admins
CREATE POLICY "sites_update_policy"
ON sites
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true OR role IN ('account_owner', 'admin')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true OR role IN ('account_owner', 'admin')
  )
);

-- Delete: Only owners and admins
CREATE POLICY "sites_delete_policy"
ON sites
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true OR role IN ('account_owner', 'admin')
  )
);

-- ============================================
-- ORGANIZATION_MEMBERS - SIMPLIFIED POLICIES
-- ============================================

-- View: All members from the same organization
CREATE POLICY "members_select_policy"
ON organization_members
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM user_organization_ids(auth.uid())
  )
);

-- Insert: Only owners and admins
CREATE POLICY "members_insert_policy"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true OR role IN ('account_owner', 'admin')
  )
);

-- Update: Only owners and admins
CREATE POLICY "members_update_policy"
ON organization_members
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true OR role IN ('account_owner', 'admin')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true OR role IN ('account_owner', 'admin')
  )
);

-- Delete: Only owners
CREATE POLICY "members_delete_policy"
ON organization_members
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true
  )
);

-- ============================================
-- ORGANIZATIONS - SIMPLIFIED POLICIES
-- ============================================

-- View: All members can view their organization
CREATE POLICY "orgs_select_policy"
ON organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM user_organization_ids(auth.uid())
  )
);

-- Update: Only owners and admins
CREATE POLICY "orgs_update_policy"
ON organizations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true OR role IN ('account_owner', 'admin')
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true OR role IN ('account_owner', 'admin')
  )
);

-- Delete: Only owners
CREATE POLICY "orgs_delete_policy"
ON organizations
FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT organization_id
    FROM user_organization_ids(auth.uid())
    WHERE is_owner = true
  )
);

-- Insert: Allow for organization creation
CREATE POLICY "orgs_insert_policy"
ON organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('sites', 'organization_members', 'organizations')
  AND policyname NOT IN ('super_admin_bypass', 'users_view_their_orgs', 'users_view_their_memberships')
ORDER BY tablename, cmd;
