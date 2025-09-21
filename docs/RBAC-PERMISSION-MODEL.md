# Simple RBAC Permission Model

## Overview

Blipee OS uses a **Simple RBAC (Role-Based Access Control)** system based on industry best practices from leading ESG platforms. The system is designed to be fast, simple, and effective - covering 90% of enterprise use cases with just 4 core roles.

## Architecture

### Database Tables

1. **`user_access`** - Main permission table
   - Single source of truth for all permissions
   - Indexed for fast lookups
   - Supports resource-specific permissions

2. **`super_admins`** - Platform-level administrators
   - Bypasses all RLS policies
   - Separate from role system
   - Reserved for Blipee team

3. **`app_users`** - User profiles
   - Contains user role (fallback)
   - Links auth users to organizations

### Core Roles

| Role | Level | Description | Key Permissions |
|------|-------|-------------|-----------------|
| **owner** | Organization | Full control over organization | All permissions |
| **manager** | Organization | Manages sites and users | Create/update sites, manage users, full data access |
| **member** | Site | Works with data and reports | Edit data, create reports, update devices |
| **viewer** | Site | Read-only access | View data, reports, and settings |

### Permission Matrix

| Resource | Owner | Manager | Member | Viewer |
|----------|-------|---------|--------|--------|
| **Organization** | All | Read, Update | - | - |
| **Sites** | All | All | Read, Update | Read |
| **Users** | All | Create, Read, Update | - | - |
| **Billing** | All | - | - | - |
| **Settings** | All | Read, Update | - | - |
| **Reports** | All | All | Create, Read | Read |
| **Data** | All | All | Create, Read, Update | Read |
| **Devices** | All | All | Read, Update | Read |

## Implementation

### Permission Service

All permission checks go through the centralized `PermissionService` class:

```typescript
import { PermissionService } from '@/lib/auth/permission-service';

// Check if user is super admin
const isSuperAdmin = await PermissionService.isSuperAdmin(userId);

// Check specific permission
const canEdit = await PermissionService.checkPermission(
  userId,
  'data',
  'update',
  organizationId
);

// Convenience methods
const canManageUsers = await PermissionService.canManageUsers(userId, orgId);
const canViewSites = await PermissionService.canViewSites(userId, siteId);
```

### Permission Check Flow

1. **Super Admin Check** - Bypasses all other checks
2. **User Access Table** - Check for explicit permissions
3. **App Users Role** - Fallback to role in user profile
4. **Deny by Default** - No permission if not explicitly granted

### Database Functions

```sql
-- Check user permission (single query, indexed)
SELECT check_user_permission(user_id, 'org', org_id, 'users');

-- Get user role
SELECT get_user_role(user_id, 'org', org_id);

-- Check organization access (backward compatibility)
SELECT user_has_org_access(org_id);
```

## Migration from Legacy System

### Legacy Role Mapping

The system automatically maps legacy roles to Simple RBAC:

- `account_owner` → `owner`
- `sustainability_manager` → `manager`
- `facility_manager` → `member`
- `analyst` → `member`
- `viewer` → `viewer`
- `stakeholder` → `viewer`

### Removed Tables

The following tables have been deprecated:
- `organization_members` - Replaced by `user_access`
- `user_roles` - Integrated into `app_users`
- Complex enterprise RBAC tables

## Best Practices

### For Pages

```typescript
// Server component
import { PermissionService } from '@/lib/auth/permission-service';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Check permission
  const canAccess = await PermissionService.canManageUsers(user.id);
  if (!canAccess) {
    redirect('/');
  }

  // Render page...
}
```

### For API Routes

```typescript
// API route
import { PermissionService } from '@/lib/auth/permission-service';

export async function POST(request: NextRequest) {
  const { user } = await getUser();

  // Check permission for specific organization
  const { organizationId } = await request.json();
  const canCreate = await PermissionService.checkPermission(
    user.id,
    'users',
    'create',
    organizationId
  );

  if (!canCreate) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Process request...
}
```

### For Client Components

```typescript
// Use permission data passed from server
interface Props {
  userRole: 'owner' | 'manager' | 'member' | 'viewer';
  isSuperAdmin?: boolean;
}

export default function ClientComponent({ userRole, isSuperAdmin }: Props) {
  const canEdit = isSuperAdmin || ['owner', 'manager'].includes(userRole);

  return (
    <div>
      {canEdit && <EditButton />}
    </div>
  );
}
```

## Security Considerations

1. **Always check permissions server-side** - Never trust client-side permission checks
2. **Use admin client for bypassing RLS** - When needed for system operations
3. **Default deny** - If no explicit permission, deny access
4. **Audit logging** - Track all permission changes in `access_audit_log`
5. **Session validation** - Validate sessions before permission checks

## Performance Optimizations

1. **Single query checks** - `check_user_permission()` is a single indexed query
2. **Cached super admin status** - Super admin check is fast
3. **Indexed lookups** - All permission tables have proper indexes
4. **RLS policies** - Automatically filter data at database level

## Testing Permissions

```typescript
// Test different roles
describe('Permission Tests', () => {
  it('owner should have full access', async () => {
    const canManage = await PermissionService.checkPermission(
      ownerId,
      'users',
      'delete',
      orgId
    );
    expect(canManage).toBe(true);
  });

  it('viewer should have read-only access', async () => {
    const canEdit = await PermissionService.checkPermission(
      viewerId,
      'data',
      'update',
      orgId
    );
    expect(canEdit).toBe(false);
  });
});
```

## Troubleshooting

### Common Issues

1. **User has no permissions**
   - Check `user_access` table
   - Verify `app_users.role` is set
   - Ensure organization_id is correct

2. **Super admin not working**
   - Verify user is in `super_admins` table
   - Check `is_super_admin()` function exists
   - Ensure RLS policies have super admin bypass

3. **Permission denied errors**
   - Check permission service logs
   - Verify resource_type and resource_id
   - Ensure user has valid session

### Debug Queries

```sql
-- Check user's access records
SELECT * FROM user_access WHERE user_id = 'USER_ID';

-- Check if user is super admin
SELECT * FROM super_admins WHERE user_id = 'USER_ID';

-- Check user's role in app_users
SELECT role, organization_id FROM app_users WHERE auth_user_id = 'USER_ID';

-- Test permission function
SELECT check_user_permission('USER_ID', 'org', 'ORG_ID', 'users');
```

## Future Enhancements

1. **Dynamic permissions** - Custom permissions per organization
2. **Temporary access** - Time-based permissions
3. **Delegation** - Allow users to delegate permissions
4. **Audit improvements** - More detailed audit trails
5. **Performance monitoring** - Track permission check performance