import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get the status of the Railway worker service that runs prompt optimization jobs
 */
export async function GET() {
  try {
    const supabase = await createServerClient();

    // Get active worker instances from database
    const { data: workers, error: workersError } = await supabase
      .from('ai_agent_service_state')
      .select('*')
      .order('last_heartbeat', { ascending: false })
      .limit(5);

    if (workersError) {
      console.error('Error fetching worker state:', workersError);
      return NextResponse.json(
        { error: 'Failed to fetch worker state', details: workersError.message },
        { status: 500 }
      );
    }

    // Try to fetch health from Railway service if available
    let railwayHealth = null;
    const railwayUrl = process.env.RAILWAY_SERVICE_URL;

    if (railwayUrl) {
      try {
        const healthResponse = await fetch(`${railwayUrl}/health`, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (healthResponse.ok) {
          railwayHealth = await healthResponse.json();
        }
      } catch (err) {
        console.warn('Could not fetch Railway health:', err);
        // Non-fatal, continue without Railway health
      }
    }

    return NextResponse.json({
      workers: workers || [],
      railwayHealth,
      railwayUrl: railwayUrl || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in worker-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
