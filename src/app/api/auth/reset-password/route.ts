import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = resetPasswordSchema.parse(body);

    // Get the origin from the request headers
    const origin = request.headers.get('origin') || 
                  request.headers.get('x-forwarded-host') ? 
                    `https://${request.headers.get('x-forwarded-host')}` : 
                    process.env.NEXT_PUBLIC_SITE_URL || 
                    'http://localhost:3000';

    // Send reset password email using server client
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
      redirectTo: `${origin}/auth/reset-password`,
    });

    if (error) {
      console.error('Reset password error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error: any) {
    console.error('Error:', error);

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
        _error: "Failed to send reset email. Please try again.",
      },
      { status: 500 },
    );
  }
}
