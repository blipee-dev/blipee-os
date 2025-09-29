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
    const range = '2025';

    // Get current year data
    const { data } = await supabaseAdmin
      .from('metrics_data')
      .select('co2e_emissions, period_start')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_end', '2025-12-31')
      .not('co2e_emissions', 'is', null);

    // Calculate year-over-year comparison
    const yearOverYearComparison = await calculateYearOverYearComparison(data || [], range, organizationId);

    return NextResponse.json({
      yearOverYearComparison,
      dataPoints: data?.length || 0
    });
  } catch (error: any) {
    console.error('Test YoY error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function calculateYearOverYearComparison(data: any[], range: string, organizationId: string) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const comparison = [];

  // Determine current and previous year based on range
  let currentYear: number;
  let previousYear: number;

  if (range === 'all' || !range) {
    // For "all", we'll compare the latest year with data to the previous year
    const latestDate = data.reduce((max, d) => {
      const date = new Date(d.period_start);
      return date > max ? date : max;
    }, new Date(0));
    currentYear = latestDate.getFullYear();
    previousYear = currentYear - 1;
  } else if (['2025', '2024', '2023', '2022'].includes(range)) {
    currentYear = parseInt(range);
    previousYear = currentYear - 1;
  } else if (range === 'year') {
    currentYear = new Date().getFullYear();
    previousYear = currentYear - 1;
  } else {
    // Default to latest year
    currentYear = 2025;
    previousYear = 2024;
  }

  // Fetch previous year data
  const { data: previousYearData } = await supabaseAdmin
    .from('metrics_data')
    .select('co2e_emissions, period_start')
    .eq('organization_id', organizationId)
    .gte('period_start', `${previousYear}-01-01`)
    .lte('period_end', `${previousYear}-12-31`)
    .not('co2e_emissions', 'is', null);

  // Group current year data by month
  const currentYearByMonth: { [key: number]: number } = {};
  data.forEach(d => {
    const date = new Date(d.period_start);
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();
      currentYearByMonth[month] = (currentYearByMonth[month] || 0) + (d.co2e_emissions || 0);
    }
  });

  // Group previous year data by month
  const previousYearByMonth: { [key: number]: number } = {};
  previousYearData?.forEach(d => {
    const date = new Date(d.period_start);
    const month = date.getMonth();
    previousYearByMonth[month] = (previousYearByMonth[month] || 0) + (d.co2e_emissions || 0);
  });

  // Calculate year-over-year change for each month
  for (let i = 0; i < 12; i++) {
    const currentMonthEmissions = currentYearByMonth[i] || 0;
    const previousMonthEmissions = previousYearByMonth[i] || 0;

    let change = 0;
    if (previousMonthEmissions > 0) {
      change = ((currentMonthEmissions - previousMonthEmissions) / previousMonthEmissions) * 100;
    } else if (currentMonthEmissions > 0) {
      change = 100; // New emissions where there were none
    }

    comparison.push({
      month: months[i],
      change: Math.round(change * 10) / 10, // Round to 1 decimal
      currentEmissions: currentMonthEmissions / 1000, // Convert to tons
      previousEmissions: previousMonthEmissions / 1000,
      hasData: currentMonthEmissions > 0 || previousMonthEmissions > 0
    });
  }

  return {
    data: comparison,
    currentYear,
    previousYear
  };
}