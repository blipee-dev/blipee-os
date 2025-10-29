-- Fix the permissions column type in app_users table
-- First drop the column if it exists with wrong type
ALTER TABLE app_users DROP COLUMN IF EXISTS permissions;

-- Add it back with correct JSONB type and default
ALTER TABLE app_users
ADD COLUMN permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add comment to explain the column structure
COMMENT ON COLUMN app_users.permissions IS 'Stores user access level and site-specific permissions as JSONB object';

-- Update any existing rows to have valid permissions
UPDATE app_users
SET permissions = '{}'::jsonb
WHERE permissions IS NULL;
