import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/auth/get-user-org';

export async function GET(request: NextRequest) {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgData = await getUserOrganization(supabase);
    if (!orgData || !orgData.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }
    const organizationId = orgData.organizationId;

    // Get organization's selected metrics
    const { data: orgMetrics, error: metricsError } = await supabase
      .from('organization_metrics')
      .select(`
        metric_id,
        reporting_frequency,
        metrics_catalog (
          id,
          name,
          scope,
          category,
          unit,
          code
        )
      `)
      .eq('organization_id', organizationId);

    if (metricsError) {
      console.error('Error fetching organization metrics:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Get the latest data for each metric to determine what's pending
    const currentDate = new Date();
    const pendingMetrics = [];

    for (const orgMetric of orgMetrics || []) {
      const metric = orgMetric.metrics_catalog;
      if (!metric) continue;

      // Get last data entry for this metric
      const { data: lastEntry } = await supabase
        .from('metrics_data')
        .select('period_end')
        .eq('organization_id', organizationId)
        .eq('metric_id', metric.id)
        .order('period_end', { ascending: false })
        .limit(1)
        .single();

      // Determine if metric is due based on frequency
      let isDue = false;
      let status = 'upcoming';
      let dueDate = new Date();

      if (!lastEntry) {
        // Never been updated
        isDue = true;
        status = 'overdue';
      } else {
        const lastUpdate = new Date(lastEntry.period_end);
        const daysSinceUpdate = Math.floor((currentDate.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

        switch (orgMetric.reporting_frequency) {
          case 'monthly':
            isDue = daysSinceUpdate > 30;
            dueDate = new Date(lastUpdate);
            dueDate.setMonth(dueDate.getMonth() + 1);
            break;
          case 'quarterly':
            isDue = daysSinceUpdate > 90;
            dueDate = new Date(lastUpdate);
            dueDate.setMonth(dueDate.getMonth() + 3);
            break;
          case 'annually':
            isDue = daysSinceUpdate > 365;
            dueDate = new Date(lastUpdate);
            dueDate.setFullYear(dueDate.getFullYear() + 1);
            break;
        }

        if (isDue) {
          status = currentDate > dueDate ? 'overdue' : 'due';
        } else if ((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24) <= 7) {
          status = 'upcoming';
        } else {
          status = 'complete';
        }
      }

      pendingMetrics.push({
        id: metric.id,
        name: metric.name,
        scope: parseInt(metric.scope.replace('scope_', '')),
        category: metric.category,
        unit: metric.unit,
        code: metric.code,
        lastUpdate: lastEntry?.period_end || null,
        dueDate: dueDate.toISOString().split('T')[0],
        status,
        frequency: orgMetric.reporting_frequency
      });
    }

    // Sort by status priority (overdue first, then due, then upcoming)
    const statusOrder = { 'overdue': 0, 'due': 1, 'upcoming': 2, 'complete': 3 };
    pendingMetrics.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    return NextResponse.json(pendingMetrics);
  } catch (error) {
    console.error('Error in pending metrics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get count of pending metrics for badge
export async function POST(request: NextRequest) {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgData = await getUserOrganization(supabase);
    if (!orgData || !orgData.organizationId) {
      return NextResponse.json({ count: 0 });
    }
    const organizationId = orgData.organizationId;

    // Quick count of metrics that need updating
    const { data: orgMetrics } = await supabase
      .from('organization_metrics')
      .select('metric_id, reporting_frequency')
      .eq('organization_id', organizationId);

    let pendingCount = 0;
    const currentDate = new Date();

    for (const orgMetric of orgMetrics || []) {
      // Get last data entry
      const { data: lastEntry } = await supabase
        .from('metrics_data')
        .select('period_end')
        .eq('organization_id', organizationId)
        .eq('metric_id', orgMetric.metric_id)
        .order('period_end', { ascending: false })
        .limit(1)
        .single();

      if (!lastEntry) {
        pendingCount++;
      } else {
        const lastUpdate = new Date(lastEntry.period_end);
        const daysSinceUpdate = Math.floor((currentDate.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

        const isDue =
          (orgMetric.reporting_frequency === 'monthly' && daysSinceUpdate > 30) ||
          (orgMetric.reporting_frequency === 'quarterly' && daysSinceUpdate > 90) ||
          (orgMetric.reporting_frequency === 'annually' && daysSinceUpdate > 365);

        if (isDue) pendingCount++;
      }
    }

    return NextResponse.json({ count: pendingCount });
  } catch (error) {
    console.error('Error getting pending count:', error);
    return NextResponse.json({ count: 0 });
  }
}