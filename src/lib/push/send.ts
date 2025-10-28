/**
 * Push Notification Sending Utility
 *
 * Handles sending web push notifications to subscribed users
 * Supports both iOS and Android devices
 */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:noreply@blipee.io';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: {
    url?: string;
    conversationId?: string;
    agentId?: string;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  vibrate?: number[];
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(userId: string, payload: PushNotificationPayload): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let sentCount = 0;
  let failedCount = 0;

  try {
    // Get all active subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('[Push] Error fetching subscriptions:', error);
      return { success: false, sentCount: 0, failedCount: 0, errors: [error.message] };
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push] No active subscriptions found for user:', userId);
      return { success: true, sentCount: 0, failedCount: 0, errors: [] };
    }

    console.log(`[Push] Sending to ${subscriptions.length} subscription(s) for user ${userId}`);

    // Send to all subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify(payload),
          {
            TTL: 86400, // 24 hours
            urgency: 'high'
          }
        );

        // Update last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);

        sentCount++;
        console.log('[Push] ✅ Sent successfully to subscription:', sub.id);
      } catch (error: any) {
        failedCount++;
        const errorMsg = error.message || 'Unknown error';
        errors.push(`Subscription ${sub.id}: ${errorMsg}`);
        console.error(`[Push] ❌ Failed to send to subscription ${sub.id}:`, error);

        // If subscription is no longer valid (410 Gone or 404 Not Found), mark as inactive
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('[Push] Marking subscription as inactive:', sub.id);
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id);
        }
      }
    });

    await Promise.all(sendPromises);

    console.log(`[Push] Results: ${sentCount} sent, ${failedCount} failed`);

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      errors
    };
  } catch (error: any) {
    console.error('[Push] Error in sendPushToUser:', error);
    return {
      success: false,
      sentCount,
      failedCount,
      errors: [error.message || 'Unknown error']
    };
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(userIds: string[], payload: PushNotificationPayload): Promise<{
  success: boolean;
  totalSent: number;
  totalFailed: number;
  errors: string[];
}> {
  const results = await Promise.all(
    userIds.map(userId => sendPushToUser(userId, payload))
  );

  return {
    success: results.some(r => r.success),
    totalSent: results.reduce((sum, r) => sum + r.sentCount, 0),
    totalFailed: results.reduce((sum, r) => sum + r.failedCount, 0),
    errors: results.flatMap(r => r.errors)
  };
}

/**
 * Test push notification (for debugging)
 */
export async function sendTestPush(userId: string): Promise<boolean> {
  const payload: PushNotificationPayload = {
    title: 'Test Notification from Blipee',
    body: 'If you can see this, push notifications are working! 🎉',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'test-notification',
    data: {
      url: '/mobile'
    },
    vibrate: [200, 100, 200],
    requireInteraction: false
  };

  const result = await sendPushToUser(userId, payload);
  return result.success;
}
