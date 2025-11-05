/**
 * Email Mailer using Gmail SMTP
 *
 * Uses nodemailer with Gmail SMTP configuration from .env.local
 * Sender: no-reply@blipee.com
 *
 * Configuration:
 * - SMTP_SERVER=smtp.gmail.com
 * - SMTP_PORT=587
 * - SMTP_USER=pedro@blipee.com
 * - SMTP_PASSWORD=... (app password)
 * - EMAIL_FROM=no-reply@blipee.com
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Create transporter singleton
let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) {
    return transporter
  }

  if (!process.env.SMTP_SERVER || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP configuration missing in environment variables')
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports (587 uses STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    // Gmail-specific settings
    tls: {
      // Don't fail on invalid certs (useful for development)
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  })

  return transporter
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string // Plain text fallback
  attachments?: Array<{
    filename: string
    path?: string
    content?: Buffer
    cid?: string // Content-ID for inline images
  }>
}

/**
 * Send an email using Gmail SMTP
 *
 * @param options - Email options (to, subject, html, text)
 * @returns Promise with success status
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter()

    const result = await transporter.sendMail({
      from: `"blipee" <${process.env.EMAIL_FROM || 'no-reply@blipee.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html), // Auto-generate text version
      attachments: options.attachments, // Inline images and other attachments
    })

    console.log('[EMAIL] Sent successfully:', {
      to: options.to,
      subject: options.subject,
      messageId: result.messageId,
    })

    return { success: true }
  } catch (error) {
    console.error('[EMAIL] Failed to send:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
}

/**
 * Get logo attachment for emails
 * Uses CID (Content-ID) for inline display
 * Logo: blipee assistant robot (green)
 */
export function getLogoAttachment() {
  const path = require('path')
  const logoPath = path.join(process.cwd(), 'public', 'blipee-assistant-logo.svg')

  return {
    filename: 'blipee-logo.svg',
    path: logoPath,
    cid: 'blipee-logo', // Referenced as cid:blipee-logo in HTML
  }
}

/**
 * Test email connection
 */
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter()
    await transporter.verify()
    console.log('[EMAIL] SMTP connection verified successfully')
    return { success: true }
  } catch (error) {
    console.error('[EMAIL] SMTP connection failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}
