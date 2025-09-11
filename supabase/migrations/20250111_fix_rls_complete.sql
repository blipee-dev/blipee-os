-- =============================================
-- Complete Fix for RLS Recursion Issues
-- =============================================

-- First, disable RLS temporarily to clean up
ALTER TABLE user_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on these tables
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on user_access
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_access'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_access', pol.policyname);
    END LOOP;
    
    -- Drop all policies on super_admins
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'super_admins'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON super_admins', pol.policyname);
    END LOOP;
    
    -- Drop all policies on organizations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'organizations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organizations', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create new, simple policies

-- 1. Super admins table - anyone can read
CREATE POLICY "super_admins_read_all"
ON super_admins
FOR SELECT
USING (true);

-- 2. User access table - users can see their own records only
CREATE POLICY "user_access_own_records"
ON user_access
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Organizations table - more complex but avoiding recursion
-- We'll use a function to avoid direct recursion
CREATE OR REPLACE FUNCTION user_can_access_org(org_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Check if user is a super admin
    IF EXISTS (
        SELECT 1 FROM super_admins 
        WHERE user_id = auth.uid()
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user has access to this organization
    IF EXISTS (
        SELECT 1 FROM user_access 
        WHERE user_id = auth.uid() 
        AND resource_type = 'organization' 
        AND resource_id = org_id
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use the function in the policy
CREATE POLICY "organizations_with_access"
ON organizations
FOR SELECT
USING (user_can_access_org(id));

-- Grant necessary permissions
GRANT SELECT ON user_access TO authenticated;
GRANT SELECT ON super_admins TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_access_org TO authenticated;