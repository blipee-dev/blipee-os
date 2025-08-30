import { NextRequest, NextResponse } from 'next/server';
import { getAuditService } from '@/lib/audit/service';
import { sessionManager } from '@/lib/session/manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const sessionCookie = request.cookies.get('blipee-session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await sessionManager.validateSession(request, ['audit:read']);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = {
      start: searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate')!) 
        : new Date(),
    };

    const organizationId = searchParams.get('organizationId') || validation.session?.organizationId;

    // Get audit service and summary
    const auditService = getAuditService();
    const summary = await auditService.getSummary(organizationId, timeRange);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        _error: errorerror.message || 'Failed to fetch audit summary' 
      },
      { status: 500 }
    );
  }
}