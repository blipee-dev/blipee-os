import { NextRequest, NextResponse } from 'next/server';
import { getAuditService } from '@/lib/audit/service';
import { sessionManager } from '@/lib/session/manager';
import { AuditEventType, AuditEventSeverity, AuditLogQuery } from '@/lib/audit/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const sessionCookie = request.cookies.get('blipee-session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await sessionManager.validateSession(request, ['audit:export']);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') as 'json' | 'csv' || 'json';
    
    const query: AuditLogQuery = {
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      types: searchParams.getAll('types') as AuditEventType[],
      severities: searchParams.getAll('severities') as AuditEventSeverity[],
      actorId: searchParams.get('actorId') || undefined,
      actorType: searchParams.get('actorType') as 'user' | 'system' | 'api' || undefined,
      targetId: searchParams.get('targetId') || undefined,
      targetType: searchParams.get('targetType') || undefined,
      organizationId: searchParams.get('organizationId') || validation.session?.organizationId,
      buildingId: searchParams.get('buildingId') || undefined,
      result: searchParams.get('result') as 'success' | 'failure' || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '10000'), // Higher limit for exports
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: searchParams.get('sortBy') as 'timestamp' | 'severity' | 'type' || 'timestamp',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
    };

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