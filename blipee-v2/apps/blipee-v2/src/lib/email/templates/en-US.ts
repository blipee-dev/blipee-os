/**
 * English (United States) Email Templates
 * en-US locale
 */

// Logo hosted on production domain
const LOGO_URL = "https://v2.blipee.io/blipee-assistant-logo.png"

/**
 * Email Confirmation Template - English
 */
export function emailConfirmationTemplate(name: string, confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
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
                Confirm your email
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                ${name ? `Hi ${name}, ` : ''}Click the button below to confirm your email address and activate your account:
              </p>

              <!-- Confirm Button -->
              <div style="margin: 0 0 32px;">
                <a href="${confirmationUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Confirm email
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                This link expires in 48 hours.
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
                  ${confirmationUrl}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px 48px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">
                If you didn't create an account, you can safely ignore this email.
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
}

/**
 * Password Reset Template - English
 */
export function passwordResetTemplate(email: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
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
                Reset your password
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                We received a request to reset the password for your account (<strong>${email}</strong>). Click the button below to create a new password:
              </p>

              <!-- Reset Password Button -->
              <div style="margin: 0 0 32px;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Reset password
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                This link expires in 24 hours.
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
                  ${resetUrl}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px 48px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">
                If you didn't request a password reset, you can safely ignore this email and your password will remain unchanged.
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
}

/**
 * Magic Link Template - English
 */
export function magicLinkTemplate(email: string, magicLinkUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Access Link</title>
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
                Your access link
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                Click the button below to access your account (<strong>${email}</strong>):
              </p>

              <!-- Magic Link Button -->
              <div style="margin: 0 0 32px;">
                <a href="${magicLinkUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Access account
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                This link expires in 1 hour.
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
                  ${magicLinkUrl}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px 48px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">
                If you didn't request this link, you can safely ignore this email.
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
}

/**
 * User Invitation Template - English
 */
export function userInvitationTemplate(
  inviterName: string,
  organizationName: string,
  invitationUrl: string,
  role: string
): string {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Platform Invitation</title>
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
                You've been invited!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #525252;">
                <strong style="color: #0a0a0a;">${inviterName}</strong> invited you to join <strong style="color: #0a0a0a;">${organizationName}</strong> on blipee${role ? ` as <strong>${role}</strong>` : ''}.
              </p>

              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                Click the button below to accept the invitation and create your account:
              </p>

              <!-- Accept Invite Button -->
              <div style="margin: 0 0 32px;">
                <a href="${invitationUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Accept invitation
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                This invitation expires in 7 days.
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
                  ${invitationUrl}
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
}
