/**
 * Email template for initiative invitation
 */

// Logo hosted on production domain
const LOGO_URL = 'https://v2.blipee.io/blipee-assistant-logo.png'

export interface InitiativeInvitationData {
  participantName: string | null
  participantEmail: string
  initiativeName: string
  initiativeDescription: string | null
  organizationName: string
  invitedByName: string
  role: 'owner' | 'member' | 'viewer'
  canEdit: boolean
  accessToken: string
  appUrl: string
}

export function generateInitiativeInvitationEmail(data: InitiativeInvitationData): {
  subject: string
  html: string
  text: string
} {
  const recipientName = data.participantName || data.participantEmail.split('@')[0]
  const roleLabel =
    data.role === 'owner' ? 'Owner' : data.role === 'member' ? 'Team Member' : 'Viewer'

  const viewUrl = `${data.appUrl}/initiatives/view/${data.accessToken}`
  const acceptUrl = `${data.appUrl}/initiatives/view/${data.accessToken}?action=accept`

  const subject = `You've been invited to "${data.initiativeName}"`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Initiative Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 500px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 24px;">
              <img src="${LOGO_URL}" alt="blipee Logo" style="width: 80px; height: 80px; display: block;" />
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #0a0a0a; letter-spacing: -0.5px;">
                You've been invited to an initiative
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #525252;">
                <strong style="color: #0a0a0a;">${data.invitedByName}</strong> from <strong style="color: #0a0a0a;">${data.organizationName}</strong> invited you to participate in a sustainability initiative.
              </p>
            </td>
          </tr>

          <!-- Initiative Details Box -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; border-left: 4px solid #0a0a0a;">
                <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0a0a0a;">
                  ${data.initiativeName}
                </h2>
                ${data.initiativeDescription ? `<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #525252;">${data.initiativeDescription}</p>` : ''}
              </div>
            </td>
          </tr>

          <!-- Role Information -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0; font-size: 13px; color: #737373;">Your Role</p>
                    <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; color: #0a0a0a;">${roleLabel}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #737373;">Permissions</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #525252;">
                      ${data.canEdit ? '• View initiative details<br>• Track progress and metrics<br>• Add comments and updates<br>• Edit initiative information' : '• View initiative details<br>• Track progress and metrics<br>• Add comments'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accept Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <div style="margin: 0 0 24px;">
                <a href="${acceptUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Accept invitation
                </a>
              </div>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                You don't need a blipee account to participate.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #737373; text-align: center;">
                  Or copy and paste this link in your browser:
                </p>
                <p style="margin: 0; font-size: 12px; color: #a3a3a3; word-break: break-all; text-align: center; font-family: 'Courier New', monospace;">
                  ${viewUrl}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px 48px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                © ${new Date().getFullYear()} blipee. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `
Hi ${recipientName},

${data.invitedByName} from ${data.organizationName} invited you to participate in a sustainability initiative.

INITIATIVE: ${data.initiativeName}
${data.initiativeDescription ? `DESCRIPTION: ${data.initiativeDescription}` : ''}

YOUR ROLE: ${roleLabel}

PERMISSIONS:
${data.canEdit ? `- View initiative details
- Track progress and metrics
- Add comments and updates
- Edit initiative information` : `- View initiative details
- Track progress and metrics
- Add comments`}

ACCEPT INVITATION:
${acceptUrl}

Or copy and paste this link in your browser:
${viewUrl}

You don't need a blipee account to participate.

If you weren't expecting this invitation, you can safely ignore this email.

---
© ${new Date().getFullYear()} blipee. All rights reserved.
  `.trim()

  return { subject, html, text }
}
