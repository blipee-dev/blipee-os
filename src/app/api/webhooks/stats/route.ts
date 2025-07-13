import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { webhookService } from '@/lib/webhooks/webhook-service';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('invitation_status', 'accepted')
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Get webhook statistics
    const stats = await webhookService.getStats(member.organization_id);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get webhook stats:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook stats' },
      { status: 500 }
    );
  }
}