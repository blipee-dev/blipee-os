import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { SDGTracker } from '@/lib/sdg/sdg-tracker';

const sdgTracker = new SDGTracker();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const organizationId = searchParams.get('organizationId') || 'default-org';

    switch (action) {
      case 'dashboard':
        const dashboardData = await sdgTracker.getSDGDashboard(organizationId);
        return NextResponse.json({
          success: true,
          data: dashboardData
        });

      case 'impact-assessment':
        const industry = searchParams.get('industry') || 'technology';
        const locations = searchParams.get('locations')?.split(',') || ['US'];
        const employeeCount = parseInt(searchParams.get('employeeCount') || '100');
        const revenue = parseInt(searchParams.get('revenue') || '10000000');
        const activities = searchParams.get('activities')?.split(',') || ['software_development'];

        const impactAssessment = await sdgTracker.assessSDGImpact(
          organizationId,
          industry,
          {
            locations,
            employeeCount,
            revenue,
            activities
          }
        );

        return NextResponse.json({
          success: true,
          data: impactAssessment
        });

      case 'alignment-score':
        const mission = searchParams.get('mission') || 'Create sustainable technology solutions';
        const values = searchParams.get('values')?.split(',') || ['innovation', 'sustainability', 'integrity'];
        const keyActivities = searchParams.get('keyActivities')?.split(',') || ['product_development', 'customer_service'];
        const targetMarkets = searchParams.get('targetMarkets')?.split(',') || ['enterprise', 'small_business'];
        const stakeholders = searchParams.get('stakeholders')?.split(',') || ['customers', 'employees', 'investors'];

        const alignmentScore = await sdgTracker.calculateAlignmentScore(
          organizationId,
          {
            mission,
            values,
            keyActivities,
            targetMarkets,
            stakeholders
          }
        );

        return NextResponse.json({
          success: true,
          data: alignmentScore
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: dashboard, impact-assessment, alignment-score' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('SDG API error:', error);
    return NextResponse.json(
      { error: 'Failed to process SDG request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, organizationId, ...params } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'track-progress':
        if (!params.goalId || !params.targetId || !params.indicatorId || params.value === undefined) {
          return NextResponse.json(
            { error: 'Missing required parameters: goalId, targetId, indicatorId, value' },
            { status: 400 }
          );
        }

        await sdgTracker.trackProgress(
          organizationId,
          params.goalId,
          params.targetId,
          params.indicatorId,
          params.value,
          {
            dataSource: params.dataSource || 'manual_entry',
            methodology: params.methodology || 'direct_measurement',
            confidence: params.confidence || 'medium',
            coverage: params.coverage || 1.0
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Progress tracked successfully'
        });

      case 'generate-action-plan':
        if (!params.priorityGoals || !Array.isArray(params.priorityGoals)) {
          return NextResponse.json(
            { error: 'Priority goals array is required' },
            { status: 400 }
          );
        }

        const actionPlan = await sdgTracker.generateActionPlan(
          organizationId,
          params.priorityGoals,
          {
            budget: params.budget || 1000000,
            timeline: params.timeline || 24, // months
            resources: params.resources || ['sustainability_team', 'external_consultant']
          }
        );

        return NextResponse.json({
          success: true,
          data: actionPlan
        });

      case 'bulk-track':
        if (!params.progressData || !Array.isArray(params.progressData)) {
          return NextResponse.json(
            { error: 'Progress data array is required' },
            { status: 400 }
          );
        }

        const results = await Promise.allSettled(
          params.progressData.map(async (progress: any) => {
            return await sdgTracker.trackProgress(
              organizationId,
              progress.goalId,
              progress.targetId,
              progress.indicatorId,
              progress.value,
              {
                dataSource: progress.dataSource || 'bulk_import',
                methodology: progress.methodology || 'automated_calculation',
                confidence: progress.confidence || 'medium',
                coverage: progress.coverage || 1.0
              }
            );
          })
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.length - successful;

        return NextResponse.json({
          success: true,
          message: `Bulk tracking completed: ${successful} successful, ${failed} failed`,
          details: {
            total: results.length,
            successful,
            failed
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: track-progress, generate-action-plan, bulk-track' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('SDG POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process SDG request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, organizationId, ...params } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update-targets':
        // Update custom targets for organization
        if (!params.targets || !Array.isArray(params.targets)) {
          return NextResponse.json(
            { error: 'Targets array is required' },
            { status: 400 }
          );
        }

        // In a real implementation, this would update the database
        // For now, we'll just validate the structure
        const validTargets = params.targets.every((target: any) => 
          target.goalId && target.targetId && target.value !== undefined && target.targetYear
        );

        if (!validTargets) {
          return NextResponse.json(
            { error: 'Invalid target structure. Each target must have goalId, targetId, value, and targetYear' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Updated ${params.targets.length} custom targets`,
          data: {
            updated: params.targets.length,
            targets: params.targets
          }
        });

      case 'update-preferences':
        // Update dashboard and reporting preferences
        const preferences = {
          displayGoals: params.displayGoals || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
          reportingFrequency: params.reportingFrequency || 'quarterly',
          priorityGoals: params.priorityGoals || [],
          dashboardLayout: params.dashboardLayout || 'grid',
          alertThresholds: params.alertThresholds || {
            red: 30,
            amber: 50,
            green: 70
          }
        };

        return NextResponse.json({
          success: true,
          message: 'Preferences updated successfully',
          data: preferences
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: update-targets, update-preferences' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('SDG PUT API error:', error);
    return NextResponse.json(
      { error: 'Failed to update SDG data' },
      { status: 500 }
    );
  }
}