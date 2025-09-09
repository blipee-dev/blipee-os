# Supabase Email Integration for Organization Invitations

## Overview
We'll use Supabase's built-in email system with custom SMTP and HTML templates to send organization creation invitations. This approach keeps everything within Supabase while giving us full customization control.

## Setup in Supabase Dashboard

### 1. Configure Custom SMTP
```
Enable Custom SMTP: ✅ Enabled
Sender Email: no-reply@blipee.com
Sender Name: blipee OS

SMTP Settings:
- Host: smtp.gmail.com (or your preferred SMTP)
- Port: 587
- Username: pedro@blipee.com
- Password: [your app password]
- Minimum interval: 60 seconds
```

### 2. Customize "Invite User" Template
Since we're creating organization invitations, we'll use Supabase's "Invite User" template with custom HTML:

```html
<!-- Subject: You're invited to create {{.Data.organization_name}} on blipee OS -->

<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1A73E8; margin: 0;">blipee OS</h1>
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">You're invited to create your organization</h2>
  
  <p>Hello,</p>
  
  <p>You've been invited by <strong>{{.Data.sender_name}}</strong> to create a new organization on blipee OS. You'll become the account owner with full control over your organization's sustainability data.</p>
  
  {{if .Data.organization_name}}
  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1A73E8;">
    <p style="margin: 0; font-weight: bold;">Suggested Organization Name:</p>
    <p style="margin: 5px 0 0 0; font-size: 18px; color: #1A73E8;">{{.Data.organization_name}}</p>
  </div>
  {{end}}
  
  {{if .Data.custom_message}}
  <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">Message from {{.Data.sender_name}}:</p>
    <p style="margin: 10px 0 0 0; font-style: italic;">{{.Data.custom_message}}</p>
  </div>
  {{end}}
  
  <div style="background: #fff; border: 2px solid #1A73E8; border-radius: 8px; padding: 20px; margin: 30px 0;">
    <h3 style="margin: 0 0 15px 0; color: #1A73E8;">Getting Started</h3>
    <p style="margin: 0 0 15px 0;">To create your organization, you'll:</p>
    <ol style="margin: 0; padding-left: 20px;">
      <li>Create your user account with personal information</li>
      <li>Set up your organization details and preferences</li>
      <li>Start inviting your team members</li>
    </ol>
  </div>
  
  <div style="text-align: center; margin: 40px 0;">
    <a href="{{.ConfirmationURL}}" 
       style="background: #1A73E8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
      Create Your Account & Organization
    </a>
  </div>
  
  <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
    <p style="margin: 0;"><strong>⏰ Important:</strong> This invitation will expire in 7 days</p>
  </div>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p>This email was sent by blipee OS</p>
    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
  
  <!-- Debug info (remove in production) -->
  <div style="margin-top: 40px; padding: 10px; background: #f5f5f5; font-size: 12px; color: #666;">
    <strong>Available variables:</strong><br>
    Email: {{.Email}}<br>
    Site URL: {{.SiteURL}}<br>
    Confirmation URL: {{.ConfirmationURL}}<br>
    Token: {{.Token}}<br>
    Data: {{.Data}}
  </div>
</div>
```

## Implementation

### 1. Update Organization Invitation API
```typescript
// src/app/api/admin/organization-invitations/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // ... validation code ...
    
    // Create invitation record first
    const { data: invitation, error: inviteError } = await supabase
      .from('organization_creation_invitations')
      .insert({
        email,
        organization_name,
        custom_message,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
        sender_name: senderName,
        sender_email: user.email,
        suggested_org_data,
        invitation_type: 'organization_creation'
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Send invitation using Supabase Auth
    const { data: authInvite, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          // Custom data available in email template
          organization_name: organization_name || 'Your Organization',
          sender_name: senderName,
          custom_message: custom_message || '',
          invitation_type: 'organization_creation',
          invitation_token: invitation.token,
          expires_in_days: expires_in_days
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/organization?token=${invitation.token}`
      }
    );

    if (authError) {
      // Cleanup invitation record if auth invite fails
      await supabase
        .from('organization_creation_invitations')
        .delete()
        .eq('id', invitation.id);
      
      throw authError;
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        organization_name: invitation.organization_name,
        sender_name: invitation.sender_name,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at
      },
      message: 'Organization creation invitation sent successfully'
    });

  } catch (error: any) {
    console.error('Error in create organization invitation API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. Handle User Signup from Invitation
```typescript
// src/app/onboarding/organization/page.tsx
export default function OrganizationOnboardingPage() {
  const { token } = useSearchParams();
  const [invitation, setInvitation] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user (should be authenticated from Supabase invite flow)
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    // Validate invitation token
    const validateToken = async () => {
      if (token) {
        const validation = await validateInvitation(token);
        if (validation.valid) {
          setInvitation(validation.invitation);
        }
      }
    };

    getUser();
    validateToken();
  }, [token]);

  if (!user) {
    return (
      <div className="text-center">
        <p>Please check your email and click the invitation link to get started.</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="text-center">
        <p>Invalid or expired invitation. Please contact your administrator.</p>
      </div>
    );
  }

  return <OrganizationSetupForm invitation={invitation} user={user} />;
}
```

### 3. Organization Setup Flow
```typescript
// The user is already authenticated via Supabase auth invite
// Now we just need to collect organization details and create the org

const handleOrganizationCreation = async (orgData) => {
  try {
    // User is already authenticated, just create the organization
    const response = await createOrganizationFromInvitation({
      token: invitation.token,
      organization_data: orgData,
      user_profile: {
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        phone: user.user_metadata?.phone || '',
        job_title: 'CEO' // Default or from form
      }
    });

    if (response.success) {
      router.push('/dashboard');
    }
  } catch (error) {
    setError(error.message);
  }
};
```

## Benefits of Using Supabase Email

### ✅ **Advantages**
1. **Integrated**: Everything stays within Supabase ecosystem
2. **Reliable**: Uses Supabase's email infrastructure
3. **Custom SMTP**: Use your own SMTP server
4. **HTML Templates**: Full HTML customization with variables
5. **Auth Integration**: Automatically creates user accounts
6. **Rate Limiting**: Built-in email rate limiting
7. **Monitoring**: Email delivery tracking in Supabase dashboard

### ⚠️ **Considerations**
1. **Template Limitations**: Can only customize existing auth templates
2. **Variable Constraints**: Limited to Supabase's template variables
3. **One Template**: "Invite User" template serves all invitations
4. **Debugging**: Less control over email delivery debugging

## Email Template Variables

### Available in Supabase Templates:
- `{{.Email}}` - Recipient's email
- `{{.SiteURL}}` - Your app URL
- `{{.ConfirmationURL}}` - Auth confirmation link
- `{{.Token}}` - Auth token
- `{{.TokenHash}}` - Hashed token
- `{{.Data}}` - Custom data object
- `{{.Data.organization_name}}` - Organization name
- `{{.Data.sender_name}}` - Sender's name
- `{{.Data.custom_message}}` - Custom message
- `{{.Data.invitation_token}}` - Our custom token

### Template Logic:
```html
{{if .Data.organization_name}}
  <p>Organization: {{.Data.organization_name}}</p>
{{end}}

{{if .Data.custom_message}}
  <div>Message: {{.Data.custom_message}}</div>
{{end}}
```

## Implementation Status ✅

### ✅ **Completed**
1. **Database Integration**: Organization invitation system tied to database tables
2. **API Implementation**: `/api/admin/organization-invitations/route.ts` uses `supabase.auth.admin.inviteUserByEmail()`
3. **Custom Data**: Email templates receive organization_name, sender_name, custom_message, etc.
4. **Error Handling**: Proper cleanup and error handling for failed invitations
5. **Variable Naming**: Fixed variable conflicts (authError → emailError)

### 🔧 **Configuration Required in Supabase Dashboard**
1. **Configure SMTP** in Authentication → Settings → SMTP Settings:
   ```
   Enable Custom SMTP: ✅ Enabled
   Sender Email: no-reply@blipee.com
   Sender Name: blipee OS
   SMTP Host: smtp.gmail.com (or your preferred SMTP)
   Port: 587
   Username: pedro@blipee.com
   Password: [your app password]
   ```

2. **Update "Invite User" template** in Authentication → Email Templates:
   - **Subject**: `You're invited to create {{.Data.organization_name}} on blipee OS`
   - **Body**: Use the HTML template provided above

3. **Test invitation flow**: Create test invitation via super admin interface

### 🎯 **Next Steps**
1. Configure SMTP settings in Supabase dashboard
2. Customize the "Invite User" email template with the provided HTML
3. Test complete flow from super admin invitation to organization creation
4. Monitor email delivery in Supabase logs

This implementation gives us the best of both worlds: Supabase's reliable email infrastructure with our custom organization creation flow!