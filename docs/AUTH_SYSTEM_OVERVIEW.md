# Authentication & User Management System Documentation

## Overview

blipee OS uses an **invitation-based authentication system** built on Supabase Auth, designed specifically for B2B SaaS with multi-tenant support. Users are created and managed through the admin interface at `/settings/users` rather than public signup.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. USER CREATION (Admin-Initiated)
   ┌─────────────┐
   │   Admin     │
   │ /settings/  │
   │   users     │
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────┐
   │ POST /api/users/    │
   │      manage         │
   └──────┬──────────────┘
          │
          ├─► Check Permissions (PermissionService)
          │
          ├─► Create Auth User (Supabase)
          │   └─► Generate temp password
          │
          ├─► Generate Invite Link (Supabase Admin)
          │   └─► Type: 'invite', expires: 24h
          │
          ├─► Send Custom Email (Gmail SMTP)
          │   └─► Multilingual (EN/ES/PT)
          │
          └─► Create/Update app_users record
              └─► Status: 'pending'

2. USER INVITATION ACCEPTANCE
   ┌─────────────┐
   │ User clicks │
   │ email link  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────┐
   │  /auth/callback     │
   │  - Exchange token   │
   │  - Set session      │
   └──────┬──────────────┘
          │
          ├─► Check session type
          │   └─► type === 'invite' ?
          │
          ▼
   ┌─────────────────────┐
   │  /set-password      │
   │  - Validate format  │
   │  - Update password  │
   │  - Set metadata     │
   └──────┬──────────────┘
          │
          ▼
   ┌─────────────────────┐
   │  /sustainability    │
   │  (Main App)         │
   └─────────────────────┘

3. PASSWORD MANAGEMENT
   ┌─────────────┐
   │ Forgot      │
   │ Password?   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────────┐
   │ POST /api/auth/         │
   │      reset-password     │
   └──────┬──────────────────┘
          │
          ├─► Generate reset link (Supabase)
          │
          └─► Send reset email
              │
              ▼
   ┌─────────────────────┐
   │ /auth/callback      │
   │ type: 'recovery'    │
   └──────┬──────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ /set-password       │
   │ (Same flow)         │
   └─────────────────────┘
```

---

## Database Schema

### Core Tables

#### `auth.users` (Managed by Supabase)
```sql
- id (uuid, primary key)
- email (text, unique)
- encrypted_password (text)
- email_confirmed_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)
- raw_user_meta_data (jsonb)
  └─► {
        full_name: string,
        display_name: string,
        organization_id: uuid,
        language: 'en' | 'es' | 'pt',
        password_set: boolean,
        onboarded: boolean
      }
```

#### `app_users` (Application Users)
```sql
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'owner' | 'manager' | 'member' | 'viewer'
  organization_id UUID REFERENCES organizations(id),
  status TEXT DEFAULT 'pending', -- 'pending' | 'active' | 'inactive'
  permissions JSONB DEFAULT '{"access_level": "organization", "site_ids": []}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions JSONB structure:
{
  "access_level": "organization" | "site",
  "site_ids": ["site-uuid-1", "site-uuid-2"]
}
```

#### `user_access` (Simple RBAC)
```sql
CREATE TABLE user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users(id)
  resource_type TEXT NOT NULL, -- 'org' | 'site' | 'report' | 'device'
  resource_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'owner' | 'manager' | 'member' | 'viewer'
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  UNIQUE(user_id, resource_type, resource_id)
);

CREATE INDEX idx_user_access_user ON user_access(user_id);
CREATE INDEX idx_user_access_resource ON user_access(resource_type, resource_id);
```

#### `super_admins` (Platform Admins)
```sql
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) Policies

### `app_users` Policies

#### SELECT Policy
```sql
-- Users can:
-- 1. See themselves
-- 2. See others in their organization
-- 3. Super admins see everyone

CREATE POLICY "app_users_select_policy" ON app_users
FOR SELECT USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR auth_user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.organization_id = app_users.organization_id
    )
);
```

#### INSERT Policy
```sql
-- Users can create:
-- 1. Super admins can create anyone
-- 2. Owners can create in their org
-- 3. Managers can create in their org
-- 4. Service role (triggers)

CREATE POLICY "app_users_insert_policy" ON app_users
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role IN ('owner', 'manager')
        AND u.organization_id = organization_id
    )
    OR auth.jwt()->>'role' = 'service_role'
);
```

#### UPDATE Policy
```sql
-- Users can update:
-- 1. Super admins update anyone
-- 2. Self-update (limited fields)
-- 3. Owners update their org
-- 4. Managers update their org (except owners)

CREATE POLICY "app_users_update_policy" ON app_users
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR auth_user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role = 'owner'
        AND u.organization_id = app_users.organization_id
    )
    OR EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role = 'manager'
        AND u.organization_id = app_users.organization_id
        AND app_users.role != 'owner'
    )
);
```

#### DELETE Policy
```sql
-- Users can delete:
-- 1. Super admins delete anyone (except themselves)
-- 2. Owners delete their org (except themselves)
-- 3. Managers delete non-owners/managers (except themselves)

CREATE POLICY "app_users_delete_policy" ON app_users
FOR DELETE USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR (
        EXISTS (
            SELECT 1 FROM app_users u
            WHERE u.auth_user_id = auth.uid()
            AND u.role = 'owner'
            AND u.organization_id = app_users.organization_id
        )
        AND app_users.auth_user_id != auth.uid()
    )
    OR (
        EXISTS (
            SELECT 1 FROM app_users u
            WHERE u.auth_user_id = auth.uid()
            AND u.role = 'manager'
            AND u.organization_id = app_users.organization_id
        )
        AND app_users.role NOT IN ('owner', 'manager')
        AND app_users.auth_user_id != auth.uid()
    )
);
```

---

## API Endpoints

### User Management

#### `POST /api/users/manage`
**Purpose**: Create new user with invitation
**Auth**: Requires owner/manager/super_admin role
**Request**:
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "role": "member",
  "organization_id": "org-uuid",
  "access_level": "organization" | "site",
  "site_ids": ["site-uuid-1"],
  "status": "pending"
}
```
**Response**:
```json
{
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "member",
    "status": "pending",
    "organization_id": "org-uuid"
  }
}
```

#### `PUT /api/users/manage`
**Purpose**: Update existing user
**Auth**: Requires permission to manage users
**Request**:
```json
{
  "id": "user-uuid",
  "name": "John Smith",
  "role": "manager",
  "status": "active"
}
```

#### `DELETE /api/users/manage?id=user-uuid`
**Purpose**: Delete user
**Auth**: Requires owner/manager/super_admin role
**Process**:
1. Delete from `user_access` table
2. Delete from `app_users` table
3. Delete from `auth.users` table

#### `GET /api/users/all`
**Purpose**: List all users
**Auth**: Authenticated users see their org, super admins see all
**Response**:
```json
{
  "users": [
    {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "member",
      "status": "active",
      "organization_id": "org-uuid",
      "organizations": {
        "name": "Acme Corp",
        "slug": "acme"
      },
      "is_super_admin": false
    }
  ]
}
```

#### `POST /api/users/resend-invitation`
**Purpose**: Resend invitation email to pending user
**Auth**: Requires owner/manager/super_admin role
**Request**:
```json
{
  "userId": "user-uuid"
}
```

#### `POST /api/users/bulk-delete`
**Purpose**: Delete multiple users at once
**Auth**: Requires owner/manager/super_admin role
**Request**:
```json
{
  "userIds": ["user-uuid-1", "user-uuid-2"]
}
```
**Response**:
```json
{
  "successCount": 2,
  "failedCount": 0,
  "errors": []
}
```

#### `POST /api/users/session-stats`
**Purpose**: Get average daily time spent for users
**Auth**: Authenticated
**Request**:
```json
{
  "userIds": ["user-uuid-1", "user-uuid-2"]
}
```

### Authentication

#### `POST /api/auth/reset-password`
**Purpose**: Request password reset email
**Auth**: Public
**Request**:
```json
{
  "email": "user@example.com"
}
```

---

## Permission System (Simple RBAC)

### Role Hierarchy

```
super_admin (Platform-wide)
    ↓
owner (Organization-wide)
    ↓
manager (Organization-wide, limited)
    ↓
member (Site-specific possible)
    ↓
viewer (Read-only)
```

### Role Capabilities Matrix

| Resource      | Owner | Manager | Member | Viewer |
|--------------|-------|---------|--------|--------|
| Organizations| *     | read, update | - | - |
| Sites        | *     | *       | read, update | read |
| Users        | *     | create, read, update | - | - |
| Settings     | *     | read, update | - | - |
| Reports      | *     | *       | create, read | read |
| Data         | *     | *       | create, read, update | read |
| Devices      | *     | *       | read, update | read |
| Billing      | *     | -       | - | - |

**Legend**: `*` = Full access (create, read, update, delete)

### Permission Check Flow

```typescript
// Central permission check
async function checkPermission(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<boolean>

// Flow:
1. Check if super_admin → Allow all
2. If resourceId provided:
   a. Check user_access table for specific resource permission
   b. Check app_users role for organization-level permission
3. Else:
   a. Check app_users role for general permission
4. Return boolean
```

### Permission Service Usage

```typescript
// In API routes
import { PermissionService } from '@/lib/auth/permission-service';

// Check if user can manage users
const canManage = await PermissionService.canManageUsers(
  user.id,
  organization_id
);

if (!canManage) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Check if user can view site
const canView = await PermissionService.canViewSites(
  user.id,
  siteId
);

// Check if user is super admin
const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
```

---

## Email System

### Configuration

**Provider**: Gmail SMTP
**Library**: `nodemailer`
**Languages**: EN, ES, PT (auto-detected from Accept-Language header)

### Invitation Email Template

**Subject**: "Welcome to blipee - Set Your Password"
**Components**:
- Logo and branding
- Personalized greeting
- Invitation context (who invited, which org)
- Access details table (email, role, org)
- CTA button with invite link
- Platform features list
- Support contact

### Email Flow

```typescript
// 1. Generate invite link (Supabase)
const { data } = await supabaseAdmin.auth.admin.generateLink({
  type: 'invite',
  email: email,
  options: {
    data: { full_name, organization_id, role, language }
  }
});

// 2. Modify redirect URL
const url = new URL(actionLink);
url.searchParams.set('redirect_to', `${baseUrl}/auth/callback`);

// 3. Send via Gmail SMTP
await sendInvitationEmailViaGmail({
  email,
  userName,
  organizationName,
  inviterName,
  role,
  confirmationUrl: url.toString(),
  language: 'en' | 'es' | 'pt'
});
```

---

## Security Features

### Current Implementation

1. **Row Level Security (RLS)**: All tables protected with Postgres RLS
2. **Permission Checks**: Centralized through PermissionService
3. **Audit Logging**: All user actions logged to audit_logs table
4. **CSRF Protection**: Middleware validates CSRF tokens on API routes
5. **Rate Limiting**: Basic DDoS protection in middleware (100 req/min)
6. **Session Management**: Supabase handles JWT tokens with refresh
7. **Password Requirements**:
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number

### Middleware Protection

```typescript
// Protected routes (require authentication)
[
  '/blipee-ai',
  '/settings',
  '/sustainability',
  '/profile',
  '/api/ai',
  '/api/conversations',
  '/api/organizations',
  '/api/sustainability',
  ...
]

// Public routes (no authentication)
[
  '/',
  '/signin',
  '/signup',
  '/forgot-password',
  '/auth/callback',
  '/api/auth/*',
  ...
]
```

---

## Troubleshooting Guide

### Common Issues

#### 1. "User with this email already exists"
**Cause**: Email exists in auth.users or app_users
**Solution**: Check both tables, clean up orphaned records

#### 2. Session not found after invitation
**Cause**: Timing issue with Supabase session establishment
**Current workaround**: Multiple retries with delays
**Better solution**: Use `onAuthStateChange` listener

#### 3. Password reset link expired
**Cause**: Links expire after 24 hours
**Solution**: Request new reset link via /forgot-password

#### 4. Can't create user as manager
**Cause**: RLS policy or permission service blocking
**Debug**: Check app_users.role and organization_id match

#### 5. Invitation email not received
**Cause**: SMTP configuration or spam filter
**Debug**:
- Check server logs for email send confirmation
- Verify SMTP credentials
- Check spam folder

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── reset-password/route.ts
│   │   │   ├── session/route.ts
│   │   │   └── ...
│   │   └── users/
│   │       ├── all/route.ts
│   │       ├── manage/route.ts
│   │       ├── bulk-delete/route.ts
│   │       ├── resend-invitation/route.ts
│   │       └── session-stats/route.ts
│   ├── auth/
│   │   └── callback/page.tsx
│   ├── set-password/page.tsx
│   └── settings/
│       └── users/
│           ├── page.tsx
│           └── UsersClient.tsx
├── components/
│   └── admin/
│       └── UsersModal.tsx
├── lib/
│   ├── auth/
│   │   ├── permission-service.ts (Central permission checks)
│   │   ├── session-auth.ts
│   │   └── middleware.ts
│   ├── rbac-simple/
│   │   └── service.ts (Simple RBAC implementation)
│   ├── email/
│   │   └── send-invitation-gmail.ts
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── admin.ts
└── middleware.ts (Main app middleware)

supabase/
└── migrations/
    ├── 20250117_fix_app_users_policies.sql
    ├── 20250117_fix_auth_user_creation.sql
    └── ...
```

---

## Next Steps

See `AUTH_SECURITY_FIXES.md` for planned security improvements and implementation timeline.
