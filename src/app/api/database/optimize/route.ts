import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { indexOptimizer } from '@/lib/database/index-optimizer';
import { queryAnalyzer } from '@/lib/database/query-analyzer';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || !['account_owner', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json({ _error: 'Insufficient permissions' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    let result;
    
    switch (action) {
      case 'analyze':
        // Get comprehensive optimization report
        result = await queryAnalyzer.generateOptimizationReport();
        break;
        
      case 'optimize':
        // Run index optimization (dry run by default)
        const dryRun = searchParams.get('dryRun') !== 'false';
        result = await indexOptimizer.optimizeIndexes(dryRun);
        
        // Log security audit
        await securityAuditLogger.log({
          eventType: SecurityEventType.DATABASE_REPAIR,
          _userId: user.id,
          action: 'database_optimization',
          resource: 'indexes',
          result: 'success',
          details: {
            dryRun,
            actionsCount: result.actions.length
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        break;
        
      case 'create-core':
        // Create all core indexes
        result = await indexOptimizer.createCoreIndexes();
        
        // Log security audit
        await securityAuditLogger.log({
          eventType: SecurityEventType.DATABASE_REPAIR,
          _userId: user.id,
          action: 'create_core_indexes',
          resource: 'indexes',
          result: 'success',
          details: result,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        break;
        
      case 'index-stats':
        // Get index statistics
        const indexName = searchParams.get('name') || undefined;
        result = await indexOptimizer.getIndexStats(indexName);
        break;
        
      case 'table-stats':
        // Get table statistics
        const tableName = searchParams.get('table');
        if (!tableName) {
          return NextResponse.json({ _error: 'Table name required' }, { status: 400 });
        }
        result = await queryAnalyzer.getTableStatistics(tableName);
        break;
        
      default:
        return NextResponse.json({ 
          _error: 'Invalid action. Valid actions: analyze, optimize, create-core, index-stats, table-stats' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString(),
      data: result
    });

  } catch (error) {
    console.error('Database optimization _error:', error);
    return NextResponse.json(
      { _error: 'Failed to perform database optimization' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'account_owner') {
      return NextResponse.json({ _error: 'Only account owners can modify indexes' }, { status: 403 });
    }

    const body = await request.json();
    const { action, index } = body;
    
    let result;
    
    switch (action) {
      case 'create':
        // Create a specific index
        if (!index) {
          return NextResponse.json({ _error: 'Index definition required' }, { status: 400 });
        }
        result = await indexOptimizer.createIndex(index);
        break;
        
      case 'drop':
        // Drop a specific index
        if (!index?.name) {
          return NextResponse.json({ _error: 'Index name required' }, { status: 400 });
        }
        result = await indexOptimizer.dropIndex(index.name, true);
        break;
        
      case 'rebuild':
        // Rebuild a specific index
        if (!index?.name) {
          return NextResponse.json({ _error: 'Index name required' }, { status: 400 });
        }
        result = await indexOptimizer.rebuildIndex(index.name);
        break;
        
      case 'analyze-query':
        // Analyze a specific query
        const { query, params } = body;
        if (!query) {
          return NextResponse.json({ _error: 'Query required' }, { status: 400 });
        }
        result = await queryAnalyzer.analyzeQuery(query, params);
        break;
        
      default:
        return NextResponse.json({ 
          _error: 'Invalid action. Valid actions: create, drop, rebuild, analyze-query' 
        }, { status: 400 });
    }

    // Log security audit for index modifications
    if (['create', 'drop', 'rebuild'].includes(action)) {
      await securityAuditLogger.log({
        eventType: SecurityEventType.DATABASE_REPAIR,
        _userId: user.id,
        action: `index_${action}`,
        resource: 'indexes',
        result: 'success',
        details: {
          indexName: index?.name,
          success: result
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    }

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString(),
      data: result
    });

  } catch (error) {
    console.error('Database optimization _error:', error);
    return NextResponse.json(
      { _error: 'Failed to perform database operation' },
      { status: 500 }
    );
  }
}