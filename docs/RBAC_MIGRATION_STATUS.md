# RBAC Migration Status

## ✅ Completed Migration

### Database Changes
1. **Migration Applied**: `20250111_simple_rbac_system.sql`
   - ✅ Created new `user_access` table (flexible permission system)
   - ✅ Created `groups` table (multi-site access)
   - ✅ Preserved `super_admins` table
   - ✅ Migrated data from `user_organizations` to `user_access`
   - ✅ Created helper functions (is_super_admin, get_user_organizations, etc.)
   - ✅ Set up RLS policies and audit logging

### New Role System
**Old Roles** → **New Roles**
- super_admin → owner (+ super_admin flag)
- account_owner → owner
- sustainability_manager → manager
- facility_manager → member
- analyst → member
- viewer → viewer

### Code Updates Completed
1. **Permission System** (`/src/lib/permissions/`)
   - ✅ Created `service.ts` - Main permission service
   - ✅ Created `migration-helper.ts` - Compatibility layer
   - ✅ Created `/src/types/permissions.ts` - TypeScript types

2. **Organizations Page** (`/src/app/settings/organizations/page.tsx`)
   - ✅ Updated to use `user_access` table
   - ✅ Added fallback to old table for compatibility
   - ✅ Super admin support preserved

3. **API Routes** (`/src/app/api/organizations/create/route.ts`)
   - ✅ Updated to create entries in `user_access` table
   - ✅ Uses new role: 'owner' instead of 'account_owner'
   - ✅ Includes fallback for compatibility

## 🚧 Remaining Tasks

### High Priority
1. **User Management Pages**
   - [ ] Update `/src/app/settings/users/page.tsx`
   - [ ] Update `/src/app/settings/users/UsersClient.tsx`
   - [ ] Update user invitation flow

2. **Site Management**
   - [ ] Update `/src/app/settings/sites/page.tsx`
   - [ ] Update `/src/app/settings/sites/SitesClient.tsx`
   - [ ] Add multi-site access via groups

3. **Permission Checks**
   - [ ] Update all permission checks to use new service
   - [ ] Replace hardcoded role checks
   - [ ] Update middleware if needed

### Medium Priority
4. **Translation Files**
   - [ ] Update role names in `/src/messages/en.json`
   - [ ] Update role names in `/src/messages/es.json`
   - [ ] Update role names in `/src/messages/pt.json`

5. **Components**
   - [ ] Update role selectors/dropdowns
   - [ ] Update permission-based UI rendering
   - [ ] Update role badges/displays

### Low Priority
6. **Tests**
   - [ ] Update test files to use new roles
   - [ ] Add tests for new permission service
   - [ ] Test migration compatibility

## How to Use the New System

### In React Components
```typescript
import { permissionService } from '@/lib/permissions/service';

// Check if super admin
const isSuperAdmin = await permissionService.isSuperAdmin();

// Check resource access
const canEdit = await permissionService.canAccessResource(
  'organization',
  orgId,
  'manager' // Required role
);

// Get user's organizations
const orgs = await permissionService.getUserOrganizations();
```

### In API Routes
```typescript
// Grant access
await supabase.from('user_access').insert({
  user_id: userId,
  resource_type: 'organization',
  resource_id: orgId,
  role: 'owner'
});
```

### Multi-Site Access
```typescript
// Create a group
const groupId = await permissionService.createGroup(
  orgId,
  'European Sites',
  'All EU facilities',
  ['site-1', 'site-2', 'site-3']
);

// Add user to group
await permissionService.addUserToGroup(userId, groupId, 'manager');
```

### Delegation (Temporary Access)
```typescript
// Grant temporary access
await permissionService.grantAccess(
  deputyId,
  'organization',
  orgId,
  'manager',
  new Date('2024-02-01') // Expires
);
```

## Benefits Achieved

✅ **Simplicity**: 4 roles instead of complex hierarchy
✅ **Flexibility**: Groups, temporary access, multi-site support
✅ **Performance**: Single table lookups with indexes
✅ **Compatibility**: Fallbacks to old system during transition
✅ **Security**: RLS policies and audit logging in place

## Next Steps

1. Test the current implementation
2. Update remaining user management pages
3. Gradually migrate all permission checks
4. Remove fallback code after full migration

## Notes

- Old `user_organizations` table renamed to `user_access_backup`
- All existing data preserved
- Super admin (pedro@blipee.com) status maintained
- System supports both old and new roles during transition