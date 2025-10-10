import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';

export async function GET(request: NextRequest) {
  console.log('🔍 Data Comparison: Starting analysis');
  
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '2024';
    
    // Get user's organization
    let organizationId: string | null = null;

    // Check if super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (superAdmin) {
      // Get PLMJ organization for super admin
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'PLMJ')
        .single();
      organizationId = org?.id;
    } else {
      // Get user's organization
      const { data: userAccess } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (userAccess) {
        organizationId = userAccess.organization_id;
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Fetch raw data for the year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const { data: rawData, error: dataError } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          id, name, code, unit, scope, category, subcategory,
          emission_factor, emission_factor_unit
        ),
        sites (
          id, name
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate)
      .lte('period_end', endDate)
      .order('period_start', { ascending: true });

    if (dataError) {
      console.error('Error fetching data:', dataError);
      throw dataError;
    }

    console.log(`🔍 Data Comparison: Found ${rawData?.length || 0} total records for ${year}`);
    console.log('✅ Using calculator for data-comparison emissions calculation');

    // Group data by month
    const monthlyComparison: any = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize all months
    months.forEach((month, index) => {
      monthlyComparison[month] = {
        month,
        monthNumber: index + 1,
        rawRecords: 0,
        totalEmissions: 0,
        electricity: { value: 0, count: 0 },
        water: { value: 0, count: 0 },
        waste: { value: 0, count: 0 },
        dataRanges: []
      };
    });

    // Process each record for metadata (not emissions - calculator handles that)
    rawData?.forEach(record => {
      const startDate = new Date(record.period_start);
      const endDate = new Date(record.period_end);
      const monthIndex = startDate.getMonth();
      const monthName = months[monthIndex];

      if (monthlyComparison[monthName]) {
        monthlyComparison[monthName].rawRecords++;
        
        // Track date ranges to detect month spanning issues
        monthlyComparison[monthName].dataRanges.push({
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          startMonth: startDate.getMonth() + 1,
          endMonth: endDate.getMonth() + 1,
          crossesMonth: startDate.getMonth() !== endDate.getMonth()
        });

        // Categorize metrics
        const category = record.metrics_catalog?.category;
        const unit = record.unit?.toLowerCase();

        if (category === 'Electricity' || category === 'Purchased Energy') {
          monthlyComparison[monthName].electricity.value += record.value || 0;
          monthlyComparison[monthName].electricity.count++;
        } else if (category === 'Purchased Goods & Services' && (unit === 'm³' || unit === 'm3')) {
          monthlyComparison[monthName].water.value += record.value || 0;
          monthlyComparison[monthName].water.count++;
        } else if (category === 'Waste') {
          monthlyComparison[monthName].waste.value += record.value || 0;
          monthlyComparison[monthName].waste.count++;
        }
      }
    });

    // Calculate monthly emissions using calculator for consistency
    for (const monthName of months) {
      const monthIndex = months.indexOf(monthName);
      const monthStart = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      const nextMonthIndex = (monthIndex + 1) % 12;
      const nextYear = monthIndex === 11 ? parseInt(year) + 1 : year;
      const monthEnd = `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-01`;

      const monthEmissions = await getPeriodEmissions(organizationId, monthStart, monthEnd);
      monthlyComparison[monthName].totalEmissions = monthEmissions.total;
    }

    // Convert to array and add summary stats
    const comparisonData = Object.values(monthlyComparison).map((month: any) => ({
      ...month,
      totalEmissions: month.totalEmissions, // Already rounded by calculator
      electricity: {
        ...month.electricity,
        value: Math.round(month.electricity.value)
      },
      water: {
        ...month.water,
        value: Math.round(month.water.value)
      },
      waste: {
        ...month.waste,
        value: Math.round(month.waste.value * 10) / 10
      },
      hasMonthSpanningData: month.dataRanges.some((r: any) => r.crossesMonth),
      uniqueDateRanges: [...new Set(month.dataRanges.map((r: any) => `${r.start} to ${r.end}`))].length
    }));

    // Calculate dashboard aggregations using calculator for consistency
    const yearEmissions = await getPeriodEmissions(organizationId, startDate, endDate);
    const dashboardTotals = {
      totalEmissions: yearEmissions.total, // Already rounded by calculator
      electricity: Math.round(rawData?.filter(d =>
        d.metrics_catalog?.category === 'Electricity' ||
        d.metrics_catalog?.category === 'Purchased Energy'
      ).reduce((sum, d) => sum + (d.value || 0), 0)),
      water: Math.round(rawData?.filter(d =>
        d.metrics_catalog?.category === 'Purchased Goods & Services' &&
        (d.unit?.toLowerCase() === 'm³' || d.unit?.toLowerCase() === 'm3')
      ).reduce((sum, d) => sum + (d.value || 0), 0)),
      waste: Math.round(rawData?.filter(d =>
        d.metrics_catalog?.category === 'Waste'
      ).reduce((sum, d) => sum + (d.value || 0), 0) * 10) / 10
    };

    return NextResponse.json({
      year,
      organizationId,
      totalRecords: rawData?.length || 0,
      monthlyData: comparisonData,
      dashboardTotals,
      summary: {
        monthsWithData: comparisonData.filter((m: any) => m.rawRecords > 0).length,
        monthsWithNoData: comparisonData.filter((m: any) => m.rawRecords === 0).map((m: any) => m.month),
        monthsWithSpanningData: comparisonData.filter((m: any) => m.hasMonthSpanningData).map((m: any) => m.month)
      }
    });

  } catch (error: any) {
    console.error('Data comparison API error:', error);
    return NextResponse.json(
      { error: 'Failed to compare data', details: error.message },
      { status: 500 }
    );
  }
}