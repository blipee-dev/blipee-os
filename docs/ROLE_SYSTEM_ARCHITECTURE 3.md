# Role-Based Access Control (RBAC) System Architecture

## Overview
This document outlines the complete RBAC implementation for blipee OS using Supabase's full capabilities including RLS (Row Level Security), Edge Functions, and Auth Hooks.

## Table of Contents
1. [Role Hierarchy](#role-hierarchy)
2. [Database Schema](#database-schema)
3. [Supabase Implementation](#supabase-implementation)
4. [Security Architecture](#security-architecture)
5. [API Design](#api-design)
6. [Best Practices](#best-practices)

## Role Hierarchy

### System Level
- **super_admin**: Platform owners with system-wide access

### Organization Level
- **account_owner**: Single owner per organization with full control
- **organization_manager**: Multiple managers for organization administration
- **regional_manager**: Manages groups of sites within regions

### Site Level
- **facility_manager**: Full control over specific facilities
- **operator**: Active operational role with modification rights
- **viewer**: Read-only access for stakeholders

## Database Schema

### Core Tables

```sql
-- Organizations table (existing)
organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  account_owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- ... other fields
)

-- Sites table with region support
sites (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  region_id UUID REFERENCES regions(id),
  name TEXT NOT NULL,
  -- ... other fields
)

-- Regions for grouping sites
regions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Organization-level roles
user_organization_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  role TEXT CHECK (role IN ('account_owner', 'organization_manager', 'regional_manager')),
  region_ids UUID[], -- For regional managers
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id, role)
)

-- Site-level roles
user_site_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  site_id UUID REFERENCES sites(id),
  role TEXT CHECK (role IN ('facility_manager', 'operator', 'viewer')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, site_id)
)

-- Audit log for role changes
role_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- 'GRANT', 'REVOKE', 'MODIFY'
  target_user_id UUID REFERENCES auth.users(id),
  performed_by UUID REFERENCES auth.users(id),
  role_type TEXT,
  role_value TEXT,
  entity_type TEXT, -- 'organization', 'region', 'site'
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Supabase Implementation

### 1. Row Level Security (RLS) Policies

```sql
-- Helper function to check organization access
CREATE OR REPLACE FUNCTION user_has_org_access(org_id UUID, min_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organization_roles
    WHERE organization_id = org_id 
    AND user_id = auth.uid()
    AND (
      min_role IS NULL OR
      CASE min_role
        WHEN 'account_owner' THEN role = 'account_owner'
        WHEN 'organization_manager' THEN role IN ('account_owner', 'organization_manager')
        ELSE true
      END
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check site access
CREATE OR REPLACE FUNCTION user_has_site_access(site_id UUID, min_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
  v_region_id UUID;
BEGIN
  -- Get site's organization and region
  SELECT organization_id, region_id INTO v_org_id, v_region_id
  FROM sites WHERE id = site_id;
  
  -- Check organization-level access
  IF user_has_org_access(v_org_id, 'organization_manager') THEN
    RETURN true;
  END IF;
  
  -- Check regional manager access
  IF EXISTS (
    SELECT 1 FROM user_organization_roles
    WHERE user_id = auth.uid()
    AND organization_id = v_org_id
    AND role = 'regional_manager'
    AND v_region_id = ANY(region_ids)
  ) THEN
    RETURN true;
  END IF;
  
  -- Check site-level access
  RETURN EXISTS (
    SELECT 1 FROM user_site_roles
    WHERE site_id = site_id
    AND user_id = auth.uid()
    AND (
      min_role IS NULL OR
      CASE min_role
        WHEN 'facility_manager' THEN role = 'facility_manager'
        WHEN 'operator' THEN role IN ('facility_manager', 'operator')
        ELSE true
      END
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Supabase Edge Functions

```typescript
// supabase/functions/check-permission/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { action, resource, resourceId } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  
  if (!user) {
    return new Response(JSON.stringify({ allowed: false }), { status: 401 })
  }
  
  // Complex permission logic here
  const allowed = await checkPermission(user.id, action, resource, resourceId)
  
  return new Response(
    JSON.stringify({ allowed, userId: user.id }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

### 3. Database Triggers for Audit

```sql
-- Trigger function for role audit logging
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO role_audit_log (
      action, target_user_id, performed_by, 
      role_type, role_value, entity_type, entity_id
    ) VALUES (
      'GRANT', NEW.user_id, auth.uid(),
      TG_TABLE_NAME, NEW.role,
      CASE 
        WHEN TG_TABLE_NAME = 'user_organization_roles' THEN 'organization'
        WHEN TG_TABLE_NAME = 'user_site_roles' THEN 'site'
      END,
      CASE 
        WHEN TG_TABLE_NAME = 'user_organization_roles' THEN NEW.organization_id
        WHEN TG_TABLE_NAME = 'user_site_roles' THEN NEW.site_id
      END
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO role_audit_log (
      action, target_user_id, performed_by,
      role_type, role_value, entity_type, entity_id
    ) VALUES (
      'REVOKE', OLD.user_id, auth.uid(),
      TG_TABLE_NAME, OLD.role,
      CASE 
        WHEN TG_TABLE_NAME = 'user_organization_roles' THEN 'organization'
        WHEN TG_TABLE_NAME = 'user_site_roles' THEN 'site'
      END,
      CASE 
        WHEN TG_TABLE_NAME = 'user_organization_roles' THEN OLD.organization_id
        WHEN TG_TABLE_NAME = 'user_site_roles' THEN OLD.site_id
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers
CREATE TRIGGER audit_org_role_changes
  AFTER INSERT OR DELETE ON user_organization_roles
  FOR EACH ROW EXECUTE FUNCTION log_role_change();

CREATE TRIGGER audit_site_role_changes
  AFTER INSERT OR DELETE ON user_site_roles
  FOR EACH ROW EXECUTE FUNCTION log_role_change();
```

### 4. Supabase Auth Hooks

```sql
-- Custom claims for JWT tokens
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_roles jsonb;
BEGIN
  -- Get user's roles
  SELECT jsonb_build_object(
    'organizations', (
      SELECT jsonb_agg(jsonb_build_object(
        'org_id', organization_id,
        'role', role,
        'regions', region_ids
      ))
      FROM user_organization_roles
      WHERE user_id = (event->>'user_id')::uuid
    ),
    'sites', (
      SELECT jsonb_agg(jsonb_build_object(
        'site_id', site_id,
        'role', role
      ))
      FROM user_site_roles
      WHERE user_id = (event->>'user_id')::uuid
    ),
    'is_super_admin', EXISTS(
      SELECT 1 FROM super_admins 
      WHERE user_id = (event->>'user_id')::uuid
    )
  ) INTO user_roles;
  
  -- Add custom claims to the JWT
  claims := event;
  claims := jsonb_set(claims, '{claims, app_roles}', user_roles);
  
  RETURN claims;
END;
$$ LANGUAGE plpgsql;

-- Register the hook
ALTER ROLE authenticator SET pgrst.jwt_secret TO 'your-jwt-secret';
```

## Security Architecture

### 1. Multi-Layer Security
- **Layer 1**: Supabase Auth (authentication)
- **Layer 2**: RLS Policies (row-level authorization)
- **Layer 3**: Application-level checks (business logic)
- **Layer 4**: Audit logging (compliance & monitoring)

### 2. Zero Trust Principles
```typescript
// Every request is verified
export async function checkAccess(
  userId: string,
  action: string,
  resource: string
): Promise<boolean> {
  // Never trust client-side role claims
  const actualRoles = await fetchUserRoles(userId)
  
  // Always verify against database
  return verifyPermission(actualRoles, action, resource)
}
```

### 3. Supabase Realtime for Live Updates
```typescript
// Subscribe to role changes
const subscription = supabase
  .channel('role_changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'user_organization_roles',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Update UI immediately when roles change
      refreshUserPermissions()
    }
  )
  .subscribe()
```

## API Design

### RESTful Endpoints
```typescript
// Role Management APIs
POST   /api/roles/grant
POST   /api/roles/revoke
GET    /api/roles/user/:userId
GET    /api/roles/organization/:orgId
GET    /api/roles/site/:siteId
GET    /api/roles/audit-log

// Permission Checking
POST   /api/permissions/check
GET    /api/permissions/user/:userId
```

### GraphQL Schema (Optional)
```graphql
type User {
  id: ID!
  email: String!
  organizationRoles: [OrganizationRole!]!
  siteRoles: [SiteRole!]!
  
  # Computed fields using Supabase Functions
  canAccessOrganization(orgId: ID!): Boolean!
  canAccessSite(siteId: ID!): Boolean!
  canPerformAction(action: String!, resource: String!): Boolean!
}

type OrganizationRole {
  organization: Organization!
  role: OrganizationRoleType!
  regions: [Region!]
  assignedAt: DateTime!
  assignedBy: User!
}

enum OrganizationRoleType {
  ACCOUNT_OWNER
  ORGANIZATION_MANAGER
  REGIONAL_MANAGER
}
```

## Best Practices

### 1. Use Supabase Service Role Sparingly
```typescript
// ❌ Bad: Using service role in client
const supabase = createClient(url, serviceRoleKey)

// ✅ Good: Use service role only in Edge Functions
const supabase = createClient(url, anonKey)
```

### 2. Leverage Supabase's Built-in Features
- **Row Level Security**: Primary authorization mechanism
- **Edge Functions**: Complex permission logic
- **Realtime**: Live permission updates
- **Storage Policies**: File access control
- **Auth Hooks**: Custom JWT claims

### 3. Performance Optimization
```sql
-- Create composite indexes for permission checks
CREATE INDEX idx_user_org_roles_lookup 
ON user_organization_roles(user_id, organization_id, role);

CREATE INDEX idx_user_site_roles_lookup 
ON user_site_roles(user_id, site_id, role);

-- Use materialized views for complex permission matrices
CREATE MATERIALIZED VIEW user_permissions AS
SELECT 
  u.id as user_id,
  array_agg(DISTINCT o.id) as org_ids,
  array_agg(DISTINCT s.id) as site_ids,
  max(uor.role = 'account_owner') as is_owner,
  max(uor.role = 'organization_manager') as is_org_manager
FROM auth.users u
LEFT JOIN user_organization_roles uor ON u.id = uor.user_id
LEFT JOIN organizations o ON uor.organization_id = o.id
LEFT JOIN user_site_roles usr ON u.id = usr.user_id
LEFT JOIN sites s ON usr.site_id = s.id
GROUP BY u.id;

-- Refresh periodically
CREATE OR REPLACE FUNCTION refresh_user_permissions()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_permissions;
END;
$$ LANGUAGE plpgsql;
```

### 4. Testing Strategy
```typescript
// Test different role scenarios
describe('Role-Based Access Control', () => {
  test('account_owner can delete organization', async () => {
    const { data, error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId)
    expect(error).toBeNull()
  })
  
  test('operator cannot create sites', async () => {
    const { data, error } = await supabase
      .from('sites')
      .insert({ name: 'New Site' })
    expect(error.code).toBe('42501') // RLS violation
  })
})
```

## Migration Path

1. **Phase 1**: Create new role tables alongside existing system
2. **Phase 2**: Migrate existing roles to new structure
3. **Phase 3**: Update RLS policies to use new functions
4. **Phase 4**: Deploy Edge Functions for complex permissions
5. **Phase 5**: Deprecate old role system

## Monitoring & Compliance

### Audit Dashboard Queries
```sql
-- Most active role granters
SELECT 
  performed_by,
  COUNT(*) as actions,
  array_agg(DISTINCT action) as action_types
FROM role_audit_log
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY performed_by
ORDER BY actions DESC;

-- Privilege escalation detection
SELECT * FROM role_audit_log
WHERE action = 'GRANT'
AND role_value IN ('account_owner', 'organization_manager')
AND performed_by != target_user_id
ORDER BY created_at DESC;
```

## Support & Troubleshooting

### Common Issues
1. **RLS Policy Violations**: Check user_has_org_access() and user_has_site_access()
2. **JWT Token Size**: Limit custom claims to essential data
3. **Performance**: Use connection pooling and prepared statements

### Debug Helpers
```sql
-- Check user's effective permissions
CREATE OR REPLACE FUNCTION debug_user_permissions(user_id UUID)
RETURNS TABLE(
  permission_type TEXT,
  entity_name TEXT,
  role TEXT,
  granted_by TEXT,
  granted_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Return all permissions for debugging
  RETURN QUERY
  SELECT 
    'Organization' as permission_type,
    o.name as entity_name,
    uor.role,
    u.email as granted_by,
    uor.assigned_at as granted_at
  FROM user_organization_roles uor
  JOIN organizations o ON uor.organization_id = o.id
  LEFT JOIN auth.users u ON uor.assigned_by = u.id
  WHERE uor.user_id = $1
  
  UNION ALL
  
  SELECT 
    'Site' as permission_type,
    s.name as entity_name,
    usr.role,
    u.email as granted_by,
    usr.assigned_at as granted_at
  FROM user_site_roles usr
  JOIN sites s ON usr.site_id = s.id
  LEFT JOIN auth.users u ON usr.assigned_by = u.id
  WHERE usr.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Conclusion

This RBAC system leverages Supabase's full capabilities to provide:
- Enterprise-grade security
- Granular permissions
- Complete audit trail
- Real-time updates
- Scalable architecture

The system is designed to handle complex organizational structures while maintaining performance and security.