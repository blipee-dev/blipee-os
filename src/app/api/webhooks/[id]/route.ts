import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { webhookService } from '@/lib/webhooks/webhook-service';
import { WebhookEndpointUpdate } from '@/types/webhooks';
import { webhookVerifier } from '@/lib/webhooks/webhook-verifier';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get webhook
    const webhook = await webhookService.getEndpoint(params.id, member.organization_id);
    
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Failed to get webhook:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    if (!['account_owner', 'admin', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const data: WebhookEndpointUpdate = await request.json();
    
    // Validate webhook data
    if (data.url) {
      const urlValidation = webhookVerifier.validateWebhookUrl(data.url);
      if (!urlValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid webhook URL', details: urlValidation.errors },
          { status: 400 }
        );
      }
    }

    if (data.events) {
      const eventValidation = webhookVerifier.validateEventTypes(data.events);
      if (!eventValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid event types', details: eventValidation.errors },
          { status: 400 }
        );
      }
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

    // Update webhook
    const webhook = await webhookService.updateEndpoint(
      params.id,
      member.organization_id,
      data
    );
    
    return NextResponse.json({ 
      webhook,
      message: 'Webhook updated successfully' 
    });
  } catch (error) {
    console.error('Failed to update webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    if (!['account_owner', 'admin', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete webhook
    await webhookService.deleteEndpoint(params.id, member.organization_id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Webhook deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}