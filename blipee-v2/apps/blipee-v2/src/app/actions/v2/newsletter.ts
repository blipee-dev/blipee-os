/**
 * Newsletter Subscription Server Action
 *
 * Handles newsletter subscriptions using Server Actions.
 * Replaces /api/newsletter route for better performance and V2 compliance.
 *
 * Benefits over API route:
 * - No fetch overhead
 * - Built-in CSRF protection
 * - Better type safety
 * - Automatic revalidation
 */

'use server'

import { createClient } from '@/lib/supabase/v2/server'
import { z } from 'zod'
import nodemailer from 'nodemailer'

// Validation schema
const NewsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

// Response type
type NewsletterResponse = {
  success: boolean
  message: string
  error?: string
}

/**
 * Subscribe to newsletter
 *
 * @example
 * ```tsx
 * import { subscribeToNewsletter } from '@/app/actions/v2/newsletter'
 *
 * const formData = new FormData()
 * formData.append('email', email)
 * const result = await subscribeToNewsletter(formData)
 * ```
 */
export async function subscribeToNewsletter(
  formData: FormData
): Promise<NewsletterResponse> {
  try {
    // Validate input
    const rawData = {
      email: formData.get('email') as string,
    }

    const validation = NewsletterSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        message: '',
        error: validation.error.errors[0].message,
      }
    }

    const { email } = validation.data

    // Get Supabase client
    const supabase = await createClient()

    // Save to database
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          email,
          subscribed_at: new Date().toISOString(),
          source: 'footer',
        },
      ] as any)

    if (dbError) {
      console.error('Database error:', dbError)

      // If duplicate email, return success (already subscribed)
      if (dbError.code === '23505') {
        return {
          success: true,
          message: 'You are already subscribed to our newsletter!',
        }
      }

      return {
        success: false,
        message: '',
        error: 'Failed to subscribe. Please try again.',
      }
    }

    // Send notification email to marketing team (optional, can fail)
    await sendMarketingNotification(email).catch((error) => {
      console.error('Failed to send marketing notification:', error)
      // Don't fail the request if email fails
    })

    return {
      success: true,
      message: 'Successfully subscribed! Check your inbox for confirmation.',
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return {
      success: false,
      message: '',
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Send notification email to marketing team
 */
async function sendMarketingNotification(email: string): Promise<void> {
  // Skip if email not configured
  if (!process.env.SMTP_SERVER || !process.env.SMTP_USER) {
    console.log('Email not configured, skipping notification')
    return
  }

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
    from: process.env.EMAIL_FROM || 'no-reply@blipee.com',
    to: 'marketing@blipee.com',
    subject: 'New Newsletter Subscription',
    html: `
      <h2>New Newsletter Subscription</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Source:</strong> Website Footer</p>
      <p><strong>Subscribed at:</strong> ${new Date().toLocaleString()}</p>
    `,
    text: `
New Newsletter Subscription

Email: ${email}
Source: Website Footer
Subscribed at: ${new Date().toLocaleString()}
    `,
  })
}
