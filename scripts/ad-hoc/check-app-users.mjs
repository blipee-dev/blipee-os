import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function checkTable() {
  try {
    console.log('Checking app_users table structure...\n');

    // Try a simple select to see what columns exist
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error querying app_users:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Available columns in app_users:');
      console.log(Object.keys(data[0]));
    } else {
      console.log('No data in app_users table, creating test record...');

      // Try to insert a test record to see what columns are required
      const { data: testData, error: insertError } = await supabase
        .from('app_users')
        .insert({
          auth_user_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Test User',
          email: 'test@example.com',
          role: 'viewer',
          status: 'active',
          last_login: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        console.log('Test record created. Columns:', Object.keys(testData[0]));

        // Clean up
        await supabase.from('app_users').delete().eq('auth_user_id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
      }
    }

    // Test if we can update without issues
    console.log('\nTesting update operation...');
    const { error: updateError } = await supabase
      .from('app_users')
      .update({ last_login: new Date().toISOString() })
      .eq('auth_user_id', 'test-user-id');

    if (updateError) {
      console.log('Update test result:', updateError.message);
    } else {
      console.log('Update test successful (no matching rows is ok)');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTable();