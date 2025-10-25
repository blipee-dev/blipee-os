import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function testUpdate() {
  console.log('Testing direct update with service role...\n');

  const userId = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

  // First, verify the user exists
  const { data: user, error: selectError } = await supabase
    .from('app_users')
    .select('*')
    .eq('auth_user_id', userId)
    .single();

  if (selectError) {
    console.error('Select error:', selectError);
    return;
  }

  console.log('User found:', {
    id: user.id,
    name: user.name,
    status: user.status,
    last_login: user.last_login
  });

  // Now try to update
  console.log('\nAttempting update...');
  const { data: updatedUser, error: updateError } = await supabase
    .from('app_users')
    .update({
      last_login: new Date().toISOString()
    })
    .eq('auth_user_id', userId)
    .select();

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Update successful!', updatedUser);
  }
}

testUpdate();