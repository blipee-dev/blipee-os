/**
 * Support Ticket Server Action
 *
 * Handles support ticket submissions using Server Actions.
 * Replaces /api/support route for better performance and V2 compliance.
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
const SupportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Please select a valid priority level' }),
  }),
  category: z.string().min(1, 'Please select a category'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

// Response type
type SupportResponse = {
  success: boolean
  message: string
  error?: string
  ticketId?: string
}

/**
 * Submit support ticket
 *
 * @example
 * ```tsx
 * import { submitSupportTicket } from '@/app/actions/v2/support'
 *
 * const formData = new FormData(form)
 * const result = await submitSupportTicket(formData)
 * ```
 */
export async function submitSupportTicket(
  formData: FormData
): Promise<SupportResponse> {
  try {
    // Validate input
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      priority: formData.get('priority') as string,
      category: formData.get('category') as string,
      message: formData.get('message') as string,
    }

    const validation = SupportSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        message: '',
        error: validation.error.errors[0].message,
      }
    }

    const { name, email, priority, category, message } = validation.data

    // Get Supabase client
    const supabase = await createClient()

    // Save to database
    const { data: ticket, error: dbError } = await (supabase
      .from('support_tickets') as any)
      .insert([
        {
          name,
          email,
          priority,
          category,
          message,
          status: 'open',
          submitted_at: new Date().toISOString(),
          source: 'support_page',
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return {
        success: false,
        message: '',
        error: 'Unable to submit ticket. Please try again.',
      }
    }

    // Send notification email to support team (optional, can fail)
    await sendSupportNotification({
      name,
      email,
      priority,
      category,
      message,
    }).catch((error) => {
      console.error('Failed to send support notification:', error)
      // Don't fail the request if email fails
    })

    return {
      success: true,
      message:
        'Support ticket submitted successfully. Our team will respond shortly.',
      ticketId: ticket?.id,
    }
  } catch (error) {
    console.error('Support ticket error:', error)
    return {
      success: false,
      message: '',
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Send notification email to support team
 */
async function sendSupportNotification(data: {
  name: string
  email: string
  priority: string
  category: string
  message: string
}): Promise<void> {
  // Skip if email not configured
  if (!process.env.SMTP_SERVER || !process.env.SMTP_USER) {
    console.log('Email not configured, skipping notification')
    return
  }

  const { name, email, priority, category, message } = data

  const priorityEmoji: Record<string, string> = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴',
  }

  const emoji = priorityEmoji[priority] || '⚪'

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
    to: 'support@blipee.com',
    subject: `${emoji} New Support Ticket - ${priority.toUpperCase()} - ${category}`,
    html: `
      <h2>New Support Ticket</h2>
      <p><strong>Priority:</strong> ${emoji} ${priority.toUpperCase()}</p>
      <p><strong>Category:</strong> ${category}</p>
      <hr>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Status:</strong> Open</p>
    `,
    text: `
New Support Ticket

Priority: ${priority.toUpperCase()}
Category: ${category}

Name: ${name}
Email: ${email}
Message: ${message}

Submitted at: ${new Date().toLocaleString()}
Status: Open
    `,
  })
}
