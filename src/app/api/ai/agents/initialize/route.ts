import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { initializeAutonomousAgents, getAIWorkforceStatus } from '@/lib/ai/autonomous-agents';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// This endpoint initializes all 8 AI agents
export async function POST(request: NextRequest) {
  try {
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Only admins can initialize AI workforce
    if (!['account_owner', 'sustainability_manager'].includes(memberData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Initialize all 8 AI employees
    const workforce = await initializeAutonomousAgents(memberData.organization_id);

    // Set up autonomous tasks for each agent
    const { orchestrator, agents } = workforce;

    // Schedule recurring tasks for each agent
    // Adjusted for monthly data: bi-weekly checks instead of hourly/daily
    const tasks = [
      {
        agentId: 'esg-chief',
        type: 'strategic_review',
        schedule: '0 9 * * MON', // Weekly strategic review (KEEP)
        payload: { organizationId: memberData.organization_id }
      },
      {
        agentId: 'carbon-hunter',
        type: 'emissions_scan',
        schedule: '0 9 1,15 * *', // ✅ Bi-weekly (1st & 15th at 9 AM) - for monthly data
        payload: { organizationId: memberData.organization_id, autoDiscover: true, scanType: 'monthly_data_check' }
      },
      {
        agentId: 'compliance-guardian',
        type: 'compliance_check',
        schedule: '0 8 5,20 * *', // ✅ Bi-weekly (5th & 20th at 8 AM) - for monthly data
        payload: { organizationId: memberData.organization_id, frameworks: ['GRI', 'TCFD', 'CDP', 'SASB'] }
      },
      {
        agentId: 'supply-chain',
        type: 'supplier_risk_assessment',
        schedule: '0 10 * * WED', // Weekly supplier check (KEEP - external monitoring)
        payload: { organizationId: memberData.organization_id }
      },
      {
        agentId: 'cost-finder',
        type: 'cost_optimization_scan',
        schedule: '0 14 3,18 * *', // ✅ Bi-weekly (3rd & 18th at 2 PM) - for monthly data
        payload: { organizationId: memberData.organization_id, analyzeMonthlyData: true }
      },
      {
        agentId: 'predictive-maintenance',
        type: 'equipment_analysis',
        schedule: '0 */4 * * *', // ✅ Every 4 hours (KEEP - monitors IoT/equipment in real-time)
        payload: { organizationId: memberData.organization_id, monitorType: 'real-time' }
      },
      {
        agentId: 'optimizer',
        type: 'performance_optimization',
        schedule: '0 */2 * * *', // ✅ Every 2 hours (KEEP - optimizes operations in real-time)
        payload: { organizationId: memberData.organization_id, optimizationType: 'real-time' }
      },
      {
        agentId: 'regulatory',
        type: 'regulatory_updates',
        schedule: '0 8 * * *', // Daily at 8 AM (KEEP - monitors external regulations)
        payload: { organizationId: memberData.organization_id, monitorRegulations: true }
      }
    ];

    // Schedule all tasks
    for (const task of tasks) {
      await orchestrator.scheduleTask(task);
    }

    // Get status
    const status = await getAIWorkforceStatus();

    return NextResponse.json({
      success: true,
      message: '🎯 AI Workforce activated - 8 AI employees now working 24/7',
      workforce: {
        ...status,
        agents: Object.keys(agents),
        scheduledTasks: tasks.length,
        organizationId: memberData.organization_id
      }
    });

  } catch (error) {
    console.error('Error initializing AI workforce:', error);
    return NextResponse.json(
      { error: 'Failed to initialize AI workforce' },
      { status: 500 }
    );
  }
}

// Check workforce status
export async function GET(request: NextRequest) {
  try {
    const status = await getAIWorkforceStatus();

    return NextResponse.json({
      ...status,
      recommendation: status.systemHealth === 'excellent'
        ? 'All systems operational'
        : 'Some agents may need reinitialization'
    });

  } catch (error) {
    console.error('Error checking AI workforce status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}