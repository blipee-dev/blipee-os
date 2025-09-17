import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is super admin (same logic as /settings/sites page)
    const { data: superAdminRecord } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isSuperAdmin = !!superAdminRecord;
    console.log('User is super admin:', isSuperAdmin);

    let organizationIds = [];
    let sites = [];

    if (isSuperAdmin) {
      // Super admin can see all sites (only select what we need) - use admin client
      const { data: allSites, error: sitesError } = await supabaseAdmin
        .from('sites')
        .select('id, name, location, organization_id, type, total_area_sqm, total_employees, floors, floor_details, status, timezone, address, created_at, updated_at')
        .order('name');

      if (sitesError) {
        console.error('Error fetching all sites for super admin:', sitesError);
        throw sitesError;
      }

      sites = allSites || [];
      console.log('Super admin - fetched all sites:', sites.length);
    } else {
      // Regular users - fetch their organizations through organization_members table
      const { data: orgMemberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error fetching organization memberships:', membershipError);
      }

      console.log('Organization memberships:', orgMemberships);

      if (orgMemberships && orgMemberships.length > 0) {
        organizationIds = orgMemberships.map(om => om.organization_id);
        console.log('User is member of organizations:', organizationIds);

        // Fetch sites for user's organizations (only select what we need) - use admin client
        const { data: userSites, error: sitesError } = await supabaseAdmin
          .from('sites')
          .select('id, name, location, organization_id, type, total_area_sqm, total_employees, floors, floor_details, status, timezone, address, created_at, updated_at')
          .in('organization_id', organizationIds)
          .order('name');

        if (sitesError) {
          console.error('Error fetching user sites:', sitesError);
          throw sitesError;
        }

        sites = userSites || [];
        console.log('Regular user - fetched sites:', sites.length);
      } else {
        console.log('User has no organization memberships - returning empty sites array');
        sites = [];
      }
    }

    return NextResponse.json({ sites });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}