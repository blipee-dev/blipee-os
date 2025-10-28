/**
 * Push Notification Send API
 *
 * POST /api/push/send
 * - Send push notification to one or more users
 * - Requires authentication
 * - Can be used by NotificationQueueService
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { sendPushToUser, sendPushToUsers, sendTestPush, type PushNotificationPayload } from '@/lib/push/send';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, userIds, payload, test } = body;

    // Test mode - send test notification
    if (test) {
      const success = await sendTestPush(user.id);
      return NextResponse.json({
        success,
        message: success ? 'Test notification sent' : 'Failed to send test notification'
      });
    }

    // Validate payload
    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Invalid payload. Title and body are required.' },
        { status: 400 }
      );
    }

    // Send to single user
    if (userId) {
      const result = await sendPushToUser(userId, payload as PushNotificationPayload);
      return NextResponse.json({
        success: result.success,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        errors: result.errors
      });
    }

    // Send to multiple users
    if (userIds && Array.isArray(userIds)) {
      const result = await sendPushToUsers(userIds, payload as PushNotificationPayload);
      return NextResponse.json({
        success: result.success,
        totalSent: result.totalSent,
        totalFailed: result.totalFailed,
        errors: result.errors
      });
    }

    return NextResponse.json(
      { error: 'Either userId or userIds must be provided' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Push] Error in send endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
