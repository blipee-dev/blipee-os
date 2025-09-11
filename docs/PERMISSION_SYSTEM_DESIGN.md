# Enhanced Permission System Design

## Multi-Site Access Model

### Problem Statement
- Some users need visibility across multiple sites without full regional admin privileges
- Sustainability Managers need to delegate tasks while maintaining oversight
- Current role hierarchy is too rigid for cross-functional teams

## Solution Architecture

### 1. Site-Level Permissions (Granular Access)

Instead of rigid role-based access, implement a hybrid RBAC + ABAC model:

```sql
-- New table: site_permissions
CREATE TABLE site_permissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  permission_level text CHECK (permission_level IN ('view', 'edit', 'manage')),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- Optional expiration for temporary access
  reason text, -- Audit trail: why access was granted
  UNIQUE(user_id, site_id)
);

-- Example: Grant user view access to multiple sites
INSERT INTO site_permissions (user_id, site_id, permission_level, granted_by, reason)
VALUES 
  ('user-123', 'site-a', 'view', 'manager-456', 'Cross-site ESG reporting'),
  ('user-123', 'site-b', 'view', 'manager-456', 'Cross-site ESG reporting'),
  ('user-123', 'site-c', 'view', 'manager-456', 'Cross-site ESG reporting');
```

### 2. Delegation System for Sustainability Managers

Create a flexible delegation mechanism:

```sql
-- New table: role_delegations
CREATE TABLE role_delegations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  delegate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  delegated_permissions jsonb NOT NULL, -- Specific permissions being delegated
  effective_from timestamptz DEFAULT now(),
  effective_until timestamptz, -- Delegation period
  delegation_type text CHECK (delegation_type IN ('full', 'partial', 'vacation', 'project')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at timestamptz DEFAULT now()
);

-- Example delegation
INSERT INTO role_delegations (
  delegator_id, 
  delegate_id, 
  organization_id,
  delegated_permissions,
  effective_until,
  delegation_type
) VALUES (
  'sustainability-manager-id',
  'deputy-id',
  'org-id',
  '{
    "approve_reports": true,
    "manage_targets": true,
    "assign_tasks": true,
    "view_sensitive_data": false
  }'::jsonb,
  '2024-12-31',
  'partial'
);
```

### 3. Enhanced Role Hierarchy with Flexibility

```typescript
// Updated role definitions
export enum UserRole {
  // System level
  SUPER_ADMIN = 'super_admin',
  
  // Organization level
  ACCOUNT_OWNER = 'account_owner',
  SUSTAINABILITY_MANAGER = 'sustainability_manager',
  DEPUTY_SUSTAINABILITY_MANAGER = 'deputy_sustainability_manager', // NEW
  
  // Regional/Multi-site level
  REGIONAL_MANAGER = 'regional_manager',
  CROSS_SITE_ANALYST = 'cross_site_analyst', // NEW - can view multiple sites
  
  // Site level
  FACILITY_MANAGER = 'facility_manager',
  SITE_OPERATOR = 'site_operator',
  
  // View only
  AUDITOR = 'auditor', // NEW - external auditor with specific access
  VIEWER = 'viewer'
}

// Permission matrix
export const ROLE_PERMISSIONS = {
  [UserRole.SUSTAINABILITY_MANAGER]: {
    canDelegate: true,
    canViewAllSites: true,
    canManageTargets: true,
    canApproveReports: true,
    canAssignTasks: true,
    canViewSensitiveData: true
  },
  [UserRole.DEPUTY_SUSTAINABILITY_MANAGER]: {
    canDelegate: false,
    canViewAllSites: true,
    canManageTargets: false, // Unless delegated
    canApproveReports: false, // Unless delegated
    canAssignTasks: true,
    canViewSensitiveData: true
  },
  [UserRole.CROSS_SITE_ANALYST]: {
    canDelegate: false,
    canViewAllSites: false, // Only assigned sites
    canManageTargets: false,
    canApproveReports: false,
    canAssignTasks: false,
    canViewSensitiveData: false
  }
};
```

## Implementation Strategy

### Phase 1: Multi-Site Access (Week 1)
1. Create `site_permissions` table
2. Update RLS policies to check both role-based and site-specific permissions
3. Add UI for granting/revoking site access
4. Implement permission checking middleware

### Phase 2: Delegation System (Week 2)
1. Create `role_delegations` table
2. Build delegation management UI
3. Implement delegation workflow (request → approve → activate)
4. Add delegation audit trail

### Phase 3: Enhanced Roles (Week 3)
1. Add new role types (Deputy, Cross-site Analyst, Auditor)
2. Update permission checking logic
3. Migrate existing users to new role structure
4. Test permission inheritance and delegation

## Use Cases

### Use Case 1: ESG Analyst Needs Multi-Site Visibility
**Scenario**: An analyst needs to create a quarterly report across 5 facilities
**Solution**: 
- Grant temporary "view" permission for specific sites via `site_permissions`
- Set expiration date to end of quarter
- Analyst can view data but cannot modify

### Use Case 2: Sustainability Manager Going on Vacation
**Scenario**: SM needs to delegate responsibilities for 2 weeks
**Solution**:
- Create delegation to Deputy SM with specific permissions
- Set effective dates for vacation period
- Deputy can approve reports and manage tasks
- Full audit trail maintained

### Use Case 3: External Auditor Access
**Scenario**: Third-party auditor needs to review ESG data
**Solution**:
- Create "auditor" role with read-only access
- Grant time-limited access to specific sites
- Track all data access for compliance

## Benefits

1. **Flexibility**: Users can have different permissions at different sites
2. **Granularity**: Specific permissions can be granted without full role elevation
3. **Auditability**: Complete trail of who granted what access and why
4. **Temporary Access**: Time-bound permissions for projects or coverage
5. **Delegation**: Clear chain of command with documented handoffs
6. **Compliance**: Meets SOX, CSRD requirements for access control

## Security Considerations

1. **Principle of Least Privilege**: Users only get minimum required access
2. **Time-Boxing**: All special permissions should have expiration dates
3. **Approval Workflow**: Delegations require approval from account owner
4. **Audit Logging**: All permission changes logged for compliance
5. **Regular Reviews**: Quarterly access reviews to remove stale permissions