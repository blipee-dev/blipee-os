/**
 * Runbooks API
 * Phase 4, Task 4.4: API endpoints for runbook management
 */

import { NextRequest, NextResponse } from 'next/server';
import { runbookEngine } from '@/lib/runbooks';
import { logger } from '@/lib/logging';
import { withLogging } from '@/lib/logging/http-logger';
import { withTracing } from '@/middleware/tracing';

/**
 * GET /api/runbooks - List all runbooks or get execution status
 */
export const GET = withTracing(withLogging(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const executionId = searchParams.get('executionId');
  const status = searchParams.get('status');

  try {
    // Get specific execution
    if (executionId) {
      const execution = runbookEngine.getExecution(executionId);
      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(execution);
    }

    // Get executions by status
    if (status === 'active') {
      const activeExecutions = runbookEngine.getActiveExecutions();
      return NextResponse.json({
        executions: activeExecutions,
        count: activeExecutions.length
      });
    }

    // Get all executions
    const allExecutions = runbookEngine.getAllExecutions();
    const summary = {
      total: allExecutions.length,
      running: allExecutions.filter(e => e.status === 'running').length,
      completed: allExecutions.filter(e => e.status === 'completed').length,
      failed: allExecutions.filter(e => e.status === 'failed').length,
      cancelled: allExecutions.filter(e => e.status === 'cancelled').length
    };

    return NextResponse.json({
      executions: allExecutions.slice(-20), // Last 20 executions
      summary
    });

  } catch (error) {
    logger.error('Failed to get runbook executions', error as Error);
    return NextResponse.json(
      { error: 'Failed to get executions' },
      { status: 500 }
    );
  }
}));

/**
 * POST /api/runbooks/execute - Execute a runbook
 */
export const POST = withTracing(withLogging(async (request: NextRequest) => {
  const body = await request.json();
  const { runbookId, context, async: asyncExecution } = body;

  if (!runbookId) {
    return NextResponse.json(
      { error: 'Runbook ID is required' },
      { status: 400 }
    );
  }

  try {
    logger.info('Executing runbook', {
      runbookId,
      async: asyncExecution,
      context
    });

    const execution = await runbookEngine.execute(
      runbookId,
      context,
      { async: asyncExecution }
    );

    return NextResponse.json({
      executionId: execution.executionId,
      status: execution.status,
      runbookId: execution.runbookId,
      startTime: execution.startTime,
      message: asyncExecution 
        ? 'Runbook execution started' 
        : 'Runbook execution completed'
    });

  } catch (error) {
    logger.error('Failed to execute runbook', error as Error, {
      runbookId
    });

    return NextResponse.json(
      { 
        error: 'Failed to execute runbook',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}));

/**
 * DELETE /api/runbooks - Cancel a runbook execution
 */
export const DELETE = withTracing(withLogging(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const executionId = searchParams.get('executionId');

  if (!executionId) {
    return NextResponse.json(
      { error: 'Execution ID is required' },
      { status: 400 }
    );
  }

  try {
    const cancelled = runbookEngine.cancelExecution(executionId);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Execution not found or already completed' },
        { status: 404 }
      );
    }

    logger.info('Runbook execution cancelled', { executionId });

    return NextResponse.json({
      success: true,
      executionId,
      message: 'Execution cancelled'
    });

  } catch (error) {
    logger.error('Failed to cancel runbook execution', error as Error, {
      executionId
    });

    return NextResponse.json(
      { error: 'Failed to cancel execution' },
      { status: 500 }
    );
  }
}));