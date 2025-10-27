/**
 * AI Analytics - Experiments API
 *
 * GET: Retrieve experiment results
 * POST: Create new A/B test experiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server-auth';
import {
  createExperiment,
  getActiveExperiments,
  getExperimentResults,
  startExperiment,
  stopExperiment,
  completeExperiment,
  setupQuickExperiment,
  type ExperimentConfig,
} from '@/lib/ai/analytics/ab-testing';

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');

    if (experimentId) {
      // Get specific experiment results
      const results = await getExperimentResults(experimentId);
      if (!results) {
        return NextResponse.json(
          { error: 'Experiment not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(results);
    } else {
      // Get all active experiments
      const experiments = await getActiveExperiments();
      return NextResponse.json({
        experiments,
        count: experiments.length,
      });
    }
  } catch (error) {
    console.error('[AI Analytics API] Error fetching experiments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create': {
        const config: ExperimentConfig = {
          name: data.name,
          description: data.description,
          variants: data.variants,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        };

        const experimentId = await createExperiment(config, user.id);
        if (!experimentId) {
          return NextResponse.json(
            { error: 'Failed to create experiment' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          experimentId,
        });
      }

      case 'quick_setup': {
        const experimentId = await setupQuickExperiment(
          data.name,
          data.promptVersionIds,
          data.durationDays || 7,
          user.id
        );

        if (!experimentId) {
          return NextResponse.json(
            { error: 'Failed to create experiment' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          experimentId,
        });
      }

      case 'start': {
        const success = await startExperiment(data.experimentId);
        return NextResponse.json({ success });
      }

      case 'stop': {
        const success = await stopExperiment(data.experimentId);
        return NextResponse.json({ success });
      }

      case 'complete': {
        const success = await completeExperiment(
          data.experimentId,
          data.promoteWinner || false
        );
        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AI Analytics API] Error managing experiment:', error);
    return NextResponse.json(
      { error: 'Failed to manage experiment' },
      { status: 500 }
    );
  }
}
