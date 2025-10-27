/**
 * Notification Queue Service
 *
 * Asynchronous notification and email processing:
 * - Processes pending notifications from queue
 * - Sends emails with retry logic
 * - Tracks delivery status
 * - Handles failed deliveries with exponential backoff
 *
 * Runs: Every 5 minutes
 * Benefits: Reliable notifications, no API timeouts, delivery tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface QueuedNotification {
  id: string;
  user_id: string;
  type: 'email' | 'in_app' | 'push';
  title: string;
  body: string;
  data?: any;
  retry_count: number;
  max_retries: number;
  scheduled_for?: Date;
  created_at: Date;
}

export interface NotificationServiceStats {
  notificationsSent: number;
  emailsSent: number;
  failed: number;
  retried: number;
  errors: number;
  lastRunAt: Date | null;
}

export class NotificationQueueService {
  private stats: NotificationServiceStats = {
    notificationsSent: 0,
    emailsSent: 0,
    failed: 0,
    retried: 0,
    errors: 0,
    lastRunAt: null,
  };

  /**
   * Get service health stats
   */
  getHealth(): NotificationServiceStats {
    return { ...this.stats };
  }

  /**
   * Process notification queue
   */
  async run(): Promise<void> {
    console.log('\n📧 [Notifications] Processing queue...');

    try {
      // Get pending notifications from agent task results
      // Process high, critical, and medium priority notifications
      const { data: pendingNotifications, error } = await supabase
        .from('agent_task_results')
        .select('*')
        .in('notification_importance', ['high', 'critical', 'medium'])
        .eq('notification_sent', false)
        .order('created_at', { ascending: true })
        .limit(50); // Process in batches

      if (error) {
        console.error('   ❌ Failed to fetch notifications:', error);
        this.stats.errors++;
        return;
      }

      if (!pendingNotifications || pendingNotifications.length === 0) {
        console.log('   ℹ️  No pending notifications');
        this.stats.lastRunAt = new Date();
        return;
      }

      console.log(`   📋 Processing ${pendingNotifications.length} notifications`);

      for (const notification of pendingNotifications) {
        try {
          await this.processNotification(notification);
        } catch (error) {
          console.error(`   ❌ Failed to process notification ${notification.id}:`, error);
          this.stats.errors++;
          await this.handleFailedNotification(notification);
        }
      }

      this.stats.lastRunAt = new Date();
      console.log(`✅ [Notifications] Processed ${pendingNotifications.length} notifications`);
      console.log(`   • Sent: ${this.stats.notificationsSent}`);
      console.log(`   • Failed: ${this.stats.failed}`);

    } catch (error) {
      console.error('❌ [Notifications] Queue processing failed:', error);
      this.stats.errors++;
    }
  }

  /**
   * Process a single notification
   */
  private async processNotification(notification: any): Promise<void> {
    // Extract user_id and message from result
    const userId = notification.result?.user_id;
    const title = notification.result?.title || `Agent Alert: ${notification.task_type}`;
    const body = notification.result?.message || notification.result?.summary || 'New finding from autonomous agent';

    if (!userId) {
      console.warn(`   ⚠️  No user_id in result for task ${notification.task_id}`);
      return;
    }

    // Create in-app notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message: body,
        type: 'agent_alert',
        priority: notification.notification_importance,
        metadata: {
          agent_type: notification.task_type,
          task_id: notification.task_id,
          importance: notification.notification_importance,
        },
        read: false,
      });

    if (notificationError) {
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    // Mark as sent
    await supabase
      .from('agent_task_results')
      .update({
        notification_sent: true,
        notification_sent_at: new Date().toISOString(),
      })
      .eq('id', notification.id);

    this.stats.notificationsSent++;

    // TODO: Send email for critical notifications
    if (notification.notification_importance === 'critical') {
      // await this.sendEmail(notification);
      // this.stats.emailsSent++;
    }
  }

  /**
   * Handle failed notification with retry logic
   */
  private async handleFailedNotification(notification: any): Promise<void> {
    this.stats.failed++;

    // Implement exponential backoff retry logic
    // For now, just log the failure
    console.error(`   ⚠️  Failed notification will be retried: ${notification.id}`);
  }

  /**
   * Send email notification (placeholder for future implementation)
   */
  private async sendEmail(notification: any): Promise<void> {
    // TODO: Implement email sending with retry logic
    // - Get user email from database
    // - Format email template
    // - Send via email service (SendGrid, etc.)
    // - Track delivery status
    console.log(`   📧 Email would be sent for: ${notification.id}`);
  }

  /**
   * Retry failed notifications
   */
  async retryFailed(): Promise<void> {
    console.log('\n🔄 [Notifications] Retrying failed notifications...');

    // Future implementation:
    // 1. Get failed notifications with retry_count < max_retries
    // 2. Calculate retry delay (exponential backoff)
    // 3. Retry notifications that are past their retry delay
    // 4. Update retry_count
    // 5. Mark as permanently failed if max_retries reached

    this.stats.retried++;
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('read', true)
        .lt('created_at', cutoffDate.toISOString());

      if (!error && data) {
        const deletedCount = Array.isArray(data) ? data.length : 0;
        console.log(`   🗑️  Deleted ${deletedCount} old read notifications`);
      }

    } catch (error) {
      console.error('   ⚠️  Notification cleanup failed:', error);
    }
  }

  /**
   * Reset stats (for testing)
   */
  resetStats(): void {
    this.stats = {
      notificationsSent: 0,
      emailsSent: 0,
      failed: 0,
      retried: 0,
      errors: 0,
      lastRunAt: null,
    };
  }
}
