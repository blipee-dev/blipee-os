/**
 * Spanish (European) Email Templates
 * es-ES locale
 */

// Logo hosted on production domain
const LOGO_URL = "https://v2.blipee.io/blipee-assistant-logo.png"

/**
 * Email Confirmation Template - Spanish
 */
export function emailConfirmationTemplate(name: string, confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es-ES">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirma tu Correo Electrónico</title>
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
                Confirma tu correo electrónico
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                ${name ? `Hola ${name}, ` : ''}Haz clic en el botón de abajo para confirmar tu dirección de correo electrónico y activar tu cuenta:
              </p>

              <!-- Confirm Button -->
              <div style="margin: 0 0 32px;">
                <a href="${confirmationUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Confirmar correo
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Este enlace caduca en 48 horas.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #737373; text-align: center;">
                  O copia y pega este enlace en tu navegador:
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
                Si no has creado una cuenta, puedes ignorar este correo con seguridad.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                © ${new Date().getFullYear()} blipee. Todos los derechos reservados.
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
 * Password Reset Template - Spanish
 */
export function passwordResetTemplate(email: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es-ES">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña</title>
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
                Restablecer tu contraseña
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta (<strong>${email}</strong>). Haz clic en el botón de abajo para crear una nueva contraseña:
              </p>

              <!-- Reset Password Button -->
              <div style="margin: 0 0 32px;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Restablecer contraseña
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Este enlace caduca en 24 horas.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #737373; text-align: center;">
                  O copia y pega este enlace en tu navegador:
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
                Si no has solicitado restablecer tu contraseña, puedes ignorar este correo con seguridad y tu contraseña permanecerá sin cambios.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                © ${new Date().getFullYear()} blipee. Todos los derechos reservados.
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
 * Magic Link Template - Spanish
 */
export function magicLinkTemplate(email: string, magicLinkUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es-ES">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Enlace de Acceso</title>
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
                Tu enlace de acceso
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                Haz clic en el botón de abajo para acceder a tu cuenta (<strong>${email}</strong>):
              </p>

              <!-- Magic Link Button -->
              <div style="margin: 0 0 32px;">
                <a href="${magicLinkUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Acceder a la cuenta
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Este enlace caduca en 1 hora.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #737373; text-align: center;">
                  O copia y pega este enlace en tu navegador:
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
                Si no has solicitado este enlace, puedes ignorar este correo con seguridad.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                © ${new Date().getFullYear()} blipee. Todos los derechos reservados.
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
 * User Invitation Template - Spanish
 */
export function userInvitationTemplate(
  inviterName: string,
  organizationName: string,
  invitationUrl: string,
  role: string
): string {
  return `<!DOCTYPE html>
<html lang="es-ES">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a la Plataforma</title>
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
                ¡Has sido invitado!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #525252;">
                <strong style="color: #0a0a0a;">${inviterName}</strong> te ha invitado a unirte a <strong style="color: #0a0a0a;">${organizationName}</strong> en blipee${role ? ` como <strong>${role}</strong>` : ''}.
              </p>

              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #525252;">
                Haz clic en el botón de abajo para aceptar la invitación y crear tu cuenta:
              </p>

              <!-- Accept Invite Button -->
              <div style="margin: 0 0 32px;">
                <a href="${invitationUrl}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px;">
                  Aceptar invitación
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Esta invitación caduca en 7 días.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #737373; text-align: center;">
                  O copia y pega este enlace en tu navegador:
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
                Si no esperabas esta invitación, puedes ignorar este correo con seguridad.
              </p>
              <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                © ${new Date().getFullYear()} blipee. Todos los derechos reservados.
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
