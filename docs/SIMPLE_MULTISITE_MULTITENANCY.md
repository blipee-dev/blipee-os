# Simple Multi-Site & Multi-Tenancy Solution

## The Elegant Approach

### Core Concept: Resource-Based Access
Instead of complex hierarchies, treat everything as a "resource" with access control.

## Database Schema (Only 4 Tables!)

```sql
-- 1. Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sites (Belong to Organizations)
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Access (The Magic Table)
CREATE TABLE user_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL, -- 'organization', 'site', 'group'
    resource_id UUID NOT NULL,   -- ID of the org/site/group
    role TEXT NOT NULL,          -- 'owner', 'manager', 'member', 'viewer'
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,      -- Optional expiration
    
    -- Prevent duplicate access entries
    UNIQUE(user_id, resource_type, resource_id),
    
    -- Fast lookups
    INDEX idx_user_lookup (user_id, resource_type),
    INDEX idx_resource_lookup (resource_id, resource_type)
);

-- 4. Groups (For Multi-Site Access)
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    site_ids UUID[] NOT NULL DEFAULT '{}', -- Array of site IDs
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## How It Works

### 1. Multi-Tenancy (Organization Isolation)

```typescript
// User access to organization
await db.insert('user_access', {
  user_id: 'user-123',
  resource_type: 'organization',
  resource_id: 'org-abc',
  role: 'manager'
});

// Check org access
async function getUserOrganizations(userId: string) {
  return await db.query(`
    SELECT o.*, ua.role 
    FROM organizations o
    JOIN user_access ua ON ua.resource_id = o.id
    WHERE ua.user_id = $1 
      AND ua.resource_type = 'organization'
      AND (ua.expires_at IS NULL OR ua.expires_at > NOW())
  `, [userId]);
}
```

### 2. Multi-Site Access (Three Patterns)

#### Pattern A: Direct Site Access
```typescript
// Give user access to specific sites
const sites = ['site-1', 'site-2', 'site-3'];
for (const siteId of sites) {
  await db.insert('user_access', {
    user_id: 'analyst-123',
    resource_type: 'site',
    resource_id: siteId,
    role: 'viewer',  // Read-only for analyst
    expires_at: '2024-12-31' // Time-limited
  });
}
```

#### Pattern B: Group-Based Access (Recommended)
```typescript
// Create a group for "European Sites"
const group = await db.insert('groups', {
  organization_id: 'org-abc',
  name: 'European Sites',
  site_ids: ['site-uk', 'site-de', 'site-fr']
});

// Give user access to the group
await db.insert('user_access', {
  user_id: 'regional-manager',
  resource_type: 'group',
  resource_id: group.id,
  role: 'manager'
});

// Check what sites user can access
async function getUserSites(userId: string, orgId: string) {
  const sites = await db.query(`
    -- Direct site access
    SELECT s.*, ua.role, 'direct' as access_type
    FROM sites s
    JOIN user_access ua ON ua.resource_id = s.id
    WHERE ua.user_id = $1 
      AND ua.resource_type = 'site'
      AND s.organization_id = $2
    
    UNION
    
    -- Group-based site access
    SELECT s.*, ua.role, 'group' as access_type
    FROM sites s
    JOIN groups g ON s.id = ANY(g.site_ids)
    JOIN user_access ua ON ua.resource_id = g.id
    WHERE ua.user_id = $1
      AND ua.resource_type = 'group'
      AND s.organization_id = $2
    
    UNION
    
    -- Organization-level access (sees all sites)
    SELECT s.*, ua.role, 'organization' as access_type
    FROM sites s
    JOIN user_access ua ON ua.resource_id = s.organization_id
    WHERE ua.user_id = $1
      AND ua.resource_type = 'organization'
      AND ua.role IN ('owner', 'manager')
      AND s.organization_id = $2
  `, [userId, orgId]);
  
  return sites;
}
```

#### Pattern C: Inheritance from Organization
```typescript
// Organization managers/owners automatically see all sites
if (userRole === 'owner' || userRole === 'manager') {
  // Has access to ALL sites in the organization
  return allSitesInOrg;
}
```

## Real-World Examples

### Example 1: Sustainability Manager Delegation
```typescript
// Original Sustainability Manager
const originalAccess = {
  user_id: 'susan-sm',
  resource_type: 'organization',
  resource_id: 'org-abc',
  role: 'manager'
};

// When Susan goes on vacation, give temporary access to deputy
const deputyAccess = {
  user_id: 'john-deputy',
  resource_type: 'organization', 
  resource_id: 'org-abc',
  role: 'manager',
  expires_at: '2024-02-01', // Expires when Susan returns
  granted_by: 'susan-sm'
};

// No complex delegation table needed!
```

### Example 2: Cross-Site Analyst
```typescript
// Create a group for sites the analyst needs
const analystGroup = await db.insert('groups', {
  name: 'Q4 Analysis Sites',
  site_ids: ['site-1', 'site-2', 'site-3', 'site-4'],
  organization_id: 'org-abc'
});

// Grant analyst access to the group
await db.insert('user_access', {
  user_id: 'analyst-jane',
  resource_type: 'group',
  resource_id: analystGroup.id,
  role: 'viewer',
  expires_at: '2024-01-31' // Until analysis is complete
});
```

### Example 3: External Auditor
```typescript
// Create limited group for auditor
const auditGroup = await db.insert('groups', {
  name: 'FY2024 Audit Sites',
  site_ids: ['site-main', 'site-secondary'],
  organization_id: 'org-abc'
});

// Grant time-limited access
await db.insert('user_access', {
  user_id: 'external-auditor',
  resource_type: 'group',
  resource_id: auditGroup.id,
  role: 'viewer',
  expires_at: '2024-03-31'
});
```

## The Permission Check (Dead Simple)

```typescript
class SimplePermissions {
  // One method to rule them all
  async canUserAccessSite(
    userId: string, 
    siteId: string, 
    requiredRole?: string
  ): Promise<boolean> {
    const access = await db.query(`
      WITH user_roles AS (
        -- Direct site access
        SELECT role FROM user_access 
        WHERE user_id = $1 AND resource_type = 'site' AND resource_id = $2
        
        UNION
        
        -- Group access
        SELECT ua.role FROM user_access ua
        JOIN groups g ON ua.resource_id = g.id
        WHERE ua.user_id = $1 
          AND ua.resource_type = 'group'
          AND $2 = ANY(g.site_ids)
        
        UNION
        
        -- Organization access
        SELECT ua.role FROM user_access ua
        JOIN sites s ON s.organization_id = ua.resource_id
        WHERE ua.user_id = $1
          AND ua.resource_type = 'organization'
          AND s.id = $2
          AND ua.role IN ('owner', 'manager')
      )
      SELECT role FROM user_roles
      LIMIT 1
    `, [userId, siteId]);
    
    if (!access) return false;
    
    // If specific role required, check hierarchy
    if (requiredRole) {
      return this.roleHasPermission(access.role, requiredRole);
    }
    
    return true;
  }
  
  private roleHasPermission(userRole: string, requiredRole: string): boolean {
    const hierarchy = {
      'owner': 4,
      'manager': 3,
      'member': 2,
      'viewer': 1
    };
    
    return hierarchy[userRole] >= hierarchy[requiredRole];
  }
}
```

## Why This Works Better

### 1. **Performance**
- Single table lookup (with indexes)
- No complex joins through 7 tables
- Cache-friendly (simple key-value)

### 2. **Flexibility**
- Add user to multiple sites: Just insert rows
- Temporary access: Set expires_at
- Regional access: Create a group
- Delegation: Grant temporary role

### 3. **Simplicity**
- Developers understand it immediately
- Easy to debug (just look at user_access table)
- Easy to audit (everything in one place)

### 4. **Scalability**
- Works for 10 users or 10,000 users
- Add PostgreSQL read replicas if needed
- Cache permissions in Redis if needed

## Migration from Current System

```sql
-- You already have user_organizations table, just enhance it
ALTER TABLE user_organizations 
  RENAME TO user_access;

ALTER TABLE user_access
  ADD COLUMN resource_type TEXT DEFAULT 'organization',
  ADD COLUMN expires_at TIMESTAMPTZ;

UPDATE user_access 
  SET resource_type = 'organization',
      resource_id = organization_id;

-- That's it! You're migrated.
```

## The UI Components

```typescript
// Simple UI for managing access
function AccessManager({ userId }: { userId: string }) {
  return (
    <div>
      {/* Organization Access */}
      <Section title="Organization Access">
        <RoleSelector 
          resourceType="organization"
          resourceId={orgId}
          currentRole={userOrgRole}
        />
      </Section>
      
      {/* Direct Site Access */}
      <Section title="Site Access">
        <SiteList sites={directSites} />
        <AddSiteAccess userId={userId} />
      </Section>
      
      {/* Group Memberships */}
      <Section title="Group Access">
        <GroupList groups={userGroups} />
        <AddToGroup userId={userId} />
      </Section>
      
      {/* Temporary Access */}
      {temporaryAccess.length > 0 && (
        <Alert>
          Temporary access expires: {temporaryAccess[0].expires_at}
        </Alert>
      )}
    </div>
  );
}
```

## Examples from Real Companies

### How Notion Does It
- Workspaces (like our Organizations)
- Pages can be shared individually (like our Sites)
- Groups for team access
- Guest access with expiration

### How Airtable Does It
- Workspaces → Bases → Tables
- Share at any level
- Viewer/Commenter/Editor/Owner (4 roles!)
- Groups for teams

### How Slack Does It
- Workspaces (tenants)
- Channels (resources)
- @usergroups (groups)
- Guest access (expiring)

**They all use this simple pattern!**

## Summary

This simple approach gives you:
- ✅ **Multi-tenancy**: Through organization isolation
- ✅ **Multi-site**: Through groups and direct access
- ✅ **Delegation**: Through temporary role elevation
- ✅ **Flexibility**: Through resource-based permissions
- ✅ **Performance**: Through simple, indexed queries
- ✅ **Compliance**: Through built-in expiration and audit

All with just 4 tables and 4 roles. This is how the best companies do it.