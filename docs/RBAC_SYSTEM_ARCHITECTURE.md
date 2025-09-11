# Enterprise RBAC System Architecture for Blipee OS

## Executive Summary

This document defines a flexible, scalable Role-Based Access Control (RBAC) system that:
- Complies with industry standards (ISO 27001, SOC 2, CSRD, GRI)
- Supports multi-tenancy and multi-site operations
- Implements strict top-down permission hierarchy
- Provides flexibility for complex organizational structures

## Core Design Principles

### 1. **Hierarchical Permission Model (Top → Down)**
- Permissions flow from higher roles to lower roles
- No role can grant permissions they don't possess
- Clear separation of duties at each level

### 2. **Multi-Tenancy Architecture**
- Complete data isolation between organizations
- Shared infrastructure with logical separation
- Organization-specific customization capabilities

### 3. **Multi-Site Flexibility**
- Sites belong to organizations
- Users can have different roles at different sites
- Cross-site permissions for reporting and analysis

### 4. **Industry Compliance**
- CSRD: Audit trail for all ESG data changes
- GRI: Role-based data access for materiality assessments
- ISO 27001: Principle of least privilege
- SOC 2: Access control and monitoring

## Hierarchical Role Structure

```
┌─────────────────────────────────────────────────────┐
│                   PLATFORM LEVEL                     │
├─────────────────────────────────────────────────────┤
│  SUPER_ADMIN (Platform)                             │
│  └─ Full system access, all organizations           │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                ORGANIZATION LEVEL                    │
├─────────────────────────────────────────────────────┤
│  ORGANIZATION_OWNER                                 │
│  ├─ Full control of organization                    │
│  └─ Can create/delete sites, manage billing         │
│                                                      │
│  ORGANIZATION_ADMIN                                 │
│  ├─ Manage organization settings                    │
│  └─ Cannot delete org or change billing             │
│                                                      │
│  SUSTAINABILITY_DIRECTOR                            │
│  ├─ ESG strategy and compliance                     │
│  └─ Access to all sites for reporting               │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                   REGIONAL LEVEL                     │
├─────────────────────────────────────────────────────┤
│  REGIONAL_MANAGER                                   │
│  ├─ Manage multiple sites in a region               │
│  └─ Consolidated reporting and targets              │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                     SITE LEVEL                       │
├─────────────────────────────────────────────────────┤
│  SITE_MANAGER                                       │
│  ├─ Full control of assigned site(s)                │
│  └─ Local ESG implementation                        │
│                                                      │
│  SITE_ANALYST                                       │
│  ├─ Data entry and analysis                         │
│  └─ Report generation                               │
│                                                      │
│  SITE_OPERATOR                                      │
│  ├─ Daily operations and data collection            │
│  └─ Limited to assigned areas                       │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                   EXTERNAL LEVEL                     │
├─────────────────────────────────────────────────────┤
│  AUDITOR                                            │
│  ├─ Read-only access with audit trail               │
│  └─ Time-limited access                             │
│                                                      │
│  STAKEHOLDER                                        │
│  ├─ View published reports only                     │
│  └─ No operational access                           │
└─────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

```sql
-- 1. Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subscription_tier TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sites (Facilities/Locations)
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    region TEXT,
    country TEXT NOT NULL,
    site_type TEXT, -- factory, office, warehouse, etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Roles (Predefined)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    level TEXT NOT NULL, -- platform, organization, regional, site, external
    permissions JSONB NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE -- System roles cannot be modified
);

-- 4. User Role Assignments
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE, -- NULL for org-level roles
    region TEXT, -- For regional managers
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- For temporary access
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id, organization_id, site_id)
);

-- 5. Permission Overrides (For flexibility)
CREATE TABLE permission_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id),
    resource_type TEXT NOT NULL, -- 'report', 'emissions', 'targets', etc.
    resource_id UUID, -- Specific resource if applicable
    permission TEXT NOT NULL, -- 'view', 'edit', 'delete', 'approve'
    granted_by UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL, -- Audit requirement
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Delegation System
CREATE TABLE delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    delegate_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    delegator_role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
    scope TEXT NOT NULL, -- 'full', 'partial'
    permissions JSONB, -- Specific permissions if partial
    reason TEXT NOT NULL,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ
);

-- 7. Audit Log (Compliance requirement)
CREATE TABLE access_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    organization_id UUID REFERENCES organizations(id),
    site_id UUID REFERENCES sites(id),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Permission Matrix

### Organization-Level Permissions

| Permission | Owner | Admin | Sustainability Director | Regional Manager | Site Manager | Analyst | Operator | Auditor |
|------------|-------|-------|------------------------|------------------|--------------|---------|----------|---------|
| Manage Organization | ✓ | ✓ | - | - | - | - | - | - |
| Manage Billing | ✓ | - | - | - | - | - | - | - |
| Create Sites | ✓ | ✓ | - | - | - | - | - | - |
| Delete Sites | ✓ | - | - | - | - | - | - | - |
| Manage Users | ✓ | ✓ | Partial | - | - | - | - | - |
| Set ESG Strategy | ✓ | ✓ | ✓ | - | - | - | - | - |
| Approve Reports | ✓ | ✓ | ✓ | ✓ | - | - | - | - |
| View All Sites | ✓ | ✓ | ✓ | Region Only | Site Only | Site Only | Site Only | ✓ |

### Site-Level Permissions

| Permission | Site Manager | Site Analyst | Site Operator | Auditor |
|------------|--------------|--------------|---------------|---------|
| Manage Site Settings | ✓ | - | - | - |
| Input Emissions Data | ✓ | ✓ | ✓ | - |
| Edit Historical Data | ✓ | ✓ | - | - |
| Generate Reports | ✓ | ✓ | - | - |
| Set Local Targets | ✓ | - | - | - |
| View Sensitive Data | ✓ | ✓ | - | ✓ |
| Export Data | ✓ | ✓ | - | ✓ |

## Multi-Site Access Patterns

### 1. Cross-Site Analyst
```typescript
// User needs to analyze data across multiple sites
interface CrossSiteAccess {
  userId: string;
  baseRole: 'SITE_ANALYST';
  primarySite: string;
  additionalSites: Array<{
    siteId: string;
    permissions: ['view', 'export'];
    reason: string;
    expiresAt?: Date;
  }>;
}
```

### 2. Regional Oversight
```typescript
// Regional manager oversees multiple sites
interface RegionalAccess {
  userId: string;
  role: 'REGIONAL_MANAGER';
  region: string;
  sites: string[]; // Auto-populated based on region
  permissions: ['view', 'edit', 'approve'];
}
```

### 3. Temporary Project Access
```typescript
// Consultant needs temporary access
interface ProjectAccess {
  userId: string;
  role: 'EXTERNAL_CONSULTANT';
  sites: string[];
  permissions: ['view'];
  validFrom: Date;
  validUntil: Date;
  approvedBy: string;
}
```

## Implementation Rules

### 1. Permission Inheritance
- Higher roles automatically inherit all permissions of lower roles
- Organization-level roles have implicit access to all sites
- Regional roles have implicit access to sites in their region

### 2. Delegation Rules
- Users can only delegate permissions they possess
- Delegations require approval from role superior
- All delegations are time-bounded (max 90 days)
- Delegation audit trail maintained

### 3. Multi-Tenancy Isolation
- RLS policies enforce organization boundaries
- No cross-organization data access (except SUPER_ADMIN)
- Separate storage buckets per organization

### 4. Compliance Requirements
- All data access logged in audit table
- Quarterly access reviews required
- Automatic revocation of expired permissions
- Data retention policies per role

## API Implementation

### Check User Permissions
```typescript
async function checkUserPermission(
  userId: string,
  resource: string,
  action: string,
  context: {
    organizationId: string;
    siteId?: string;
  }
): Promise<boolean> {
  // 1. Check if super admin
  if (await isSuperAdmin(userId)) return true;
  
  // 2. Check direct role permissions
  const roles = await getUserRoles(userId, context);
  for (const role of roles) {
    if (roleHasPermission(role, resource, action)) return true;
  }
  
  // 3. Check permission overrides
  const overrides = await getPermissionOverrides(userId, context);
  if (overrideGrantsPermission(overrides, resource, action)) return true;
  
  // 4. Check active delegations
  const delegations = await getActiveDelegations(userId);
  if (delegationGrantsPermission(delegations, resource, action)) return true;
  
  // 5. Log access attempt
  await logAccessAttempt(userId, resource, action, false);
  
  return false;
}
```

### Grant Multi-Site Access
```typescript
async function grantMultiSiteAccess(
  userId: string,
  sites: string[],
  permissions: string[],
  reason: string,
  expiresAt?: Date
): Promise<void> {
  // Validate requester has permission to grant
  const canGrant = await checkUserPermission(
    requesterId,
    'user_management',
    'grant_access',
    { organizationId }
  );
  
  if (!canGrant) throw new ForbiddenError();
  
  // Create permission overrides for each site
  for (const siteId of sites) {
    await createPermissionOverride({
      userId,
      siteId,
      permissions,
      reason,
      expiresAt,
      grantedBy: requesterId
    });
  }
  
  // Send notification to user
  await notifyUserOfAccessGrant(userId, sites, permissions);
}
```

## Security Best Practices

1. **Principle of Least Privilege**: Users get minimum required access
2. **Separation of Duties**: Critical actions require multiple roles
3. **Time-Bounded Access**: All special permissions expire
4. **Regular Access Reviews**: Quarterly audit of all permissions
5. **Break-Glass Procedures**: Emergency access with heavy auditing
6. **Zero Trust Architecture**: Verify every access request

## Compliance Mapping

### CSRD Requirements
- ✓ Audit trail for all ESG data modifications
- ✓ Role-based access to materiality assessments
- ✓ External auditor access provisions
- ✓ Data lineage and approval workflows

### GRI Standards
- ✓ Stakeholder access to reports
- ✓ Data governance roles defined
- ✓ Management approval workflows
- ✓ Third-party verification support

### ISO 27001
- ✓ Access control policy implemented
- ✓ User access provisioning/deprovisioning
- ✓ Privileged access management
- ✓ Access logging and monitoring

## Migration Path

### Phase 1: Core RBAC (Week 1-2)
1. Deploy role and permission tables
2. Migrate existing users to new roles
3. Implement permission checking

### Phase 2: Multi-Site Support (Week 3)
1. Add site-level permissions
2. Implement cross-site access
3. Deploy permission overrides

### Phase 3: Delegation & Audit (Week 4)
1. Deploy delegation system
2. Implement audit logging
3. Add compliance reports

## Success Metrics

- **Security**: Zero unauthorized access incidents
- **Flexibility**: 90% of access requests handled without custom code
- **Performance**: Permission checks < 50ms
- **Compliance**: 100% audit coverage of sensitive operations
- **User Experience**: Self-service for 80% of access requests