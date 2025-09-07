/**
 * Example: API Route with Distributed Tracing
 * Phase 4, Task 4.2: Example implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTracing } from '@/middleware/tracing';
import { traceDatabaseQuery, tracePrismaOperation } from '@/lib/tracing/database-tracing';
import { traceOutgoingRequest, traceApiClient } from '@/lib/tracing/http-tracing';
import { traceAsync, tracer } from '@/lib/tracing';
import { logger } from '@/lib/logging';

/**
 * Example traced API route
 */
export const GET = withTracing(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId');
  const buildingId = searchParams.get('buildingId');

  try {
    // Add custom attributes to current span
    const span = tracer.getActiveSpan();
    if (span && organizationId) {
      tracer.setSpanAttributes(span, {
        organizationId,
        buildingId: buildingId || undefined
      });
    }

    // Trace data validation
    await traceAsync(
      'validate_request',
      async () => {
        if (!organizationId) {
          throw new Error('Organization ID is required');
        }
      },
      { operationType: 'validation' }
    );

    // Trace database query
    const buildings = await traceDatabaseQuery(
      'SELECT',
      'SELECT * FROM buildings WHERE organization_id = $1',
      async () => {
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          rows: [
            { id: '1', name: 'HQ Building', organization_id: organizationId },
            { id: '2', name: 'Branch Office', organization_id: organizationId }
          ],
          rowCount: 2
        };
      },
      {
        table: 'buildings',
        params: [organizationId],
        organizationId
      }
    );

    // Trace Prisma operation
    const detailedData = await tracePrismaOperation(
      'Building',
      'findMany',
      async () => {
        // Simulate Prisma query
        await new Promise(resolve => setTimeout(resolve, 150));
        return buildings.rows.map(b => ({
          ...b,
          energyData: {
            consumption: Math.random() * 1000,
            emissions: Math.random() * 100
          }
        }));
      },
      {
        where: { organization_id: organizationId },
        include: { energyData: true }
      }
    );

    // Trace external API call
    const weatherData = await traceApiClient(
      'weather-api',
      'get-current',
      async () => {
        return traceOutgoingRequest(
          'GET',
          'https://api.weather.example.com/current',
          async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 200));
            return {
              status: 200,
              json: async () => ({
                temperature: 22,
                humidity: 65,
                conditions: 'partly cloudy'
              })
            };
          },
          {
            headers: {
              'Authorization': 'Bearer token',
              'X-API-Version': 'v2'
            }
          }
        );
      },
      {
        method: 'GET',
        endpoint: '/current',
        params: { lat: 37.7749, lon: -122.4194 }
      }
    );

    // Trace data processing
    const processedData = await traceAsync(
      'process_building_data',
      async () => {
        // Record custom event
        tracer.recordEvent('processing_started', {
          building_count: detailedData.length
        });

        const result = detailedData.map(building => ({
          ...building,
          weather: await weatherData.json(),
          efficiency_score: calculateEfficiencyScore(building)
        }));

        tracer.recordEvent('processing_completed', {
          building_count: result.length,
          average_efficiency: result.reduce((sum, b) => sum + b.efficiency_score, 0) / result.length
        });

        return result;
      },
      {
        operationType: 'data_processing',
        buildingCount: detailedData.length
      }
    );

    // Log successful completion
    logger.info('Building data retrieved successfully', {
      organizationId,
      buildingCount: processedData.length
    });

    return NextResponse.json({
      success: true,
      data: processedData,
      meta: {
        count: processedData.length,
        organization_id: organizationId
      }
    });

  } catch (error) {
    // Error is automatically traced by withTracing
    logger.error('Failed to retrieve building data', error as Error, {
      organizationId,
      buildingId
    });

    return NextResponse.json(
      { error: 'Failed to retrieve building data' },
      { status: 500 }
    );
  }
});

/**
 * Example POST route with tracing
 */
export const POST = withTracing(async (request: NextRequest) => {
  const body = await request.json();

  // Start a manual span for complex operations
  return tracer.startActiveSpan(
    'create_sustainability_report',
    async (span) => {
      try {
        // Set operation attributes
        span.setAttribute('report.type', body.type);
        span.setAttribute('report.period', body.period);

        // Validate input
        await traceAsync('validate_report_data', async () => {
          if (!body.organizationId || !body.type) {
            throw new Error('Missing required fields');
          }
        });

        // Begin transaction
        const transactionResult = await traceDatabaseQuery(
          'BEGIN',
          'BEGIN',
          async () => {
            logger.info('Starting report generation transaction');
            return { success: true };
          }
        );

        try {
          // Insert report
          const report = await traceDatabaseQuery(
            'INSERT',
            'INSERT INTO reports (organization_id, type, period) VALUES ($1, $2, $3) RETURNING *',
            async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
              return {
                rows: [{
                  id: crypto.randomUUID(),
                  organization_id: body.organizationId,
                  type: body.type,
                  period: body.period,
                  created_at: new Date()
                }],
                rowCount: 1
              };
            },
            {
              table: 'reports',
              params: [body.organizationId, body.type, body.period]
            }
          );

          // Generate report data (trace each section)
          const sections = ['emissions', 'energy', 'waste', 'water'];
          const reportData = {};

          for (const section of sections) {
            reportData[section] = await traceAsync(
              `generate_${section}_data`,
              async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return {
                  total: Math.random() * 1000,
                  trend: Math.random() > 0.5 ? 'up' : 'down',
                  percentage: Math.random() * 10
                };
              },
              {
                operationType: 'report_generation',
                section
              }
            );
          }

          // Commit transaction
          await traceDatabaseQuery(
            'COMMIT',
            'COMMIT',
            async () => {
              logger.info('Report generation transaction committed');
              return { success: true };
            }
          );

          // Record success event
          span.addEvent('report_generated', {
            report_id: report.rows[0].id,
            sections: sections.length
          });

          return NextResponse.json({
            success: true,
            data: {
              report: report.rows[0],
              data: reportData
            }
          });

        } catch (error) {
          // Rollback on error
          await traceDatabaseQuery(
            'ROLLBACK',
            'ROLLBACK',
            async () => {
              logger.error('Rolling back report generation transaction');
              return { success: true };
            }
          );

          throw error;
        }
      } catch (error) {
        // Span error is automatically recorded
        throw error;
      }
    },
    {
      kind: 2, // SpanKind.SERVER
      attributes: {
        userId: body.userId,
        organizationId: body.organizationId
      }
    }
  );
});

/**
 * Helper function
 */
function calculateEfficiencyScore(building: any): number {
  const baseScore = 50;
  const consumptionFactor = building.energyData?.consumption || 500;
  const emissionsFactor = building.energyData?.emissions || 50;
  
  return Math.max(0, Math.min(100, 
    baseScore - (consumptionFactor / 100) - (emissionsFactor / 10)
  ));
}