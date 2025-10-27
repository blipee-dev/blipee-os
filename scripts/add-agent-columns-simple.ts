/**
 * Simple script to add agent columns to messages table
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addColumns() {
  console.log('\n🗄️  Adding agent columns to messages table...\n');

  // First, check current table structure
  console.log('📋 Checking current messages table structure...');

  const { data: existingMessages, error: checkError } = await supabase
    .from('messages')
    .select('*')
    .limit(1);

  if (checkError) {
    console.error('❌ Error checking table:', checkError);
    process.exit(1);
  }

  console.log('Current table columns:', existingMessages && existingMessages[0] ? Object.keys(existingMessages[0]) : 'No data');

  console.log('\n📝 Please run the following SQL in the Supabase SQL Editor:');
  console.log('\n' + '='.repeat(70));
  console.log(`
-- Add agent support to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS agent_id TEXT;

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('info', 'alert', 'critical'));

-- Update role constraint
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_role_check;

ALTER TABLE public.messages
ADD CONSTRAINT messages_role_check
CHECK (role IN ('user', 'assistant', 'system', 'agent'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_messages_agent
ON public.messages(agent_id)
WHERE agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_priority
ON public.messages(priority)
WHERE priority IS NOT NULL;
  `.trim());
  console.log('='.repeat(70));

  console.log('\n📍 Go to: https://supabase.com/dashboard/project/xswdrlgvcfnnqkufkhhw/sql/new');
  console.log('\nAfter running the SQL, press Ctrl+C to exit.\n');
}

addColumns()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
