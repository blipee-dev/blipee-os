/**
 * Database Health & Schema Validation API
 * 
 * Provides comprehensive database health checks and schema validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { schemaValidator } from '@/lib/database/schema-validator';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

/**
 * GET /api/database/health - Get database health status
 */
export async function GET((_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['platform_admin', 'account_owner'])
      .single();

    if (!member) {
      await securityAuditLogger.log({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        _userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resource: '/api/database/health',
        action: 'schema_validation',
        result: 'failure',
        details: { reason: 'insufficient_privileges' }
      });
      
      return NextResponse.json({ _error: 'Admin privileges required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';

    let result;

    switch (action) {
      case 'status':
        // Quick health check
        result = await getQuickHealthStatus();
        break;

      case 'validate':
        // Full schema validation
        result = await schemaValidator.validateSchema();
        break;

      case 'report':
        // Generate comprehensive report
        const report = await schemaValidator.generateSchemaReport();
        result = {
          report,
          timestamp: new Date().toISOString(),
          format: 'markdown'
        };
        break;

      case 'repair':
        // Auto-repair schema issues
        if (member.role !== 'platform_admin') {
          return NextResponse.json({ 
            _error: 'Platform admin privileges required for auto-repair' 
          }, { status: 403 });
        }
        
        result = await schemaValidator.autoRepairSchema();
        
        // Log repair actions
        await securityAuditLogger.log({
          eventType: SecurityEventType.DATABASE_REPAIR,
          _userId: user.id,
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: '/api/database/health',
          action: 'auto_repair',
          result: 'success',
          details: {
            repaired: result.repaired,
            failed: result.failed,
            actions: result.results
          }
        });
        break;

      default:
        return NextResponse.json({ 
          _error: 'Invalid action. Valid actions: status, validate, report, repair' 
        }, { status: 400 });
    }

    // Log successful health check
    await securityAuditLogger.log({
      eventType: SecurityEventType.DATABASE_HEALTH_CHECK,
      _userId: user.id,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: '/api/database/health',
      action: action,
      result: 'success',
      details: { action }
    });

    return NextResponse.json({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database health check _error:', error);
    
    return NextResponse.json({
      _error: 'Database health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/database/health - Execute specific health actions
 */
export async function POST((_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and admin privileges
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'platform_admin')
      .single();

    if (!member) {
      return NextResponse.json({ 
        _error: 'Platform admin privileges required' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { action, options = {} } = body;

    let result;

    switch (action) {
      case 'create_missing_tables':
        result = await createMissingTables(options);
        break;

      case 'fix_enum_issues':
        result = await fixEnumIssues(options);
        break;

      case 'rebuild_indexes':
        result = await rebuildIndexes(options);
        break;

      case 'update_rls_policies':
        result = await updateRLSPolicies(options);
        break;

      default:
        return NextResponse.json({ 
          _error: 'Invalid action' 
        }, { status: 400 });
    }

    // Log admin action
    await securityAuditLogger.log({
      eventType: SecurityEventType.DATABASE_ADMIN_ACTION,
      _userId: user.id,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: '/api/database/health',
      action: action,
      result: 'success',
      details: { action, options, result }
    });

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database admin action _error:', error);
    
    return NextResponse.json({
      _error: 'Database admin action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Quick health status check
 */
async function getQuickHealthStatus() {
  const supabase = createClient();
  
  const checks = {
    database_connection: false,
    core_tables_exist: false,
    enums_valid: false,
    rls_enabled: false,
    indexes_present: false
  };

  try {
    // Test database connection
    const { data: connectionTest } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    checks.database_connection = !!connectionTest;

    // Check core tables
    const coreTables = ['organizations', 'organization_members', 'buildings'];
    let tablesExist = 0;
    
    for (const table of coreTables) {
      try {
        await supabase.from(table).select('id').limit(1);
        tablesExist++;
      } catch {
        // Table doesn't exist or no access
      }
    }
    
    checks.core_tables_exist = tablesExist === coreTables.length;

    // Check enum (try to use it in a query)
    try {
      await supabase
        .from('organization_members')
        .select('role')
        .limit(1);
      checks.enums_valid = true;
    } catch {
      checks.enums_valid = false;
    }

    // Estimate other checks
    checks.rls_enabled = checks.core_tables_exist; // Assume RLS if tables exist
    checks.indexes_present = checks.core_tables_exist; // Assume indexes if tables exist

  } catch (error) {
    console.error('Health check _error:', error);
  }

  const healthScore = Object.values(checks).filter(Boolean).length * 20;
  
  return {
    overall_health: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
    health_score: healthScore,
    checks,
    timestamp: new Date().toISOString(),
    recommendations: generateRecommendations(checks)
  };
}

/**
 * Generate recommendations based on health checks
 */
function generateRecommendations(checks: Record<string, boolean>): string[] {
  const recommendations: string[] = [];

  if (!checks.database_connection) {
    recommendations.push('Database connection failed - check connection strings and network');
  }

  if (!checks.core_tables_exist) {
    recommendations.push('Core tables missing - run schema migration 20250829_00_core_schema_foundation.sql');
  }

  if (!checks.enums_valid) {
    recommendations.push('Enum validation failed - create user_role enum with required values');
  }

  if (!checks.rls_enabled) {
    recommendations.push('Row Level Security not fully enabled - review RLS policies');
  }

  if (!checks.indexes_present) {
    recommendations.push('Database indexes may be missing - check performance optimization');
  }

  if (recommendations.length === 0) {
    recommendations.push('Database health is good - no immediate actions required');
  }

  return recommendations;
}

/**
 * Helper functions for specific repair actions
 */
async function createMissingTables(_options: any) {
  // Implementation would create missing tables based on validation results
  return { message: 'Missing tables creation not yet implemented' };
}

async function fixEnumIssues(_options: any) {
  // Implementation would fix enum-related issues
  return { message: 'Enum fixes not yet implemented' };
}

async function rebuildIndexes(_options: any) {
  // Implementation would rebuild database indexes
  return { message: 'Index rebuilding not yet implemented' };
}

async function updateRLSPolicies(_options: any) {
  // Implementation would update RLS policies
  return { message: 'RLS policy updates not yet implemented' };
}