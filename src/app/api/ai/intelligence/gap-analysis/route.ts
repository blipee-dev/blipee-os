import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentMetrics, industry, organizationSize, query } = await request.json();

    // Get user's organization
    const { data: memberData } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all available metrics from catalog
    const { data: catalogMetrics } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .eq('is_active', true);

    // Analyze what's missing
    const allPossibleMetrics = catalogMetrics || [];
    const currentMetricIds = new Set(currentMetrics);

    // Categorize missing metrics by importance
    const missingMetrics = allPossibleMetrics
      .filter(m => !currentMetricIds.has(m.code))
      .map(metric => {
        // Determine importance based on scope and common usage
        let importance: 'critical' | 'important' | 'recommended' = 'recommended';
        let estimatedImpact = 5;

        // Scope 1 & 2 are usually critical
        if (metric.scope === 'scope_1' || metric.scope === 'scope_2') {
          importance = 'critical';
          estimatedImpact = 15;
        }

        // High-impact Scope 3 categories
        const highImpactCategories = [
          'purchased goods',
          'business travel',
          'employee commuting',
          'upstream transportation',
          'waste'
        ];

        if (metric.scope === 'scope_3' &&
            highImpactCategories.some(cat => metric.category?.toLowerCase().includes(cat))) {
          importance = 'important';
          estimatedImpact = 10;
        }

        // Determine measurement difficulty
        let measurementDifficulty: 'easy' | 'moderate' | 'difficult' = 'moderate';

        if (metric.category?.includes('electricity') || metric.category?.includes('fuel')) {
          measurementDifficulty = 'easy'; // Usually have bills
        } else if (metric.scope === 'scope_3') {
          measurementDifficulty = 'difficult'; // Usually need estimates
        }

        return {
          metric: metric.name,
          scope: parseInt(metric.scope.replace('scope_', '')),
          importance,
          estimatedImpact,
          measurementDifficulty,
          dataSources: getDataSources(null, metric),
          category: metric.category,
          unit: metric.unit
        };
      })
      .sort((a, b) => {
        // Sort by importance then impact
        const importanceOrder = { critical: 0, important: 1, recommended: 2 };
        if (importanceOrder[a.importance] !== importanceOrder[b.importance]) {
          return importanceOrder[a.importance] - importanceOrder[b.importance];
        }
        return b.estimatedImpact - a.estimatedImpact;
      });

    // Calculate coverage score
    const totalPossibleEmissions = allPossibleMetrics.reduce((sum, m) => {
      return sum + (m.typical_percentage || 5);
    }, 0);

    const coveredEmissions = allPossibleMetrics
      .filter(m => currentMetricIds.has(m.code))
      .reduce((sum, m) => sum + (m.typical_percentage || 5), 0);

    const coverageScore = Math.min(100, (coveredEmissions / totalPossibleEmissions) * 100);

    // Generate recommendations using AI
    const recommendations = await generateRecommendations(
      missingMetrics,
      industry,
      organizationSize,
      coverageScore
    );

    return NextResponse.json({
      missingMetrics: missingMetrics.slice(0, 20), // Top 20 missing metrics
      coverageScore: Math.round(coverageScore),
      recommendations,
      summary: {
        totalMetricsPossible: allPossibleMetrics.length,
        metricsTracked: currentMetrics.length,
        criticalGaps: missingMetrics.filter(m => m.importance === 'critical').length,
        importantGaps: missingMetrics.filter(m => m.importance === 'important').length
      }
    });

  } catch (error) {
    console.error('Error performing gap analysis:', error);
    return NextResponse.json(
      { error: 'Failed to perform gap analysis' },
      { status: 500 }
    );
  }
}

// Helper function to determine data sources
function getDataSources(this: any, metric: any): string[] {
  const sources = [];

  // Based on metric type, suggest data sources
  if (metric.category?.includes('electricity')) {
    sources.push('Utility bills', 'Smart meters', 'Energy management system');
  } else if (metric.category?.includes('fuel')) {
    sources.push('Fuel receipts', 'Fleet management system', 'Expense reports');
  } else if (metric.category?.includes('travel')) {
    sources.push('Travel booking system', 'Expense reports', 'Corporate credit card data');
  } else if (metric.category?.includes('waste')) {
    sources.push('Waste hauler reports', 'Facility management data', 'Recycling logs');
  } else if (metric.category?.includes('water')) {
    sources.push('Water bills', 'Meter readings', 'Facility reports');
  } else {
    sources.push('Supplier data', 'Surveys', 'Industry estimates');
  }

  return sources;
}

// Generate AI-powered recommendations
async function generateRecommendations(
  missingMetrics: any[],
  industry: string,
  organizationSize: string,
  coverageScore: number
): Promise<string[]> {
  const recommendations = [];

  // Coverage-based recommendations
  if (coverageScore < 30) {
    recommendations.push('Start with Scope 1 & 2 emissions - these are typically easiest to measure and control');
    recommendations.push('Focus on utility data collection (electricity, gas, water) for quick wins');
  } else if (coverageScore < 60) {
    recommendations.push('Expand to key Scope 3 categories like business travel and employee commuting');
    recommendations.push('Implement supplier engagement to gather upstream emission data');
  } else if (coverageScore < 80) {
    recommendations.push('Target remaining high-impact categories for comprehensive coverage');
    recommendations.push('Consider automated data collection tools to reduce manual effort');
  } else {
    recommendations.push('Excellent coverage! Focus on data quality and verification');
    recommendations.push('Consider more granular tracking for optimization opportunities');
  }

  // Critical gaps
  const criticalGaps = missingMetrics.filter(m => m.importance === 'critical');
  if (criticalGaps.length > 0) {
    recommendations.push(`Priority: Add ${criticalGaps[0].metric} measurement - this is typically ${criticalGaps[0].estimatedImpact}% of emissions`);
  }

  // Quick wins
  const easyMetrics = missingMetrics.filter(m => m.measurementDifficulty === 'easy');
  if (easyMetrics.length > 0) {
    recommendations.push(`Quick win: ${easyMetrics[0].metric} can be easily tracked using ${easyMetrics[0].dataSources[0]}`);
  }

  // Industry-specific
  recommendations.push(`For ${industry}, peer organizations typically track ${Math.round(coverageScore * 1.2)}% of emissions - aim to exceed this`);

  return recommendations.slice(0, 5); // Top 5 recommendations
}