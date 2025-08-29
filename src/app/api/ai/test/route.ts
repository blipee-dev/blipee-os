/**
 * AI Conversation Testing API Endpoint
 * 
 * Provides endpoints for running and managing AI conversation tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { conversationTestFramework } from '@/lib/ai/testing/conversation-test-framework';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

/**
 * GET /api/ai/test - Get available test suites
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list':
        const suites = conversationTestFramework.getTestSuites();
        return NextResponse.json({
          suites: suites.map(suite => ({
            id: suite.id,
            name: suite.name,
            scenarioCount: suite.scenarios.length,
            tags: Array.from(new Set(suite.scenarios.flatMap(s => s.tags)))
          })),
          timestamp: new Date().toISOString()
        });

      case 'details':
        const suiteId = searchParams.get('suiteId');
        if (!suiteId) {
          return NextResponse.json({ _error: 'Suite ID required' }, { status: 400 });
        }
        
        const suite = conversationTestFramework.getTestSuites()
          .find(s => s.id === suiteId);
          
        if (!suite) {
          return NextResponse.json({ _error: 'Suite not found' }, { status: 404 });
        }
        
        return NextResponse.json({
          suite,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ _error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('AI test _error:', error);
    
    return NextResponse.json({
      _error: 'Failed to get test information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/ai/test - Run AI conversation tests
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { suiteId, organizationId, scenarioId } = body;

    if (!suiteId || !organizationId) {
      return NextResponse.json({ 
        _error: 'Suite ID and Organization ID required' 
      }, { status: 400 });
    }

    // Verify user has access to organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!member || !['account_owner', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json({ _error: 'Admin access required' }, { status: 403 });
    }

    // Run tests
    let results;
    
    if (scenarioId) {
      // Run single scenario
      const suite = conversationTestFramework.getTestSuites()
        .find(s => s.id === suiteId);
        
      if (!suite) {
        return NextResponse.json({ _error: 'Suite not found' }, { status: 404 });
      }
      
      const scenario = suite.scenarios.find(s => s.id === scenarioId);
      if (!scenario) {
        return NextResponse.json({ _error: 'Scenario not found' }, { status: 404 });
      }
      
      const result = await conversationTestFramework.runScenario(
        scenario,
        { ...suite.config, organizationId }
      );
      
      results = [result];
    } else {
      // Run entire suite
      results = await conversationTestFramework.runSuite(suiteId, {
        organizationId
      });
    }

    // Generate report
    const report = conversationTestFramework.generateReport(results);

    // Store test results in database
    const { _error: insertError } = await supabase
      .from('ai_test_results')
      .insert({
        organization_id: organizationId,
        suite_id: suiteId,
        scenario_id: scenarioId,
        results: results as any, // TestResult[] needs to be serialized as Json
        report: report,
        passed: results.every(r => r.passed),
        score: results.reduce((sum, r) => sum + r.score, 0) / results.length,
        run_by: user.id
      });

    if (insertError) {
      console.error('Failed to store test results:', insertError);
    }

    // Log test execution
    await securityAuditLogger.log({
      eventType: SecurityEventType.AI_TEST_RUN,
      _userId: user.id,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: '/api/ai/test',
      action: 'run_tests',
      result: 'success',
      details: {
        suiteId,
        scenarioId,
        organizationId,
        passed: results.every(r => r.passed),
        scenariosRun: results.length
      }
    });

    return NextResponse.json({
      success: true,
      results,
      report,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
        totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Run test _error:', error);
    
    return NextResponse.json({
      _error: 'Failed to run tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/ai/test - Create or update custom test suite
 */
export async function PUT(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { suite, organizationId } = body;

    if (!suite || !organizationId) {
      return NextResponse.json({ 
        _error: 'Test suite and Organization ID required' 
      }, { status: 400 });
    }

    // Verify user has admin access
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('role', 'account_owner')
      .single();

    if (!member) {
      return NextResponse.json({ _error: 'Account owner access required' }, { status: 403 });
    }

    // Add organization-specific prefix to suite ID
    const customSuite = {
      ...suite,
      id: `${organizationId}-${suite.id}`,
      config: {
        ...suite.config,
        organizationId
      }
    };

    // Add the custom test suite
    conversationTestFramework.addTestSuite(customSuite);

    // Store in database for persistence
    const { _error: upsertError } = await supabase
      .from('ai_test_suites')
      .upsert({
        id: customSuite.id,
        organization_id: organizationId,
        suite_data: customSuite,
        created_by: user.id,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      throw new Error(`Failed to store test suite: ${upsertError.message}`);
    }

    // Log the action
    await securityAuditLogger.log({
      eventType: SecurityEventType.SETTINGS_CHANGED,
      _userId: user.id,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: '/api/ai/test',
      action: 'create_test_suite',
      result: 'success',
      details: {
        suiteId: customSuite.id,
        organizationId,
        scenarioCount: customSuite.scenarios.length
      }
    });

    return NextResponse.json({
      message: 'Test suite created successfully',
      suite: {
        id: customSuite.id,
        name: customSuite.name,
        scenarioCount: customSuite.scenarios.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create test suite _error:', error);
    
    return NextResponse.json({
      _error: 'Failed to create test suite',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}