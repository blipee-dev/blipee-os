import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET organization's selected metrics
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let organizationId = null;

    if (profile?.role === 'super_admin') {
      // For super_admin, get the first organization or a default one
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      organizationId = org?.id;
    } else {
      // Get user's organization from members table
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      organizationId = member?.organization_id;
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
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { metric_ids, template_id, organization_id: providedOrgId } = await request.json();

    // Check if user is super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let organizationId = null;
    let hasPermission = false;

    if (profile?.role === 'super_admin') {
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
      // Get user's organization and check permissions
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      if (!member) {
        return NextResponse.json({ error: 'No organization found' }, { status: 404 });
      }

      organizationId = member.organization_id;
      hasPermission = ['account_owner', 'sustainability_manager'].includes(member.role);
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
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { metric_id, organization_id: providedOrgId } = await request.json();

    // Check if user is super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let organizationId = null;
    let hasPermission = false;

    if (profile?.role === 'super_admin') {
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
      // Get user's organization and check permissions
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      if (!member) {
        return NextResponse.json({ error: 'No organization found' }, { status: 404 });
      }

      organizationId = member.organization_id;
      hasPermission = ['account_owner', 'sustainability_manager'].includes(member.role);
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