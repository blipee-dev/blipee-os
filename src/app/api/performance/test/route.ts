/**
 * Performance Testing API
 * Phase 2, Task 2.5: API endpoint for running performance tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPerformanceTestSuite } from '@/lib/performance/performance-test-suite';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

/**
 * GET /api/performance/test - Run performance test suite
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || !['account_owner', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const format = searchParams.get('format') || 'json';

    const testSuite = createPerformanceTestSuite(supabase);

    const testResults = await testSuite.runTestSuite(category || undefined);

    // Log performance testing activity
    await securityAuditLogger.log({
      eventType: SecurityEventType.SYSTEM_MONITORING,
      userId: user.id,
      action: 'performance_testing',
      resource: 'performance_test_suite',
      result: 'success',
      details: {
        category: category || 'all',
        testsRun: testResults.summary.totalTests,
        passed: testResults.summary.passed,
        warnings: testResults.summary.warnings,
        critical: testResults.summary.critical,
        failed: testResults.summary.failed,
        averageTime: testResults.summary.averageExecutionTime
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Return results in requested format
    if (format === 'report') {
      const report = testSuite.generatePerformanceReport(testResults.results);
      
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="performance-report-${new Date().toISOString().split('T')[0]}.txt"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      category: category || 'all',
      summary: testResults.summary,
      results: testResults.results,
      recommendations: testResults.recommendations,
      metadata: {
        testsAvailable: [
          'index_query_performance',
          'bulk_insert_performance', 
          'connection_pool_performance',
          'n_plus_one_elimination',
          'partition_query_performance',
          'complex_aggregation_performance',
          'concurrent_user_simulation',
          'memory_usage_efficiency'
        ],
        categories: ['database', 'api', 'query', 'bulk', 'index', 'connection'],
        formats: ['json', 'report']
      }
    });

  } catch (error) {
    console.error('Performance testing error:', error);
    
    return NextResponse.json({
      error: 'Failed to run performance tests',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/performance/test - Run specific performance test
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || !['account_owner', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const body = await request.json();
    const { testName, iterations = 1 } = body;

    if (!testName) {
      return NextResponse.json({
        error: 'Missing required field: testName'
      }, { status: 400 });
    }

    const testSuite = createPerformanceTestSuite(supabase);
    
    // Get test definition
    const testDefinitions = [
      {
        name: 'index_query_performance',
        description: 'Test query performance with proper index usage',
        category: 'index' as const,
        expectedMaxTime: 200,
        warningThreshold: 500,
        criticalThreshold: 1000
      },
      {
        name: 'bulk_insert_performance',
        description: 'Test bulk insert operations efficiency',
        category: 'bulk' as const,
        expectedMaxTime: 300,
        warningThreshold: 800,
        criticalThreshold: 1500
      },
      {
        name: 'connection_pool_performance',
        description: 'Test connection pool efficiency under load',
        category: 'connection' as const,
        expectedMaxTime: 400,
        warningThreshold: 1000,
        criticalThreshold: 2000
      },
      {
        name: 'n_plus_one_elimination',
        description: 'Test N+1 query elimination effectiveness',
        category: 'query' as const,
        expectedMaxTime: 150,
        warningThreshold: 400,
        criticalThreshold: 800
      },
      {
        name: 'partition_query_performance',
        description: 'Test partitioned table query performance',
        category: 'database' as const,
        expectedMaxTime: 250,
        warningThreshold: 600,
        criticalThreshold: 1200
      }
    ];

    const testDef = testDefinitions.find(t => t.name === testName);
    if (!testDef) {
      return NextResponse.json({
        error: 'Unknown test name',
        availableTests: testDefinitions.map(t => t.name)
      }, { status: 400 });
    }

    const result = await testSuite.executeTest(testDef, iterations);

    // Log specific test execution
    await securityAuditLogger.log({
      eventType: SecurityEventType.SYSTEM_MONITORING,
      userId: user.id,
      action: 'specific_performance_test',
      resource: 'performance_test_suite',
      result: result.status === 'fail' ? 'failure' : 'success',
      details: {
        testName,
        iterations,
        executionTime: result.executionTime,
        status: result.status,
        details: result.details
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      testName,
      iterations,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Specific performance test error:', error);
    
    return NextResponse.json({
      error: 'Failed to run specific performance test',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * PUT /api/performance/test - Update performance baselines
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only account owners can update baselines
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'account_owner') {
      return NextResponse.json({ error: 'Account owner permissions required' }, { status: 403 });
    }

    return NextResponse.json({
      message: 'Performance baseline updates coming soon',
      availableActions: [
        'GET /api/performance/test - Run full test suite',
        'GET /api/performance/test?category=database - Run database tests only',
        'GET /api/performance/test?format=report - Get report format',
        'POST /api/performance/test - Run specific test with custom iterations'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Baseline update not implemented',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}