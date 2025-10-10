import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';
import { getBaselineEmissions, getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';

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

    // Get baseline emissions data for automatic target calculation
    const baselineData = await getBaselineEmissions(organizationId);
    console.log('📊 Baseline emissions for target calculation:', baselineData);

    // Calculate recommended SBTi targets
    const calculatedTargets = baselineData ? calculateSBTiTargets(baselineData) : null;

    // Transform data to match our component expectations
    // IMPORTANT: Using actual database schema (not migration schema)
    let transformedTargets = targets?.map(target => {
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

    // Get current year data (may be incomplete) with pagination
    // Use period_start for both filters to avoid timezone/format issues
    let allCurrentYearMetrics: any[] = [];
    let rangeStart = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch } = await supabaseAdmin
        .from('metrics_data')
        .select('co2e_emissions, period_start, period_end')
        .eq('organization_id', organizationId)
        .gte('period_start', `${currentYear}-01-01`)
        .lt('period_start', `${currentYear + 1}-01-01`)
        .order('period_start', { ascending: true })
        .range(rangeStart, rangeStart + batchSize - 1);

      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }

      allCurrentYearMetrics = allCurrentYearMetrics.concat(batch);

      if (batch.length < batchSize) {
        hasMore = false;
      } else {
        rangeStart += batchSize;
      }
    }

    const currentYearMetrics = allCurrentYearMetrics;

    let currentYearEmissions = 0;
    let currentYearIsForecast = false;
    let actualYearToDate = 0;
    let forecastedRemaining = 0;

    if (currentYearMetrics && currentYearMetrics.length > 0) {
      // ✅ Using calculator for year-to-date emissions
      const ytdEmissions = await getPeriodEmissions(
        organizationId,
        `${currentYear}-01-01`,
        new Date().toISOString().split('T')[0]
      );
      const actualEmissions = ytdEmissions.total;
      actualYearToDate = actualEmissions;
      console.log('📊 Using baseline-calculator for YTD emissions:', actualEmissions.toFixed(1), 'tCO2e');

      // Count unique months (not total records, as there may be multiple records per month)
      const uniqueMonths = new Set(currentYearMetrics.map(m => m.period_start?.substring(0, 7)));
      const monthsCovered = uniqueMonths.size;

      console.log(`📊 ${currentYear} actual data: ${actualEmissions.toFixed(1)} tCO2e (${currentYearMetrics.length} records, ${monthsCovered} unique months)`);
      console.log(`📅 Unique months: ${Array.from(uniqueMonths).sort().join(', ')}`);

      // If we have less than 12 months, use enterprise forecasting
      if (monthsCovered < 12) {
        try {
          // Fetch 3 years of historical data for sophisticated forecasting with pagination
          let allHistoricalMetrics: any[] = [];
          let histRangeStart = 0;
          let histHasMore = true;

          while (histHasMore) {
            const { data: histBatch } = await supabaseAdmin
              .from('metrics_data')
              .select('co2e_emissions, period_start')
              .eq('organization_id', organizationId)
              .gte('period_start', `${currentYear - 3}-01-01`)
              .lt('period_start', `${currentYear + 1}-01-01`)
              .order('period_start', { ascending: true })
              .range(histRangeStart, histRangeStart + batchSize - 1);

            if (!histBatch || histBatch.length === 0) {
              histHasMore = false;
              break;
            }

            allHistoricalMetrics = allHistoricalMetrics.concat(histBatch);

            if (histBatch.length < batchSize) {
              histHasMore = false;
            } else {
              histRangeStart += batchSize;
            }
          }

          const historicalMetrics = allHistoricalMetrics;

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

    // Merge calculated targets with existing targets
    // For each target type (near-term, long-term, net-zero), use existing if available, otherwise use calculated
    if (calculatedTargets) {
      const targetTypeMap = new Map<string, any>();

      // First, add all existing targets
      transformedTargets.forEach(target => {
        if (target.target_type) {
          targetTypeMap.set(target.target_type, target);
        }
      });

      // Then, add calculated targets for types that don't exist
      const targetTypes = ['near-term', 'long-term', 'net-zero'];
      targetTypes.forEach(type => {
        if (!targetTypeMap.has(type) && calculatedTargets[type as keyof typeof calculatedTargets]) {
          const calculatedTarget = calculatedTargets[type as keyof typeof calculatedTargets];

          // Add current emissions to calculated targets
          if (currentYearEmissions > 0) {
            calculatedTarget.current_emissions = currentYearEmissions;
            calculatedTarget.is_forecast = currentYearIsForecast;
            calculatedTarget.actual_ytd = actualYearToDate;
            calculatedTarget.forecasted_remaining = forecastedRemaining;
            calculatedTarget.bau_projection_2030 = bauProjection2030;
            calculatedTarget.performance_status = calculatePerformanceStatus(
              calculatedTarget.baseline_emissions,
              currentYearEmissions,
              calculatedTarget.target_emissions,
              calculatedTarget.baseline_year,
              calculatedTarget.target_year,
              currentYear
            );
          }

          targetTypeMap.set(type, calculatedTarget);
        }
      });

      // Convert map back to array, maintaining order: near-term, long-term, net-zero
      transformedTargets = targetTypes
        .map(type => targetTypeMap.get(type))
        .filter(t => t !== undefined);

      console.log('🎯 Final targets (existing + calculated):', transformedTargets.map(t => `${t.target_type}: ${t.id}`));
    }

    return NextResponse.json({
      targets: transformedTargets,
      summary: {
        total: transformedTargets.length,
        validated: transformedTargets.filter(t => t.sbti_validated).length,
        onTrack: transformedTargets.filter(t => t.performance_status === 'on-track' || t.performance_status === 'exceeding').length,
        atRisk: transformedTargets.filter(t => t.performance_status === 'at-risk').length,
        offTrack: transformedTargets.filter(t => t.performance_status === 'off-track').length
      },
      baselineData // Include baseline data for UI display
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

// Note: getBaselineEmissions is now imported from @/lib/sustainability/baseline-calculator
// This ensures all APIs use the same calculation logic

// Calculate recommended SBTi targets automatically
function calculateSBTiTargets(baselineData: any) {
  if (!baselineData || baselineData.total === 0) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return {
    'near-term': {
      id: 'calculated-near-term',
      name: 'Near-Term Target',
      target_type: 'near-term',
      baseline_year: baselineData.year,
      baseline_emissions: baselineData.total,
      baseline_scope_1: baselineData.scope_1,
      baseline_scope_2: baselineData.scope_2,
      baseline_scope_3: baselineData.scope_3,
      target_year: 2030,
      target_reduction_percent: 42, // SBTi minimum for 1.5°C
      target_emissions: Math.round(baselineData.total * 0.58 * 10) / 10, // 42% reduction
      annual_reduction_rate: Math.round(42 / (2030 - baselineData.year) * 10) / 10,
      sbti_validated: false,
      progress_status: 'not_started',
      scope_1_2_coverage_percent: 95, // SBTi requirement
      scope_3_coverage_percent: baselineData.scope_3_percentage > 40 ? 67 : null, // Only required if >40%
      description: `Reduce emissions by 42% by 2030 from ${baselineData.year} baseline (${baselineData.total.toFixed(1)} tCO2e → ${(baselineData.total * 0.58).toFixed(1)} tCO2e)`
    },
    'long-term': {
      id: 'calculated-long-term',
      name: 'Long-Term Target',
      target_type: 'long-term',
      baseline_year: baselineData.year,
      baseline_emissions: baselineData.total,
      baseline_scope_1: baselineData.scope_1,
      baseline_scope_2: baselineData.scope_2,
      baseline_scope_3: baselineData.scope_3,
      target_year: 2050,
      target_reduction_percent: 90, // SBTi requirement
      target_emissions: Math.round(baselineData.total * 0.10 * 10) / 10, // 90% reduction
      annual_reduction_rate: Math.round(90 / (2050 - baselineData.year) * 10) / 10,
      sbti_validated: false,
      progress_status: 'not_started',
      scope_1_2_coverage_percent: 95,
      scope_3_coverage_percent: 90, // SBTi requires 90% for long-term
      description: `Reduce emissions by 90% by 2050 from ${baselineData.year} baseline (${baselineData.total.toFixed(1)} tCO2e → ${(baselineData.total * 0.10).toFixed(1)} tCO2e)`
    },
    'net-zero': {
      id: 'calculated-net-zero',
      name: 'Net-Zero Target',
      target_type: 'net-zero',
      baseline_year: baselineData.year,
      baseline_emissions: baselineData.total,
      baseline_scope_1: baselineData.scope_1,
      baseline_scope_2: baselineData.scope_2,
      baseline_scope_3: baselineData.scope_3,
      target_year: 2050,
      target_reduction_percent: 90, // 90% reduction + 10% neutralization
      target_emissions: 0, // Net-zero means zero
      annual_reduction_rate: Math.round(90 / (2050 - baselineData.year) * 10) / 10,
      sbti_validated: false,
      progress_status: 'not_started',
      scope_1_2_coverage_percent: 95,
      scope_3_coverage_percent: 90,
      neutralization_plan: `Neutralize residual ${(baselineData.total * 0.10).toFixed(1)} tCO2e through permanent carbon removal`,
      bvcm_commitment: 'Beyond Value Chain Mitigation to support global net-zero',
      description: `Achieve net-zero emissions by 2050 through 90% reduction (${baselineData.total.toFixed(1)} tCO2e → ${(baselineData.total * 0.10).toFixed(1)} tCO2e) + neutralization of residual emissions`
    }
  };
}