import { NextRequest, NextResponse } from 'next/server';
import { getAuditService } from '@/lib/audit/service';
import { sessionManager } from '@/lib/session/manager';
import { AuditEventType, AuditEventSeverity, AuditLogQuery } from '@/lib/audit/types';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication and permissions
    const sessionCookie = _request.cookies.get('blipee-session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await sessionManager.validateSession(_request, ['audit:export']);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = _request.nextUrl.searchParams;
    const format = searchParams.get('format') as 'json' | 'csv' || 'json';
    
    const query: AuditLogQuery = {
      limit: parseInt(searchParams.get('limit') || '10000'), // Higher limit for exports
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: searchParams.get('sortBy') as 'timestamp' | 'severity' | 'type' || 'timestamp',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
    };

    // Only add optional properties if they have values
    const startDateParam = searchParams.get('startDate');
    if (startDateParam) query.startDate = new Date(startDateParam);
    
    const endDateParam = searchParams.get('endDate');
    if (endDateParam) query.endDate = new Date(endDateParam);
    
    const types = searchParams.getAll('types') as AuditEventType[];
    if (types.length > 0) query.types = types;
    
    const severities = searchParams.getAll('severities') as AuditEventSeverity[];
    if (severities.length > 0) query.severities = severities;
    
    const actorId = searchParams.get('actorId');
    if (actorId) query.actorId = actorId;
    
    const actorType = searchParams.get('actorType') as 'user' | 'system' | 'api';
    if (actorType) query.actorType = actorType;
    
    const targetId = searchParams.get('targetId');
    if (targetId) query.targetId = targetId;
    
    const targetType = searchParams.get('targetType');
    if (targetType) query.targetType = targetType;
    
    const organizationId = searchParams.get('organizationId') || validation.session?.organizationId;
    if (organizationId) query.organizationId = organizationId;
    
    const buildingId = searchParams.get('buildingId');
    if (buildingId) query.buildingId = buildingId;
    
    const result = searchParams.get('result') as 'success' | 'failure';
    if (result) query.result = result;
    
    const search = searchParams.get('search');
    if (search) query.search = search;

    // Get audit service and export logs
    const auditService = getAuditService();
    const exportData = await auditService.export(query, format);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.${format}"`);

    return new Response(exportData, { headers });
  } catch (error: any) {
    console.error('Audit export API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to export audit logs' 
      },
      { status: 500 }
    );
  }
}