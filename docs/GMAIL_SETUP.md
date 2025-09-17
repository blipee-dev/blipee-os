# Gmail Email Setup for blipee

## Prerequisites

1. Install nodemailer:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

## Setting Up Gmail for Sending Emails

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "How you sign in to Google", enable "2-Step Verification"
4. Follow the setup process

### Step 2: Generate App Password
1. After enabling 2FA, go back to Security settings
2. Under "How you sign in to Google", click on "2-Step Verification"
3. Scroll down and click on "App passwords"
4. Select "Mail" as the app
5. Select your device type
6. Click "Generate"
7. Copy the 16-character password (spaces don't matter)

### Step 3: Add Environment Variables
Add these to your `.env.local` file:

```env
# Gmail Configuration
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

Example:
```env
GMAIL_EMAIL=notifications@blipee.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

## Using the Gmail Email Service

### Option 1: Custom Invitation Emails (Recommended)

Instead of using Supabase's default invitation emails, you can send custom multi-language emails:

```typescript
// In your user creation API endpoint
import { sendInvitationEmailViaGmail } from '@/lib/email/send-invitation-gmail';

// After creating the user in Supabase
const emailData = {
  email: user.email,
  userName: user.name,
  organizationName: 'PLMJ',
  inviterName: currentUser.name,
  role: user.role,
  confirmationUrl: inviteLink, // Get this from Supabase
  language: 'pt' // or detect from browser: 'en', 'es', 'pt'
};

await sendInvitationEmailViaGmail(emailData);
```

### Option 2: Disable Supabase Emails

To use only Gmail for invitations:

1. In Supabase Dashboard, go to Authentication > Email Templates
2. Disable the "Invite user" template
3. Handle all invitations through your custom Gmail service

## Language Detection

The system automatically detects user language from:

1. **Browser Headers**: `Accept-Language` header
2. **User Settings**: Stored language preference
3. **Fallback**: English if no preference detected

## Email Templates

Templates are available in 3 languages:
- English (en)
- Spanish (es)
- Portuguese (pt)

Each template includes:
- Welcome message
- User details (email, role, organization)
- Password setup link
- Feature highlights
- Support contact

## Testing

### Test Locally
```javascript
// Test script
const testEmail = {
  email: 'test@example.com',
  userName: 'Test User',
  organizationName: 'Test Org',
  inviterName: 'Admin',
  role: 'Manager',
  confirmationUrl: 'http://localhost:3000/auth/callback?code=test',
  language: 'en'
};

await sendInvitationEmailViaGmail(testEmail);
```

### Gmail Limitations

- **Daily limit**: 500 emails/day for regular Gmail
- **Rate limit**: 20 emails/second max
- **Recipient limit**: 100 recipients per email

For production with higher volume, consider:
- Google Workspace (2,000 emails/day)
- Gmail API (higher limits)
- Professional email services (SendGrid, AWS SES, Resend)

## Troubleshooting

### "Username and Password not accepted"
- Make sure you're using App Password, not regular password
- Verify 2FA is enabled
- Check that the app password is correct (no typos)

### "Invalid login"
- Enable "Less secure app access" (if still using regular password - not recommended)
- Use App Password instead (recommended)

### Email not arriving
- Check spam folder
- Verify recipient email is correct
- Check Gmail sent folder
- Review server logs for errors

## Security Notes

1. **Never commit** `.env.local` to version control
2. **Use environment variables** for all credentials
3. **Rotate app passwords** regularly
4. **Monitor** for unusual sending patterns
5. **Consider** email verification for new users

## Alternative: Using Gmail API

For production, consider using Gmail API instead of SMTP:

```typescript
// Using Gmail API (requires OAuth2 setup)
import { google } from 'googleapis';

const gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client
});

// Send email via API
await gmail.users.messages.send({
  userId: 'me',
  requestBody: {
    raw: encodedMessage
  }
});
```

This provides:
- Higher sending limits
- Better deliverability
- Advanced features (read receipts, threading)
- OAuth2 security