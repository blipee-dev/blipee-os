/**
 * Time-Series Partitioning Management API
 * Phase 2, Task 2.4: API endpoint for partition management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTimeSeriesPartitioner } from '@/lib/database/time-series-partitioner';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

/**
 * GET /api/database/partitions - Get partition statistics and status
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
    const tableName = searchParams.get('table');
    const action = searchParams.get('action') || 'stats';

    const partitioner = createTimeSeriesPartitioner(supabase);

    let result;

    switch (action) {
      case 'stats':
        // Get partition statistics
        result = await partitioner.getPartitionStats(tableName || undefined);
        break;

      case 'maintenance':
        // Run partition maintenance
        result = await partitioner.runMaintenance({
          createUpcoming: true,
          archiveOld: false, // Conservative default
          analyzePerformance: true,
          tableName: tableName || undefined
        });
        
        // Log maintenance activity
        await securityAuditLogger.log({
          eventType: SecurityEventType.DATABASE_REPAIR,
          userId: user.id,
          action: 'partition_maintenance',
          resource: 'database_partitions',
          result: 'success',
          details: {
            tableName: tableName || 'all_tables',
            created: result.maintenance.created.length,
            archived: result.maintenance.archived.length,
            errors: result.maintenance.errors.length
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        break;

      case 'create':
        // Auto-create upcoming partitions
        const periodsAhead = parseInt(searchParams.get('periods') || '2');
        result = await partitioner.autoCreatePartitions(tableName || undefined, periodsAhead);
        
        await securityAuditLogger.log({
          eventType: SecurityEventType.DATABASE_REPAIR,
          userId: user.id,
          action: 'create_partitions',
          resource: 'database_partitions',
          result: 'success',
          details: {
            tableName: tableName || 'all_tables',
            periodsAhead,
            created: result.created.length,
            errors: result.errors.length
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        break;

      case 'archive':
        // Archive old partitions
        result = await partitioner.archiveOldPartitions(tableName || undefined);
        
        await securityAuditLogger.log({
          eventType: SecurityEventType.DATABASE_REPAIR,
          userId: user.id,
          action: 'archive_partitions',
          resource: 'database_partitions',
          result: 'success',
          details: {
            tableName: tableName || 'all_tables',
            archived: result.archived.length,
            errors: result.errors.length
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Valid actions: stats, maintenance, create, archive' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      tableName: tableName || 'all_tables',
      timestamp: new Date().toISOString(),
      data: result
    });

  } catch (error) {
    console.error('Partition management error:', error);
    
    return NextResponse.json({
      error: 'Failed to manage partitions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/database/partitions - Create specific partition
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

    if (!member || member.role !== 'account_owner') {
      return NextResponse.json({ error: 'Account owner permissions required' }, { status: 403 });
    }

    const body = await request.json();
    const { tableName, partitionType, startDate, endDate, config } = body;

    if (!tableName || !startDate || !endDate) {
      return NextResponse.json({
        error: 'Missing required fields: tableName, startDate, endDate'
      }, { status: 400 });
    }

    const partitioner = createTimeSeriesPartitioner(supabase);

    // Create specific partition
    const partitionConfig = {
      tableName,
      partitionColumn: config?.partitionColumn || 'period_start',
      partitionType: partitionType || 'yearly',
      retentionYears: config?.retentionYears || 7,
      autoCreate: config?.autoCreate || true,
      autoArchive: config?.autoArchive || false,
      indexes: config?.indexes || []
    };

    const result = await partitioner.createPartition(
      partitionConfig,
      new Date(startDate),
      new Date(endDate)
    );

    // Log partition creation
    await securityAuditLogger.log({
      eventType: SecurityEventType.DATABASE_REPAIR,
      userId: user.id,
      action: 'create_specific_partition',
      resource: 'database_partitions',
      result: result.success ? 'success' : 'failure',
      details: {
        tableName,
        partitionName: result.partitionName,
        startDate,
        endDate,
        error: result.error
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        partitionName: result.partitionName,
        message: `Partition ${result.partitionName} created successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        partitionName: result.partitionName,
        error: result.error,
        message: 'Failed to create partition'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Partition creation error:', error);
    
    return NextResponse.json({
      error: 'Failed to create partition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/database/partitions - Update partition configuration
 */
export async function PUT(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Partition configuration updates coming soon',
      availableActions: [
        'GET /api/database/partitions?action=stats - Get partition statistics',
        'GET /api/database/partitions?action=maintenance - Run partition maintenance',
        'GET /api/database/partitions?action=create&periods=2 - Create upcoming partitions',
        'GET /api/database/partitions?action=archive - Archive old partitions',
        'POST /api/database/partitions - Create specific partition'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Configuration update not implemented',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/database/partitions - Delete/archive partition
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only account owners can delete partitions
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'account_owner') {
      return NextResponse.json({ 
        error: 'Account owner permissions required for partition deletion' 
      }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const partitionName = searchParams.get('partition');

    if (!partitionName) {
      return NextResponse.json({
        error: 'Missing partition name parameter'
      }, { status: 400 });
    }

    // Log deletion attempt
    await securityAuditLogger.log({
      eventType: SecurityEventType.DATA_DELETION,
      userId: user.id,
      action: 'delete_partition',
      resource: 'database_partitions',
      result: 'attempted',
      details: { partitionName },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Partition deletion is disabled for safety',
      partitionName,
      recommendation: 'Use archive action instead to safely archive old partitions',
      timestamp: new Date().toISOString()
    }, { status: 403 });

  } catch (error) {
    console.error('Partition deletion error:', error);
    
    return NextResponse.json({
      error: 'Failed to delete partition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}