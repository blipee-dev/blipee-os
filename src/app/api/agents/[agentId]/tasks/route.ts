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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'scheduled' or 'executions'
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');

    const database = new AgentDatabase();

    if (type === 'scheduled') {
      const scheduledTasks = await database.getScheduledTasks(agentId);
      return NextResponse.json({
        tasks: scheduledTasks,
        total: scheduledTasks.length
      });
    } else {
      let tasks = await database.getTaskExecutions(agentId, limit);
      
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }

      return NextResponse.json({
        tasks,
        total: tasks.length
      });
    }
  } catch (error) {
    console.error('Error fetching agent tasks:', error);
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

    const { 
      taskType, 
      taskName, 
      inputData = {}, 
      priority = 'medium',
      schedulePattern,
      taskConfig = {}
    } = body;

    if (!taskType || !taskName) {
      return NextResponse.json(
        { error: 'Task type and name are required' },
        { status: 400 }
      );
    }

    if (schedulePattern) {
      // Create a scheduled task
      const taskId = await database.scheduleAgentTask(
        agentId,
        taskType,
        taskName,
        schedulePattern,
        priority,
        taskConfig
      );

      return NextResponse.json({
        message: 'Scheduled task created successfully',
        taskId
      });
    } else {
      // Execute task immediately
      const executionId = await database.executeAgentTask(
        agentId,
        taskType,
        taskName,
        inputData,
        priority
      );

      return NextResponse.json({
        message: 'Task executed successfully',
        executionId
      });
    }
  } catch (error) {
    console.error('Error creating agent task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}