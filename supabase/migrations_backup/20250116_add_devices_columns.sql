-- Add missing columns to devices table
-- These columns are expected by the DevicesClient component

-- Add organization_id column
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add protocol column
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS protocol TEXT;

-- Add last_sync column
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;

-- Add api_endpoint column
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS api_endpoint TEXT;

-- Add authentication column (JSONB for flexibility)
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS authentication JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_organization_id ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_sync ON devices(last_sync);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- Update existing devices to set organization_id from their site's organization
UPDATE devices d
SET organization_id = s.organization_id
FROM sites s
WHERE d.site_id = s.id
AND d.organization_id IS NULL;

-- Add RLS policies for devices table if not already enabled
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "devices_select_policy" ON devices;
DROP POLICY IF EXISTS "devices_insert_policy" ON devices;
DROP POLICY IF EXISTS "devices_update_policy" ON devices;
DROP POLICY IF EXISTS "devices_delete_policy" ON devices;

-- Create new RLS policies using Simple RBAC
CREATE POLICY "devices_select_policy" ON devices
    FOR SELECT TO authenticated
    USING (
        -- Super admins can see all devices
        EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
        OR
        -- Users with organization access can see devices
        EXISTS (
            SELECT 1 FROM user_access ua
            WHERE ua.user_id = auth.uid()
            AND ua.resource_type = 'org'
            AND ua.resource_id = devices.organization_id
        )
        OR
        -- Users with site access can see devices
        EXISTS (
            SELECT 1 FROM user_access ua
            WHERE ua.user_id = auth.uid()
            AND ua.resource_type = 'site'
            AND ua.resource_id = devices.site_id
        )
    );

CREATE POLICY "devices_insert_policy" ON devices
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Super admins can create devices
        EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
        OR
        -- Users with sites permission in the organization can create devices
        check_user_permission(auth.uid(), 'org', organization_id, 'sites')
    );

CREATE POLICY "devices_update_policy" ON devices
    FOR UPDATE TO authenticated
    USING (
        -- Super admins can update devices
        EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
        OR
        -- Users with sites permission in the organization can update devices
        check_user_permission(auth.uid(), 'org', organization_id, 'sites')
    );

CREATE POLICY "devices_delete_policy" ON devices
    FOR DELETE TO authenticated
    USING (
        -- Super admins can delete devices
        EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
        OR
        -- Users with sites permission in the organization can delete devices
        check_user_permission(auth.uid(), 'org', organization_id, 'sites')
    );

-- Grant permissions
GRANT ALL ON devices TO authenticated;

-- Test query
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'devices'
ORDER BY ordinal_position;