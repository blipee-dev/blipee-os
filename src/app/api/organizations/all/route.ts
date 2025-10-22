import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Force this route to be dynamic to ensure fresh data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {

    // Check if user is authenticated
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin using admin client to avoid RLS issues
    const { data: superAdminRecord } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!superAdminRecord) {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }


    // Super admin - fetch ALL organizations using admin client to bypass RLS
    const { data: allOrgs, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .order('name');

    if (orgsError) {
      console.error('Error fetching all organizations:', orgsError);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    // Get counts for each organization
    const orgsWithCounts = await Promise.all(
      (allOrgs || []).map(async (org) => {
        // Count sites
        const { count: sitesCount } = await supabaseAdmin
          .from('sites')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Count users
        const { count: usersCount } = await supabaseAdmin
          .from('app_users')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        return {
          ...org,
          sites: sitesCount || 0,
          users: usersCount || 0
        };
      })
    );

    return NextResponse.json({ organizations: orgsWithCounts });
  } catch (error: any) {
    console.error('Error in all organizations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}