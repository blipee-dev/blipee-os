/**
 * Test Email API Route
 * For testing email sending functionality
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, testEmailConnection } from '@/lib/email/mailer'
import { getEmailTemplate } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, test } = await request.json()

    console.log('[TEST EMAIL] Testing email system')
    console.log('[TEST EMAIL] To:', to)
    console.log('[TEST EMAIL] Subject:', subject)

    // First test connection
    console.log('[TEST EMAIL] Testing SMTP connection...')
    const connectionTest = await testEmailConnection()

    if (!connectionTest.success) {
      console.error('[TEST EMAIL] SMTP connection failed:', connectionTest.error)
      return NextResponse.json({
        success: false,
        error: `SMTP connection failed: ${connectionTest.error}`
      })
    }

    console.log('[TEST EMAIL] ✓ SMTP connection successful')

    // Send test email
    console.log('[TEST EMAIL] Sending test email...')
    const result = await sendEmail({
      to,
      subject,
      html: test
        ? `
          <h1>Test Email</h1>
          <p>This is a test email from Blipee authentication system.</p>
          <p>If you received this, the email system is working correctly!</p>
        `
        : getEmailTemplate('email_confirmation', 'en-US', {
            name: 'Test User',
            confirmationUrl: 'http://localhost:3005/test',
          }),
    })

    if (result.success) {
      console.log('[TEST EMAIL] ✓ Email sent successfully')
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully'
      })
    } else {
      console.error('[TEST EMAIL] Email sending failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      })
    }

  } catch (error) {
    console.error('[TEST EMAIL] Exception:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function GET() {
  console.log('[TEST EMAIL] GET request - testing connection only')

  const result = await testEmailConnection()

  return NextResponse.json({
    success: result.success,
    message: result.success
      ? 'SMTP connection successful'
      : `SMTP connection failed: ${result.error}`,
    config: {
      server: process.env.SMTP_SERVER,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.EMAIL_FROM
    }
  })
}
