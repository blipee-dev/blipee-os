# Frontend RBAC Integration Guide

## New Components Available

### 1. RoleBadge Component
Displays user roles with consistent styling:

```tsx
import { RoleBadge } from '@/components/ui/RoleBadge';

// Usage
<RoleBadge role={user.role} size="md" />
```

### 2. RoleSelector Component
For selecting roles in forms:

```tsx
import { RoleSelector } from '@/components/ui/RoleSelector';

// Usage
<RoleSelector
  value={selectedRole}
  onChange={setSelectedRole}
  currentUserRole={currentUser.role} // Limits selectable roles
/>
```

### 3. PermissionGuard Component
Conditionally render based on permissions:

```tsx
import { PermissionGuard } from '@/components/auth/PermissionGuard';

// Only show for managers and above
<PermissionGuard
  resourceType="organization"
  resourceId={orgId}
  requiredRole="manager"
  fallback={<p>You don't have permission to view this.</p>}
>
  <AdminPanel />
</PermissionGuard>

// Only show for super admins
<PermissionGuard requireSuperAdmin>
  <SuperAdminControls />
</PermissionGuard>
```

## Hooks

### usePermission Hook
Check permissions in components:

```tsx
import { usePermission } from '@/components/auth/PermissionGuard';

function MyComponent({ orgId }) {
  const { hasPermission, isLoading } = usePermission(
    'organization',
    orgId,
    'manager'
  );
  
  if (isLoading) return <Spinner />;
  
  return hasPermission ? <EditForm /> : <ViewOnly />;
}
```

### useSuperAdmin Hook
Check if user is super admin:

```tsx
import { useSuperAdmin } from '@/components/auth/PermissionGuard';

function AdminSection() {
  const { isSuperAdmin, isLoading } = useSuperAdmin();
  
  if (!isSuperAdmin) return null;
  
  return <SuperAdminPanel />;
}
```

## Migration Examples

### Before (Old System)
```tsx
// Hardcoded role check
{user.role === 'account_owner' && (
  <button>Delete Organization</button>
)}

// Multiple role checks
{(user.role === 'account_owner' || 
  user.role === 'sustainability_manager') && (
  <EditButton />
)}
```

### After (New System)
```tsx
// Using PermissionGuard
<PermissionGuard
  resourceType="organization"
  resourceId={orgId}
  requiredRole="owner"
>
  <button>Delete Organization</button>
</PermissionGuard>

// Using hook
const { hasPermission } = usePermission('organization', orgId, 'manager');
{hasPermission && <EditButton />}
```

## Role Display

### Before
```tsx
// Custom badge implementation
<span className="px-2 py-1 bg-blue-100 rounded">
  {user.role === 'account_owner' ? 'Owner' : user.role}
</span>
```

### After
```tsx
// Consistent role badge
<RoleBadge role={user.role} />
```

## Permission Service Usage

### Direct Permission Checks
```tsx
import { permissionService } from '@/lib/permissions/service';

// In async functions
async function handleDelete() {
  const canDelete = await permissionService.hasPermission(
    'canDeleteOrganization',
    'organization',
    orgId
  );
  
  if (!canDelete) {
    alert('You do not have permission to delete this organization');
    return;
  }
  
  // Proceed with deletion
}
```

### Getting User's Access
```tsx
// Get all organizations user can access
const orgs = await permissionService.getUserOrganizations();

// Get all sites in an organization
const sites = await permissionService.getUserSites(orgId);

// Get complete access profile
const profile = await permissionService.getUserAccessProfile();
```

## Common Patterns

### 1. Admin-Only Features
```tsx
<PermissionGuard requireSuperAdmin>
  <SystemSettings />
</PermissionGuard>
```

### 2. Role-Based UI
```tsx
function OrganizationCard({ org, userRole }) {
  return (
    <div>
      <h3>{org.name}</h3>
      <RoleBadge role={userRole} />
      
      <PermissionGuard
        resourceType="organization"
        resourceId={org.id}
        requiredRole="manager"
      >
        <EditButton />
        <InviteUserButton />
      </PermissionGuard>
      
      <PermissionGuard
        resourceType="organization"
        resourceId={org.id}
        requiredRole="owner"
      >
        <DeleteButton />
        <BillingSettings />
      </PermissionGuard>
    </div>
  );
}
```

### 3. Form with Role Selection
```tsx
function InviteUserForm({ orgId }) {
  const [role, setRole] = useState('viewer');
  const { hasPermission } = usePermission('organization', orgId, 'manager');
  
  if (!hasPermission) {
    return <p>You cannot invite users to this organization.</p>;
  }
  
  return (
    <form>
      <input type="email" placeholder="Email" />
      
      <RoleSelector
        value={role}
        onChange={setRole}
        currentUserRole="manager" // Limits to manager and below
      />
      
      <button type="submit">Send Invitation</button>
    </form>
  );
}
```

## Best Practices

1. **Use Components Over Direct Checks**
   - Prefer `<PermissionGuard>` over manual permission checks
   - Use `<RoleBadge>` for consistent role display

2. **Cache Permission Results**
   - The permission service caches results for 5 minutes
   - Use the same service instance across components

3. **Handle Loading States**
   - Always show loading state during permission checks
   - Provide meaningful fallbacks for denied access

4. **Progressive Enhancement**
   - Show read-only views for viewers
   - Add edit capabilities for members
   - Show admin controls for managers/owners

5. **Security**
   - Frontend checks are for UX only
   - Always validate permissions on the backend
   - Never trust client-side permission checks alone

## Gradual Migration

During the transition period:
1. New components work with both old and new roles
2. The migration-helper maps old roles to new ones
3. Fallbacks ensure compatibility

You can migrate components gradually without breaking existing functionality.