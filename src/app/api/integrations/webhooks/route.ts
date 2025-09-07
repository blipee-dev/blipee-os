/**
 * Integration Webhooks API
 * POST /api/integrations/webhooks - Receive webhook from third-party integrations
 * GET /api/integrations/webhooks - List webhook deliveries for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { marketplaceManager } from '@/lib/integrations/marketplace-manager';
import { withAPIVersioning } from '@/middleware/api-versioning';
import { withRateLimit } from '@/middleware/rate-limit';
import crypto from 'crypto';

async function handleWebhook(req: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(req.url);
    const integrationId = searchParams.get('integration');
    const installationId = searchParams.get('installation');

    if (!integrationId || !installationId) {
      return NextResponse.json(
        { error: 'MISSING_PARAMETERS', message: 'Integration ID and installation ID are required' },
        { status: 400 }
      );
    }

    // Get webhook payload
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    // Get integration installation to verify webhook signature
    const supabase = createClient();
    const { data: installation, error } = await supabase
      .from('integration_installations')
      .select(`
        *,
        organizations (
          id,
          name
        )
      `)
      .eq('id', installationId)
      .eq('integration_id', integrationId)
      .single();

    if (error || !installation) {
      console.error('Integration installation not found:', { integrationId, installationId });
      return NextResponse.json(
        { error: 'INSTALLATION_NOT_FOUND', message: 'Integration installation not found' },
        { status: 404 }
      );
    }

    // Verify webhook signature
    const isValidSignature = await marketplaceManager.verifyWebhookSignature(
      integrationId,
      body,
      headers,
      installation.configuration
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature:', { integrationId, installationId });
      
      // Log failed webhook delivery
      await supabase
        .from('webhook_deliveries')
        .insert({
          installation_id: installationId,
          integration_id: integrationId,
          organization_id: installation.organizations.id,
          event_type: 'signature_verification_failed',
          payload: body,
          headers: JSON.stringify(headers),
          status: 'failed',
          error_message: 'Invalid webhook signature',
          delivered_at: new Date().toISOString()
        });

      return NextResponse.json(
        { error: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' },
        { status: 401 }
      );
    }

    // Process the webhook
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse webhook payload:', parseError);
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Handle the webhook based on integration type
    const result = await marketplaceManager.handleWebhook(
      integrationId,
      installationId,
      installation.organizations.id,
      parsedPayload,
      headers
    );

    // Log successful webhook delivery
    await supabase
      .from('webhook_deliveries')
      .insert({
        installation_id: installationId,
        integration_id: integrationId,
        organization_id: installation.organizations.id,
        event_type: result.eventType,
        payload: body,
        headers: JSON.stringify(headers),
        status: 'success',
        processed_data: JSON.stringify(result.processedData),
        delivered_at: new Date().toISOString()
      });

    // If this webhook triggered sustainability data updates, notify the AI system
    if (result.triggerAIAnalysis) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/ai/analyze-webhook-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
          },
          body: JSON.stringify({
            organizationId: installation.organizations.id,
            integrationId,
            eventType: result.eventType,
            processedData: result.processedData
          })
        });
      } catch (aiError) {
        console.error('Failed to trigger AI analysis for webhook:', aiError);
        // Don't fail the webhook - just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      eventType: result.eventType,
      processed: result.processedData ? Object.keys(result.processedData).length : 0
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Try to log the failed webhook delivery
    try {
      const supabase = createClient();
      const { searchParams } = new URL(req.url);
      const integrationId = searchParams.get('integration');
      const installationId = searchParams.get('installation');
      
      if (integrationId && installationId) {
        const body = await req.text();
        const headers = Object.fromEntries(req.headers.entries());
        
        await supabase
          .from('webhook_deliveries')
          .insert({
            installation_id: installationId,
            integration_id: integrationId,
            event_type: 'processing_error',
            payload: body,
            headers: JSON.stringify(headers),
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            delivered_at: new Date().toISOString()
          });
      }
    } catch (logError) {
      console.error('Failed to log webhook delivery error:', logError);
    }

    return NextResponse.json(
      {
        error: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getWebhookDeliveries(req: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(req.url);
    const installationId = searchParams.get('installationId');
    const integrationId = searchParams.get('integrationId');
    const status = searchParams.get('status') as 'success' | 'failed' | 'pending' | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'NO_ORGANIZATION', message: 'User not associated with organization' },
        { status: 400 }
      );
    }

    // Check permissions - only account_owner, sustainability_manager, and facility_manager can view webhook deliveries
    if (!['account_owner', 'sustainability_manager', 'facility_manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions to view webhook deliveries' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('webhook_deliveries')
      .select(`
        *,
        integration_installations (
          integration_id,
          configuration
        )
      `)
      .eq('organization_id', profile.organization_id)
      .order('delivered_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (installationId) {
      query = query.eq('installation_id', installationId);
    }

    if (integrationId) {
      query = query.eq('integration_id', integrationId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: deliveries, error: deliveriesError } = await query;

    if (deliveriesError) {
      throw deliveriesError;
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('webhook_deliveries')
      .select('status')
      .eq('organization_id', profile.organization_id)
      .gte('delivered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    const summary = {
      last24Hours: {
        total: stats?.length || 0,
        success: stats?.filter(s => s.status === 'success').length || 0,
        failed: stats?.filter(s => s.status === 'failed').length || 0,
        pending: stats?.filter(s => s.status === 'pending').length || 0
      }
    };

    return NextResponse.json({
      deliveries: deliveries?.map(delivery => ({
        ...delivery,
        // Don't expose sensitive payload data in list view
        payload: delivery.payload ? `${delivery.payload.substring(0, 100)}...` : null,
        headers: delivery.headers ? JSON.parse(delivery.headers) : null
      })) || [],
      summary,
      pagination: {
        limit,
        offset,
        total: deliveries?.length || 0,
        hasMore: (deliveries?.length || 0) === limit
      }
    });
  } catch (error) {
    console.error('Webhook deliveries query error:', error);
    return NextResponse.json(
      {
        error: 'QUERY_ERROR',
        message: 'Failed to fetch webhook deliveries',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Webhook endpoint needs higher rate limits due to third-party services
const POST = withAPIVersioning(
  withRateLimit({ requests: 1000, window: '1h' })(
    handleWebhook
  )
);

// Webhook delivery queries have normal rate limits
const GET = withAPIVersioning(
  withRateLimit({ requests: 100, window: '1h' })(
    getWebhookDeliveries
  )
);

export { POST, GET };