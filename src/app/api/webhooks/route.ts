import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { webhookService } from '@/lib/webhooks/webhook-service';
import { WebhookEndpointCreate } from '@/types/webhooks';
import { webhookVerifier } from '@/lib/webhooks/webhook-verifier';

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

    // Check if user has permissions
    if (!['account_owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get webhooks
    const webhooks = await webhookService.getEndpoints(member.organization_id);
    
    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Failed to get webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to get webhooks' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
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

    // Check if user has permissions
    if (!['account_owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const data: WebhookEndpointCreate = await request.json();
    
    // Validate webhook data
    const urlValidation = webhookVerifier.validateWebhookUrl(data.url);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid webhook URL', details: urlValidation.errors },
        { status: 400 }
      );
    }

    const eventValidation = webhookVerifier.validateEventTypes(data.events);
    if (!eventValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid event types', details: eventValidation.errors },
        { status: 400 }
      );
    }

    if (data.headers) {
      const headerValidation = webhookVerifier.validateHeaders(data.headers);
      if (!headerValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid headers', details: headerValidation.errors },
          { status: 400 }
        );
      }
    }

    // Create webhook
    const webhook = await webhookService.createEndpoint(
      member.organization_id,
      data,
      user.id
    );
    
    return NextResponse.json({ 
      webhook,
      message: 'Webhook created successfully' 
    });
  } catch (error) {
    console.error('Failed to create webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}