import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {

    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check app_users record
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    // Check organization memberships
    const { data: orgMembers, error: orgError } = await supabaseAdmin
      .from('organization_members')
      .select('*, organizations!inner(*)')
      .eq('user_id', user.id);

    return NextResponse.json({
      authUser: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      appUser: appUser || null,
      appUserError: appUserError?.message || null,
      organizationMemberships: orgMembers || [],
      organizationError: orgError?.message || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
