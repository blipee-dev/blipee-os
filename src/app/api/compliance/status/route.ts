import { NextRequest, NextResponse } from 'next/server';
import { complianceService } from '@/lib/compliance/service';
import { requireAuth } from '@/lib/auth/session';

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const status = await complianceService.getComplianceStatus(user.id);

    return NextResponse.json({ status });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { _error: error instanceof Error ? error.message : 'Failed to get compliance status' },
      { status: 500 }
    );
  }
}