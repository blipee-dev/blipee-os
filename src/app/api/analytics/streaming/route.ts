import { NextRequest, NextResponse } from 'next/server';
import { streamingEngine } from '@/lib/analytics/advanced/streaming-engine';
import { profiler } from '@/lib/performance/profiler';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    profiler.startTiming('streaming_analytics_process');

    const body = await request.json();
    const { events, processorId } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({
        error: 'Invalid events data. Expected array of streaming events.'
      }, { status: 400 });
    }

    // Validate event structure
    for (const event of events) {
      if (!event.id || !event.timestamp || !event.source || !event.type || !event.data) {
        return NextResponse.json({
          error: 'Invalid event structure. Required fields: id, timestamp, source, type, data'
        }, { status: 400 });
      }
    }

    // Process events through streaming engine
    await streamingEngine.processStream(events);

    const processingTime = profiler.endTiming('streaming_analytics_process', {
      eventCount: events.length,
      processorId
    });

    // Record API metrics
    profiler.recordApiRequest({
      route: '/api/analytics/streaming',
      method: 'POST',
      statusCode: 200,
      duration: processingTime
    });

    return NextResponse.json({
      success: true,
      processed: events.length,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    profiler.endTiming('streaming_analytics_process', { error: true });

    profiler.recordApiRequest({
      route: '/api/analytics/streaming',
      method: 'POST',
      statusCode: 500,
      duration: Date.now() - startTime
    });

    console.error('Streaming analytics error:', error);
    return NextResponse.json({
      error: 'Failed to process streaming events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'processors':
        // Return available processors
        return NextResponse.json({
          processors: [
            {
              id: 'anomaly-detector',
              name: 'Real-time Anomaly Detection',
              description: 'Statistical anomaly detection using z-score analysis'
            },
            {
              id: 'carbon-calculator',
              name: 'Real-time Carbon Footprint Calculator',
              description: 'Calculates carbon emissions from energy consumption events'
            },
            {
              id: 'predictive-maintenance',
              name: 'Predictive Maintenance AI',
              description: 'Predicts equipment maintenance needs using trend analysis'
            },
            {
              id: 'esg-compliance',
              name: 'Real-time ESG Compliance Monitor',
              description: 'Monitors ESG compliance and generates alerts'
            }
          ]
        });

      case 'status':
        // Return streaming engine status
        return NextResponse.json({
          status: 'active',
          registered_processors: 4,
          last_processing: new Date().toISOString(),
          performance_summary: profiler.getSummary(5 * 60 * 1000) // Last 5 minutes
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Available actions: processors, status'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Streaming analytics GET error:', error);
    return NextResponse.json({
      error: 'Failed to get streaming analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}