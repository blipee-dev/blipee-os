# Authentication Quick Reference Guide

## For Developers

This is a quick reference guide for common authentication and authorization tasks in blipee OS. For detailed information, see `AUTH_SYSTEM_OVERVIEW.md`.

---

## Quick Start Checklist

### Setting Up Locally

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Add required variables
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# 3. Email configuration (required for user invitations)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@blipee.com
SMTP_PASSWORD=your-app-password

# 4. Install dependencies
npm install

# 5. Run development server
npm run dev
```

---

## Common Tasks

### 1. Check if User is Authenticated

```typescript
// Client-side component
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function MyComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  if (!user) {
    return <div>Please sign in</div>;
  }

  return <div>Hello, {user.email}</div>;
}
```

```typescript
// Server-side (API route)
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated
  return NextResponse.json({ user });
}
```

---

### 2. Check User Permissions

```typescript
import { PermissionService } from '@/lib/auth/permission-service';

// In API route or server component
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user can manage users
  const canManageUsers = await PermissionService.canManageUsers(
    user.id,
    organizationId
  );

  if (!canManageUsers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // User has permission, proceed
}
```

**Available permission methods**:
```typescript
PermissionService.isSuperAdmin(userId)
PermissionService.canManageUsers(userId, orgId?)
PermissionService.canManageOrganizations(userId, orgId?)
PermissionService.canViewSites(userId, siteId?)
PermissionService.canManageSites(userId, siteId?)
PermissionService.canViewData(userId, orgId?)
PermissionService.canEditData(userId, orgId?)
PermissionService.checkPermission(userId, resource, action, resourceId?)
```

---

### 3. Get User's Role

```typescript
import { PermissionService } from '@/lib/auth/permission-service';

const role = await PermissionService.getUserOrgRole(userId, organizationId);
// Returns: 'owner' | 'manager' | 'member' | 'viewer' | null
```

---

### 4. Create a New User (Invitation)

```typescript
// POST /api/users/manage
const response = await fetch('/api/users/manage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@company.com',
    role: 'member', // 'owner' | 'manager' | 'member' | 'viewer'
    organization_id: 'org-uuid',
    access_level: 'organization', // or 'site'
    site_ids: [], // required if access_level is 'site'
    status: 'pending'
  })
});

const { user } = await response.json();
// Invitation email is sent automatically
```

---

### 5. Protect a Page

```typescript
// app/protected-page/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  return <div>Protected content for {user.email}</div>;
}
```

---

### 6. Protect an API Route

```typescript
// app/api/protected/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Optional: Check permissions
  const hasAccess = await PermissionService.checkPermission(
    user.id,
    'reports',
    'read'
  );

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: 'protected data' });
}
```

---

### 7. Get Current User's Organization

```typescript
import { supabaseAdmin } from '@/lib/supabase/admin';

const { data: appUser } = await supabaseAdmin
  .from('app_users')
  .select('organization_id, role, organizations(name, slug)')
  .eq('auth_user_id', user.id)
  .single();

const organizationId = appUser.organization_id;
const organizationName = appUser.organizations.name;
```

---

### 8. Handle Sign Out

```typescript
// Client-side
'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

---

### 9. Listen to Auth State Changes

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

export default function MyComponent() {
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);

        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed');
        }
      }
    );

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <div>Component content</div>;
}
```

---

### 10. Add Row Level Security to a Table

```sql
-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their organization's data
CREATE POLICY "users_see_own_org_data" ON my_table
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id
    FROM app_users
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Only owners and managers can insert
CREATE POLICY "owners_managers_insert" ON my_table
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role IN ('owner', 'manager')
    AND organization_id = my_table.organization_id
  )
);

-- Policy: Super admins bypass all restrictions
CREATE POLICY "super_admin_all_access" ON my_table
FOR ALL USING (
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);
```

---

## Role Capabilities

### Quick Reference Table

| Action | Owner | Manager | Member | Viewer |
|--------|-------|---------|--------|--------|
| View organization | ✅ | ✅ | ❌ | ❌ |
| Edit organization | ✅ | ✅ | ❌ | ❌ |
| Create users | ✅ | ✅ | ❌ | ❌ |
| Edit users | ✅ | ✅ | ❌ | ❌ |
| Delete users | ✅ | ✅* | ❌ | ❌ |
| View sites | ✅ | ✅ | ✅ | ✅ |
| Edit sites | ✅ | ✅ | ✅ | ❌ |
| Create sites | ✅ | ✅ | ❌ | ❌ |
| Delete sites | ✅ | ✅ | ❌ | ❌ |
| View data | ✅ | ✅ | ✅ | ✅ |
| Edit data | ✅ | ✅ | ✅ | ❌ |
| Create reports | ✅ | ✅ | ✅ | ❌ |
| Delete reports | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |

*Managers cannot delete owners or other managers

---

## Common Errors & Solutions

### Error: "Unauthorized"
**Cause**: No valid session
**Solution**: User needs to sign in

### Error: "Forbidden"
**Cause**: Insufficient permissions
**Solution**: Check user role, verify permission check logic

### Error: "User already exists"
**Cause**: Email already in use
**Solution**: Use different email or link existing auth user

### Error: "CSRF token validation failed"
**Cause**: Missing or invalid CSRF token
**Solution**: Ensure CSRF cookie is set, check middleware config

### Error: "Too many requests"
**Cause**: Rate limit exceeded
**Solution**: Wait before retrying, check rate limit settings

---

## Environment Variables Reference

### Required
```bash
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key (server-only)
```

### Email (Required for invitations)
```bash
SMTP_SERVER=smtp.gmail.com      # SMTP server
SMTP_PORT=587                    # SMTP port
SMTP_USER=your-email@blipee.com # SMTP username
SMTP_PASSWORD=your-app-password  # SMTP password (app password, not account password)
```

### Optional
```bash
NEXT_PUBLIC_APP_URL=            # Application URL (for email links)
```

---

## Testing Authentication

### Test User Creation
```bash
# Create test user
curl -X POST http://localhost:3000/api/users/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "role": "member",
    "organization_id": "your-org-id"
  }'
```

### Test Permission Check
```typescript
// In tests
import { PermissionService } from '@/lib/auth/permission-service';

test('owner can manage users', async () => {
  const canManage = await PermissionService.canManageUsers(
    ownerUserId,
    organizationId
  );
  expect(canManage).toBe(true);
});

test('viewer cannot manage users', async () => {
  const canManage = await PermissionService.canManageUsers(
    viewerUserId,
    organizationId
  );
  expect(canManage).toBe(false);
});
```

---

## Security Best Practices

### ✅ DO
- Always check authentication in API routes
- Use `PermissionService` for permission checks
- Validate user input
- Use RLS policies on all tables
- Log security events
- Use environment variables for secrets
- Sanitize error messages before sending to client
- Use HTTPS in production

### ❌ DON'T
- Don't hardcode credentials
- Don't trust client-side permission checks
- Don't expose sensitive data in error messages
- Don't bypass RLS with `supabaseAdmin` without permission checks
- Don't use `auth.uid()` in client-side code
- Don't commit `.env` files to git

---

## Useful Commands

```bash
# Check authentication status
curl -H "Cookie: your-session-cookie" \
  http://localhost:3000/api/auth/session

# List all users
curl http://localhost:3000/api/users/all

# Create migration
supabase migration new my_migration_name

# Apply migrations
supabase db push

# Reset local database
supabase db reset

# View logs
supabase functions logs
```

---

## File Locations

| What | Where |
|------|-------|
| User management UI | `src/app/settings/users/` |
| User API endpoints | `src/app/api/users/` |
| Auth API endpoints | `src/app/api/auth/` |
| Permission service | `src/lib/auth/permission-service.ts` |
| RBAC service | `src/lib/rbac-simple/service.ts` |
| Email templates | `src/lib/email/send-invitation-gmail.ts` |
| Middleware | `src/middleware.ts` |
| Database migrations | `supabase/migrations/` |
| Auth docs | `docs/AUTH_*.md` |

---

## Getting Help

1. **Documentation**: Check `AUTH_SYSTEM_OVERVIEW.md` for detailed info
2. **Security Fixes**: See `AUTH_SECURITY_FIXES.md` for known issues
3. **Supabase Docs**: https://supabase.com/docs/guides/auth
4. **Team Chat**: #auth-help channel
5. **Create Issue**: GitHub issues for bugs

---

## Quick Debugging

### User can't sign in
```typescript
// Check if user exists
const { data } = await supabaseAdmin.auth.admin.listUsers();
const user = data.users.find(u => u.email === 'email@example.com');
console.log('User:', user);

// Check app_users record
const { data: appUser } = await supabaseAdmin
  .from('app_users')
  .select('*')
  .eq('email', 'email@example.com')
  .single();
console.log('App user:', appUser);
```

### Permission denied
```typescript
// Debug permission check
const { data: appUser } = await supabaseAdmin
  .from('app_users')
  .select('role, organization_id')
  .eq('auth_user_id', userId)
  .single();
console.log('User role:', appUser.role);

const isSuperAdmin = await PermissionService.isSuperAdmin(userId);
console.log('Is super admin:', isSuperAdmin);

// Check specific permission
const result = await PermissionService.checkPermission(
  userId,
  'users',
  'update',
  organizationId
);
console.log('Permission check result:', result);
```

### Email not sent
```bash
# Check SMTP configuration
echo $SMTP_USER
echo $SMTP_PASSWORD

# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransporter({
  host: process.env.SMTP_SERVER,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
transport.verify().then(console.log).catch(console.error);
"
```

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Last Updated**: 2025-10-14
**Version**: 1.0
