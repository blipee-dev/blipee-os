import { eventPublisher } from './event-publisher';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export class WebhookProcessor {
  private static instance: WebhookProcessor;
  private processingInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): WebhookProcessor {
    if (!WebhookProcessor.instance) {
      WebhookProcessor.instance = new WebhookProcessor();
    }
    return WebhookProcessor.instance;
  }

  /**
   * Start the webhook processor with scheduled jobs
   */
  start(): void {
    if (this.processingInterval) {
      console.log('Webhook processor already running');
      return;
    }

    console.log('Starting webhook processor...');

    // Process pending deliveries every 30 seconds
    this.processingInterval = setInterval(async () => {
      try {
        await eventPublisher.processPendingDeliveries();
      } catch (error) {
        console.error('Error processing pending webhook deliveries:', error);
      }
    }, 30000);

    // Clean up old deliveries every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await eventPublisher.cleanupOldDeliveries();
      } catch (error) {
        console.error('Error cleaning up old webhook deliveries:', error);
      }
    }, 3600000);

    console.log('Webhook processor started');
  }

  /**
   * Stop the webhook processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log('Webhook processor stopped');
  }

  /**
   * Process a single batch of pending deliveries
   */
  async processBatch(batchSize: number = 50): Promise<void> {
    await eventPublisher.processPendingDeliveries(batchSize);
  }

  /**
   * Get processor status
   */
  getStatus(): {
    running: boolean;
    startTime?: Date;
    processedCount?: number;
  } {
    return {
      running: this.processingInterval !== null,
      // Additional status info could be added here
    };
  }

  /**
   * Process failed deliveries that are ready for retry
   */
  async processRetries(): Promise<void> {
    const supabase = await createServerSupabaseClient();
    
    const { data: retryDeliveries, error } = await supabase
      .from('webhook_deliveries')
      .select('id')
      .eq('status', 'pending')
      .not('next_retry_at', 'is', null)
      .lte('next_retry_at', new Date().toISOString())
      .limit(100);

    if (error) {
      console.error('Failed to get retry deliveries:', error);
      return;
    }

    if (!retryDeliveries || retryDeliveries.length === 0) {
      return;
    }

    console.log(`Processing ${retryDeliveries.length} retry deliveries`);

    const processingPromises = retryDeliveries.map(async (delivery) => {
      try {
        await eventPublisher.processDeliveryAsync(delivery.id);
      } catch (error) {
        console.error(`Failed to process retry delivery ${delivery.id}:`, error);
      }
    });

    await Promise.allSettled(processingPromises);
  }

  /**
   * Update endpoint statuses based on recent failures
   */
  async updateEndpointStatuses(): Promise<void> {
    const supabase = await createServerSupabaseClient();
    
    // Get endpoints with recent failures
    const { data: endpoints, error } = await supabase
      .from('webhook_endpoints')
      .select('id, failure_count, status')
      .neq('status', 'disabled');

    if (error) {
      console.error('Failed to get endpoints for status update:', error);
      return;
    }

    if (!endpoints || endpoints.length === 0) {
      return;
    }

    const updates = endpoints.map(async (endpoint) => {
      let newStatus = endpoint.status;
      
      // Mark as failing if more than 10 consecutive failures
      if (endpoint.failure_count >= 10 && endpoint.status !== 'failing') {
        newStatus = 'failing';
      }
      
      // Mark as active if no recent failures
      if (endpoint.failure_count === 0 && endpoint.status === 'failing') {
        newStatus = 'active';
      }

      if (newStatus !== endpoint.status) {
        await supabase
          .from('webhook_endpoints')
          .update({ status: newStatus })
          .eq('id', endpoint.id);
      }
    });

    await Promise.allSettled(updates);
  }

  /**
   * Generate health report for webhook system
   */
  async generateHealthReport(): Promise<{
    totalEndpoints: number;
    activeEndpoints: number;
    failingEndpoints: number;
    pendingDeliveries: number;
    recentSuccessRate: number;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const supabase = await createServerSupabaseClient();
    
    // Get endpoint counts
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('status');

    const totalEndpoints = endpoints?.length || 0;
    const activeEndpoints = endpoints?.filter(e => e.status === 'active').length || 0;
    const failingEndpoints = endpoints?.filter(e => e.status === 'failing').length || 0;

    // Get pending deliveries count
    const { count: pendingDeliveries } = await supabase
      .from('webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get recent success rate (last 24 hours)
    const { data: recentDeliveries } = await supabase
      .from('webhook_deliveries')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const totalRecent = recentDeliveries?.length || 0;
    const successfulRecent = recentDeliveries?.filter(d => d.status === 'success').length || 0;
    const recentSuccessRate = totalRecent > 0 ? (successfulRecent / totalRecent) * 100 : 100;

    // Determine system health
    let systemHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (failingEndpoints > totalEndpoints * 0.5 || recentSuccessRate < 50) {
      systemHealth = 'unhealthy';
    } else if (failingEndpoints > totalEndpoints * 0.2 || recentSuccessRate < 80) {
      systemHealth = 'degraded';
    }

    return {
      totalEndpoints,
      activeEndpoints,
      failingEndpoints,
      pendingDeliveries: pendingDeliveries || 0,
      recentSuccessRate,
      systemHealth,
    };
  }
}

// Initialize and start the processor if we're in a server environment
if (typeof window === 'undefined') {
  const processor = WebhookProcessor.getInstance();
  
  // Start processor in production or if explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_WEBHOOK_PROCESSOR === 'true') {
    processor.start();
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Shutting down webhook processor...');
      processor.stop();
    });
    
    process.on('SIGINT', () => {
      console.log('Shutting down webhook processor...');
      processor.stop();
    });
  }
}

export const webhookProcessor = WebhookProcessor.getInstance();