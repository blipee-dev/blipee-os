/**
 * Contact Form Server Action
 *
 * Handles contact form submissions using Server Actions.
 * Replaces /api/contact route for better performance and V2 compliance.
 *
 * Benefits over API route:
 * - No fetch overhead
 * - Built-in CSRF protection
 * - Better type safety
 * - Direct database access with RLS
 */

'use server'

import { createClient } from '@/lib/supabase/v2/server'
import { z } from 'zod'
import nodemailer from 'nodemailer'

// Validation schema
const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

// Response type
type ContactResponse = {
  success: boolean
  message: string
  error?: string
}

/**
 * Submit contact form
 *
 * @example
 * ```tsx
 * import { submitContactForm } from '@/app/actions/v2/contact'
 *
 * const formData = new FormData(form)
 * const result = await submitContactForm(formData)
 * ```
 */
export async function submitContactForm(
  formData: FormData
): Promise<ContactResponse> {
  try {
    // Validate input
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string | undefined,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    }

    const validation = ContactSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        message: '',
        error: validation.error.errors[0].message,
      }
    }

    const { name, email, company, subject, message } = validation.data

    // Get Supabase client
    const supabase = await createClient()

    // Save to database
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        company: company || null,
        subject,
        message,
        submitted_at: new Date().toISOString(),
        source: 'contact_page',
      } as any)

    if (dbError) {
      console.error('Database error:', dbError)
      return {
        success: false,
        message: '',
        error: 'Unable to send message. Please try again.',
      }
    }

    // Send notification email to team (optional, can fail)
    await sendTeamNotification({ name, email, company, subject, message }).catch(
      (error) => {
        console.error('Failed to send team notification:', error)
        // Don't fail the request if email fails
      }
    )

    return {
      success: true,
      message: 'Thank you! Your message has been sent. We\'ll get back to you soon.',
    }
  } catch (error) {
    console.error('Contact form error:', error)
    return {
      success: false,
      message: '',
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Send notification email to team
 */
async function sendTeamNotification(data: {
  name: string
  email: string
  company?: string
  subject: string
  message: string
}): Promise<void> {
  // Skip if email not configured
  if (!process.env.SMTP_SERVER || !process.env.SMTP_USER) {
    console.log('Email not configured, skipping notification')
    return
  }

  const { name, email, company, subject, message } = data

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@blipee.com',
    to: 'info@blipee.com',
    subject: `New Contact Form Submission - ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
    `,
    text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ''}
Subject: ${subject}
Message: ${message}
Submitted at: ${new Date().toLocaleString()}
    `,
  })
}
