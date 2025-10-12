import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sustainability/replan/rollback
 * Rollback a replanning event to its previous state
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { historyId, organizationId } = await request.json();

    if (!historyId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: historyId, organizationId' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    // Check if user has permission (only managers and owners)
    const allowedRoles = ['account_owner', 'sustainability_manager', 'facility_manager'];
    if (!allowedRoles.includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only managers can rollback targets.' },
        { status: 403 }
      );
    }

    // Verify this history record belongs to this organization
    const { data: historyRecord } = await supabase
      .from('target_replanning_history')
      .select('organization_id, sustainability_target_id')
      .eq('id', historyId)
      .single();

    if (!historyRecord || historyRecord.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'History record not found or access denied' },
        { status: 404 }
      );
    }

    // Execute rollback via database function
    const { data: result, error: rollbackError } = await supabase
      .rpc('rollback_target_replanning', {
        p_history_id: historyId,
        p_user_id: session.user.id
      });

    if (rollbackError) {
      console.error('Rollback error:', rollbackError);
      return NextResponse.json(
        { error: 'Rollback failed: ' + rollbackError.message },
        { status: 500 }
      );
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Rollback failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Replanning rolled back successfully',
      targetId: historyRecord.sustainability_target_id
    });

  } catch (error: any) {
    console.error('Error in rollback API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
