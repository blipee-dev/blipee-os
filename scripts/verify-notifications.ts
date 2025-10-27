/**
 * Verify Notifications Script
 *
 * Checks both notifications and messages tables to verify
 * the dual notification system is working correctly.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyNotifications() {
  console.log('\n🔍 Verifying notification system...\n');

  // Check notifications table
  console.log('📋 Checking notifications table:');
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, type, priority, read, created_at')
    .gt('created_at', '2025-10-27 19:40:00')
    .order('created_at', { ascending: false });

  if (notifError) {
    console.error('❌ Error fetching notifications:', notifError);
  } else if (!notifications || notifications.length === 0) {
    console.log('   ⚠️  No notifications found');
  } else {
    console.log(`   ✅ Found ${notifications.length} notification(s):\n`);
    notifications.forEach((n: any) => {
      console.log(`   • [${n.priority}] ${n.title}`);
      console.log(`     Message: ${n.message.substring(0, 80)}...`);
      console.log(`     Type: ${n.type} | Read: ${n.read} | Created: ${n.created_at}\n`);
    });
  }

  // Check messages table for agent chat messages
  console.log('\n💬 Checking messages table for agent chat messages:');
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content, agent_id, priority, created_at')
    .eq('role', 'agent')
    .gt('created_at', '2025-10-27 19:40:00')
    .order('created_at', { ascending: false });

  if (msgError) {
    console.error('❌ Error fetching messages:', msgError);
  } else if (!messages || messages.length === 0) {
    console.log('   ⚠️  No agent chat messages found');
  } else {
    console.log(`   ✅ Found ${messages.length} chat message(s):\n`);
    messages.forEach((m: any) => {
      console.log(`   • Agent: ${m.agent_id} | Priority: ${m.priority}`);
      console.log(`     Content: ${m.content.substring(0, 100)}...`);
      console.log(`     Conversation: ${m.conversation_id} | Created: ${m.created_at}\n`);
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`   Notification table entries: ${notifications?.length || 0}`);
  console.log(`   Chat messages created: ${messages?.length || 0}`);
  console.log('='.repeat(60));

  if ((notifications?.length || 0) > 0 && (messages?.length || 0) > 0) {
    console.log('\n✅ Dual notification system is working!');
  } else if ((notifications?.length || 0) > 0) {
    console.log('\n⚠️  Notifications created but no chat messages found');
  } else {
    console.log('\n❌ No notifications or messages found - system may not have processed yet');
  }
}

verifyNotifications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
