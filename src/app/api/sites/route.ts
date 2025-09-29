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

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Remove fields that shouldn't be set directly
    delete body.id;
    delete body.created_at;
    delete body.updated_at;
    delete body.organization;

    // Check if user has permission to create sites
    const { data: superAdminRecord } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isSuperAdmin = !!superAdminRecord;

    // Validate organization_id
    if (!body.organization_id) {
      // If not super admin, get user's organization
      if (!isSuperAdmin) {
        const { organizationId } = await getUserOrganization(user.id);
        if (!organizationId) {
          return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
        }
        body.organization_id = organizationId;
      } else {
        return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
      }
    }

    // If not super admin, verify user has access to the organization
    if (!isSuperAdmin) {
      const { organizationId: userOrgId } = await getUserOrganization(user.id);

      // Also check user_access table
      const { data: userAccess } = await supabaseAdmin
        .from('user_access')
        .select('resource_id')
        .eq('user_id', user.id)
        .eq('resource_type', 'org')
        .eq('resource_id', body.organization_id)
        .maybeSingle();

      if (body.organization_id !== userOrgId && !userAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Create the site using admin client to bypass RLS
    const { data: newSite, error: createError } = await supabaseAdmin
      .from('sites')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating site:', createError);
      throw createError;
    }

    return NextResponse.json({ site: newSite });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the site ID from the URL search params
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('id');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    delete body.id;
    delete body.created_at;
    delete body.updated_at;
    delete body.organization;

    // Check if user has permission to update this site
    const { data: superAdminRecord } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isSuperAdmin = !!superAdminRecord;

    if (!isSuperAdmin) {
      // Check if user has access to the site's organization
      const { data: site } = await supabaseAdmin
        .from('sites')
        .select('organization_id')
        .eq('id', siteId)
        .single();

      if (!site) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
      }

      // Check if user has access to this organization
      const { organizationId: userOrgId } = await getUserOrganization(user.id);

      // Also check user_access table
      const { data: userAccess } = await supabaseAdmin
        .from('user_access')
        .select('resource_id')
        .eq('user_id', user.id)
        .eq('resource_type', 'org')
        .eq('resource_id', site.organization_id)
        .maybeSingle();

      if (site.organization_id !== userOrgId && !userAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Update the site using admin client to bypass RLS
    const { data: updatedSite, error: updateError } = await supabaseAdmin
      .from('sites')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', siteId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating site:', updateError);
      throw updateError;
    }

    return NextResponse.json({ site: updatedSite });
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json(
      { error: 'Failed to update site' },
      { status: 500 }
    );
  }
}