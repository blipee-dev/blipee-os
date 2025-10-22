import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SmartRecommendationEngine } from '@/lib/sustainability/smart-recommendations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sustainability/recommendations
 * Get smart recommendations for a specific metric target
 *
 * Query params:
 * - organizationId: string (required)
 * - metricTargetId: string (required)
 */
export async function GET(request: NextRequest) {
  try {

    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const metricTargetId = searchParams.get('metricTargetId');

    if (!organizationId || !metricTargetId) {
      return NextResponse.json(
        { error: 'Missing required parameters: organizationId, metricTargetId' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
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

    // Get organization details
    // Try to get all columns, but don't fail if some don't exist
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('Organization query failed:', {
        organizationId,
        error: orgError,
        errorDetails: orgError?.details,
        errorHint: orgError?.hint,
        errorMessage: orgError?.message
      });
      return NextResponse.json(
        { error: `Organization not found: ${orgError?.message || 'Unknown error'}` },
        { status: 404 }
      );
    }

    // Get metric target details
    const { data: metricTarget, error: mtError } = await supabase
      .from('metric_targets')
      .select(`
        *,
        metrics_catalog (
          id,
          name,
          code,
          category,
          scope,
          unit
        )
      `)
      .eq('id', metricTargetId)
      .eq('organization_id', organizationId)
      .single();

    if (mtError || !metricTarget) {
      console.error('Metric target not found:', {
        metricTargetId,
        organizationId,
        error: mtError
      });
      return NextResponse.json(
        { error: `Metric target not found: ${mtError?.message || 'Unknown error'}` },
        { status: 404 }
      );
    }

    // Calculate current annual emissions and target reduction
    const currentAnnual = metricTarget.current_value || 0;
    const targetAnnual = metricTarget.target_value || 0;
    const reductionNeeded = currentAnnual - targetAnnual;
    const reductionPercent = currentAnnual > 0
      ? ((reductionNeeded / currentAnnual) * 100)
      : 0;

    // Build context objects
    const orgContext = {
      id: org.id,
      name: org.name,
      industry: org.industry || 'general',
      squareFeet: org.square_feet,
      location: org.location ? {
        lat: org.location.lat || 0,
        lon: org.location.lon || 0,
        country: org.location.country || 'US'
      } : undefined,
      employees: org.employee_count
    };

    const metricContext = {
      metricId: metricTarget.metrics_catalog.id,
      metricCode: metricTarget.metrics_catalog.code,
      metricName: metricTarget.metrics_catalog.name,
      scope: metricTarget.metrics_catalog.scope,
      currentAnnualEmissions: currentAnnual,
      targetReduction: reductionNeeded,
      reductionPercent: reductionPercent
    };

    // Get smart recommendations
    const recommendations = await SmartRecommendationEngine.getRecommendations(
      orgContext,
      metricContext
    );

    return NextResponse.json({
      success: true,
      data: {
        metricTarget: {
          id: metricTarget.id,
          metricName: metricTarget.metrics_catalog.name,
          metricCode: metricTarget.metrics_catalog.code,
          scope: metricTarget.metrics_catalog.scope,
          currentAnnualEmissions: currentAnnual,
          targetAnnualEmissions: targetAnnual,
          reductionNeeded: reductionNeeded,
          reductionPercent: reductionPercent
        },
        recommendations: recommendations,
        context: {
          organization: orgContext,
          dataQuality: {
            hasLocation: !!org.location,
            hasSquareFeet: !!org.square_feet,
            hasEmployeeCount: !!org.employee_count,
            hasIndustry: !!org.industry
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
