-- Fix the Simple RBAC permission function
-- The issue is that the function was checking for p_resource_type as a key in the permissions JSON,
-- but it should check for p_action as the key instead

DROP FUNCTION IF EXISTS check_user_permission CASCADE;

-- Corrected permission check function
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_access_record RECORD;
    v_base_permissions JSONB;
    v_final_permissions JSONB;
BEGIN
    -- Check if super admin first
    IF EXISTS (SELECT 1 FROM super_admins WHERE user_id = p_user_id) THEN
        RETURN TRUE;
    END IF;

    -- Get user's access record
    SELECT ua.role, ua.permissions, r.base_permissions
    INTO v_access_record
    FROM user_access ua
    JOIN roles r ON ua.role = r.name
    WHERE ua.user_id = p_user_id
    AND ua.resource_type = p_resource_type
    AND ua.resource_id = p_resource_id
    AND (ua.expires_at IS NULL OR ua.expires_at > NOW());

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Merge base permissions with overrides
    v_final_permissions := v_access_record.base_permissions;
    IF v_access_record.permissions IS NOT NULL THEN
        v_final_permissions := v_final_permissions || v_access_record.permissions;
    END IF;

    -- Check if user has wildcard or specific permission for the ACTION
    -- The JSON structure is: {"users": ["*"], "sites": ["*"], "organization": ["*"], ...}
    RETURN (
        v_final_permissions ? p_action AND (
            v_final_permissions->p_action ? '*' OR
            v_final_permissions->p_action ? p_action
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;

-- Test the fix
SELECT check_user_permission(
    'e1c83a34-424d-4114-94c5-1a11942dcdea'::UUID,
    'org',
    '22647141-2ee4-4d8d-8b47-16b0cbd830b2'::UUID,
    'users'
) AS users_permission_test;

SELECT check_user_permission(
    'e1c83a34-424d-4114-94c5-1a11942dcdea'::UUID,
    'org',
    '22647141-2ee4-4d8d-8b47-16b0cbd830b2'::UUID,
    'sites'
) AS sites_permission_test;

SELECT check_user_permission(
    'e1c83a34-424d-4114-94c5-1a11942dcdea'::UUID,
    'org',
    '22647141-2ee4-4d8d-8b47-16b0cbd830b2'::UUID,
    'organization'
) AS organization_permission_test;