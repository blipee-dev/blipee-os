import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';

// GET organization's selected metrics
export async function GET(request: NextRequest) {

  const user = await getAPIUser(request);
    if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let organizationId = null;

    // Check if user is super_admin
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

    if (isSuperAdmin) {
      // For super_admin, get the first organization or a default one
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      organizationId = org?.id;
    } else {
      // Get user's organization using centralized helper
      const { organizationId: userOrgId } = await getUserOrganization(user.id);
      organizationId = userOrgId;
    }

    if (!organizationId) {
      // Return empty metrics array if no organization
      return NextResponse.json({
        metrics: [],
        organization_id: null
      });
    }

    // Get organization's selected metrics with catalog details
    const { data: metrics, error } = await supabase
      .from('organization_metrics')
      .select(`
        *,
        metric:metrics_catalog(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at');

    if (error) throw error;

    return NextResponse.json({
      metrics: metrics || [],
      organization_id: organizationId
    });
  } catch (error) {
    console.error('Error fetching organization metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization metrics' },
      { status: 500 }
    );
  }
}

// POST select metrics for organization
export async function POST(request: NextRequest) {

  const user = await getAPIUser(request);
    if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { metric_ids, template_id, organization_id: providedOrgId } = await request.json();

    // Check if user is super_admin
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

    let organizationId = null;
    let hasPermission = false;

    if (isSuperAdmin) {
      // Super admin can manage any organization
      hasPermission = true;
      // Use provided org ID or get the first organization
      if (providedOrgId) {
        organizationId = providedOrgId;
      } else {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        organizationId = org?.id;
      }
    } else {
      // Get user's organization from app_users using admin client
      const { data: appUser } = await supabaseAdmin
        .from('app_users')
        .select('organization_id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser?.organization_id) {
        // Check user_access table using admin client
        const { data: userAccess } = await supabaseAdmin
          .from('user_access')
          .select('resource_id, role')
          .eq('user_id', user.id)
          .eq('resource_type', 'org')
          .limit(1)
          .single();

        if (!userAccess) {
          return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }
        organizationId = userAccess.resource_id;
        hasPermission = ['owner', 'manager'].includes(userAccess.role);
      } else {
        organizationId = appUser.organization_id;
        hasPermission = ['owner', 'manager'].includes(appUser.role);
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    let metricsToAdd = metric_ids;

    // If template_id provided, get metrics from template
    if (template_id) {
      const { data: template } = await supabase
        .from('metrics_templates')
        .select('metric_ids')
        .eq('id', template_id)
        .single();

      if (template) {
        metricsToAdd = template.metric_ids;
      }
    }

    // Add metrics to organization
    const organizationMetrics = metricsToAdd.map((metric_id: string) => ({
      organization_id: organizationId,
      metric_id,
      reporting_frequency: 'monthly',
      data_source: 'Manual'
    }));

    const { data, error } = await supabase
      .from('organization_metrics')
      .upsert(organizationMetrics, {
        onConflict: 'organization_id,metric_id'
      })
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      metrics: data,
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error adding organization metrics:', error);
    return NextResponse.json(
      { error: 'Failed to add organization metrics' },
      { status: 500 }
    );
  }
}

// DELETE remove metric from organization
export async function DELETE(request: NextRequest) {

  const user = await getAPIUser(request);
    if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { metric_id, organization_id: providedOrgId } = await request.json();

    // Check if user is super_admin
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

    let organizationId = null;
    let hasPermission = false;

    if (isSuperAdmin) {
      // Super admin can manage any organization
      hasPermission = true;
      // Use provided org ID or get the first organization
      if (providedOrgId) {
        organizationId = providedOrgId;
      } else {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        organizationId = org?.id;
      }
    } else {
      // Get user's organization from app_users using admin client
      const { data: appUser } = await supabaseAdmin
        .from('app_users')
        .select('organization_id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser?.organization_id) {
        // Check user_access table using admin client
        const { data: userAccess } = await supabaseAdmin
          .from('user_access')
          .select('resource_id, role')
          .eq('user_id', user.id)
          .eq('resource_type', 'org')
          .limit(1)
          .single();

        if (!userAccess) {
          return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }
        organizationId = userAccess.resource_id;
        hasPermission = ['owner', 'manager'].includes(userAccess.role);
      } else {
        organizationId = appUser.organization_id;
        hasPermission = ['owner', 'manager'].includes(appUser.role);
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('organization_metrics')
      .update({ is_active: false })
      .eq('organization_id', organizationId)
      .eq('metric_id', metric_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing organization metric:', error);
    return NextResponse.json(
      { error: 'Failed to remove organization metric' },
      { status: 500 }
    );
  }
}