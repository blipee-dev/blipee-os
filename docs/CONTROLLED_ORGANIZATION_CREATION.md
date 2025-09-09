# Controlled Organization Creation

## Overview
Organization creation is **restricted** to super admins and users with valid organization creation invitations. This prevents unauthorized organizations from being created.

## Access Control Model

### ❌ **What's NOT Allowed**
- Free signup → create organization
- Any user creating organizations
- Self-service organization creation

### ✅ **What's Allowed**
- Super admin creates organizations directly
- Super admin sends organization creation invitations
- Invited users create organizations (single-use token)

## Database Schema Updates

### Organization Creation Tokens
```sql
CREATE TABLE organization_creation_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token UUID UNIQUE DEFAULT gen_random_uuid(),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    organization_name TEXT, -- Pre-filled if super admin provides
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id),
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookup
CREATE INDEX idx_org_invitations_token ON organization_creation_invitations(token);
CREATE INDEX idx_org_invitations_email ON organization_creation_invitations(email);
```

### Organization Creation Permissions
```sql
-- Add flag to track how organization was created
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS creation_method TEXT DEFAULT 'invitation' 
CHECK (creation_method IN ('superadmin', 'invitation'));

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS invitation_token UUID REFERENCES organization_creation_invitations(id);
```

## Updated RLS Policies

### Restrict Organization Creation
```sql
-- Drop the open creation policy
DROP POLICY IF EXISTS "organizations_insert" ON organizations;

-- New restrictive policy
CREATE POLICY "controlled_org_creation" ON organizations
FOR INSERT WITH CHECK (
    -- Only super admins can create directly
    is_current_user_super_admin() 
    OR 
    -- Or user has valid invitation token (checked in application logic)
    (creation_method = 'invitation' AND invitation_token IS NOT NULL)
);
```

## Implementation

### 1. Super Admin Creates Organization Directly
```typescript
// API: POST /api/admin/organizations
export async function createOrganizationAsSuperAdmin(orgData: {
  name: string;
  slug: string;
  account_owner_email: string;
  legal_name?: string;
  industry_primary: string;
}) {
  // Verify super admin
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error('Unauthorized: Super admin required');
  }

  // Find or create account owner user
  let { data: owner } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', orgData.account_owner_email)
    .single();

  if (!owner) {
    // Create user account
    const { data: newUser } = await supabase.auth.admin.createUser({
      email: orgData.account_owner_email,
      password: generateTempPassword(),
      email_confirm: true,
      user_metadata: {
        invited_by: 'superadmin',
        role: 'account_owner'
      }
    });
    owner = newUser.user;
    
    // Send welcome email with password reset
    await sendWelcomeEmail(orgData.account_owner_email);
  }

  // Create organization
  const { data: org } = await supabase
    .from('organizations')
    .insert({
      name: orgData.name,
      slug: orgData.slug,
      legal_name: orgData.legal_name,
      industry_primary: orgData.industry_primary,
      account_owner_id: owner.id,
      creation_method: 'superadmin',
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  // Assign account owner role
  await supabase
    .from('user_organization_roles')
    .insert({
      user_id: owner.id,
      organization_id: org.id,
      role: 'account_owner',
      assigned_by: (await supabase.auth.getUser()).data.user?.id
    });

  return { organization: org, account_owner: owner };
}
```

### 2. Super Admin Sends Organization Creation Invitation
```typescript
// API: POST /api/admin/organization-invitations
export async function createOrganizationInvitation(inviteData: {
  email: string;
  organization_name?: string;
  expires_in_days?: number;
  custom_message?: string;
}) {
  // Verify super admin
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error('Unauthorized: Super admin required');
  }

  // Create invitation
  const { data: invitation } = await supabase
    .from('organization_creation_invitations')
    .insert({
      email: inviteData.email,
      organization_name: inviteData.organization_name,
      invited_by: (await supabase.auth.getUser()).data.user?.id,
      expires_at: new Date(Date.now() + (inviteData.expires_in_days || 7) * 24 * 60 * 60 * 1000),
      metadata: {
        custom_message: inviteData.custom_message
      }
    })
    .select()
    .single();

  // Send invitation email
  await sendOrganizationCreationInvite({
    email: inviteData.email,
    token: invitation.token,
    organization_name: inviteData.organization_name,
    custom_message: inviteData.custom_message,
    expires_at: invitation.expires_at
  });

  return invitation;
}
```

### 3. User Creates Organization via Invitation
```typescript
// API: POST /api/organizations/create-from-invitation
export async function createOrganizationFromInvitation(
  token: string,
  orgData: {
    name: string;
    slug: string;
    legal_name?: string;
    industry_primary: string;
  }
) {
  // Verify and consume invitation
  const { data: invitation } = await supabase
    .from('organization_creation_invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (!invitation) {
    throw new Error('Invalid invitation token');
  }

  if (invitation.expires_at < new Date()) {
    throw new Error('Invitation has expired');
  }

  if (invitation.used_at) {
    throw new Error('Invitation has already been used');
  }

  // Verify user email matches invitation
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== invitation.email) {
    throw new Error('Must be signed in as invited user');
  }

  // Create organization
  const { data: org } = await supabase
    .from('organizations')
    .insert({
      name: orgData.name,
      slug: orgData.slug,
      legal_name: orgData.legal_name,
      industry_primary: orgData.industry_primary,
      account_owner_id: user.id,
      creation_method: 'invitation',
      invitation_token: invitation.id,
      created_by: user.id
    })
    .select()
    .single();

  // Assign account owner role
  await supabase
    .from('user_organization_roles')
    .insert({
      user_id: user.id,
      organization_id: org.id,
      role: 'account_owner',
      assigned_by: user.id
    });

  // Mark invitation as used
  await supabase
    .from('organization_creation_invitations')
    .update({
      used_at: new Date(),
      used_by: user.id,
      current_uses: invitation.current_uses + 1
    })
    .eq('id', invitation.id);

  return org;
}
```

## Frontend Flow Changes

### 1. Super Admin Dashboard
```typescript
// /admin/organizations
const SuperAdminOrganizations = () => {
  return (
    <AdminDashboard>
      <div className="space-y-6">
        {/* Direct Creation */}
        <Card>
          <h3>Create Organization Directly</h3>
          <CreateOrganizationForm 
            onSubmit={createOrganizationAsSuperAdmin}
          />
        </Card>

        {/* Send Invitation */}
        <Card>
          <h3>Send Organization Creation Invitation</h3>
          <InvitationForm 
            onSubmit={createOrganizationInvitation}
          />
        </Card>

        {/* Pending Invitations */}
        <Card>
          <h3>Pending Invitations</h3>
          <InvitationsList />
        </Card>
      </div>
    </AdminDashboard>
  );
};
```

### 2. Regular User Flow
```typescript
// /onboarding/organization?token=xxx
const OrganizationOnboarding = () => {
  const { token } = useSearchParams();
  
  if (!token) {
    return (
      <div className="text-center">
        <h2>Organization Creation Requires Invitation</h2>
        <p>Please contact your administrator for an invitation.</p>
      </div>
    );
  }

  return (
    <OnboardingWizard>
      <ValidateInvitation token={token} />
      <OrganizationForm 
        onSubmit={(data) => createOrganizationFromInvitation(token, data)}
      />
    </OnboardingWizard>
  );
};
```

### 3. Sign Up Flow Update
```typescript
// /auth/signup
const SignUpForm = () => {
  const { token } = useSearchParams();
  
  return (
    <AuthForm
      onSuccess={() => {
        if (token) {
          // Redirect to organization creation
          router.push(`/onboarding/organization?token=${token}`);
        } else {
          // Regular user - no organization creation
          router.push('/dashboard'); // Will show "No organizations" state
        }
      }}
    />
  );
};
```

## Email Templates

### Organization Creation Invitation
```html
<h2>You're invited to create an organization on blipee OS</h2>

<p>Hello,</p>

<p>You've been invited to create a new organization on blipee OS. You'll become the account owner with full control.</p>

{{#if organization_name}}
<p><strong>Suggested Organization Name:</strong> {{organization_name}}</p>
{{/if}}

{{#if custom_message}}
<p><strong>Message from administrator:</strong><br>{{custom_message}}</p>
{{/if}}

<div style="margin: 20px 0;">
  <a href="{{app_url}}/auth/signup?token={{token}}" 
     style="background: #1A73E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Create Organization
  </a>
</div>

<p><strong>This invitation expires on:</strong> {{expires_at}}</p>

<small>If you already have an account, <a href="{{app_url}}/onboarding/organization?token={{token}}">click here</a> to create your organization.</small>
```

## API Routes

### Super Admin Routes
```typescript
// /api/admin/organizations
POST - Create organization directly
GET  - List all organizations

// /api/admin/organization-invitations  
POST - Send invitation
GET  - List pending invitations
DELETE /:id - Cancel invitation
```

### Regular User Routes
```typescript
// /api/organizations/create-from-invitation
POST - Create org from invitation token

// /api/organizations/validate-invitation
POST - Validate invitation token
```

## Database Functions

### Validate Invitation Function
```sql
CREATE OR REPLACE FUNCTION validate_organization_invitation(p_token UUID)
RETURNS TABLE(
    valid BOOLEAN,
    email TEXT,
    organization_name TEXT,
    expires_at TIMESTAMPTZ,
    error_message TEXT
) AS $$
DECLARE
    v_invitation organization_creation_invitations%ROWTYPE;
BEGIN
    -- Get invitation
    SELECT * INTO v_invitation
    FROM organization_creation_invitations
    WHERE token = p_token;
    
    -- Check if exists
    IF v_invitation.id IS NULL THEN
        RETURN QUERY SELECT false, null::text, null::text, null::timestamptz, 'Invalid invitation token';
        RETURN;
    END IF;
    
    -- Check if expired
    IF v_invitation.expires_at < NOW() THEN
        RETURN QUERY SELECT false, v_invitation.email, v_invitation.organization_name, v_invitation.expires_at, 'Invitation has expired';
        RETURN;
    END IF;
    
    -- Check if already used
    IF v_invitation.used_at IS NOT NULL THEN
        RETURN QUERY SELECT false, v_invitation.email, v_invitation.organization_name, v_invitation.expires_at, 'Invitation already used';
        RETURN;
    END IF;
    
    -- Valid invitation
    RETURN QUERY SELECT true, v_invitation.email, v_invitation.organization_name, v_invitation.expires_at, null::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security Benefits

### ✅ **Controlled Access**
- Only super admins can authorize new organizations
- Prevents unauthorized organization creation
- Audit trail of who created what organization

### ✅ **Invitation Security**
- Single-use tokens (by default)
- Time-limited (7 days default)
- Email verification required
- Token cannot be guessed

### ✅ **Compliance**
- Full audit trail of organization creation
- Clear accountability chain
- Proper approval workflow

## Migration Script

```sql
-- Add new columns to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS creation_method TEXT DEFAULT 'superadmin' 
CHECK (creation_method IN ('superadmin', 'invitation'));

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS invitation_token UUID;

-- Create invitations table
CREATE TABLE IF NOT EXISTS organization_creation_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token UUID UNIQUE DEFAULT gen_random_uuid(),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    organization_name TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id),
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing organizations to reflect superadmin creation
UPDATE organizations 
SET creation_method = 'superadmin'
WHERE creation_method IS NULL;

-- Update RLS policies
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
CREATE POLICY "controlled_org_creation" ON organizations
FOR INSERT WITH CHECK (
    is_current_user_super_admin() OR
    (creation_method = 'invitation' AND invitation_token IS NOT NULL)
);
```

This ensures **complete control** over organization creation while maintaining security and auditability!