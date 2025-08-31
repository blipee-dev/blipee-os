/**
 * Runbook Details API
 * Phase 4, Task 4.4: Get runbook definition
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  aiServiceRecoveryRunbook,
  databasePerformanceRunbook,
  highMemoryUsageRunbook
} from '@/lib/runbooks/runbook-library';
import { withLogging } from '@/lib/logging/http-logger';
import { withTracing } from '@/middleware/tracing';

// Map of available runbooks
const runbooks = {
  'ai-service-recovery': aiServiceRecoveryRunbook,
  'database-performance': databasePerformanceRunbook,
  'high-memory-usage': highMemoryUsageRunbook
};

/**
 * GET /api/runbooks/[runbookId] - Get runbook definition
 */
export const GET = withTracing(withLogging(async (
  request: NextRequest,
  { params }: { params: { runbookId: string } }
) => {
  const { runbookId } = params;
  
  const runbook = runbooks[runbookId as keyof typeof runbooks];
  
  if (!runbook) {
    return NextResponse.json(
      { error: 'Runbook not found' },
      { status: 404 }
    );
  }

  // Return runbook definition without functions
  const definition = {
    id: runbook.id,
    name: runbook.name,
    description: runbook.description,
    version: runbook.version,
    tags: runbook.tags,
    triggers: runbook.triggers,
    initialStep: runbook.initialStep,
    notifications: runbook.notifications,
    steps: runbook.steps.map(step => ({
      id: step.id,
      name: step.name,
      type: step.type,
      description: step.description,
      onSuccess: step.onSuccess,
      onFailure: step.onFailure,
      retryable: step.retryable,
      timeout: step.timeout,
      options: step.options
    }))
  };

  return NextResponse.json(definition);
}));