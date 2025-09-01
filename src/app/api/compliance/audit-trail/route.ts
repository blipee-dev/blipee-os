/**
 * Compliance Audit Trail API
 * REST endpoints for audit event management and reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { complianceAuditTrail, AuditQuery } from '@/lib/compliance/audit-trail';
import { dataRetentionManager } from '@/lib/compliance/data-retention';

export interface AuditTrailRequest {
  action: 'query' | 'log_event' | 'generate_report' | 'get_statistics' | 'cleanup';
  query?: AuditQuery;
  event?: {
    framework: 'SOC2' | 'GDPR' | 'General';
    eventType: string;
    severity: 'Info' | 'Warning' | 'High' | 'Critical';
    action: string;
    description: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    metadata?: Record<string, any>;
  };
  report?: {
    type: 'Full Audit' | 'SOC2 Controls' | 'GDPR Activities' | 'Security Events' | 'Data Subject Requests';
    startDate: string;
    endDate: string;
    organizationId?: string;
  };
}

export interface AuditTrailResponse {
  success: boolean;
  timestamp: string;
  action: string;
  data?: any;
  error?: string;
  metadata?: {
    totalEvents?: number;
    processingTime?: number;
    reportId?: string;
  };
}

/**
 * GET endpoint for querying audit events
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: AuditQuery = {
      framework: searchParams.get('framework') as any,
      eventType: searchParams.get('eventType') || undefined,
      severity: searchParams.get('severity') || undefined,
      actorId: searchParams.get('actorId') || undefined,
      targetType: searchParams.get('targetType') || undefined,
      targetId: searchParams.get('targetId') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      organizationId: searchParams.get('organizationId') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };
    
    // Remove undefined values
    Object.keys(query).forEach(key => {
      if (query[key as keyof AuditQuery] === undefined) {
        delete query[key as keyof AuditQuery];
      }
    });
    
    // Query events
    const events = complianceAuditTrail.queryEvents(query);
    const statistics = complianceAuditTrail.getAuditStatistics();
    
    const response: AuditTrailResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      action: 'query',
      data: {
        events: events.map(event => ({
          id: event.id,
          timestamp: event.timestamp,
          framework: event.framework,
          eventType: event.eventType,
          severity: event.severity,
          actor: {
            userEmail: event.actor.userEmail,
            role: event.actor.role
          },
          target: event.target,
          action: event.action,
          description: event.description,
          metadata: event.metadata
        })),
        pagination: {
          limit: query.limit || 50,
          offset: query.offset || 0,
          total: statistics.totalEvents
        },
        statistics: {
          totalEvents: statistics.totalEvents,
          eventsByFramework: statistics.eventsByFramework,
          eventsBySeverity: statistics.eventsBySeverity,
          eventsLast30Days: statistics.eventsLast30Days,
          criticalEventsLast7Days: statistics.criticalEventsLast7Days
        }
      },
      metadata: {
        totalEvents: events.length,
        processingTime: Date.now() - startTime
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Audit trail GET error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'query',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime
        }
      } as AuditTrailResponse,
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for audit trail operations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: AuditTrailRequest = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'query':
        return await handleQuery(body, startTime);
      
      case 'log_event':
        return await handleLogEvent(body, startTime);
      
      case 'generate_report':
        return await handleGenerateReport(body, startTime);
      
      case 'get_statistics':
        return await handleGetStatistics(body, startTime);
      
      case 'cleanup':
        return await handleCleanup(body, startTime);
      
      default:
        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            action: action || 'unknown',
            error: 'Invalid action'
          } as AuditTrailResponse,
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Audit trail POST error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime
        }
      } as AuditTrailResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle query action
 */
async function handleQuery(
  body: AuditTrailRequest,
  startTime: number
): Promise<NextResponse> {
  const { query = {} } = body;
  
  const events = complianceAuditTrail.queryEvents(query);
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'query',
    data: {
      events,
      total: events.length
    },
    metadata: {
      totalEvents: events.length,
      processingTime: Date.now() - startTime
    }
  } as AuditTrailResponse);
}

/**
 * Handle log event action
 */
async function handleLogEvent(
  body: AuditTrailRequest,
  startTime: number
): Promise<NextResponse> {
  const { event } = body;
  
  if (!event) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'log_event',
        error: 'Event data is required'
      } as AuditTrailResponse,
      { status: 400 }
    );
  }
  
  // Create default actor (in real implementation, would extract from auth)
  const actor = {
    userId: 'api_user',
    userEmail: 'api@blipee.ai',
    role: 'api'
  };
  
  const target = {
    type: (event.targetType as any) || 'System',
    id: event.targetId || 'system',
    name: event.targetName
  };
  
  const eventId = complianceAuditTrail.logEvent(
    event.framework,
    event.eventType as any,
    event.severity,
    actor,
    target,
    event.action,
    event.description,
    undefined,
    undefined,
    event.metadata || {}
  );
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'log_event',
    data: {
      eventId,
      framework: event.framework,
      action: event.action
    },
    metadata: {
      processingTime: Date.now() - startTime
    }
  } as AuditTrailResponse);
}

/**
 * Handle generate report action
 */
async function handleGenerateReport(
  body: AuditTrailRequest,
  startTime: number
): Promise<NextResponse> {
  const { report } = body;
  
  if (!report) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'generate_report',
        error: 'Report parameters are required'
      } as AuditTrailResponse,
      { status: 400 }
    );
  }
  
  const reportId = complianceAuditTrail.generateAuditReport(
    report.type,
    {
      startDate: new Date(report.startDate),
      endDate: new Date(report.endDate)
    },
    'api_user',
    report.organizationId
  );
  
  const generatedReport = complianceAuditTrail.getReport(reportId);
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'generate_report',
    data: {
      reportId,
      report: generatedReport
    },
    metadata: {
      reportId,
      processingTime: Date.now() - startTime
    }
  } as AuditTrailResponse);
}

/**
 * Handle get statistics action
 */
async function handleGetStatistics(
  body: AuditTrailRequest,
  startTime: number
): Promise<NextResponse> {
  const statistics = complianceAuditTrail.getAuditStatistics();
  const retentionStats = dataRetentionManager.getRetentionStatistics();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'get_statistics',
    data: {
      auditTrail: statistics,
      dataRetention: retentionStats,
      summary: {
        totalAuditEvents: statistics.totalEvents,
        criticalEvents: statistics.eventsBySeverity['Critical'] || 0,
        recentActivity: statistics.eventsLast30Days,
        dataRecords: retentionStats.totalRecords,
        recordsPendingDeletion: retentionStats.pendingDeletion,
        recordsOnLegalHold: retentionStats.onLegalHold
      }
    },
    metadata: {
      processingTime: Date.now() - startTime
    }
  } as AuditTrailResponse);
}

/**
 * Handle cleanup action
 */
async function handleCleanup(
  body: AuditTrailRequest,
  startTime: number
): Promise<NextResponse> {
  try {
    const auditCleanup = await complianceAuditTrail.cleanupExpiredEvents();
    const dataCleanup = dataRetentionManager.findDataForDeletion(true); // Dry run first
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'cleanup',
      data: {
        auditEventsCleanup: auditCleanup,
        dataRetentionAnalysis: {
          eligibleForDeletion: dataCleanup.eligibleRecords.length,
          requiresReview: dataCleanup.requiresReview.length,
          onLegalHold: dataCleanup.onLegalHold.length
        }
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as AuditTrailResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'cleanup',
        error: error instanceof Error ? error.message : 'Cleanup failed',
        metadata: {
          processingTime: Date.now() - startTime
        }
      } as AuditTrailResponse,
      { status: 500 }
    );
  }
}