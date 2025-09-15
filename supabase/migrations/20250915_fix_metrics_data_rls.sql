-- Fix RLS policies for metrics_data to work with user_access and super_admins

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization's data" ON metrics_data;
DROP POLICY IF EXISTS "Users can insert data for their organization" ON metrics_data;
DROP POLICY IF EXISTS "Users can update their organization's data" ON metrics_data;

-- Create new policies that check both organization_members, user_access, and super_admins

-- SELECT policy: Users can view data if they have access via organization_members, user_access, or are super admin
CREATE POLICY "Users can view metrics data" ON metrics_data
  FOR SELECT USING (
    -- Super admin can see everything
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
    OR
    -- User has access via organization_members
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
    OR
    -- User has access via user_access table
    organization_id IN (
      SELECT ua.resource_id
      FROM user_access ua
      WHERE ua.user_id = auth.uid()
        AND ua.resource_type = 'organization'
    )
  );

-- INSERT policy: Users can insert data if they have appropriate role
CREATE POLICY "Users can insert metrics data" ON metrics_data
  FOR INSERT WITH CHECK (
    -- Super admin can insert for any org
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
    OR
    -- User has manager or owner role in organization_members
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
    OR
    -- User has owner/manager role in user_access
    organization_id IN (
      SELECT ua.resource_id
      FROM user_access ua
      WHERE ua.user_id = auth.uid()
        AND ua.resource_type = 'organization'
        AND ua.role IN ('owner', 'manager')
    )
  );

-- UPDATE policy: Users can update data if they have appropriate role
CREATE POLICY "Users can update metrics data" ON metrics_data
  FOR UPDATE USING (
    -- Super admin can update any data
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
    OR
    -- User has manager or owner role in organization_members
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
    OR
    -- User has owner/manager role in user_access
    organization_id IN (
      SELECT ua.resource_id
      FROM user_access ua
      WHERE ua.user_id = auth.uid()
        AND ua.resource_type = 'organization'
        AND ua.role IN ('owner', 'manager')
    )
  );

-- DELETE policy: Only admins and owners can delete
CREATE POLICY "Only admins can delete metrics data" ON metrics_data
  FOR DELETE USING (
    -- Super admin can delete any data
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
    OR
    -- User has owner role in organization_members
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role = 'account_owner'
    )
    OR
    -- User has owner role in user_access
    organization_id IN (
      SELECT ua.resource_id
      FROM user_access ua
      WHERE ua.user_id = auth.uid()
        AND ua.resource_type = 'organization'
        AND ua.role = 'owner'
    )
  );