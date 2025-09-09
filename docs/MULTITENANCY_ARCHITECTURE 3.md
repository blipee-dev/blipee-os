# Multi-Tenancy Architecture

## Overview
blipee OS implements a **hybrid multi-tenancy model** that combines the security of data isolation with the flexibility of shared infrastructure. This document explains how we achieve enterprise-grade multi-tenancy using Supabase's Row Level Security (RLS) and our role-based access control system.

## Multi-Tenancy Model

### Tenant Hierarchy
```
Platform (Single Database)
├── Organization 1 (Tenant)
│   ├── Region A
│   │   ├── Site 1
│   │   │   └── Devices
│   │   └── Site 2
│   │       └── Devices
│   └── Region B
│       └── Site 3
│           └── Devices
├── Organization 2 (Tenant)
│   └── Site 4
│       └── Devices
└── Organization N (Tenant)
```

## Implementation Strategy

### 1. Database Architecture: **Single Database, Row-Level Isolation**

We use a **single database with row-level security** approach because:
- **Cost Effective**: One database for all tenants
- **Easy Maintenance**: Single schema to manage
- **Scalable**: Supabase handles millions of rows efficiently
- **Secure**: PostgreSQL RLS provides bulletproof isolation
- **Flexible**: Easy to share data between tenants when needed

### 2. Tenant Identification

Every table has an `organization_id` column that identifies the tenant:

```sql
-- All tenant-specific tables follow this pattern
CREATE TABLE sites (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id), -- Tenant ID
    name TEXT,
    -- ... other fields
);

CREATE TABLE devices (
    id UUID PRIMARY KEY,
    site_id UUID REFERENCES sites(id),
    -- organization_id derived through site relationship
    -- ... other fields
);
```

### 3. Data Isolation via RLS

**Every query automatically filters by tenant** using Row Level Security:

```sql
-- Users can only see data from their organizations
CREATE POLICY "tenant_isolation" ON sites FOR ALL
USING (
    -- Check if user belongs to the organization
    organization_id IN (
        SELECT organization_id 
        FROM user_organization_roles 
        WHERE user_id = auth.uid()
    )
);
```

### 4. Multi-Tenancy Features

#### A. Complete Data Isolation
- Each organization's data is completely isolated
- No accidental data leaks between tenants
- Queries automatically filtered by RLS

#### B. Tenant-Specific Configurations
```sql
-- Each organization has its own settings
organizations (
    id UUID PRIMARY KEY,
    name TEXT,
    subscription_tier TEXT, -- 'starter', 'professional', 'enterprise'
    enabled_features TEXT[], -- Feature flags per tenant
    compliance_frameworks TEXT[], -- GRI, ISO, etc.
    custom_branding JSONB, -- Tenant-specific UI customization
    api_limits JSONB, -- Rate limits per tenant
    data_retention_days INTEGER -- Tenant-specific retention
)
```

#### C. Cross-Tenant Access (When Needed)
Super admins can access all tenants for support:
```sql
-- Super admin bypass for support
IF is_current_user_super_admin() THEN
    -- Can see all organizations
    RETURN TRUE;
END IF;
```

## Security Layers

### Layer 1: Authentication (Supabase Auth)
- User must be authenticated
- JWT tokens contain user ID
- Session management handled by Supabase

### Layer 2: Tenant Assignment
- Users are explicitly assigned to organizations
- `user_organization_roles` table maps users to tenants
- Multiple tenant support (user can belong to multiple orgs)

### Layer 3: Row Level Security
- PostgreSQL RLS policies enforce tenant isolation
- Every query automatically filtered
- Cannot be bypassed by application code

### Layer 4: Application Logic
- Additional business rules
- Feature flags per tenant
- Rate limiting per organization

## Performance Optimizations

### 1. Tenant-Aware Indexes
```sql
-- Composite indexes for tenant queries
CREATE INDEX idx_sites_org_lookup ON sites(organization_id, status);
CREATE INDEX idx_devices_org_lookup ON devices(
    (SELECT organization_id FROM sites WHERE id = devices.site_id),
    status
);
```

### 2. Partition Strategy (Future)
For massive scale, we can partition by organization:
```sql
-- Future: Partition large tables by organization
CREATE TABLE measurements_2024 PARTITION OF measurements
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')
PARTITION BY HASH (organization_id);
```

### 3. Caching Strategy
```typescript
// Tenant-specific caching keys
const cacheKey = `org:${organizationId}:${resource}:${id}`;

// Redis/Upstash for tenant-specific caches
await redis.set(cacheKey, data, { ex: 3600 });
```

## Multi-Tenant User Scenarios

### Scenario 1: User in Multiple Organizations
```typescript
// User can switch between organizations
const userOrgs = await getUserOrganizations(userId);
// Returns: [
//   { id: 'org1', name: 'Company A', role: 'organization_manager' },
//   { id: 'org2', name: 'Company B', role: 'viewer' }
// ]

// Set active organization in session
await setActiveOrganization(orgId);
```

### Scenario 2: Consultant Access
```sql
-- Temporary access with expiration
INSERT INTO user_organization_roles (
    user_id, 
    organization_id, 
    role,
    expires_at -- Automatically revoked after this date
) VALUES (
    'consultant-id',
    'client-org-id',
    'viewer',
    NOW() + INTERVAL '30 days'
);
```

### Scenario 3: Regional Manager
```sql
-- Manager for specific regions only
INSERT INTO user_organization_roles (
    user_id,
    organization_id,
    role,
    region_ids -- Only these regions
) VALUES (
    'manager-id',
    'org-id',
    'regional_manager',
    ARRAY['region-1-id', 'region-2-id']
);
```

## API Design for Multi-Tenancy

### Headers
```typescript
// Every API request includes organization context
headers: {
  'X-Organization-ID': 'org-uuid', // Current tenant
  'Authorization': 'Bearer token'   // User auth
}
```

### API Middleware
```typescript
// Middleware validates tenant access
export async function validateTenant(req: Request) {
  const orgId = req.headers['X-Organization-ID'];
  const user = await getUser(req);
  
  // Check user has access to this tenant
  const hasAccess = await userHasOrgAccess(user.id, orgId);
  if (!hasAccess) {
    throw new Error('Access denied to this organization');
  }
  
  // Set tenant context for all queries
  req.tenantId = orgId;
}
```

### Supabase Client Configuration
```typescript
// Tenant-aware Supabase client
export function createTenantClient(organizationId: string) {
  const supabase = createClient();
  
  // All queries will be filtered by this org
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      // Add organization to RLS context
      supabase.rpc('set_current_tenant', { 
        org_id: organizationId 
      });
    }
  });
  
  return supabase;
}
```

## Billing & Limits Per Tenant

### Subscription Tiers
```typescript
const TIER_LIMITS = {
  starter: {
    users: 10,
    sites: 3,
    devices: 100,
    api_calls_per_month: 10000,
    data_retention_days: 30
  },
  professional: {
    users: 50,
    sites: 20,
    devices: 1000,
    api_calls_per_month: 100000,
    data_retention_days: 90
  },
  enterprise: {
    users: -1, // Unlimited
    sites: -1,
    devices: -1,
    api_calls_per_month: -1,
    data_retention_days: 365
  }
};
```

### Enforcement
```typescript
// Check limits before operations
async function canAddUser(orgId: string): boolean {
  const org = await getOrganization(orgId);
  const limits = TIER_LIMITS[org.subscription_tier];
  const currentUsers = await countOrgUsers(orgId);
  
  return limits.users === -1 || currentUsers < limits.users;
}
```

## Data Migration Between Tenants

### Export Organization Data
```sql
-- Export all organization data
CREATE OR REPLACE FUNCTION export_organization(org_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'organization', (SELECT row_to_json(o) FROM organizations o WHERE id = org_id),
        'sites', (SELECT jsonb_agg(row_to_json(s)) FROM sites s WHERE organization_id = org_id),
        'users', (SELECT jsonb_agg(row_to_json(u)) FROM user_organization_roles u WHERE organization_id = org_id),
        'devices', (SELECT jsonb_agg(row_to_json(d)) FROM devices d WHERE site_id IN (SELECT id FROM sites WHERE organization_id = org_id))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Compliance & Auditing

### Tenant-Specific Audit Logs
```sql
-- All actions logged with tenant context
role_audit_log (
    id UUID,
    organization_id UUID, -- Tenant context
    action TEXT,
    performed_by UUID,
    target_entity TEXT,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ
)
```

### Data Residency (Future)
```typescript
// Regional database selection
const REGIONAL_DATABASES = {
  'eu': 'supabase-eu-instance',
  'us': 'supabase-us-instance',
  'asia': 'supabase-asia-instance'
};

// Route based on organization's region
function getRegionalClient(org: Organization) {
  const region = org.data_residency_region;
  return createClient(REGIONAL_DATABASES[region]);
}
```

## Testing Multi-Tenancy

### Test Scenarios
```typescript
describe('Multi-Tenancy Tests', () => {
  test('User cannot access other tenant data', async () => {
    const user1 = await createUser({ org: 'org1' });
    const user2 = await createUser({ org: 'org2' });
    
    // User1 tries to access Org2 data
    const { error } = await supabase
      .auth.signInWithPassword(user1)
      .from('sites')
      .select('*')
      .eq('organization_id', 'org2');
    
    expect(error.code).toBe('42501'); // RLS violation
  });
  
  test('Super admin can access all tenants', async () => {
    const superAdmin = await loginAsSuperAdmin();
    
    const { data: org1Sites } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', 'org1');
    
    const { data: org2Sites } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', 'org2');
    
    expect(org1Sites).toBeDefined();
    expect(org2Sites).toBeDefined();
  });
});
```

## Best Practices

### 1. Always Include Tenant Context
```typescript
// ❌ Bad: No tenant context
const sites = await supabase.from('sites').select('*');

// ✅ Good: Tenant context in RLS
const sites = await supabase
  .from('sites')
  .select('*'); // RLS automatically filters by user's orgs
```

### 2. Validate Tenant Access Early
```typescript
// Middleware checks tenant access before processing
app.use('/api/*', validateTenantAccess);
```

### 3. Use Composite Keys
```sql
-- Ensure uniqueness within tenant
CREATE UNIQUE INDEX idx_unique_site_name_per_org 
ON sites(organization_id, slug);
```

### 4. Monitor Tenant Usage
```typescript
// Track API usage per tenant
await redis.incr(`usage:${orgId}:api_calls:${date}`);
```

### 5. Implement Soft Deletes
```sql
-- Keep data for compliance but hide from tenant
ALTER TABLE sites ADD COLUMN deleted_at TIMESTAMPTZ;

-- Update RLS policy
CREATE POLICY "hide_deleted" ON sites
FOR SELECT USING (deleted_at IS NULL);
```

## Scaling Considerations

### Current: 0-1000 Organizations
- Single database
- RLS for isolation
- Basic indexes

### Growth: 1000-10,000 Organizations  
- Read replicas
- Materialized views
- Redis caching

### Scale: 10,000+ Organizations
- Database sharding by org
- Regional deployments
- CDN for static assets
- Dedicated clusters for large tenants

## Conclusion

Our multi-tenancy implementation provides:
- ✅ Complete data isolation between tenants
- ✅ Flexible access control within tenants
- ✅ Scalable to thousands of organizations
- ✅ Cost-effective single database approach
- ✅ Enterprise-grade security via RLS
- ✅ Support for complex organizational structures
- ✅ Built-in audit and compliance features

The combination of Supabase's Row Level Security and our comprehensive role system creates a robust, secure, and scalable multi-tenant platform.