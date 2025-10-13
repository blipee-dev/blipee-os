import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Reset password request received for email:', body.email);

    // Validate input
    const validated = resetPasswordSchema.parse(body);

    // Get the origin from the request headers
    const origin = request.headers.get('origin') ||
                  request.headers.get('x-forwarded-host') ?
                    `https://${request.headers.get('x-forwarded-host')}` :
                    process.env.NEXT_PUBLIC_SITE_URL ||
                    'http://localhost:3000';

    console.log('Reset password redirect URL:', `${origin}/auth/reset-password`);

    // Send reset password email using server client
    console.log('Creating Supabase client...');
    const supabase = await createServerSupabaseClient();
    console.log('Supabase client created, sending reset email...');

    const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
      redirectTo: `${origin}/auth/reset-password`,
    });

    if (error) {
      console.error('Supabase reset password error:', error.message, error);
      throw error;
    }

    console.log('Reset password email sent successfully');
    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error: any) {
    console.error('Reset password API error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          _error: "Invalid email address",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        _error: error.message || "Failed to send reset email. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
