import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from '@/lib/supabase/admin';
import { organizationCreateSchema } from "@/lib/validation/schemas";
import { sessionManager } from '@/lib/session/manager';

export const dynamic = 'force-dynamic';

/**
 * Setup organization for users (especially super admins) who don't have one
 */
export async function POST(request: NextRequest) {
  try {
    // Get the custom session
    const sessionData = await sessionManager.getSessionFromCookies();

    if (!sessionData) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user details
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(sessionData.userId);

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = organizationCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid organization data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, slug, industry, size, metadata } = validation.data;

    // Check if user is super admin
    const { data: superAdminRecord } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isSuperAdmin = !!superAdminRecord;

    // Create the organization
    const { data: organization, error: createError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        industry,
        size,
        metadata: metadata || {},
        created_by: user.id
      })
      .select()
      .single();

    if (createError || !organization) {
      console.error('Error creating organization:', createError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    // Add user to the organization
    const { error: roleError } = await supabaseAdmin
      .from('user_organization_roles')
      .insert({
        user_id: user.id,
        organization_id: organization.id,
        role: isSuperAdmin ? 'owner' : 'account_owner'
      });

    if (roleError) {
      console.error('Error adding user to organization:', roleError);
    }

    // Update or create app_users entry with organization
    const { error: appUserError } = await supabaseAdmin
      .from('app_users')
      .upsert({
        auth_user_id: user.id,
        email: user.email,
        name: body.userName || user.email?.split('@')[0],
        role: isSuperAdmin ? 'super_admin' : 'account_owner',
        organization_id: organization.id,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'auth_user_id'
      });

    if (appUserError) {
      console.error('Error updating app_users:', appUserError);
    }

    // Update session with new organization
    await sessionManager.updateSessionData(sessionData.sessionId, {
      organizationId: organization.id,
      organizationName: organization.name,
      role: isSuperAdmin ? 'super_admin' : 'account_owner'
    });

    // Create initial buildings if requested
    if (body.createSampleBuildings) {
      const sampleBuildings = [
        {
          name: "Headquarters",
          address: "123 Main Street",
          city: "San Francisco",
          state: "CA",
          country: "USA",
          type: "office",
          size_sqft: 50000,
          floors: 5
        }
      ];

      for (const building of sampleBuildings) {
        await supabaseAdmin
          .from('buildings')
          .insert({
            ...building,
            organization_id: organization.id,
            created_by: user.id
          });
      }
    }

    return NextResponse.json({
      success: true,
      organization,
      message: isSuperAdmin
        ? "Organization created for super admin"
        : "Organization created successfully"
    });

  } catch (error: any) {
    console.error('Error in setup-organization:', error);
    return NextResponse.json(
      { error: error.message || "Failed to setup organization" },
      { status: 500 }
    );
  }
}

/**
 * GET existing organizations for super admins to select from
 */
export async function GET(request: NextRequest) {
  try {
    const sessionData = await sessionManager.getSessionFromCookies();

    if (!sessionData) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const { data: superAdminRecord } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', sessionData.userId)
      .maybeSingle();

    if (!superAdminRecord) {
      return NextResponse.json(
        { error: "Only super admins can list all organizations" },
        { status: 403 }
      );
    }

    // Get all organizations for super admin
    const { data: organizations, error } = await supabaseAdmin
      .from('organizations')
      .select(`
        *,
        buildings:buildings(count),
        users:user_organization_roles(count)
      `)
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      organizations: organizations || [],
      isSuperAdmin: true
    });

  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}