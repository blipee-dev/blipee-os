import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';
import { getBaselineEmissions, getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
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

    // ⚡ PARALLEL QUERY: Fetch targets and baseline simultaneously
    const [targetsResult, baselineData, scopeBreakdown] = await Promise.all([
      supabaseAdmin
        .from('sustainability_targets')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
      getBaselineEmissions(organizationId),
      getPeriodEmissions(
        organizationId,
        `${new Date().getFullYear()}-01-01`,
        new Date().toISOString().split('T')[0]
      )
    ]);

    const targets = targetsResult.data;
    if (targetsResult.error) {
      console.error('Error fetching targets:', targetsResult.error);
      return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
    }

    // Calculate recommended SBTi targets
    const calculatedTargets = baselineData ? calculateSBTiTargets(baselineData) : null;

    // Get current year for emissions data
    const currentYear = new Date().getFullYear();

    // Determine active scopes based on actual data
    const activeScopes: string[] = [];
    if (scopeBreakdown.scope_1 > 0) activeScopes.push('scope_1');
    if (scopeBreakdown.scope_2 > 0) activeScopes.push('scope_2');
    if (scopeBreakdown.scope_3 > 0) activeScopes.push('scope_3');


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

      // Use database scopes if available, otherwise use detected active scopes
      const scopeCoverage = Array.isArray(target.scopes) && target.scopes.length > 0
        ? target.scopes
        : activeScopes;

      // Calculate progress percentage
      const currentYear = new Date().getFullYear();
      const yearsElapsed = currentYear - target.baseline_year;
      const totalYears = target.target_year - target.baseline_year;
      const targetReduction = target.baseline_value - target.target_value;
      const actualReduction = target.current_emissions
        ? target.baseline_value - target.current_emissions
        : 0;
      const progressPercentage = targetReduction > 0
        ? (actualReduction / targetReduction) * 100
        : 0;

      return {
        id: target.id,
        name: target.name, // Frontend expects 'name'
        target_type: target.target_type || 'near-term',
        target_scope: scopeCoverage.join(','),
        scope_coverage: scopeCoverage,
        baseline_year: target.baseline_year,
        baseline_emissions: target.baseline_value,
        target_year: target.target_year,
        reduction_percentage: reductionPercent,
        target_emissions: target.target_value,
        annual_reduction_rate: annualRate,
        sbti_validated: target.sbti_approved || false,
        status: determinePerformanceStatus(target) === 'exceeding' || determinePerformanceStatus(target) === 'on-track'
          ? 'on_track'
          : determinePerformanceStatus(target) === 'at-risk'
            ? 'at_risk'
            : 'off_track',
        current_emissions: target.current_emissions,
        progress_percentage: Math.max(0, Math.min(100, progressPercentage)),
        performance_status: determinePerformanceStatus(target)
      };
    }) || [];

    // Fetch emissions data with ML-powered forecasting for incomplete years

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

      // Count unique months (not total records, as there may be multiple records per month)
      const uniqueMonths = new Set(currentYearMetrics.map(m => m.period_start?.substring(0, 7)));
      const monthsCovered = uniqueMonths.size;


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


            // Use enterprise-grade forecasting
            const remainingMonths = 12 - monthsCovered;
            const forecast = EnterpriseForecast.forecast(monthlyEmissions, remainingMonths, true);

            forecastedRemaining = forecast.forecasted.reduce((a, b) => a + b, 0);
            currentYearEmissions = actualEmissions + forecastedRemaining;
            currentYearIsForecast = true;

          } else {
            // Fallback: use current year average
            const monthlyAverage = actualEmissions / monthsCovered;
            forecastedRemaining = monthlyAverage * (12 - monthsCovered);
            currentYearEmissions = actualEmissions + forecastedRemaining;
            currentYearIsForecast = true;
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

      }
    }

    // Check if metric targets exist (replanning has been done)
    // If so, use their aggregated current values instead of forecast
    const { data: metricTargetsExist } = await supabaseAdmin
      .from('metric_targets')
      .select('target_id, baseline_value, baseline_emissions')
      .in('target_id', transformedTargets.map(t => t.id))
      .limit(1);

    const hasMetricTargets = metricTargetsExist && metricTargetsExist.length > 0;

    if (hasMetricTargets) {

      // For each target, aggregate from metric targets
      for (const target of transformedTargets) {
        const { data: metricTargets } = await supabaseAdmin
          .from('metric_targets')
          .select('baseline_value, baseline_emissions')
          .eq('target_id', target.id)
          .eq('status', 'active');

        if (metricTargets && metricTargets.length > 0) {
          // Sum up baseline emissions (which represent current state after replanning)
          const aggregatedCurrent = metricTargets.reduce((sum, mt) => sum + (mt.baseline_emissions || 0), 0);

          target.current_emissions = aggregatedCurrent;
          target.is_forecast = false; // This is from metric targets, not forecast
          target.actual_ytd = aggregatedCurrent; // All is "actual" from metric breakdown
          target.forecasted_remaining = 0;

        }
      }
    } else if (currentYearEmissions > 0) {

      // Original logic: Persist current emissions to database for all targets
      for (const target of transformedTargets) {
        await supabaseAdmin
          .from('sustainability_targets')
          .update({
            current_emissions: currentYearEmissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', target.id);
      }

      // Update in-memory objects for response
      transformedTargets.forEach(target => {
        target.current_emissions = currentYearEmissions;
        target.is_forecast = currentYearIsForecast;
        target.actual_ytd = actualYearToDate;
        target.forecasted_remaining = forecastedRemaining;
        target.bau_projection_2030 = bauProjection2030;

        // Recalculate performance status
        const newPerformanceStatus = calculatePerformanceStatus(
          target.baseline_emissions,
          currentYearEmissions,
          target.target_emissions,
          target.baseline_year,
          target.target_year,
          currentYear
        );
        target.performance_status = newPerformanceStatus;

        // Update status based on performance_status
        target.status = newPerformanceStatus === 'exceeding' || newPerformanceStatus === 'on-track'
          ? 'on_track'
          : newPerformanceStatus === 'at-risk'
            ? 'at_risk'
            : 'off_track';

        // Recalculate progress_percentage
        const targetReduction = target.baseline_emissions - target.target_emissions;
        const actualReduction = target.baseline_emissions - currentYearEmissions;
        const progressPercentage = targetReduction > 0
          ? (actualReduction / targetReduction) * 100
          : 0;
        target.progress_percentage = Math.max(0, Math.min(100, progressPercentage));
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

            const newPerformanceStatus = calculatePerformanceStatus(
              calculatedTarget.baseline_emissions,
              currentYearEmissions,
              calculatedTarget.target_emissions,
              calculatedTarget.baseline_year,
              calculatedTarget.target_year,
              currentYear
            );
            calculatedTarget.performance_status = newPerformanceStatus;

            // Set status based on performance_status
            calculatedTarget.status = newPerformanceStatus === 'exceeding' || newPerformanceStatus === 'on-track'
              ? 'on_track'
              : newPerformanceStatus === 'at-risk'
                ? 'at_risk'
                : 'off_track';

            // Calculate progress_percentage
            const targetReduction = calculatedTarget.baseline_emissions - calculatedTarget.target_emissions;
            const actualReduction = calculatedTarget.baseline_emissions - currentYearEmissions;
            const progressPercentage = targetReduction > 0
              ? (actualReduction / targetReduction) * 100
              : 0;
            calculatedTarget.progress_percentage = Math.max(0, Math.min(100, progressPercentage));
          }

          targetTypeMap.set(type, calculatedTarget);
        }
      });

      // Convert map back to array, maintaining order: near-term, long-term, net-zero
      transformedTargets = targetTypes
        .map(type => targetTypeMap.get(type))
        .filter(t => t !== undefined);

    }

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Targets API Performance: Total=${totalTime}ms`);

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

  // Determine scope coverage based on baseline data
  const scopeCoverage: string[] = [];
  if (baselineData.scope_1 > 0) scopeCoverage.push('scope_1');
  if (baselineData.scope_2 > 0) scopeCoverage.push('scope_2');
  if (baselineData.scope_3 > 0) scopeCoverage.push('scope_3');

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
      scope_coverage: scopeCoverage, // Add scope coverage array
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
      scope_coverage: scopeCoverage, // Add scope coverage array
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
      scope_coverage: scopeCoverage, // Add scope coverage array
      scope_1_2_coverage_percent: 95,
      scope_3_coverage_percent: 90,
      neutralization_plan: `Neutralize residual ${(baselineData.total * 0.10).toFixed(1)} tCO2e through permanent carbon removal`,
      bvcm_commitment: 'Beyond Value Chain Mitigation to support global net-zero',
      description: `Achieve net-zero emissions by 2050 through 90% reduction (${baselineData.total.toFixed(1)} tCO2e → ${(baselineData.total * 0.10).toFixed(1)} tCO2e) + neutralization of residual emissions`
    }
  };
}