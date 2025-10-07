import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization from organization_members table
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;

    // Fetch targets from sustainability_targets table
    const { data: targets, error: targetsError } = await supabaseAdmin
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (targetsError) {
      console.error('Error fetching targets:', targetsError);
      return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
    }

    // Transform data to match our component expectations
    // IMPORTANT: Using actual database schema (not migration schema)
    const transformedTargets = targets?.map(target => {
      // Calculate target_reduction_percent from baseline_value and target_value
      const reductionPercent = target.baseline_value > 0
        ? ((target.baseline_value - target.target_value) / target.baseline_value) * 100
        : 0;

      // Calculate annual_reduction_rate
      const yearsToTarget = target.target_year - target.baseline_year;
      const annualRate = yearsToTarget > 0 ? reductionPercent / yearsToTarget : 0;

      return {
        id: target.id,
        target_type: target.target_type || 'near-term',
        target_name: target.name, // Database has 'name', not 'target_name'
        target_scope: Array.isArray(target.scopes) ? target.scopes.join(',') : 'all_scopes', // Database has 'scopes' array
        baseline_year: target.baseline_year,
        baseline_emissions: target.baseline_value, // Database has 'baseline_value'
        target_year: target.target_year,
        target_reduction_percent: reductionPercent,
        target_emissions: target.target_value, // Database has 'target_value'
        annual_reduction_rate: annualRate,
        sbti_validated: target.sbti_approved || false, // Database has 'sbti_approved'
        target_status: target.status || 'draft', // Database has 'status', not 'target_status'
        current_emissions: target.current_emissions,
        performance_status: determinePerformanceStatus(target)
      };
    }) || [];

    // Fetch emissions data with ML-powered forecasting for incomplete years
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    console.log(`🎯 Fetching emissions for ${currentYear} (current month: ${currentMonth})`);

    // Get current year data (may be incomplete)
    // Use period_start for both filters to avoid timezone/format issues
    const { data: currentYearMetrics } = await supabaseAdmin
      .from('metrics_data')
      .select('co2e_emissions, period_start, period_end')
      .eq('organization_id', organizationId)
      .gte('period_start', `${currentYear}-01-01`)
      .lt('period_start', `${currentYear + 1}-01-01`)
      .order('period_start', { ascending: true });

    let currentYearEmissions = 0;
    let currentYearIsForecast = false;
    let actualYearToDate = 0;
    let forecastedRemaining = 0;

    if (currentYearMetrics && currentYearMetrics.length > 0) {
      // Calculate actual emissions so far this year
      const actualEmissions = currentYearMetrics.reduce((sum, m) => sum + (m.co2e_emissions || 0), 0) / 1000; // Convert to tCO2e
      actualYearToDate = actualEmissions;

      // Count unique months (not total records, as there may be multiple records per month)
      const uniqueMonths = new Set(currentYearMetrics.map(m => m.period_start?.substring(0, 7)));
      const monthsCovered = uniqueMonths.size;

      console.log(`📊 ${currentYear} actual data: ${actualEmissions.toFixed(1)} tCO2e (${currentYearMetrics.length} records, ${monthsCovered} unique months)`);
      console.log(`📅 Unique months: ${Array.from(uniqueMonths).sort().join(', ')}`);

      // If we have less than 12 months, use enterprise forecasting
      if (monthsCovered < 12) {
        try {
          // Fetch 3 years of historical data for sophisticated forecasting
          const { data: historicalMetrics } = await supabaseAdmin
            .from('metrics_data')
            .select('co2e_emissions, period_start')
            .eq('organization_id', organizationId)
            .gte('period_start', `${currentYear - 3}-01-01`)
            .lt('period_start', `${currentYear + 1}-01-01`)
            .order('period_start', { ascending: true });

          if (historicalMetrics && historicalMetrics.length >= 12) {
            // Group by month to get monthly totals
            const monthlyData: { [key: string]: number } = {};

            historicalMetrics.forEach(m => {
              const month = m.period_start?.substring(0, 7);
              if (month) {
                monthlyData[month] = (monthlyData[month] || 0) + (m.co2e_emissions || 0);
              }
            });

            // Prepare data for forecaster
            const monthlyEmissions = Object.entries(monthlyData)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, emissions]) => ({
                month,
                emissions: emissions / 1000 // Convert kg to tCO2e
              }));

            console.log(`🔬 Enterprise Forecasting with ${monthlyEmissions.length} months of data`);

            // Use enterprise-grade forecasting
            const remainingMonths = 12 - monthsCovered;
            const forecast = EnterpriseForecast.forecast(monthlyEmissions, remainingMonths, true);

            forecastedRemaining = forecast.forecasted.reduce((a, b) => a + b, 0);
            currentYearEmissions = actualEmissions + forecastedRemaining;
            currentYearIsForecast = true;

            console.log(`✅ ${forecast.method.toUpperCase()}: Actual ${actualEmissions.toFixed(1)} + Forecast ${forecastedRemaining.toFixed(1)} = ${currentYearEmissions.toFixed(1)} tCO2e`);
            console.log(`   📊 Model Quality: R²=${forecast.metadata.r2.toFixed(3)}, Trend=${forecast.metadata.trendSlope.toFixed(3)} tCO2e/month`);
          } else {
            // Fallback: use current year average
            const monthlyAverage = actualEmissions / monthsCovered;
            forecastedRemaining = monthlyAverage * (12 - monthsCovered);
            currentYearEmissions = actualEmissions + forecastedRemaining;
            currentYearIsForecast = true;
            console.log(`📊 Insufficient history, YTD average: ${actualEmissions.toFixed(1)} + ${forecastedRemaining.toFixed(1)} = ${currentYearEmissions.toFixed(1)} tCO2e`);
          }
        } catch (error) {
          console.error('Error forecasting emissions:', error);
          // Fallback to simple average
          const monthlyAverage = actualEmissions / monthsCovered;
          forecastedRemaining = monthlyAverage * (12 - monthsCovered);
          currentYearEmissions = monthlyAverage * 12;
          currentYearIsForecast = true;
        }
      } else {
        // We have full year data
        currentYearEmissions = actualEmissions;
      }
    }

    // Calculate Business as Usual (BAU) projection to target year
    // This shows where emissions will be if no action is taken
    let bauProjection2030 = 0;
    if (currentYearEmissions > 0) {
      // Calculate trend from baseline to current
      const baselineYear = 2023; // Could be dynamic from target data
      const yearsElapsed = currentYear - baselineYear;

      if (yearsElapsed > 0) {
        // Get baseline emissions (we'll use the first target's baseline)
        const baselineEmissions = transformedTargets[0]?.baseline_emissions || currentYearEmissions;

        // Calculate annual growth/decline rate
        const annualChangeRate = (currentYearEmissions - baselineEmissions) / baselineEmissions / yearsElapsed;

        // Project to 2030 using compound growth
        const yearsTo2030 = 2030 - currentYear;
        bauProjection2030 = currentYearEmissions * Math.pow(1 + annualChangeRate, yearsTo2030);

        console.log(`📈 BAU Projection: ${baselineEmissions.toFixed(1)} (${baselineYear}) → ${currentYearEmissions.toFixed(1)} (${currentYear}) → ${bauProjection2030.toFixed(1)} (2030) | Annual rate: ${(annualChangeRate * 100).toFixed(2)}%`);
      }
    }

    // Update targets with current emissions (actual + forecast)
    if (currentYearEmissions > 0) {
      transformedTargets.forEach(target => {
        target.current_emissions = currentYearEmissions;
        target.is_forecast = currentYearIsForecast;
        target.actual_ytd = actualYearToDate;
        target.forecasted_remaining = forecastedRemaining;
        target.bau_projection_2030 = bauProjection2030;
        // Recalculate performance status
        target.performance_status = calculatePerformanceStatus(
          target.baseline_emissions,
          currentYearEmissions,
          target.target_emissions,
          target.baseline_year,
          target.target_year,
          currentYear
        );
      });
    }

    return NextResponse.json({
      targets: transformedTargets,
      summary: {
        total: transformedTargets.length,
        validated: transformedTargets.filter(t => t.sbti_validated).length,
        onTrack: transformedTargets.filter(t => t.performance_status === 'on-track' || t.performance_status === 'exceeding').length,
        atRisk: transformedTargets.filter(t => t.performance_status === 'at-risk').length,
        offTrack: transformedTargets.filter(t => t.performance_status === 'off-track').length
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization from organization_members table
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions
    if (!['account_owner', 'sustainability_manager'].includes(memberData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    // Transform the data to match existing table structure
    const targetData = {
      organization_id: memberData.organization_id,
      target_type: body.target_type || 'near-term',
      target_scope: body.target_scope || 'all_scopes',
      target_name: body.target_name,
      target_description: body.target_description,
      baseline_year: body.baseline_year,
      baseline_emissions: body.baseline_emissions,
      target_year: body.target_year,
      target_reduction_percent: body.target_reduction_percent,
      target_status: body.target_status || 'draft',
      sbti_validated: body.sbti_validated || false,
      sbti_ambition: body.sbti_ambition || null,
      is_active: true,
      created_by: user.id
    };

    const { data: newTarget, error: insertError } = await supabaseAdmin
      .from('sustainability_targets')
      .insert(targetData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating target:', insertError);
      return NextResponse.json({ error: 'Failed to create target' }, { status: 500 });
    }

    // Automatically calculate and store category-level targets using weighted allocation
    try {
      const weightedParams = new URLSearchParams({
        target: (body.target_reduction_percent || 4.2).toString(),
        baseline_year: body.baseline_year.toString()
      });

      const weightedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sustainability/targets/weighted-allocation?${weightedParams}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (weightedResponse.ok) {
        const weightedData = await weightedResponse.json();

        // Store category targets (we'll create the table structure separately)
        console.log('📊 Weighted targets calculated:', weightedData.allocations?.length, 'categories');

        // For now, store in metadata or separate table
        // This will be enhanced once we run the migration
      }
    } catch (error) {
      console.error('Error calculating weighted targets:', error);
      // Don't fail the main target creation if weighted calculation fails
    }

    return NextResponse.json({
      success: true,
      target: newTarget
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('id');

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID required' }, { status: 400 });
    }

    const body = await request.json();

    // Update target
    const { data: updatedTarget, error: updateError } = await supabaseAdmin
      .from('sustainability_targets')
      .update({
        target_name: body.target_name,
        target_description: body.target_description,
        current_emissions: body.current_emissions,
        target_status: body.target_status,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', targetId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating target:', updateError);
      return NextResponse.json({ error: 'Failed to update target' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      target: updatedTarget
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
// IMPORTANT: Using actual database schema (baseline_value, target_value)
function determinePerformanceStatus(target: any): string {
  const baselineEmissions = target.baseline_value || target.baseline_emissions;
  const targetEmissions = target.target_value || target.target_emissions;

  if (!target.current_emissions || !baselineEmissions || !targetEmissions) {
    return 'pending';
  }

  const requiredReduction = baselineEmissions - targetEmissions;
  const actualReduction = baselineEmissions - target.current_emissions;
  const progressRatio = actualReduction / requiredReduction;

  if (progressRatio >= 1.05) return 'exceeding';
  if (progressRatio >= 0.95) return 'on-track';
  if (progressRatio >= 0.85) return 'at-risk';
  return 'off-track';
}

function calculatePerformanceStatus(
  baseline: number,
  current: number,
  target: number,
  baselineYear: number,
  targetYear: number,
  currentYear: number
): string {
  const yearsElapsed = currentYear - baselineYear;
  const totalYears = targetYear - baselineYear;

  if (totalYears <= 0) return 'pending';

  const expectedProgress = (baseline - target) * (yearsElapsed / totalYears);
  const actualProgress = baseline - current;
  const progressRatio = actualProgress / expectedProgress;

  if (progressRatio >= 1.05) return 'exceeding';
  if (progressRatio >= 0.95) return 'on-track';
  if (progressRatio >= 0.85) return 'at-risk';
  return 'off-track';
}