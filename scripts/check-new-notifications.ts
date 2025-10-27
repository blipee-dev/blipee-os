import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('Checking new test notifications...\n');

  const { data, error } = await supabase
    .from('agent_task_results')
    .select('*')
    .gt('created_at', '2025-10-27 19:54:00')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} notifications:\n`);
  data?.forEach(n => {
    console.log(`• ${n.notification_importance.toUpperCase()}: ${n.result?.title}`);
    console.log(`  Sent: ${n.notification_sent} at ${n.notification_sent_at || 'N/A'}`);
    console.log(`  Created: ${n.created_at}\n`);
  });
}

check().then(() => process.exit(0));
