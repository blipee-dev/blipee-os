import { NextRequest, NextResponse } from 'next/server';
import { gdprService } from '@/lib/compliance/service';
import { requireAuth } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { data, error } = await supabaseAdmin
      .from('data_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ requests: data });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { _error: error instanceof Error ? error.message : 'Failed to get deletion requests' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const { reason } = body;

    const deletionRequest = await gdprService.requestAccountDeletion(
      user.id,
      reason
    );

    return NextResponse.json({ request: deletionRequest }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { _error: error instanceof Error ? error.message : 'Failed to request account deletion' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { _error: 'Request ID is required' },
        { status: 400 }
      );
    }

    await gdprService.cancelDeletionRequest(user.id, requestId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { _error: error instanceof Error ? error.message : 'Failed to cancel deletion request' },
      { status: 500 }
    );
  }
}