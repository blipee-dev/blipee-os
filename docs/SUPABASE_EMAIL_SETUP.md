# Supabase Email Template Setup

## How to Add Custom Invitation Email Template

### 1. Go to Supabase Dashboard
Navigate to: [Authentication > Email Templates](https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/auth/templates)

### 2. Select "Invite User" Template
From the dropdown, select **"Invite user"**

### 3. Enable Custom Template
Toggle **"Enable custom email"** to ON

### 4. Update Email Content

#### Subject Line:
```
Welcome to Blipee OS - Set Your Password
```

#### Email Body:
Copy the entire content from `/src/templates/invitation-email.html`

### 5. Template Variables

The template uses these variables that Supabase provides:
- `{{ .ConfirmationURL }}` - The magic link for password setup
- `{{ .Email }}` - User's email address

### 6. Additional Variables (Custom)

For the template to work fully, you'll need to pass these in the metadata when creating users:
```javascript
supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  data: {
    full_name: "User Name",      // Maps to {{ .UserName }}
    organization_name: "PLMJ",   // Maps to {{ .OrganizationName }}
    role: "Manager",              // Maps to {{ .Role }}
    inviter_name: "José Pinto"   // Maps to {{ .InviterName }}
  }
})
```

### 7. Template Placeholders

Since Supabase doesn't support all our custom variables directly, you can use these fallback approaches:

#### Option A: Simplified Template
Replace custom variables with generic text:
- `{{ .UserName }}` → "there"
- `{{ .OrganizationName }}` → "your organization"
- `{{ .InviterName }}` → "Your team"
- `{{ .Role }}` → "Team Member"

#### Option B: Use Confirmation URL Parameters
Append data to the confirmation URL:
```javascript
const confirmUrl = `${baseUrl}/auth/confirm?token=${token}&name=${userName}&org=${orgName}&role=${role}`;
```

### 8. Save Template
Click **"Save"** at the bottom of the page

## Testing the Template

### 1. Create a Test User
```javascript
// Run this in your application or via API
const { data, error } = await supabase.auth.admin.inviteUserByEmail(
  'test@example.com',
  {
    data: {
      full_name: 'Test User',
      organization_name: 'Test Org',
      role: 'member',
      inviter_name: 'Admin User'
    }
  }
);
```

### 2. Check Email
The user should receive the styled invitation email

### 3. Verify Links
Ensure the confirmation URL correctly redirects to your password setup page

## Alternative: Using Resend or SendGrid

For full control over email templates with all variables, consider:

1. **Disable Supabase Emails**: Set up manual email sending
2. **Use Email Service**: Resend, SendGrid, or similar
3. **Send Custom Emails**: When creating users, send your own invitation

Example with Resend:
```javascript
// In your API endpoint
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// After creating user
await resend.emails.send({
  from: 'Blipee OS <noreply@blipee.com>',
  to: email,
  subject: 'Welcome to Blipee OS',
  html: compiledTemplate // Your HTML with all variables replaced
});
```

## Email Template Features

### Design Elements Used:
- **Gradient Backgrounds**: Purple → Pink → Blue (matching brand)
- **Glass Morphism**: Subtle transparent backgrounds
- **Home Icon**: SVG icon in header
- **Role Badges**: Visual hierarchy for user role
- **Action Cards**: Feature highlights with icons
- **Security Notice**: Yellow warning box for link security
- **Responsive Design**: Works on all devices

### Color Palette:
- Primary Text: `#111111`
- Secondary Text: `#616161`
- Muted Text: `#9ca3af`
- Gradient: `#a855f7` → `#ec4899` → `#3b82f6`
- Background: `#f9fafb`
- Cards: `#f5f5f5`

### Typography:
- Font Family: System fonts for best rendering
- Headers: 28-32px, weight 600
- Body: 14-16px, regular
- Small text: 12-13px

## Maintenance

### Updating Template:
1. Edit `/src/templates/invitation-email.html`
2. Copy new content to Supabase Dashboard
3. Test with a new user invitation
4. Verify all links and styling work correctly

### Common Issues:
- **Variables not replaced**: Use Supabase's supported variables only
- **Styling broken**: Some email clients strip CSS - use inline styles
- **Links not working**: Verify `{{ .ConfirmationURL }}` is properly formatted
- **Images not showing**: Use absolute URLs or embed as base64