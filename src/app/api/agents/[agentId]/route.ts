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
    
    // Get agent details
    const agent = await database.getAgentInstance(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get comprehensive agent information
    const [
      statistics,
      recentTasks,
      scheduledTasks,
      pendingApprovals,
      recentDecisions,
      learningPatterns,
      recentMetrics
    ] = await Promise.all([
      database.getAgentStatistics(agentId),
      database.getTaskExecutions(agentId, 20),
      database.getScheduledTasks(agentId),
      database.getPendingApprovals(agentId),
      database.getDecisions(agentId, 20),
      database.getLearningPatterns(agentId),
      database.getMetrics(agentId, undefined, 50)
    ]);

    return NextResponse.json({
      agent,
      statistics,
      recentTasks,
      scheduledTasks,
      pendingApprovals,
      recentDecisions,
      learningPatterns,
      recentMetrics
    });
  } catch (error) {
    console.error('Error fetching agent details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Update agent configuration
    const updatedAgent = await database.updateAgentInstance(agentId, body);

    return NextResponse.json({
      message: 'Agent updated successfully',
      agent: updatedAgent
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Stop the agent before deletion
    await database.updateAgentStatus(agentId, 'stopped');

    // Note: We don't actually delete the agent from the database
    // to preserve historical data, just mark it as stopped
    return NextResponse.json({
      message: 'Agent stopped and deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}