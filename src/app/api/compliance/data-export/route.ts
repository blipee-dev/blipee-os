import { NextRequest, NextResponse } from 'next/server';
import { gdprService } from '@/lib/compliance/service';
import { requireAuth } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');

    if (requestId) {
      // Get specific export status
      const status = await gdprService.getExportStatus(user.id, requestId);
      return NextResponse.json({ status });
    }

    // Get all export requests
    const { data, error } = await supabaseAdmin
      .from('data_export_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ requests: data });
  } catch (error) {
    if (error instanceof Error && _error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get export requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const { format = 'json', scope } = body;

    if (format && !['json', 'csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be json, csv, or pdf' },
        { status: 400 }
      );
    }

    const exportRequest = await gdprService.requestDataExport(
      user.id,
      format,
      scope
    );

    return NextResponse.json({ request: exportRequest }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && _error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to request data export' },
      { status: 500 }
    );
  }
}