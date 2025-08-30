import { NextRequest, NextResponse } from 'next/server';
import { gdprService } from '@/lib/compliance/service';
import { requireAuth } from '@/lib/auth/session';
import { ConsentType, ConsentStatus } from '@/lib/compliance/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const consents = await gdprService.getUserConsents(user.id);

    return NextResponse.json({ consents });
  } catch (error) {
    if (error instanceof Error && _error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get consents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const { type, status, version, metadata } = body;

    if (!type || !status) {
      return NextResponse.json(
        { error: 'Type and status are required' },
        { status: 400 }
      );
    }

    if (!Object.values(ConsentType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid consent type' },
        { status: 400 }
      );
    }

    if (!Object.values(ConsentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid consent status' },
        { status: 400 }
      );
    }

    const consent = await gdprService.recordConsent(
      user.id,
      type,
      status,
      version,
      metadata
    );

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && _error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record consent' },
      { status: 500 }
    );
  }
}