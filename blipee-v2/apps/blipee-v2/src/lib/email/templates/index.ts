/**
 * Email Template Selector
 * Routes to the correct language template based on locale
 */

import * as enUS from './en-US'
import * as esES from './es-ES'
import * as ptPT from './pt-PT'

// Supported locales
export type Locale = 'en-US' | 'es-ES' | 'pt-PT'

// Email types
export type EmailType =
  | 'email_confirmation'
  | 'password_reset'
  | 'magic_link'
  | 'user_invitation'

// Template data interfaces
export interface EmailConfirmationData {
  name: string
  confirmationUrl: string
}

export interface PasswordResetData {
  email: string
  resetUrl: string
}

export interface MagicLinkData {
  email: string
  magicLinkUrl: string
}

export interface UserInvitationData {
  inviterName: string
  organizationName: string
  invitationUrl: string
  role: string
}

export type TemplateData =
  | EmailConfirmationData
  | PasswordResetData
  | MagicLinkData
  | UserInvitationData

// Template modules by locale
const templates = {
  'en-US': enUS,
  'es-ES': esES,
  'pt-PT': ptPT,
}

/**
 * Get the appropriate email template based on type and locale
 * Falls back to en-US if locale is not supported
 */
export function getEmailTemplate(
  type: EmailType,
  locale: Locale,
  data: TemplateData
): string {
  // Get locale templates with fallback to en-US
  const localeTemplates = templates[locale] || templates['en-US']

  switch (type) {
    case 'email_confirmation':
      const confirmData = data as EmailConfirmationData
      return localeTemplates.emailConfirmationTemplate(
        confirmData.name,
        confirmData.confirmationUrl
      )

    case 'password_reset':
      const resetData = data as PasswordResetData
      return localeTemplates.passwordResetTemplate(resetData.email, resetData.resetUrl)

    case 'magic_link':
      const magicData = data as MagicLinkData
      return localeTemplates.magicLinkTemplate(magicData.email, magicData.magicLinkUrl)

    case 'user_invitation':
      const inviteData = data as UserInvitationData
      return localeTemplates.userInvitationTemplate(
        inviteData.inviterName,
        inviteData.organizationName,
        inviteData.invitationUrl,
        inviteData.role
      )

    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}

/**
 * Get email subject by type and locale
 */
export function getEmailSubject(type: EmailType, locale: Locale): string {
  const subjects = {
    'en-US': {
      email_confirmation: 'Confirm your email address',
      password_reset: 'Reset your password',
      magic_link: 'Your access link',
      user_invitation: "You've been invited to blipee",
    },
    'es-ES': {
      email_confirmation: 'Confirma tu correo electrónico',
      password_reset: 'Restablece tu contraseña',
      magic_link: 'Tu enlace de acceso',
      user_invitation: 'Has sido invitado a blipee',
    },
    'pt-PT': {
      email_confirmation: 'Confirme o seu email',
      password_reset: 'Redefina a sua palavra-passe',
      magic_link: 'A sua ligação de acesso',
      user_invitation: 'Foi convidado para a blipee',
    },
  }

  const localeSubjects = subjects[locale] || subjects['en-US']
  return localeSubjects[type]
}
