import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AgentDatabase } from '@/lib/ai/autonomous-agents/database';
import type { Database } from '@/lib/database/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status') || 'pending';

    const database = new AgentDatabase();

    // Get pending approvals
    const approvals = await database.getPendingApprovals(agentId || undefined);

    // Filter by status if specified
    const filteredApprovals = status === 'pending' 
      ? approvals 
      : approvals.filter(approval => approval.status === status);

    return NextResponse.json({
      approvals: filteredApprovals,
      total: filteredApprovals.length,
      pending: approvals.filter(a => a.status === 'pending').length
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const database = new AgentDatabase();

    const { 
      approvalId, 
      action, 
      reason 
    } = body;

    if (!approvalId || !action) {
      return NextResponse.json(
        { error: 'Approval ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      await database.approveAction(approvalId, session.user.id, reason);
      return NextResponse.json({ message: 'Action approved successfully' });
    } else {
      await database.rejectAction(approvalId, session.user.id, reason);
      return NextResponse.json({ message: 'Action rejected successfully' });
    }
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}