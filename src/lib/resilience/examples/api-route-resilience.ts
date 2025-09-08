/**
 * Example: API Routes with Resilience Patterns
 * Phase 4, Task 4.3: Resilient API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  resilienceManager,
  ResiliencePolicies,
  circuitBreakerRegistry,
  WithResilience
} from '@/lib/resilience';
import { logger } from '@/lib/logging';
import { withLogging } from '@/lib/logging/http-logger';
import { withTracing } from '@/middleware/tracing';

/**
 * Health check endpoint with circuit breaker status
 */
export const GET = withTracing(withLogging(async (request: NextRequest) => {
  const healthStatus = resilienceManager.getHealthStatus();
  
  const isHealthy = healthStatus.summary.healthy;
  const status = isHealthy ? 200 : 503;

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    resilience: {
      circuitBreakers: {
        total: healthStatus.circuitBreakers.total,
        healthy: healthStatus.circuitBreakers.healthy,
        unhealthy: healthStatus.circuitBreakers.unhealthy,
        states: healthStatus.circuitBreakers.byState
      },
      bulkheads: healthStatus.bulkheads.map(b => ({
        name: b.name,
        active: b.state.active,
        queued: b.state.queued,
        rejected: b.metrics.rejected
      })),
      issues: healthStatus.summary.issues
    }
  }, { status });
}));

/**
 * Example data endpoint with full resilience
 */
export const POST = withTracing(withLogging(async (request: NextRequest) => {
  const body = await request.json();

  try {
    // Execute with resilience patterns
    const result = await resilienceManager.execute(
      'api.process_data',
      async () => {
        // Validate input
        if (!body.organizationId || !body.data) {
          throw new Error('Missing required fields');
        }

        // Process with external service (resilient)
        const externalData = await fetchExternalData(body.organizationId);

        // Process with AI (resilient)
        const aiAnalysis = await processWithAI(body.data, externalData);

        // Store in database (resilient)
        const stored = await storeResults(body.organizationId, aiAnalysis);

        return {
          success: true,
          data: stored,
          analysis: aiAnalysis
        };
      },
      {
        ...ResiliencePolicies.api(),
        fallback: () => ({
          success: false,
          data: null,
          analysis: { 
            message: 'Service temporarily unavailable, please try again later',
            cached: true
          }
        })
      }
    );

    return NextResponse.json(result);

  } catch (error) {
    logger.error('API processing failed', error as Error);
    
    return NextResponse.json({
      error: 'Failed to process request',
      message: (error as Error).message,
      code: (error as any).code
    }, { status: 500 });
  }
}));

/**
 * Fetch external data with resilience
 */
async function fetchExternalData(organizationId: string): Promise<any> {
  return resilienceManager.execute(
    'external.carbon_data',
    async () => {
      logger.info('Fetching external carbon data', { organizationId });

      // Simulate external API call
      const response = await fetch('https://api.carbon.example.com/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        body: JSON.stringify({ organizationId })
      });

      if (!response.ok) {
        const error = new Error(`External API error: ${response.status}`);
        (error as any).code = response.status.toString();
        throw error;
      }

      return response.json();
    },
    ResiliencePolicies.external()
  );
}

/**
 * Process with AI using resilience
 */
async function processWithAI(data: any, externalData: any): Promise<any> {
  return resilienceManager.execute(
    'ai.analyze_data',
    async () => {
      logger.info('Processing data with AI');

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate occasional failures
      if (Math.random() < 0.1) {
        const error = new Error('AI service rate limit');
        (error as any).code = 'RATE_LIMIT';
        throw error;
      }

      return {
        insights: [
          'Carbon emissions trending downward',
          'Energy efficiency improved by 15%',
          'Recommendation: Optimize HVAC schedules'
        ],
        confidence: 0.92,
        processedAt: new Date().toISOString()
      };
    },
    ResiliencePolicies.ai()
  );
}

/**
 * Store results with resilience
 */
async function storeResults(organizationId: string, analysis: any): Promise<any> {
  return resilienceManager.execute(
    'db.store_analysis',
    async () => {
      logger.info('Storing analysis results', { organizationId });

      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate occasional database errors
      if (Math.random() < 0.05) {
        const error = new Error('Database connection timeout');
        (error as any).code = 'TIMEOUT';
        throw error;
      }

      return {
        id: crypto.randomUUID(),
        organizationId,
        analysis,
        storedAt: new Date().toISOString()
      };
    },
    ResiliencePolicies.database()
  );
}

/**
 * Circuit breaker management endpoint
 */
export async function PATCH(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');
  const name = searchParams.get('name');

  if (!action) {
    return NextResponse.json({ error: 'Action required' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'reset':
        if (name) {
          const breaker = circuitBreakerRegistry.get(name);
          if (!breaker) {
            return NextResponse.json({ error: 'Circuit breaker not found' }, { status: 404 });
          }
          breaker.reset();
          logger.info('Circuit breaker reset', { name });
        } else {
          circuitBreakerRegistry.resetAll();
          logger.info('All circuit breakers reset');
        }
        break;

      case 'open':
        if (!name) {
          return NextResponse.json({ error: 'Name required for open action' }, { status: 400 });
        }
        const breaker = circuitBreakerRegistry.get(name);
        if (!breaker) {
          return NextResponse.json({ error: 'Circuit breaker not found' }, { status: 404 });
        }
        breaker.forceOpen();
        logger.warn('Circuit breaker forced open', { name });
        break;

      case 'close':
        if (!name) {
          return NextResponse.json({ error: 'Name required for close action' }, { status: 400 });
        }
        const closingBreaker = circuitBreakerRegistry.get(name);
        if (!closingBreaker) {
          return NextResponse.json({ error: 'Circuit breaker not found' }, { status: 404 });
        }
        closingBreaker.forceClose();
        logger.warn('Circuit breaker forced closed', { name });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      name,
      status: resilienceManager.getHealthStatus()
    });

  } catch (error) {
    logger.error('Circuit breaker management failed', error as Error);
    return NextResponse.json({
      error: 'Failed to manage circuit breaker',
      message: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Service class with resilience decorators
 */
class ResilientDataService {
  @WithResilience('data.fetch', ResiliencePolicies.database())
  async fetchData(id: string): Promise<any> {
    logger.info('Fetching data', { id });
    
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      id,
      value: Math.random() * 1000,
      timestamp: new Date().toISOString()
    };
  }

  @WithResilience('data.aggregate', {
    bulkhead: {
      maxConcurrent: 5,
      maxQueueSize: 20
    },
    timeout: 10000,
    retry: {
      maxAttempts: 2,
      initialDelay: 500,
      maxDelay: 2000,
      backoffMultiplier: 2
    }
  })
  async aggregateData(ids: string[]): Promise<any> {
    logger.info('Aggregating data', { count: ids.length });
    
    const results = await Promise.all(
      ids.map(id => this.fetchData(id))
    );
    
    return {
      total: results.reduce((sum, r) => sum + r.value, 0),
      average: results.reduce((sum, r) => sum + r.value, 0) / results.length,
      count: results.length
    };
  }
}

// Export service instance
export const dataService = new ResilientDataService();