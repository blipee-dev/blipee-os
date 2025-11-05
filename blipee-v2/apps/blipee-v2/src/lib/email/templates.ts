/**
 * Email HTML Templates
 *
 * Branded HTML email templates for all authentication flows
 * Clean and minimal design with blipee robot logo
 */

// Logo hosted on domain - PNG for universal email client support
// blipee assistant robot (green) - 192x192px
const LOGO_URL = "https://blipee.io/blipee-assistant-logo.png"

/**
 * Email Confirmation Template
 */
export function emailConfirmationTemplate(name: string, confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu Email</title>
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
                Confirme seu email
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                ${name ? `Olá ${name}, ` : ''}Clique no botão abaixo para confirmar seu endereço de email e ativar sua conta:
              </p>

              <!-- Confirm Button -->
              <div style="margin: 0 0 32px;">
                <a href="${confirmationUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Confirmar email
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Este link expira em 48 horas.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #737373; text-align: center;">
                  Ou copie e cole este link no seu navegador:
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
                Se você não criou uma conta, ignore este email.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                © ${new Date().getFullYear()} blipee. Todos os direitos reservados.
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
 * Password Reset Template
 */
export function passwordResetTemplate(email: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha</title>
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
                Redefinir sua senha
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                Recebemos uma solicitação para redefinir a senha da sua conta (<strong>${email}</strong>). Clique no botão abaixo para criar uma nova senha:
              </p>

              <!-- Reset Password Button -->
              <div style="margin: 0 0 32px;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Redefinir senha
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Este link expira em 24 horas.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #737373; text-align: center;">
                  Ou copie e cole este link no seu navegador:
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
                Se você não solicitou a redefinição de senha, ignore este email e sua senha permanecerá inalterada.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                © ${new Date().getFullYear()} blipee. Todos os direitos reservados.
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
 * Magic Link Template
 */
export function magicLinkTemplate(email: string, magicLinkUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link de Acesso</title>
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
                Seu link de acesso
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                Clique no botão abaixo para acessar sua conta (<strong>${email}</strong>):
              </p>

              <!-- Magic Link Button -->
              <div style="margin: 0 0 32px;">
                <a href="${magicLinkUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Acessar conta
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Este link expira em 1 hora.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #737373; text-align: center;">
                  Ou copie e cole este link no seu navegador:
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
                Se você não solicitou este link, ignore este email.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                © ${new Date().getFullYear()} blipee. Todos os direitos reservados.
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
 * User Invitation Template
 */
export function userInvitationTemplate(
  inviterName: string,
  organizationName: string,
  invitationUrl: string,
  role: string
): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para a Plataforma</title>
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
                Você foi convidado!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #525252;">
                <strong style="color: #0a0a0a;">${inviterName}</strong> convidou você para se juntar à <strong style="color: #0a0a0a;">${organizationName}</strong> na blipee${role ? ` como <strong>${role}</strong>` : ''}.
              </p>

              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                Clique no botão abaixo para aceitar o convite e criar sua conta:
              </p>

              <!-- Accept Invite Button -->
              <div style="margin: 0 0 32px;">
                <a href="${invitationUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Aceitar convite
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Este convite expira em 7 dias.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #737373; text-align: center;">
                  Ou copie e cole este link no seu navegador:
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
                Se você não esperava este convite, pode ignorar este email com segurança.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                © ${new Date().getFullYear()} blipee. Todos os direitos reservados.
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
