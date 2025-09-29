import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get PLMJ organization
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('name', 'PLMJ')
      .single();

    const organizationId = org?.id;

    // Get sites with their areas
    const { data: sites } = await supabaseAdmin
      .from('sites')
      .select('id, name, total_area_sqm, total_employees, type')
      .eq('organization_id', organizationId);

    // Create sites map
    const sitesMap = new Map(sites?.map(s => [s.id, {
      ...s,
      area_m2: s.total_area_sqm,
      employee_count: s.total_employees,
      site_type: s.type
    }]) || []);

    // Calculate total area
    let totalArea = 0;
    const siteAreas: any[] = [];
    sitesMap.forEach(site => {
      const area = site.area_m2 || 0;
      totalArea += area;
      siteAreas.push({
        id: site.id,
        name: site.name,
        area: area
      });
    });

    // Get 2025 emissions
    const { data: emissions } = await supabaseAdmin
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_end', '2025-12-31')
      .not('site_id', 'is', null);

    const totalEmissionsKg = emissions?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0;
    const totalEmissionsTons = totalEmissionsKg / 1000;
    const intensity = totalArea > 0 ? totalEmissionsKg / totalArea : 0;

    return NextResponse.json({
      sites: siteAreas,
      totalArea,
      totalEmissionsKg,
      totalEmissionsTons: Math.round(totalEmissionsTons * 10) / 10,
      carbonIntensity: Math.round(intensity * 10) / 10,
      dataPoints: emissions?.length || 0
    });
  } catch (error: any) {
    console.error('Test intensity error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}