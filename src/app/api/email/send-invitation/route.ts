import { NextRequest, NextResponse } from 'next/server';
import { sendInvitationEmailViaGmail } from '@/lib/email/send-invitation-gmail';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const {
      email,
      userName,
      organizationName,
      inviterName,
      role,
      confirmationUrl,
      language
    } = body;

    // Validate required fields
    if (!email || !userName || !organizationName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Detect language if not provided
    let userLanguage = language;
    if (!userLanguage) {
      const acceptLanguage = request.headers.get('accept-language') || '';
      const languages = acceptLanguage.split(',').map(l => l.split(';')[0].trim().toLowerCase());

      if (languages.some(l => l.startsWith('es'))) {
        userLanguage = 'es';
      } else if (languages.some(l => l.startsWith('pt'))) {
        userLanguage = 'pt';
      } else {
        userLanguage = 'en';
      }
    }

    // Send the invitation email
    const result = await sendInvitationEmailViaGmail({
      email,
      userName,
      organizationName,
      inviterName: inviterName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Team Admin',
      role,
      confirmationUrl: confirmationUrl || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`,
      language: userLanguage
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation email sent successfully',
      messageId: result.messageId,
      language: userLanguage
    });

  } catch (error) {
    console.error('Error sending invitation email:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 500 }
    );
  }
}