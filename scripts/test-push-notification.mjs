/**
 * Test Push Notification Script
 *
 * Sends a test push notification to verify the push system is working
 *
 * Usage:
 *   node scripts/test-push-notification.mjs [user-email]
 *
 * If no email is provided, it will use the first admin user or prompt for email.
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Prompt user for input
 */
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', email)
    .single();

  if (error) {
    console.error('❌ Error fetching user:', error.message);
    return null;
  }

  return data;
}

/**
 * Get first user with push subscription
 */
async function getFirstSubscribedUser() {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select(`
      user_id,
      profiles!inner(id, email, full_name)
    `)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data?.profiles;
}

/**
 * Check if user has push subscriptions
 */
async function checkSubscriptions(userId) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, is_active, created_at, device_info')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error checking subscriptions:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Send test push notification
 */
async function sendTestPush(userId) {
  try {
    const response = await fetch(`${appUrl}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        test: true,
        userId: userId,
        payload: {
          title: '🧪 Test Notification',
          body: 'This is a test push notification from Blipee. If you see this, push notifications are working!',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'test-notification',
          vibrate: [200, 100, 200, 100, 200],
          data: {
            url: '/mobile',
            test: true,
            timestamp: new Date().toISOString()
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Failed to send push: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🧪 Blipee Push Notification Test\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Get user email from args or prompt
  let userEmail = process.argv[2];
  let user;

  if (userEmail) {
    console.log(`📧 Looking up user: ${userEmail}`);
    user = await getUserByEmail(userEmail);

    if (!user) {
      console.error(`❌ User not found: ${userEmail}\n`);
      process.exit(1);
    }
  } else {
    console.log('🔍 Finding first subscribed user...');
    user = await getFirstSubscribedUser();

    if (!user) {
      console.log('\n⚠️  No users found with active push subscriptions.');
      console.log('\nTo test push notifications:');
      console.log('1. Open http://localhost:3000/mobile in a browser');
      console.log('2. Allow push notification permission');
      console.log('3. Run this script again\n');
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email}`);
    userEmail = user.email;
  }

  console.log('\n👤 User Details:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.full_name || 'N/A'}`);
  console.log(`   ID: ${user.id}`);

  // Check subscriptions
  console.log('\n📱 Checking push subscriptions...');
  const subscriptions = await checkSubscriptions(user.id);

  if (subscriptions.length === 0) {
    console.error('\n❌ No active push subscriptions found for this user');
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:3000/mobile');
    console.log(`2. Login as ${userEmail}`);
    console.log('3. Allow push notification permission');
    console.log('4. Run this script again\n');
    process.exit(1);
  }

  console.log(`✓ Found ${subscriptions.length} active subscription(s)`);
  subscriptions.forEach((sub, i) => {
    const device = sub.device_info || {};
    console.log(`\n   Subscription ${i + 1}:`);
    console.log(`   ├─ Platform: ${device.platform || 'Unknown'}`);
    console.log(`   ├─ Browser: ${device.userAgent?.split('/')[0] || 'Unknown'}`);
    console.log(`   └─ Created: ${new Date(sub.created_at).toLocaleString()}`);
  });

  // Confirm before sending
  console.log('\n═══════════════════════════════════════════════════');
  const confirm = await prompt('\n📤 Send test push notification? (y/n): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Test cancelled\n');
    process.exit(0);
  }

  // Send test push
  console.log('\n📤 Sending test push notification...');

  try {
    const result = await sendTestPush(user.id);

    console.log('\n✅ Push notification sent successfully!\n');
    console.log('📊 Results:');
    console.log(`   ├─ Sent: ${result.sentCount || 0}`);
    console.log(`   ├─ Failed: ${result.failedCount || 0}`);

    if (result.errors && result.errors.length > 0) {
      console.log('   └─ Errors:');
      result.errors.forEach(err => {
        console.log(`      └─ ${err}`);
      });
    }

    console.log('\n📱 Check your device for the test notification!');
    console.log('   (Should appear as: "🧪 Test Notification")\n');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Failed to send test push:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check VAPID keys in .env.local');
    console.error('   2. Verify push_subscriptions table has valid data');
    console.error('   3. Check browser console for errors');
    console.error('   4. Ensure service worker is registered\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
