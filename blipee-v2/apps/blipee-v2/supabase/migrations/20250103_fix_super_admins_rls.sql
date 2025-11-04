-- Fix super_admins RLS to allow authenticated users to check if they are super admins

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to check their own super admin status" ON super_admins;

-- Enable RLS on super_admins table
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to check if they are super admins
-- This allows any authenticated user to SELECT from super_admins where user_id matches their own ID
CREATE POLICY "Allow authenticated users to check their own super admin status"
  ON super_admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Allow authenticated users to check their own super admin status" ON super_admins
IS 'Allows authenticated users to query the super_admins table to check if their user_id exists, which determines if they have super admin access';
