import { NextRequest, NextResponse } from 'next/server';
import { soc2Service, complianceService } from '@/lib/compliance/service';
import { requireAuth } from '@/lib/auth/middleware';
import { ComplianceFramework } from '@/lib/compliance/types';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - only admins can generate compliance reports
    const authResult = await requireAuth(request, ['account_owner', 'admin']);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const framework = searchParams.get('framework') as ComplianceFramework;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!framework || !Object.values(ComplianceFramework).includes(framework)) {
      return NextResponse.json(
        { error: 'Valid framework is required' },
        { status: 400 }
      );
    }

    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      end: endDate ? new Date(endDate) : new Date(),
    };

    const report = await soc2Service.generateComplianceReport(framework, period);

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}