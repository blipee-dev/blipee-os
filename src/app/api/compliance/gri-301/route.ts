import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const siteId = searchParams.get('siteId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Date range for the year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch materials metrics data
    let query = supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog!inner(
          name,
          category,
          unit,
          code
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate)
      .lte('period_start', endDate)
      .in('metrics_catalog.category', [
        'Raw Materials',
        'Recycled Materials',
        'Packaging Materials',
        'Product Reclamation'
      ]);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching materials metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch materials data' },
        { status: 500 }
      );
    }

    // Calculate totals by category
    let totalRawMaterials = 0;
    let renewableMaterials = 0;
    let nonRenewableMaterials = 0;
    let totalRecycledInput = 0;
    let totalPackaging = 0;
    let productsReclaimed = 0;

    const rawMaterialsBreakdown: { [key: string]: number } = {};
    const recycledBreakdown: { [key: string]: number } = {};
    const packagingBreakdown: { [key: string]: number } = {};
    const reclamationData: { [key: string]: number } = {};

    metricsData?.forEach((metric: any) => {
      const value = parseFloat(metric.value) || 0;
      const metricName = metric.metrics_catalog.name;
      const category = metric.metrics_catalog.category;
      const unit = metric.metrics_catalog.unit;

      if (category === 'Raw Materials' && unit === 'tonnes') {
        totalRawMaterials += value;

        if (metricName.includes('Renewable')) {
          renewableMaterials += value;
        } else if (metricName.includes('Non-Renewable')) {
          nonRenewableMaterials += value;
        }

        rawMaterialsBreakdown[metricName] = (rawMaterialsBreakdown[metricName] || 0) + value;
      } else if (category === 'Recycled Materials' && unit === 'tonnes') {
        totalRecycledInput += value;
        recycledBreakdown[metricName] = (recycledBreakdown[metricName] || 0) + value;
      } else if (category === 'Packaging Materials' && unit === 'tonnes') {
        totalPackaging += value;
        packagingBreakdown[metricName] = (packagingBreakdown[metricName] || 0) + value;
      } else if (category === 'Product Reclamation' && unit === 'tonnes') {
        productsReclaimed += value;
        reclamationData[metricName] = (reclamationData[metricName] || 0) + value;
      }
    });

    // Calculate recycled content percentage
    const recycledContentPercentage = totalRawMaterials > 0
      ? (totalRecycledInput / totalRawMaterials) * 100
      : 0;

    // Get organization data for intensity metrics
    const { data: orgData } = await supabase
      .from('organizations')
      .select('annual_revenue, employee_count, total_area')
      .eq('id', organizationId)
      .single();

    // Calculate intensity metrics
    const intensityMetrics = {
      materialsPerRevenue: orgData?.annual_revenue
        ? totalRawMaterials / (orgData.annual_revenue / 1000000)
        : null,
      materialsPerEmployee: orgData?.employee_count
        ? totalRawMaterials / orgData.employee_count
        : null,
      materialsPerArea: orgData?.total_area
        ? totalRawMaterials / orgData.total_area
        : null,
    };

    return NextResponse.json({
      year,
      organizationId,
      siteId,

      // GRI 301-1: Materials used by weight
      totalRawMaterials,
      renewableMaterials,
      nonRenewableMaterials,
      renewablePercentage: totalRawMaterials > 0 ? (renewableMaterials / totalRawMaterials) * 100 : 0,
      rawMaterialsBreakdown,

      // GRI 301-2: Recycled input materials
      totalRecycledInput,
      recycledContentPercentage,
      recycledBreakdown,

      // Packaging
      totalPackaging,
      packagingBreakdown,

      // GRI 301-3: Reclaimed products
      productsReclaimed,
      reclamationData,

      // Intensity metrics
      intensityMetrics,

      // Methodology
      methodology: {
        boundaries: siteId ? 'Site-specific data' : 'Organization-wide data',
        reportingPeriod: `${year}-01-01 to ${year}-12-31`,
        standards: 'GRI 301: Materials 2016',
      },
    });
  } catch (error) {
    console.error('Error in GRI 301 API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
