import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sustainability/targets/by-category-dynamic
 *
 * Dynamically calculates metric-level targets from:
 * 1. Category targets (reduction rates)
 * 2. Metrics catalog (which metrics exist)
 * 3. Metrics data (2023 baseline values)
 *
 * NO NEED FOR metric_targets TABLE - everything is calculated!
 *
 * Query params:
 * - organizationId: string (required)
 * - categories: string (required) - Comma-separated (e.g., "Electricity,Purchased Energy")
 * - baselineYear: number (optional, default: 2023)
 * - targetYear: number (optional, default: 2025)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const categoriesParam = searchParams.get('categories');
    const baselineYear = parseInt(searchParams.get('baselineYear') || '2023');
    const targetYear = parseInt(searchParams.get('targetYear') || '2025');

    if (!organizationId || !categoriesParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: organizationId, categories' },
        { status: 400 }
      );
    }

    const categories = categoriesParam.split(',').map(c => c.trim());

    // Verify user has access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    // Step 1: Get category targets (these have the reduction rates!)
    const { data: categoryTargets, error: ctError } = await supabaseAdmin
      .from('category_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('baseline_year', baselineYear)
      .in('category', categories);

    if (ctError) {
      console.error('Error fetching category targets:', ctError);
      return NextResponse.json(
        { error: 'Failed to fetch category targets' },
        { status: 500 }
      );
    }

    // If no category targets exist, return empty (user needs to run weighted allocation first)
    if (!categoryTargets || categoryTargets.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No category targets found. Run weighted allocation first.'
      });
    }

    // Create a map of category -> reduction rate
    const categoryReductionMap = new Map(
      categoryTargets.map(ct => [
        ct.category,
        ct.baseline_target_percent || ct.adjusted_target_percent || 4.2 // Fallback to 4.2%
      ])
    );

    // Step 2: Get all metrics in these categories
    const { data: metrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('id, name, category, scope, unit')
      .in('category', categories)
      .in('scope', ['scope_1', 'scope_2']); // Energy-related

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No metrics found for these categories'
      });
    }

    // Step 3: Get baseline data for each metric
    const metricIds = metrics.map(m => m.id);

    const { data: baselineData, error: baselineError } = await supabaseAdmin
      .from('metrics_data')
      .select('metric_id, value, co2e_emissions')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .gte('period_start', `${baselineYear}-01-01`)
      .lt('period_start', `${baselineYear + 1}-01-01`);

    if (baselineError) {
      console.error('Error fetching baseline data:', baselineError);
      return NextResponse.json(
        { error: 'Failed to fetch baseline data' },
        { status: 500 }
      );
    }

    // Step 4: Aggregate baseline by metric
    const metricBaselines = new Map();

    baselineData?.forEach(record => {
      if (!metricBaselines.has(record.metric_id)) {
        metricBaselines.set(record.metric_id, {
          totalValue: 0,
          totalEmissions: 0
        });
      }
      const current = metricBaselines.get(record.metric_id);
      current.totalValue += parseFloat(record.value || '0');
      current.totalEmissions += parseFloat(record.co2e_emissions || '0');
    });

    // Step 5: Calculate targets for each metric dynamically
    const currentYear = new Date().getFullYear();
    const yearsToTarget = targetYear - baselineYear;

    const calculatedTargets = metrics
      .filter(metric => metricBaselines.has(metric.id))
      .map(metric => {
        const baseline = metricBaselines.get(metric.id);
        const annualReductionRate = categoryReductionMap.get(metric.category) || 4.2;
        const cumulativeReduction = (annualReductionRate / 100) * yearsToTarget;

        const baselineValue = baseline.totalValue;
        const baselineEmissions = baseline.totalEmissions;
        const targetValue = baselineValue * (1 - cumulativeReduction);
        const targetEmissions = baselineEmissions * (1 - cumulativeReduction);

        // Get current year data for progress calculation
        return {
          id: `dynamic-${metric.id}`, // Virtual ID
          metricId: metric.id,
          metricName: metric.name,
          category: metric.category,
          scope: metric.scope,
          unit: metric.unit,
          baselineYear,
          targetYear,
          baselineValue,
          baselineEmissions: Math.round(baselineEmissions * 10) / 10, // Round to 1 decimal
          targetValue: Math.round(targetValue * 10) / 10,
          targetEmissions: Math.round(targetEmissions * 10) / 10,
          annualReductionRate,
          cumulativeReductionPercent: Math.round(cumulativeReduction * 100 * 10) / 10
        };
      })
      .filter(target => target.baselineEmissions > 0); // Only metrics with actual emissions

    // Step 6: Get current year data for progress tracking
    const { data: currentYearData, error: currentError } = await supabaseAdmin
      .from('metrics_data')
      .select('metric_id, value, co2e_emissions')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .gte('period_start', `${currentYear}-01-01`)
      .lt('period_start', `${currentYear + 1}-01-01`);

    if (!currentError && currentYearData) {
      // Aggregate current year by metric
      const currentYearMap = new Map();

      currentYearData.forEach(record => {
        if (!currentYearMap.has(record.metric_id)) {
          currentYearMap.set(record.metric_id, {
            value: 0,
            emissions: 0
          });
        }
        const current = currentYearMap.get(record.metric_id);
        current.value += parseFloat(record.value || '0');
        current.emissions += parseFloat(record.co2e_emissions || '0');
      });

      // Add current values and calculate progress
      calculatedTargets.forEach(target => {
        const current = currentYearMap.get(target.metricId);
        if (current) {
          target.currentValue = Math.round(current.value * 10) / 10;
          target.currentEmissions = Math.round((current.emissions / 1000) * 10) / 10; // Convert to tCO2e

          // Calculate progress
          const reductionNeeded = target.baselineEmissions - target.targetEmissions;
          const reductionAchieved = target.baselineEmissions - target.currentEmissions;
          const progressPercent = reductionNeeded > 0
            ? (reductionAchieved / reductionNeeded) * 100
            : 0;

          target.progress = {
            reductionNeeded: Math.round(reductionNeeded * 10) / 10,
            reductionAchieved: Math.round(reductionAchieved * 10) / 10,
            progressPercent: Math.round(progressPercent * 10) / 10,
            trajectoryStatus: progressPercent >= 90 ? 'on-track' :
                            progressPercent >= 70 ? 'at-risk' : 'off-track'
          };
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: calculatedTargets,
      meta: {
        baselineYear,
        targetYear,
        categoriesQueried: categories,
        metricsFound: calculatedTargets.length,
        calculatedDynamically: true
      }
    });

  } catch (error: any) {
    console.error('Error in dynamic by-category API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
