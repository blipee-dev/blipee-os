-- Fix RLS policies for user_profiles table
-- Allow users to see profiles of members from the same organization

-- Add policy to view profiles of organization members
CREATE POLICY "Users can view organization members profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  -- Can view own profile OR profiles of users in the same organization
  auth.uid() = id
  OR
  id IN (
    SELECT om.user_id
    FROM organization_members om
    WHERE om.organization_id IN (
      SELECT organization_id
      FROM user_organization_ids(auth.uid())
    )
    AND om.deleted_at IS NULL
  )
);

-- Verify policies
SELECT
  policyname,
  cmd,
  substring(qual::text, 1, 100) as qual_preview
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
