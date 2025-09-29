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

    // Get metrics data for 2025
    const { data: metricsData } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        co2e_emissions,
        metrics_catalog!inner(
          category,
          scope,
          name
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_end', '2025-12-31')
      .not('co2e_emissions', 'is', null);

    // Generate category heatmap (same logic as dashboard API)
    const categoryData: any = {};

    metricsData?.forEach(d => {
      const category = d.metrics_catalog?.category || 'Other';
      const scope = d.metrics_catalog?.scope || 'scope_1';

      if (!categoryData[category]) {
        categoryData[category] = {
          category,
          scope_1: 0,
          scope_2: 0,
          scope_3: 0
        };
      }

      categoryData[category][scope] += d.co2e_emissions || 0;
    });

    const categoryHeatmap = Object.values(categoryData).map((cat: any) => ({
      ...cat,
      scope1: Math.round((cat.scope_1 / 1000) * 10) / 10, // Convert kg to tons
      scope2: Math.round((cat.scope_2 / 1000) * 10) / 10,
      scope3: Math.round((cat.scope_3 / 1000) * 10) / 10
    }));

    return NextResponse.json({
      totalRecords: metricsData?.length || 0,
      categoryHeatmap,
      categories: Object.keys(categoryData),
      summary: categoryHeatmap.map((cat: any) => ({
        category: cat.category,
        total: (cat.scope1 + cat.scope2 + cat.scope3).toFixed(1) + ' tCO2e',
        breakdown: {
          scope1: cat.scope1 + ' tCO2e',
          scope2: cat.scope2 + ' tCO2e',
          scope3: cat.scope3 + ' tCO2e'
        }
      }))
    });
  } catch (error: any) {
    console.error('Test categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}