# Super Admin Architecture

## Overview

The `super_admin` role is a **platform-level** administrative role that sits **above** the organization hierarchy. It's designed for Blipee team members who need full system access for support, maintenance, and platform management.

## Architecture Design

### 1. Two-Tier Permission System

```
┌─────────────────────────────────────┐
│         PLATFORM LEVEL              │
│  ┌─────────────────────────────┐    │
│  │     super_admins table      │    │
│  │  (Blipee team members only) │    │
│  └─────────────────────────────┘    │
│              ↓                       │
│     Full access to all orgs         │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      ORGANIZATION LEVEL             │
│  ┌─────────────────────────────┐    │
│  │  organization_members table │    │
│  │    - account_owner          │    │
│  │    - sustainability_manager │    │
│  │    - facility_manager       │    │
│  │    - analyst                │    │
│  │    - viewer                 │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 2. Database Structure

#### `super_admins` Table
```sql
CREATE TABLE super_admins (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    UNIQUE(user_id)
);
```

#### How It Works
1. **Separate Table**: Super admins are tracked in a dedicated `super_admins` table
2. **Not in Enum**: `super_admin` is intentionally NOT in the `organization_members.role` enum
3. **Override Logic**: Permission checks first verify super admin status, then check org roles

### 3. Permission Checking Flow

```typescript
// In the auth service
async function hasPermission(userId, resource, action, orgId) {
    // Step 1: Check if user is super admin
    if (await isSuperAdmin(userId)) {
        return true; // Super admins can do anything
    }

    // Step 2: Check organization-level permissions
    const orgRole = await getUserOrgRole(userId, orgId);
    return checkRolePermission(orgRole, resource, action);
}
```

### 4. Database Functions

```sql
-- Check if user is super admin
CREATE FUNCTION is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's effective role
CREATE FUNCTION get_user_org_role(org_id UUID, check_user_id UUID)
RETURNS user_role AS $$
BEGIN
    -- Super admin override
    IF is_super_admin(check_user_id) THEN
        RETURN 'super_admin'::user_role;
    END IF;

    -- Normal org role
    SELECT role FROM organization_members
    WHERE organization_id = org_id
    AND user_id = check_user_id
    AND invitation_status = 'accepted';
END;
$$
```

## Implementation Details

### 1. Session Building

When building a user session, the system:

```typescript
// In service-v2.ts
private async buildSession(userId: string): Promise<Session> {
    // Check super admin status
    const { data: superAdmin } = await supabase
        .from("super_admins")
        .select("*")
        .eq("user_id", userId)
        .single();

    // Build permissions
    let permissions: Permission[] = [];
    if (superAdmin) {
        // Super admin gets wildcard permission
        permissions = [{ resource: '*', action: '*' }];
    } else {
        // Regular users get role-based permissions
        permissions = getRolePermissions(userRole);
    }
}
```

### 2. RLS Policies

Super admins bypass RLS through SQL functions:

```sql
-- Example RLS policy
CREATE POLICY "View all organizations" ON organizations
FOR SELECT USING (
    -- Super admins can see everything
    is_super_admin(auth.uid())
    OR
    -- Regular users see their orgs
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = organizations.id
        AND user_id = auth.uid()
    )
);
```

### 3. UI/UX Considerations

```typescript
// Frontend permission check
export function canUserAccessResource(
    session: Session,
    resource: string,
    action: string
): boolean {
    // Check for wildcard permission (super admin)
    if (session.permissions.some(p =>
        p.resource === '*' && p.action === '*'
    )) {
        return true;
    }

    // Check specific permissions
    return hasPermission(session.permissions, resource, action);
}
```

## Security Considerations

### 1. Assignment Protection

- **Manual Only**: Super admins can only be added via direct database access
- **No Self-Assignment**: Users cannot make themselves super admin
- **Audit Trail**: All super admin assignments are logged

### 2. Access Controls

```sql
-- Only existing super admins can view the super admin list
CREATE POLICY "Super admin visibility" ON super_admins
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = auth.uid()
    )
);
```

### 3. Best Practices

1. **Minimal Distribution**: Only essential Blipee team members
2. **Regular Audits**: Review super admin list monthly
3. **Activity Monitoring**: All super admin actions logged to `auth_audit_log`
4. **Time-Limited Access**: Consider expiration dates for temporary access

## Current Super Admins

As per the migration, the following users have super admin access:

```sql
-- pedro@blipee.com - Platform founder
INSERT INTO super_admins (user_id, reason)
VALUES ('d5708d9c-34fb-4c85-90ec-34faad9e2896', 'Platform founder');
```

## Adding/Removing Super Admins

### Adding a Super Admin

```sql
-- Run in Supabase SQL Editor (requires service role)
INSERT INTO super_admins (user_id, granted_by, reason)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'new.admin@blipee.com'),
    (SELECT id FROM auth.users WHERE email = 'pedro@blipee.com'),
    'Engineering team lead - Q1 2025'
);
```

### Removing a Super Admin

```sql
-- Run in Supabase SQL Editor
DELETE FROM super_admins
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'former.admin@blipee.com'
);

-- Log the removal
INSERT INTO auth_audit_log (event_type, user_id, status, metadata)
VALUES (
    'super_admin_removed',
    (SELECT id FROM auth.users WHERE email = 'former.admin@blipee.com'),
    'success',
    jsonb_build_object('removed_by', 'pedro@blipee.com', 'reason', 'Role change')
);
```

## Monitoring & Compliance

### 1. Activity Dashboard Query

```sql
-- View all super admin activities
SELECT
    al.created_at,
    up.email,
    al.event_type,
    al.metadata,
    o.name as organization
FROM auth_audit_log al
JOIN user_profiles up ON up.id = al.user_id
LEFT JOIN organizations o ON o.id = al.organization_id
WHERE al.user_id IN (
    SELECT user_id FROM super_admins
)
ORDER BY al.created_at DESC
LIMIT 100;
```

### 2. Access Review Query

```sql
-- Review super admin list with last activity
SELECT
    up.email,
    sa.granted_at,
    sa.reason,
    sa.granted_by,
    MAX(al.created_at) as last_activity
FROM super_admins sa
JOIN user_profiles up ON up.id = sa.user_id
LEFT JOIN auth_audit_log al ON al.user_id = sa.user_id
GROUP BY up.email, sa.granted_at, sa.reason, sa.granted_by
ORDER BY sa.granted_at DESC;
```

## Integration Points

### 1. Authentication Service

The `super_admin` role integrates at these points:

- **Session Creation**: Adds wildcard permissions
- **Permission Checks**: Always returns true for super admins
- **Organization Access**: Can access all organizations
- **Role Management**: Can assign/remove any role

### 2. API Middleware

```typescript
// Example API middleware
export async function requireSuperAdmin(req: Request) {
    const session = await getSession(req);

    if (!session.permissions.some(p =>
        p.resource === '*' && p.action === '*'
    )) {
        throw new Error('Super admin access required');
    }
}
```

### 3. Frontend Guards

```typescript
// React component guard
export function SuperAdminOnly({ children }: { children: React.ReactNode }) {
    const { session } = useAuth();

    const isSuperAdmin = session?.permissions.some(p =>
        p.resource === '*' && p.action === '*'
    );

    if (!isSuperAdmin) {
        return <div>Access denied. Super admin privileges required.</div>;
    }

    return <>{children}</>;
}
```

## Summary

The super admin system provides:

1. **Complete Platform Control**: Access to all organizations and data
2. **Security Through Separation**: Separate table, not mixed with org roles
3. **Audit Trail**: All actions logged
4. **Override Mechanism**: Bypasses all permission checks
5. **Support Capabilities**: Ability to debug and fix user issues

This design ensures that Blipee team members can effectively support customers while maintaining clear separation between platform administration and organization management.