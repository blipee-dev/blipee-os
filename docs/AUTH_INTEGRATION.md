# Supabase Authentication Integration

## Overview

The blipee OS platform uses a dual-table architecture for user management that properly integrates with Supabase Authentication:

- **`auth.users`**: Supabase's built-in authentication table (handles authentication)
- **`app_users`**: Our application-specific user data (handles authorization, roles, organization membership)

## Architecture

### User Creation Flow

1. **API Endpoint** (`/api/users/manage/route.ts`)
   - Creates auth user with `supabaseAdmin.auth.admin.createUser()`
   - Generates temporary password that meets requirements
   - Sets user metadata (name, role, organization)
   - Sends custom invitation email via Gmail

2. **Database Trigger** (`handle_new_user`)
   - Automatically creates `app_users` entry when auth user is created
   - Uses `ON CONFLICT` to handle existing emails gracefully
   - Links records via `auth_user_id` foreign key
   - Never fails (prevents blocking auth user creation)

3. **Invitation Flow**
   - Generates Supabase invite link with token
   - Sends branded email in user's language (EN/ES/PT)
   - User clicks link → `/auth/callback` → `/set-password`
   - Password is set directly in Supabase Auth

### Data Synchronization

#### Key Principles

1. **Auth First**: Always create auth user before app_user
2. **Trigger Sync**: Database trigger ensures app_users entry exists
3. **Foreign Key**: `app_users.auth_user_id` links to `auth.users.id`
4. **Conflict Handling**: Gracefully handles existing emails

#### Database Schema

```sql
-- app_users table
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT,
  organization_id UUID,
  status TEXT DEFAULT 'active',
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to sync auth.users → app_users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Authentication vs Authorization

- **Authentication** (Supabase Auth)
  - Login/logout
  - Password management
  - Session handling
  - Email verification

- **Authorization** (app_users)
  - Role-based access (owner, manager, analyst, viewer)
  - Organization membership
  - Site-level permissions
  - Feature access control

## Common Operations

### Creating a New User

```javascript
// 1. Create auth user
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: false,
  user_metadata: { name, role, organization_id }
});

// 2. Trigger creates app_user automatically
// 3. Send invitation email
await sendInvitationEmailViaGmail({ email, confirmationUrl });
```

### Checking User Permissions

```javascript
// Get user with role and permissions
const { data: user } = await supabase
  .from('app_users')
  .select('*')
  .eq('auth_user_id', authUserId)
  .single();

// Check role
if (user.role === 'owner' || user.role === 'manager') {
  // Can manage users
}

// Check site access
if (user.permissions?.site_ids?.includes(siteId)) {
  // Has access to specific site
}
```

### Handling Login

```javascript
// 1. User logs in via Supabase Auth
const { data: { user } } = await supabase.auth.signInWithPassword({
  email,
  password
});

// 2. Get app user data
const { data: appUser } = await supabase
  .from('app_users')
  .select('*')
  .eq('auth_user_id', user.id)
  .single();

// 3. Use combined data for app functionality
const fullUser = { ...user, ...appUser };
```

### Updating Users

User updates must sync data between both tables:

```javascript
// 1. Update app_users
const { data: updatedUser } = await supabaseAdmin
  .from('app_users')
  .update({
    name,
    email,
    role,
    permissions
  })
  .eq('id', userId)
  .select()
  .single();

// 2. Update auth.users metadata
if (updatedUser.auth_user_id) {
  await supabaseAdmin.auth.admin.updateUserById(
    updatedUser.auth_user_id,
    {
      email: email, // Update email if changed
      user_metadata: {
        full_name: name,
        role: role,
        permissions: permissions
      }
    }
  );
}
```

**Important Notes**:
- Name and role changes sync to auth metadata
- Email changes update both tables
- Permissions stored in both for redundancy
- Metadata sync ensures consistency across sessions

### Deleting Users

User deletion must remove records from both tables in the correct order:

```javascript
// 1. Get user details including auth_user_id
const { data: targetUser } = await supabaseAdmin
  .from('app_users')
  .select('*')
  .eq('id', userId)
  .single();

// 2. Delete from app_users first (due to foreign key)
await supabaseAdmin
  .from('app_users')
  .delete()
  .eq('id', userId);

// 3. Delete from auth.users
if (targetUser.auth_user_id) {
  await supabaseAdmin.auth.admin.deleteUser(targetUser.auth_user_id);
}
```

#### Bulk Deletion

For better performance when deleting multiple users:

```javascript
// Use the /api/users/bulk-delete endpoint
const response = await fetch('/api/users/bulk-delete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userIds: [...] })
});
```

## Verification Scripts

### Check Integration Health

```bash
# Verify auth/app_users synchronization
node scripts/verify-auth-integration.js

# Fix any synchronization issues
node scripts/fix-auth-integration.js

# Test complete creation flow
node scripts/test-user-creation-flow.js

# Test deletion flow
node scripts/test-user-deletion.js

# Test edit/update flow
node scripts/test-user-edit.js
```

## Troubleshooting

### Common Issues

1. **"Database error creating new user"**
   - Cause: Email exists in app_users but not auth.users
   - Fix: API now checks and cleans up orphaned entries

2. **User can't login after creation**
   - Cause: No auth account created
   - Fix: Run `fix-auth-integration.js` to create missing auth accounts

3. **Invitation link expired**
   - Cause: Link older than 24 hours
   - Fix: Generate new invitation through settings UI

### Best Practices

1. **Always use admin client** for user management operations
2. **Check both tables** when debugging user issues
3. **Let trigger handle** app_users creation when possible
4. **Send invitation emails** immediately after creation
5. **Monitor synchronization** with verification scripts

## Security Considerations

1. **Service Key**: Only use `SUPABASE_SERVICE_KEY` server-side
2. **RLS Policies**: app_users has Row Level Security enabled
3. **Password Requirements**: Enforced by Supabase Auth
4. **Session Management**: Handled by Supabase Auth
5. **Email Verification**: Optional but recommended for production

## Migration Notes

If migrating from a system without Supabase Auth integration:

1. Create auth accounts for existing app_users
2. Send password reset emails to all users
3. Update app_users with auth_user_id
4. Enable the sync trigger
5. Verify with integration scripts