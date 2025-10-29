-- Add created_by column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing organizations to set created_by to the account owner
UPDATE organizations o
SET created_by = (
  SELECT user_id 
  FROM user_organizations uo 
  WHERE uo.organization_id = o.id 
    AND uo.role = 'account_owner'
  LIMIT 1
)
WHERE created_by IS NULL;