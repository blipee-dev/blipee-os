/**
 * Real-Time Analytics Data Ingestion API
 * POST /api/analytics/ingest - Ingest sustainability data points
 * Handles millions of data points with high-throughput processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { realTimePipeline } from '@/lib/analytics/real-time-pipeline';
import { AnalyticsDataPoint } from '@/lib/analytics/analytics-engine';

async function ingestAnalyticsData(req: NextRequest, context: any) {
  try {
    const { user } = context;
    const body = await req.json();
    
    // Handle both single data point and batch ingestion
    const isArray = Array.isArray(body.data || body);
    const rawDataPoints = isArray ? (body.data || body) : [body.data || body];

    if (rawDataPoints.length === 0) {
      return NextResponse.json(
        { error: 'NO_DATA', message: 'No data points provided' },
        { status: 400 }
      );
    }

    // Validate batch size (prevent excessive memory usage)
    const maxBatchSize = 10000;
    if (rawDataPoints.length > maxBatchSize) {
      return NextResponse.json(
        { 
          error: 'BATCH_TOO_LARGE', 
          message: `Batch size ${rawDataPoints.length} exceeds maximum ${maxBatchSize}`,
          maxBatchSize
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results = {
      total: rawDataPoints.length,
      accepted: 0,
      rejected: 0,
      errors: [] as string[],
      processingTime: 0,
      averageLatency: 0
    };

    // Transform raw data to AnalyticsDataPoint format
    const dataPoints: AnalyticsDataPoint[] = [];
    const validationErrors: string[] = [];

    for (let i = 0; i < rawDataPoints.length; i++) {
      const rawPoint = rawDataPoints[i];
      
      try {
        // Basic structure validation
        if (!rawPoint.type || typeof rawPoint.value !== 'number' || !rawPoint.unit) {
          validationErrors.push(`Point ${i}: Missing required fields (type, value, unit)`);
          results.rejected++;
          continue;
        }

        // Create properly formatted data point
        const dataPoint: AnalyticsDataPoint = {
          id: rawPoint.id || crypto.randomUUID(),
          organizationId: user.organizationId,
          buildingId: rawPoint.buildingId || null,
          timestamp: rawPoint.timestamp ? new Date(rawPoint.timestamp) : new Date(),
          type: rawPoint.type,
          value: parseFloat(rawPoint.value),
          unit: rawPoint.unit,
          source: rawPoint.source || 'api',
          metadata: rawPoint.metadata || {}
        };

        // Additional validation
        if (isNaN(dataPoint.value)) {
          validationErrors.push(`Point ${i}: Invalid numeric value`);
          results.rejected++;
          continue;
        }

        // Check timestamp validity
        const timestamp = dataPoint.timestamp;
        const now = new Date();
        const maxFutureTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        const maxPastTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

        if (timestamp > maxFutureTime) {
          validationErrors.push(`Point ${i}: Timestamp too far in future`);
          results.rejected++;
          continue;
        }

        if (timestamp < maxPastTime) {
          validationErrors.push(`Point ${i}: Timestamp too old (>30 days)`);
          results.rejected++;
          continue;
        }

        dataPoints.push(dataPoint);
        results.accepted++;

      } catch (error) {
        validationErrors.push(`Point ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.rejected++;
      }
    }

    // Add validation errors to results
    results.errors = validationErrors;

    // Process valid data points through the pipeline
    if (dataPoints.length > 0) {
      try {
        const pipelineResult = await realTimePipeline.ingest(dataPoints);
        
        // Update results with pipeline feedback
        if (pipelineResult.rejected > 0) {
          results.accepted -= pipelineResult.rejected;
          results.rejected += pipelineResult.rejected;
          results.errors.push(...pipelineResult.errors);
        }

      } catch (pipelineError) {
        console.error('Pipeline ingestion error:', pipelineError);
        
        // If pipeline fails, try individual ingestion
        let pipelineAccepted = 0;
        for (const dataPoint of dataPoints) {
          const success = await realTimePipeline.ingestSingle(dataPoint);
          if (success) {
            pipelineAccepted++;
          } else {
            results.errors.push(`Pipeline rejected data point ${dataPoint.id}`);
          }
        }
        
        results.accepted = pipelineAccepted;
        results.rejected = dataPoints.length - pipelineAccepted;
      }
    }

    // Calculate metrics
    const processingTime = Date.now() - startTime;
    results.processingTime = processingTime;
    results.averageLatency = results.accepted > 0 ? processingTime / results.accepted : 0;

    // Log ingestion metrics
    console.log(`📊 Ingested ${results.accepted}/${results.total} data points in ${processingTime}ms`);

    // Log ingestion event (commented out - table not in schema yet)
    // const supabase = createClient();
    // await supabase
    //   .from('analytics_events')
    //   .insert({
    //     organization_id: user.organizationId,
    //     user_id: user.id,
    //     event_type: 'data_ingestion',
    //     metadata: {
    //       batch_size: results.total,
    //       accepted_count: results.accepted,
    //       rejected_count: results.rejected,
    //       processing_time_ms: processingTime,
    //       source: req.headers.get('user-agent') || 'unknown'
    //     },
    //       timestamp: new Date().toISOString()
    //   });

    // Return appropriate response based on results
    const statusCode = results.rejected === 0 ? 200 : 
                      results.accepted === 0 ? 400 : 207; // 207 = Multi-Status

    const response = {
      success: results.rejected === 0,
      message: results.rejected === 0 
        ? `Successfully ingested ${results.accepted} data points`
        : `Processed ${results.accepted}/${results.total} data points (${results.rejected} rejected)`,
      results,
      pipeline: {
        status: 'active',
        metrics: realTimePipeline.getMetrics()
      }
    };

    // Add performance headers
    const responseObj = NextResponse.json(response, { status: statusCode });
    responseObj.headers.set('X-Processing-Time', processingTime.toString());
    responseObj.headers.set('X-Accepted-Count', results.accepted.toString());
    responseObj.headers.set('X-Rejected-Count', results.rejected.toString());

    return responseObj;

  } catch (error) {
    console.error('Analytics ingestion error:', error);
    
    return NextResponse.json(
      {
        error: 'INGESTION_ERROR',
        message: 'Failed to process analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export the POST handler directly
export async function POST(req: NextRequest) {
  // Simple rate limiting check
  const identifier = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
  
  // For now, just pass through to the handler
  // TODO: Implement proper rate limiting with Redis
  
  return ingestAnalyticsData(req, { user: null });
}