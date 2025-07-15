import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AgentDatabase } from '@/lib/ai/autonomous-agents/database';
import type { Database } from '@/lib/database/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const database = new AgentDatabase();
    const agents = await database.getAgentInstances(userOrg.organization_id);

    // Get agent statistics
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const stats = await database.getAgentStatistics(agent.id);
        const recentTasks = await database.getTaskExecutions(agent.id, 10);
        const pendingApprovals = await database.getPendingApprovals(agent.id);
        
        return {
          ...agent,
          statistics: stats,
          recentTasks: recentTasks.slice(0, 5),
          pendingApprovals: pendingApprovals.length
        };
      })
    );

    return NextResponse.json({
      agents: agentsWithStats,
      total: agentsWithStats.length,
      active: agentsWithStats.filter(a => a.status === 'running').length,
      paused: agentsWithStats.filter(a => a.status === 'paused').length,
      stopped: agentsWithStats.filter(a => a.status === 'stopped').length
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, agentId, data } = body;

    const database = new AgentDatabase();

    switch (action) {
      case 'initialize_agents':
        await database.initializeAgentsForOrganization(userOrg.organization_id);
        return NextResponse.json({ message: 'Agents initialized successfully' });

      case 'start_agent':
        if (!agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }
        
        await database.updateAgentStatus(agentId, 'running');
        
        // Schedule default tasks for the agent
        const agent = await database.getAgentInstance(agentId);
        if (agent) {
          await database.scheduleAgentTask(
            agentId,
            'analyze_metrics',
            'Daily ESG Analysis',
            '0 8 * * *', // Every day at 8 AM
            'high'
          );
        }

        return NextResponse.json({ message: 'Agent started successfully' });

      case 'stop_agent':
        if (!agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }
        
        await database.updateAgentStatus(agentId, 'stopped');
        return NextResponse.json({ message: 'Agent stopped successfully' });

      case 'pause_agent':
        if (!agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }
        
        await database.updateAgentStatus(agentId, 'paused');
        return NextResponse.json({ message: 'Agent paused successfully' });

      case 'execute_task':
        if (!agentId || !data?.taskType || !data?.taskName) {
          return NextResponse.json({ error: 'Agent ID, task type, and task name required' }, { status: 400 });
        }
        
        const executionId = await database.executeAgentTask(
          agentId,
          data.taskType,
          data.taskName,
          data.inputData || {},
          data.priority || 'medium'
        );
        
        return NextResponse.json({ 
          message: 'Task executed successfully',
          executionId 
        });

      case 'update_autonomy_level':
        if (!agentId || !data?.autonomyLevel) {
          return NextResponse.json({ error: 'Agent ID and autonomy level required' }, { status: 400 });
        }
        
        await database.updateAgentInstance(agentId, {
          autonomy_level: data.autonomyLevel
        });
        
        return NextResponse.json({ message: 'Autonomy level updated successfully' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in agents POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}