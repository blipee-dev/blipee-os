import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendInvitationEmailViaGmail } from "@/lib/email/send-invitation-gmail";
import { z } from "zod";
import crypto from "crypto";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Password reset request for:', body.email);

    const validated = requestSchema.parse(body);
    const email = validated.email.toLowerCase().trim();

    // Check if user exists
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('Error listing users:', userError);
      throw userError;
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email);

    // Always return success to avoid email enumeration
    if (!user) {
      console.log('User not found, but returning success');
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, you will receive a password reset link.",
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      throw new Error('Failed to create reset token');
    }

    // Get app origin
    const origin = request.headers.get('origin') ||
                  request.headers.get('x-forwarded-host') ?
                    `https://${request.headers.get('x-forwarded-host')}` :
                    process.env.NEXT_PUBLIC_SITE_URL ||
                    'http://localhost:3000';

    // Create reset link
    const resetLink = `${origin}/reset-password?token=${token}`;

    // Send email (reusing the invitation email function with custom content)
    const htmlContent = generateResetEmail(user.email || email, resetLink);

    // Use nodemailer directly
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"blipee" <no-reply@blipee.com>',
      to: email,
      subject: 'Reset Your Password - blipee',
      html: htmlContent,
    });

    console.log('✅ Password reset email sent to:', email);

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error: any) {
    console.error('Password reset error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

function generateResetEmail(email: string, resetLink: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">

    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 48px;">
      <span style="font-size: 24px; font-weight: 400; background: linear-gradient(to right, rgb(236, 72, 153), rgb(147, 51, 234)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">blipee</span>
    </div>

    <!-- Title -->
    <h1 style="color: #111111; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
      Reset Your Password
    </h1>

    <p style="color: #616161; font-size: 16px; line-height: 24px; margin: 0 0 32px 0; text-align: center;">
      We received a request to reset your password
    </p>

    <!-- Info Card -->
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 0 0 32px 0;">
      <p style="color: #616161; font-size: 15px; line-height: 22px; margin: 0;">
        Click the button below to reset your password. This link will expire in 1 hour.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 0 0 24px 0;">
      <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, rgb(236, 72, 153), rgb(147, 51, 234)); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; font-size: 15px;">
        Reset Password
      </a>
    </div>

    <!-- Plain text link -->
    <p style="color: #616161; font-size: 13px; text-align: center; margin: 0 0 8px 0;">
      Or copy this link:
    </p>
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0 0 32px 0; word-break: break-all;">
      <a href="${resetLink}" style="color: rgb(147, 51, 234);">${resetLink}</a>
    </p>

    <!-- Security notice -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
      <p style="color: #616161; font-size: 14px; margin: 0;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <p style="text-align: center; color: #9ca3af; font-size: 13px; margin-top: 32px;">
      © 2025 blipee. All rights reserved.
    </p>
  </div>
</body>
</html>`;
}
