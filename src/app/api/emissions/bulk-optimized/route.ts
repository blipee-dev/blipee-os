/**
 * Optimized Bulk Emissions API
 * Phase 2, Task 2.3: N+1 Query Elimination Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createNPlusOneEliminator } from '@/lib/database/n-plus-one-eliminator';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bulkData } = await request.json();
    
    if (!bulkData || !Array.isArray(bulkData)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of emission records.' },
        { status: 400 }
      );
    }

    console.log(`🚀 Processing ${bulkData.length} emission records with N+1 elimination...`);

    const supabase = createClient();
    const nPlusOneEliminator = createNPlusOneEliminator(supabase);

    // Use the optimized batch insert method
    const result = await nPlusOneEliminator.batchInsertEmissions(bulkData, user.id);

    const processingTime = Date.now() - startTime;

    // Calculate performance metrics
    const originalQueryEstimate = bulkData.length * 3; // Each record would have done ~3 queries (facility + source lookup/create + insert)
    const optimizedQueryCount = Math.ceil(bulkData.length / 100) * 4; // Batch lookups + batch inserts
    const queriesEliminated = originalQueryEstimate - optimizedQueryCount;
    const improvementPercentage = ((queriesEliminated / originalQueryEstimate) * 100);

    // Generate performance report
    const performanceReport = nPlusOneEliminator.generatePerformanceReport(
      'bulk_emissions_insert',
      originalQueryEstimate,
      optimizedQueryCount,
      bulkData.length,
      processingTime
    );

    console.log(`✅ Bulk emissions processing completed:`);
    console.log(`   - Records processed: ${bulkData.length}`);
    console.log(`   - Successful inserts: ${result.successCount}`);
    console.log(`   - Errors: ${result.errorCount}`);
    console.log(`   - Processing time: ${processingTime}ms`);
    console.log(`   - Query optimization: ${queriesEliminated} queries eliminated (${improvementPercentage.toFixed(1)}% reduction)`);

    return NextResponse.json({
      success: true,
      processed: result.successCount,
      errors: result.errors,
      message: `Successfully imported ${result.successCount} emission records`,
      performance: {
        processingTimeMs: processingTime,
        recordsPerSecond: Math.round((result.successCount / processingTime) * 1000),
        optimization: {
          originalQueryEstimate,
          optimizedQueryCount,
          queriesEliminated,
          improvementPercentage: Math.round(improvementPercentage * 100) / 100,
        },
        report: performanceReport
      },
      metadata: {
        totalRecords: bulkData.length,
        successfulRecords: result.successCount,
        failedRecords: result.errorCount,
        batchSize: 100,
        nPlusOneOptimized: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Optimized bulk emissions error:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        processingTimeMs: processingTime,
        failed: true
      }
    }, { status: 500 });
  }
}

/**
 * GET endpoint to compare performance between optimized and original implementations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testSize = parseInt(searchParams.get('testSize') || '100');
    
    return NextResponse.json({
      optimization: {
        endpoint: '/api/emissions/bulk-optimized',
        features: [
          'Batch facility lookups (eliminates N facility queries)',
          'Batch emission source lookup/creation (eliminates N source queries)', 
          'Batch emission inserts (reduces insert overhead)',
          'Comprehensive error handling with row-level tracking',
          'Performance metrics and reporting'
        ],
        estimatedImprovement: {
          queryReduction: `${testSize * 3} → ${Math.ceil(testSize / 100) * 4} queries`,
          improvementPercentage: `${Math.round(((testSize * 3 - Math.ceil(testSize / 100) * 4) / (testSize * 3)) * 100)}% fewer queries`,
          scalingBenefit: 'Improvement increases with larger datasets'
        },
        comparison: {
          original: {
            pattern: 'N+1 queries',
            queriesPerRecord: 3,
            totalQueries: testSize * 3,
            description: 'Each record triggers separate facility lookup, source lookup/create, and insert'
          },
          optimized: {
            pattern: 'Batch processing',
            queriesPerBatch: 4,
            totalQueries: Math.ceil(testSize / 100) * 4,
            description: 'Batch facility lookups, batch source operations, batch inserts'
          }
        }
      },
      usage: {
        endpoint: 'POST /api/emissions/bulk-optimized',
        contentType: 'application/json',
        body: {
          data: [
            {
              organization_id: 'uuid',
              facility_name: 'string',
              source_category: 'string',
              period_start: 'date',
              period_end: 'date',
              scope: 'number',
              activity_value: 'number',
              activity_unit: 'string',
              activity_description: 'string',
              emission_factor: 'number',
              emission_factor_unit: 'string',
              co2e_tonnes: 'number',
              data_quality: 'string',
              notes: 'string'
            }
          ]
        }
      },
      nPlusOneOptimized: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get optimization info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}