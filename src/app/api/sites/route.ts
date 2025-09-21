import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganization } from '@/lib/auth/get-user-org';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is super admin using admin client to avoid RLS issues
    const { data: superAdminRecord } = await supabaseAdmin
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
      // Get user's primary organization using centralized helper
      const { organizationId: primaryOrgId } = await getUserOrganization(user.id);

      const orgIds = new Set<string>();

      // Add primary organization if exists
      if (primaryOrgId) {
        orgIds.add(primaryOrgId);
      }

      // Also check user_access table for additional organizations
      const { data: userAccess, error: accessError } = await supabaseAdmin
        .from('user_access')
        .select('resource_id, role')
        .eq('user_id', user.id)
        .eq('resource_type', 'org');

      if (accessError) {
        console.error('Error fetching user access:', accessError);
      }

      console.log('User access:', userAccess);

      // Add user_access organizations to the set
      if (userAccess && userAccess.length > 0) {
        userAccess.forEach(ua => orgIds.add(ua.resource_id));
      }

      organizationIds = Array.from(orgIds);

      if (organizationIds.length > 0) {
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