# Fix Organization Members References

## Critical Files to Fix

### Pages that need immediate fixing:

1. **Settings/Sites Page** (`src/app/settings/sites/page.tsx`)
   - Line 64-66: Replace organization_members query with app_users/user_access
   - Line 93: Update comment

2. **Settings/Sites Client** (`src/app/settings/sites/SitesClient.tsx`)
   - Line 145-147: Replace organization_members query

3. **Settings/Devices Page** (`src/app/settings/devices/page.tsx`)
   - Line 97-99: Replace organization_members query

### Critical API Routes to fix:

1. **Sites API** (`src/app/api/sites/route.ts`)
   - Needs to use app_users and user_access instead of organization_members

2. **Sustainability Dashboard** (`src/app/api/sustainability/dashboard/route.ts`)
   - Replace organization_members references

3. **Sustainability Data** (`src/app/api/sustainability/data/route.ts`)
   - Replace organization_members references

## Pattern to Replace

### OLD Pattern:
```typescript
const { data: orgMemberships } = await supabase
  .from('organization_members')
  .select('organization_id, role')
  .eq('user_id', user.id);
```

### NEW Pattern:
```typescript
// Using admin client to avoid RLS issues
const { data: appUser } = await supabaseAdmin
  .from('app_users')
  .select('organization_id, role')
  .eq('auth_user_id', user.id)
  .single();

// If not found, check user_access table
if (!appUser?.organization_id) {
  const { data: userAccess } = await supabaseAdmin
    .from('user_access')
    .select('resource_id, role')
    .eq('user_id', user.id)
    .eq('resource_type', 'org')
    .limit(1)
    .single();

  // Use userAccess.resource_id as organization_id
}
```

## Role Mapping

Replace old roles with Simple RBAC roles:
- `account_owner` → `owner`
- `sustainability_manager` → `manager`
- `facility_manager` → `member`
- `analyst` → `member`
- `viewer` → `viewer`