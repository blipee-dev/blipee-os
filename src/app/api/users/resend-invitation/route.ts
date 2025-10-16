import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendInvitationEmailViaGmail } from '@/lib/email/send-invitation-gmail';
import { PermissionService } from '@/lib/auth/permission-service';

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

    // Get target user to check organization
    const { data: targetUser } = await supabaseAdmin
      .from('app_users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current user for audit logging
    const { data: currentUser } = await supabaseAdmin
      .from('app_users')
      .select('name, email, role')
      .eq('auth_user_id', user.id)
      .single();

    // Check permission using centralized service
    const canResend = await PermissionService.canManageUsers(user.id, targetUser.organization_id);

    if (!canResend) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the full target user details
    const { data: targetUserDetails, error: fetchError } = await supabaseAdmin
      .from('app_users')
      .select('*, organizations!inner(name)')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUserDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only resend for pending users or users who haven't logged in
    if (targetUserDetails.status === 'active' && targetUserDetails.last_login) {
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
      email: targetUserDetails.email,
      options: {
        data: {
          full_name: targetUserDetails.name,
          organization_id: targetUserDetails.organization_id,
          role: targetUserDetails.role,
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
        email: targetUserDetails.email,
        userName: targetUserDetails.name,
        organizationName: targetUserDetails.organizations?.name || 'Your Organization',
        inviterName: currentUser?.name || user.email?.split('@')[0] || 'Team Admin',
        role: targetUserDetails.role,
        confirmationUrl,
        language: userLanguage as 'en' | 'es' | 'pt'
      });


      // Update user status to pending if it was inactive
      if (targetUserDetails.status === 'inactive') {
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
            target_email: targetUserDetails.email,
            target_name: targetUserDetails.name,
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