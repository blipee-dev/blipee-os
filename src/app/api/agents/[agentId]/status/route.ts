import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AgentDatabase } from '@/lib/ai/autonomous-agents/database';
import type { Database } from '@/lib/database/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
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

    const { agentId } = params;
    const database = new AgentDatabase();

    // Get agent current status
    const agent = await database.getAgentInstance(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get real-time status information
    const [
      statistics,
      runningTasks,
      recentMetrics,
      healthScore
    ] = await Promise.all([
      database.getAgentStatistics(agentId),
      database.getTaskExecutions(agentId, 5).then(tasks => 
        tasks.filter(t => t.status === 'running')
      ),
      database.getMetrics(agentId, 'performance', 10),
      database.getMetrics(agentId, 'health', 1)
    ]);

    const currentHealth = healthScore.length > 0 ? healthScore[0].metric_value : agent.health_score;

    return NextResponse.json({
      agentId,
      status: agent.status,
      autonomyLevel: agent.autonomy_level,
      healthScore: currentHealth,
      lastHeartbeat: agent.last_heartbeat,
      statistics,
      runningTasks,
      recentMetrics: recentMetrics.slice(0, 5),
      uptime: agent.last_heartbeat ? 
        Date.now() - new Date(agent.last_heartbeat).getTime() : null,
      isHealthy: currentHealth > 0.5,
      lastActivity: statistics.totalTasks > 0 ? 
        new Date(agent.updated_at).toISOString() : null
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
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

    const { agentId } = params;
    const body = await request.json();
    const database = new AgentDatabase();

    const { action, data } = body;

    switch (action) {
      case 'start':
        await database.updateAgentStatus(agentId, 'running');
        await database.updateAgentHealth(agentId, 1.0);
        return NextResponse.json({ message: 'Agent started successfully' });

      case 'stop':
        await database.updateAgentStatus(agentId, 'stopped');
        return NextResponse.json({ message: 'Agent stopped successfully' });

      case 'pause':
        await database.updateAgentStatus(agentId, 'paused');
        return NextResponse.json({ message: 'Agent paused successfully' });

      case 'restart':
        await database.updateAgentStatus(agentId, 'starting');
        // Small delay to simulate restart
        setTimeout(async () => {
          await database.updateAgentStatus(agentId, 'running');
          await database.updateAgentHealth(agentId, 1.0);
        }, 2000);
        return NextResponse.json({ message: 'Agent restart initiated' });

      case 'update_health':
        if (!data?.healthScore) {
          return NextResponse.json({ error: 'Health score required' }, { status: 400 });
        }
        await database.updateAgentHealth(agentId, data.healthScore);
        return NextResponse.json({ message: 'Health score updated successfully' });

      case 'heartbeat':
        await database.updateAgentHealth(agentId, 1.0);
        // Record heartbeat metric
        await database.recordMetric({
          agent_instance_id: agentId,
          metric_type: 'heartbeat',
          metric_name: 'agent_heartbeat',
          metric_value: 1
        });
        return NextResponse.json({ message: 'Heartbeat recorded successfully' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating agent status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}