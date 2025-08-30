import { createServerSupabaseClient } from '@/lib/supabase/server';
import { 
  WebhookEndpoint, 
  WebhookEndpointCreate, 
  WebhookEndpointUpdate,
  WebhookEventType,
  WebhookStats,
  WebhookDelivery,
  DEFAULT_WEBHOOK_RETRY_CONFIG
} from '@/types/webhooks';
import crypto from 'crypto';

export class WebhookService {
  
  /**
   * Generate a secure random secret key for webhook signing
   */
  static generateSecretKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new webhook endpoint
   */
  static async createEndpoint(
    organizationId: string,
    data: WebhookEndpointCreate,
    createdBy: string
  ): Promise<WebhookEndpoint> {
    const supabase = await createServerSupabaseClient();
    
    const secretKey = this.generateSecretKey();
    
    const { data: endpoint, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        organization_id: organizationId,
        url: data.url,
        description: data.description,
        events: data.events,
        api_version: data.api_version,
        enabled: data.enabled,
        secret_key: secretKey,
        headers: data.headers || {},
        status: 'active',
        failure_count: 0,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create webhook endpoint: ${.message}`);
    }

    return endpoint;
  }

  /**
   * Get all webhook endpoints for an organization
   */
  static async getEndpoints(organizationId: string): Promise<WebhookEndpoint[]> {
    const supabase = await createServerSupabaseClient();
    
    const { data: endpoints, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get webhook endpoints: ${.message}`);
    }

    return (endpoints || []).map(endpoint => ({
      ...endpoint,
      description: endpoint.description || undefined
    }));
  }

  /**
   * Get a specific webhook endpoint
   */
  static async getEndpoint(id: string, organizationId: string): Promise<WebhookEndpoint | null> {
    const supabase = await createServerSupabaseClient();
    
    const { data: endpoint, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get webhook endpoint: ${.message}`);
    }

    return endpoint ? {
      ...endpoint,
      description: endpoint.description || undefined
    } : null;
  }

  /**
   * Update a webhook endpoint
   */
  static async updateEndpoint(
    id: string,
    organizationId: string,
    data: WebhookEndpointUpdate
  ): Promise<WebhookEndpoint> {
    const supabase = await createServerSupabaseClient();
    
    const { data: endpoint, error } = await supabase
      .from('webhook_endpoints')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update webhook endpoint: ${.message}`);
    }

    return {
      ...endpoint,
      description: endpoint.description || undefined
    };
  }

  /**
   * Delete a webhook endpoint
   */
  static async deleteEndpoint(id: string, organizationId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to delete webhook endpoint: ${.message}`);
    }
  }

  /**
   * Test a webhook endpoint by sending a test event
   */
  static async testEndpoint(
    id: string,
    organizationId: string
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    const endpoint = await this.getEndpoint(id, organizationId);
    
    if (!endpoint) {
      return { success: false, error: 'Webhook endpoint not found' };
    }

    const testPayload = {
      id: crypto.randomUUID(),
      type: 'system.test' as WebhookEventType,
      timestamp: new Date().toISOString(),
      api_version: endpoint.api_version,
      organization_id: organizationId,
      actor: {
        type: 'system' as const,
        id: 'webhook-test',
        name: 'Webhook Test',
      },
      data: {
        test: {
          message: 'This is a test webhook delivery',
          endpoint_id: id,
          timestamp: new Date().toISOString(),
        },
      },
    };

    try {
      const signature = this.generateSignature(JSON.stringify(testPayload), endpoint.secret_key);
      
      const headers = {
        'Content-Type': 'application/json',
        'X-Blipee-Signature': signature,
        'X-Blipee-Event': 'system.test',
        'X-Blipee-Delivery': crypto.randomUUID(),
        'User-Agent': 'Blipee-Webhooks/1.0',
        ...endpoint.headers,
      };

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseBody = await response.text();

      return {
        success: response.ok,
        response: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get webhook statistics for an organization
   */
  static async getStats(organizationId: string): Promise<WebhookStats> {
    const supabase = await createServerSupabaseClient();
    
    // Get endpoint stats
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('status')
      .eq('organization_id', organizationId);

    const totalEndpoints = endpoints?.length || 0;
    const activeEndpoints = endpoints?.filter(e => e.status === 'active').length || 0;
    const failingEndpoints = endpoints?.filter(e => e.status === 'failing').length || 0;

    // Get delivery stats
    const { data: deliveryStats } = await supabase
      .from('webhook_deliveries')
      .select('status, response_time_ms, delivered_at, event_type')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(100);

    const totalDeliveries = deliveryStats?.length || 0;
    const successfulDeliveries = deliveryStats?.filter(d => d.status === 'success').length || 0;
    const failedDeliveries = deliveryStats?.filter(d => d.status === 'failed').length || 0;
    
    const averageResponseTime = deliveryStats?.length 
      ? deliveryStats.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / deliveryStats.length
      : 0;

    const deliverySuccessRate = totalDeliveries > 0 
      ? (successfulDeliveries / totalDeliveries) * 100 
      : 0;

    const recentDeliveries = deliveryStats?.slice(0, 10).map(d => ({
      endpoint_id: (d as any).webhook_endpoint_id || '',
      event_type: d.event_type as WebhookEventType,
      status: d.status as 'success' | 'failed',
      delivered_at: d.delivered_at || (d as any).created_at,
      response_time_ms: d.response_time_ms || 0,
    })) || [];

    return {
      total_endpoints: totalEndpoints,
      active_endpoints: activeEndpoints,
      failing_endpoints: failingEndpoints,
      total_deliveries: totalDeliveries,
      successful_deliveries: successfulDeliveries,
      failed_deliveries: failedDeliveries,
      average_response_time: averageResponseTime,
      delivery_success_rate: deliverySuccessRate,
      recent_deliveries: recentDeliveries,
    };
  }

  /**
   * Get delivery logs for a webhook endpoint
   */
  static async getDeliveryLogs(
    endpointId: string,
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
    const supabase = await createServerSupabaseClient();
    
    const { data: deliveries, error, count } = await supabase
      .from('webhook_deliveries')
      .select('*', { count: 'exact' })
      .eq('webhook_endpoint_id', endpointId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get delivery logs: ${.message}`);
    }

    return {
      deliveries: deliveries || [],
      total: count || 0,
    };
  }

  /**
   * Retry a failed webhook delivery
   */
  static async retryDelivery(
    deliveryId: string,
    organizationId: string
  ): Promise<WebhookDelivery> {
    const supabase = await createServerSupabaseClient();
    
    // Get the original delivery
    const { data: delivery, error } = await supabase
      .from('webhook_deliveries')
      .select('*, webhook_endpoints(*)')
      .eq('id', deliveryId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new Error(`Failed to get delivery for retry: ${.message}`);
    }

    if (!delivery || !delivery.webhook_endpoints) {
      throw new Error('Delivery or webhook endpoint not found');
    }

    const endpoint = delivery.webhook_endpoints as WebhookEndpoint;
    
    // Create new delivery attempt
    const { data: newDelivery, error: createError } = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_endpoint_id: endpoint.id,
        organization_id: organizationId,
        event_type: delivery.event_type,
        event_id: delivery.event_id,
        payload: delivery.payload,
        attempt_number: delivery.attempt_number + 1,
        status: 'pending',
        scheduled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create retry delivery: ${createError.message}`);
    }

    // Queue the delivery for processing
    await this.processDelivery(newDelivery.id);

    return newDelivery;
  }

  /**
   * Process a webhook delivery
   */
  static async processDelivery(deliveryId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    
    const { data: delivery, error } = await supabase
      .from('webhook_deliveries')
      .select('*, webhook_endpoints(*)')
      .eq('id', deliveryId)
      .single();

    if (error || !delivery || !delivery.webhook_endpoints) {
      throw new Error('Delivery or webhook endpoint not found');
    }

    const endpoint = delivery.webhook_endpoints as WebhookEndpoint;
    
    if (!endpoint.enabled || endpoint.status === 'disabled') {
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          error_message: 'Webhook endpoint is disabled',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);
      return;
    }

    try {
      const startTime = Date.now();
      const signature = this.generateSignature(
        JSON.stringify(delivery.payload),
        endpoint.secret_key
      );

      const headers = {
        'Content-Type': 'application/json',
        'X-Blipee-Signature': signature,
        'X-Blipee-Event': delivery.event_type,
        'X-Blipee-Delivery': deliveryId,
        'User-Agent': 'Blipee-Webhooks/1.0',
        ...endpoint.headers,
      };

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(DEFAULT_WEBHOOK_RETRY_CONFIG.timeout_ms),
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      if (response.ok) {
        // Success
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'success',
            response_status_code: response.status,
            response_body: responseBody,
            response_headers: Object.fromEntries(response.headers.entries()),
            response_time_ms: responseTime,
            delivered_at: new Date().toISOString(),
          })
          .eq('id', deliveryId);

        // Update endpoint success stats
        await supabase
          .from('webhook_endpoints')
          .update({
            failure_count: 0,
            last_success_at: new Date().toISOString(),
            last_delivery_at: new Date().toISOString(),
            status: 'active',
          })
          .eq('id', endpoint.id);

      } else {
        // Failed response
        await this.handleDeliveryFailure(
          deliveryId,
          endpoint,
          `HTTP ${response.status}: ${responseBody}`,
          response.status,
          responseBody,
          Object.fromEntries(response.headers.entries()),
          responseTime
        );
      }
    } catch (error) {
      // Network or other error
      await this.handleDeliveryFailure(
        deliveryId,
        endpoint,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle delivery failure and schedule retries
   */
  private static async handleDeliveryFailure(
    deliveryId: string,
    endpoint: WebhookEndpoint,
    errorMessage: string,
    statusCode?: number,
    responseBody?: string,
    responseHeaders?: Record<string, string>,
    responseTime?: number
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();
    
    const { data: delivery } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single();

    const attemptNumber = delivery?.attempt_number || 1;
    const shouldRetry = attemptNumber < DEFAULT_WEBHOOK_RETRY_CONFIG.max_attempts;

    let nextRetryAt: string | null = null;
    if (shouldRetry) {
      const delay = Math.min(
        DEFAULT_WEBHOOK_RETRY_CONFIG.initial_delay_ms * 
        Math.pow(DEFAULT_WEBHOOK_RETRY_CONFIG.backoff_multiplier, attemptNumber - 1),
        DEFAULT_WEBHOOK_RETRY_CONFIG.max_delay_ms
      );
      nextRetryAt = new Date(Date.now() + delay).toISOString();
    }

    // Update delivery record
    await supabase
      .from('webhook_deliveries')
      .update({
        status: 'failed',
        error_message: errorMessage,
        response_status_code: statusCode,
        response_body: responseBody,
        response_headers: responseHeaders,
        response_time_ms: responseTime,
        next_retry_at: nextRetryAt,
        delivered_at: new Date().toISOString(),
      })
      .eq('id', deliveryId);

    // Update endpoint failure stats
    const newFailureCount = endpoint.failure_count + 1;
    const newStatus = newFailureCount >= 10 ? 'failing' : endpoint.status;

    await supabase
      .from('webhook_endpoints')
      .update({
        failure_count: newFailureCount,
        last_failure_at: new Date().toISOString(),
        last_delivery_at: new Date().toISOString(),
        status: newStatus,
      })
      .eq('id', endpoint.id);

    // Schedule retry if applicable
    if (shouldRetry && nextRetryAt && delivery) {
      await supabase
        .from('webhook_deliveries')
        .insert({
          webhook_endpoint_id: endpoint.id,
          organization_id: endpoint.organization_id,
          event_type: delivery.event_type,
          event_id: delivery.event_id,
          payload: delivery.payload,
          attempt_number: attemptNumber + 1,
          status: 'pending',
          scheduled_at: nextRetryAt,
        });
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  static generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

export const webhookService = WebhookService;