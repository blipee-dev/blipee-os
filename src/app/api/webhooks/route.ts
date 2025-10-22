import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import { webhookService } from '@/lib/webhooks/webhook-service';
import { WebhookEndpointCreate } from '@/types/webhooks';
import { webhookVerifier } from '@/lib/webhooks/webhook-verifier';

export async function GET(request: NextRequest) {
  try {

    // Get current user
    const user = await getAPIUser(request);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization using centralized helper
    const { organizationId, role: userRole } = await getUserOrganization(user.id);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Check if user has permissions (owner or manager)
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
    if (!isSuperAdmin && !['owner', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get webhooks
    const webhooks = await webhookService.getEndpoints(organizationId);

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Failed to get webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to get webhooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {

    // Get current user
    const user = await getAPIUser(request);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization using centralized helper
    const { organizationId, role: userRole } = await getUserOrganization(user.id);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Check if user has permissions (owner or manager)
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
    if (!isSuperAdmin && !['owner', 'manager'].includes(userRole)) {
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

    // Create webhook endpoint
    const webhook = await webhookService.createEndpoint(
      organizationId,
      data,
      user.id
    );

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Failed to create webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}