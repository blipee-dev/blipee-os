import { createServerSupabaseClient } from '@/lib/supabase/server';
import { 
  WebhookEventType, 
  WebhookPayload, 
  WebhookEndpoint,
  WebhookDelivery 
} from '@/types/webhooks';
import { webhookService } from './webhook-service';
import crypto from 'crypto';

export class EventPublisher {
  
  /**
   * Publish a webhook event to all subscribed endpoints
   */
  static async publishEvent(
    organizationId: string,
    eventType: WebhookEventType,
    payload: WebhookPayload,
    eventId?: string
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();
    
    // Get all enabled endpoints that subscribe to this event type
    const { data: endpoints, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('enabled', true)
      .neq('status', 'disabled')
      .contains('events', [eventType]);

    if (error) {
      console.error('Failed to get webhook endpoints:');
      return;
    }

    if (!endpoints || endpoints.length === 0) {
      console.log(`No webhook endpoints found for event ${eventType} in organization ${organizationId}`);
      return;
    }

    const finalEventId = eventId || crypto.randomUUID();
    
    // Create delivery records for each endpoint
    const deliveries: Omit<WebhookDelivery, 'id' | 'created_at'>[] = endpoints.map(endpoint => ({
      webhook_endpoint_id: endpoint.id,
      organization_id: organizationId,
      event_type: eventType,
      event_id: finalEventId,
      payload,
      attempt_number: 1,
      status: 'pending' as const,
      scheduled_at: new Date().toISOString(),
    }));

    // Insert delivery records
    const { data: createdDeliveries, error: deliveryError } = await supabase
      .from('webhook_deliveries')
      .insert(deliveries)
      .select('id');

    if (deliveryError) {
      console.error('Failed to create webhook deliveries:', deliveryError);
      return;
    }

    // Process each delivery asynchronously
    const processingPromises = (createdDeliveries || []).map(delivery => 
      this.processDeliveryAsync(delivery.id)
    );

    // Don't await all deliveries to avoid blocking
    Promise.allSettled(processingPromises).then(results => {
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.error(`${failures.length} webhook deliveries failed to process`);
      }
    });

    console.log(`Published event ${eventType} to ${endpoints.length} endpoints`);
  }

  /**
   * Process a webhook delivery asynchronously
   */
  static async processDeliveryAsync(deliveryId: string): Promise<void> {
    try {
      await webhookService.processDelivery(deliveryId);
    } catch (error) {
      console.error(`Failed to process webhook delivery ${deliveryId}:`);
    }
  }

  /**
   * Emit a building event
   */
  static async emitBuildingEvent(
    organizationId: string,
    eventType: WebhookEventType.BUILDING_CREATED | WebhookEventType.BUILDING_UPDATED | WebhookEventType.BUILDING_DELETED,
    building: any,
    previousData?: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      ...(actor && { actor }),
      data: {
        building,
        previous_data: previousData,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Emit an emission event
   */
  static async emitEmissionEvent(
    organizationId: string,
    eventType: WebhookEventType.EMISSION_RECORDED | WebhookEventType.EMISSION_UPDATED | WebhookEventType.EMISSION_DELETED,
    emission: any,
    previousData?: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      ...(actor && { actor }),
      data: {
        emission,
        previous_data: previousData,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Emit an alert event
   */
  static async emitAlertEvent(
    organizationId: string,
    eventType: WebhookEventType.ALERT_TRIGGERED | WebhookEventType.ALERT_RESOLVED | WebhookEventType.ALERT_ACKNOWLEDGED,
    alert: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      ...(actor && { actor }),
      data: {
        alert,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Emit a user event
   */
  static async emitUserEvent(
    organizationId: string,
    eventType: WebhookEventType.USER_CREATED | WebhookEventType.USER_UPDATED | WebhookEventType.USER_DELETED,
    user: any,
    previousData?: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      ...(actor && { actor }),
      data: {
        user,
        previous_data: previousData,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Emit an organization event
   */
  static async emitOrganizationEvent(
    organizationId: string,
    eventType: WebhookEventType.ORGANIZATION_UPDATED | WebhookEventType.ORGANIZATION_MEMBER_ADDED | WebhookEventType.ORGANIZATION_MEMBER_REMOVED,
    organization: any,
    member?: any,
    previousData?: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      actor: actor ?? { type: 'system' as const, id: 'webhook-system' },
      data: {
        organization,
        member,
        previous_data: previousData,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Emit a system event
   */
  static async emitSystemEvent(
    organizationId: string,
    eventType: WebhookEventType.SYSTEM_HEALTH_CHECK | WebhookEventType.SYSTEM_MAINTENANCE,
    system: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      actor: actor ?? { type: 'system' as const, id: 'webhook-system' },
      data: {
        system,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Emit a sustainability event
   */
  static async emitSustainabilityEvent(
    organizationId: string,
    eventType: WebhookEventType.SUSTAINABILITY_REPORT_GENERATED | WebhookEventType.SUSTAINABILITY_TARGET_UPDATED | WebhookEventType.SUSTAINABILITY_MILESTONE_REACHED,
    sustainability: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      actor: actor ?? { type: 'system' as const, id: 'webhook-system' },
      data: {
        sustainability,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Emit an API event
   */
  static async emitAPIEvent(
    organizationId: string,
    eventType: WebhookEventType.API_KEY_CREATED | WebhookEventType.API_KEY_REVOKED | WebhookEventType.API_QUOTA_EXCEEDED,
    apiKey: any,
    quota?: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      actor: actor ?? { type: 'system' as const, id: 'webhook-system' },
      data: {
        api_key: apiKey,
        quota,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Emit a compliance event
   */
  static async emitComplianceEvent(
    organizationId: string,
    eventType: WebhookEventType.COMPLIANCE_REPORT_GENERATED | WebhookEventType.COMPLIANCE_VIOLATION_DETECTED,
    compliance: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      actor: actor ?? { type: 'system' as const, id: 'webhook-system' },
      data: {
        compliance,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Emit an authentication event
   */
  static async emitAuthEvent(
    organizationId: string,
    eventType: WebhookEventType.SSO_CONFIGURATION_UPDATED | WebhookEventType.MFA_ENABLED | WebhookEventType.MFA_DISABLED,
    auth: any,
    actor?: { type: 'user' | 'system' | 'api_key'; id: string; name?: string }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      actor: actor ?? { type: 'system' as const, id: 'webhook-system' },
      data: {
        auth,
      },
    };

    await this.publishEvent(organizationId, eventType, payload);
  }

  /**
   * Process pending webhook deliveries (for background job)
   */
  static async processPendingDeliveries(limit: number = 100): Promise<void> {
    const supabase = await createServerSupabaseClient();
    
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select('id')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(limit);

    if (error) {
      console.error('Failed to get pending deliveries:');
      return;
    }

    if (!deliveries || deliveries.length === 0) {
      return;
    }

    console.log(`Processing ${deliveries.length} pending webhook deliveries`);

    const processingPromises = deliveries.map(delivery => 
      this.processDeliveryAsync(delivery.id)
    );

    await Promise.allSettled(processingPromises);
  }

  /**
   * Clean up old webhook deliveries
   */
  static async cleanupOldDeliveries(daysToKeep: number = 30): Promise<void> {
    const supabase = await createServerSupabaseClient();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const { error: _error } = await supabase
      .from('webhook_deliveries')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Failed to cleanup old webhook deliveries:');
    } else {
      console.log(`Cleaned up webhook deliveries older than ${daysToKeep} days`);
    }
  }
}

export const eventPublisher = EventPublisher;