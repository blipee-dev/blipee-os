import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendInvitationEmailViaGmail } from '@/lib/email/send-invitation-gmail';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if current user has permission to resend invitations
    const { data: superAdminCheck } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data: currentUser } = await supabaseAdmin
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    const canResend = superAdminCheck || (currentUser && (currentUser.role === 'owner' || currentUser.role === 'manager'));

    if (!canResend) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the target user details
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('app_users')
      .select('*, organizations!inner(name)')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only resend for pending users or users who haven't logged in
    if (targetUser.status === 'active' && targetUser.last_login) {
      return NextResponse.json({
        error: 'User has already activated their account'
      }, { status: 400 });
    }

    // Detect user's language from request headers
    const acceptLanguage = request.headers.get('accept-language') || '';
    const languages = acceptLanguage.split(',').map(l => l.split(';')[0].trim().toLowerCase());
    let userLanguage = 'en';
    if (languages.some(l => l.startsWith('es'))) userLanguage = 'es';
    else if (languages.some(l => l.startsWith('pt'))) userLanguage = 'pt';

    // Generate new invitation link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: targetUser.email,
      options: {
        data: {
          full_name: targetUser.name,
          organization_id: targetUser.organization_id,
          role: targetUser.role,
          language: userLanguage
        }
      }
    });

    if (resetError || !resetData) {
      console.error('Error generating invitation link:', resetError);
      return NextResponse.json({
        error: 'Failed to generate invitation link'
      }, { status: 500 });
    }

    // Modify the link to use our callback
    const actionLink = resetData.properties.action_link;
    const url = new URL(actionLink);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    url.searchParams.delete('redirect_to');
    url.searchParams.append('redirect_to', `${baseUrl}/auth/callback`);

    const confirmationUrl = url.toString();

    // Send the invitation email
    try {
      await sendInvitationEmailViaGmail({
        email: targetUser.email,
        userName: targetUser.name,
        organizationName: targetUser.organizations?.name || 'Your Organization',
        inviterName: currentUser?.name || user.email?.split('@')[0] || 'Team Admin',
        role: targetUser.role,
        confirmationUrl,
        language: userLanguage as 'en' | 'es' | 'pt'
      });

      console.log(`Invitation resent to ${targetUser.email}`);

      // Update user status to pending if it was inactive
      if (targetUser.status === 'inactive') {
        await supabaseAdmin
          .from('app_users')
          .update({
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      // Log audit event
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'user.invitation_resent',
          resource_type: 'user',
          resource_id: userId,
          details: {
            target_email: targetUser.email,
            target_name: targetUser.name,
            resent_by: currentUser?.email || user.email
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Invitation resent successfully'
      });

    } catch (emailError: any) {
      console.error('Error sending invitation email:', emailError);
      return NextResponse.json({
        error: 'Failed to send invitation email'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}