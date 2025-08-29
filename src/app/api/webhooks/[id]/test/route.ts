import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { webhookService } from '@/lib/webhooks/webhook-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(_(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, _error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
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
        { _error: 'No organization found' },
        { status: 404 }
      );
    }

    // Check if user has permissions
    if (!['account_owner', 'admin', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json(
        { _error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Test webhook
    const result = await webhookService.testEndpoint(params.id, member.organization_id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to test webhook:', error);
    return NextResponse.json(
      { _error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}