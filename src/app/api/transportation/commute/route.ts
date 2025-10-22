import { NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export async function GET() {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);

    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = orgInfo.organizationId;

    // Fetch employee commute metrics from metrics_catalog (Scope 3.7)
    const { data: commuteMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .or('code.like.scope3_commute_%,code.like.scope3_employee_commute_%');

    if (metricsError) {
      console.error('Error fetching commute metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch commute metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    if (!commuteMetrics || commuteMetrics.length === 0) {
      return NextResponse.json({ commute: [] });
    }

    // Fetch commute data from metrics_data (using admin to bypass RLS)
    const metricIds = commuteMetrics.map(m => m.id);

    const { data: commuteData, error: dataError } = await supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .order('period_start', { ascending: false });

    if (dataError) {
      console.error('❌ Error fetching commute data:', dataError);
      return NextResponse.json(
        { error: 'Failed to fetch commute data', details: dataError.message },
        { status: 500 }
      );
    }

    // Group by commute mode and aggregate
    const commuteByMode = (commuteData || []).reduce((acc: any, record: any) => {
      const metric = commuteMetrics.find(m => m.id === record.metric_id);
      const metricCode = metric?.code || '';

      // Extract mode from metric code (e.g., 'scope3_commute_car' -> 'car')
      const mode = metricCode
        .replace('scope3_commute_', '')
        .replace('scope3_employee_commute_', '') || 'other';

      if (!acc[mode]) {
        acc[mode] = {
          mode: mode,
          commute_type: metric?.name || 'Unknown',
          metric_code: metricCode,
          employee_count: 0,
          avg_distance_km: 0,
          days_per_month: 0,
          total_distance_km: 0,
          emissions_tco2e: 0,
          cost: 0,
          unit: metric?.unit || 'km'
        };
      }

      // Add distance value
      acc[mode].total_distance_km += parseFloat(record.value) || 0;

      // Convert emissions from kgCO2e (database) to tCO2e (GRI 305 standard)
      acc[mode].emissions_tco2e += (parseFloat(record.co2e_emissions) || 0) / 1000;

      // Count employees (using number of records as proxy)
      acc[mode].employee_count += 1;

      return acc;
    }, {});

    // Add intensity metrics and format final response
    const commuteWithIntensity = Object.values(commuteByMode).map((commute: any) => {
      const totalDistance = commute.total_distance_km || 0;
      const employeeCount = commute.employee_count || 1;
      const emissionsKg = commute.emissions_tco2e * 1000;

      // Calculate average distance per employee
      const avgDistance = employeeCount > 0 ? totalDistance / employeeCount : 0;

      // Calculate emission intensity (gCO2e/km)
      let intensity = 0;
      let intensity_unit = 'gCO2e/km';

      if (totalDistance > 0) {
        intensity = Math.round((emissionsKg * 1000) / totalDistance);
        intensity_unit = 'gCO2e/km';
      }

      return {
        ...commute,
        avg_distance_km: Math.round(avgDistance),
        total_distance_km: Math.round(totalDistance),
        emissions_tco2e: Math.round(commute.emissions_tco2e * 10) / 10,
        intensity: intensity,
        intensity_unit: intensity_unit,
        // Estimate days per month (20 working days typical)
        days_per_month: 20
      };
    });

    // Calculate total employees and remote work percentage
    const totalEmployees = commuteWithIntensity.reduce((sum, c) => sum + c.employee_count, 0);
    const remoteWorkers = commuteWithIntensity.find(c => c.mode === 'remote')?.employee_count || 0;
    const remoteWorkPercentage = totalEmployees > 0 ? (remoteWorkers / totalEmployees) * 100 : 0;

    const response = {
      commute: commuteWithIntensity,
      summary: {
        total_employees: totalEmployees,
        remote_workers: remoteWorkers,
        remote_work_percentage: Math.round(remoteWorkPercentage)
      },
      raw: commuteData
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching commute data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commute data' },
      { status: 500 }
    );
  }
}
