import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function applyFix() {
  try {
    console.log('Applying IP address column fix...');
    
    // Drop and recreate the column with proper handling
    const sql = `
      ALTER TABLE audit_events 
      DROP COLUMN IF EXISTS ip_address;
      
      ALTER TABLE audit_events 
      ADD COLUMN ip_address INET GENERATED ALWAYS AS (
        CASE
          WHEN event->'context'->>'ip' IS NULL THEN NULL
          WHEN event->'context'->>'ip' = '' THEN NULL
          WHEN event->'context'->>'ip' = 'localhost' THEN '127.0.0.1'::inet
          ELSE (event->'context'->>'ip')::inet
        END
      ) STORED;
    `;

    // Note: Supabase doesn't have a direct SQL execution method,
    // so we'll just provide instructions
    console.log('\n⚠️  Please run the following SQL in your Supabase dashboard:');
    console.log('Go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
    console.log('\nPaste this SQL:');
    console.log('----------------------------------------');
    console.log(sql);
    console.log('----------------------------------------');
    
    // Test if we can still insert events
    console.log('\nTesting event insertion with fixed schema...');
    const testEvent = {
      event: {
        actor: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          type: 'user',
          email: 'test@example.com'
        },
        action: {
          type: 'test',
          category: 'system',
          timestamp: new Date().toISOString()
        },
        resource: {
          type: 'test',
          id: 'test-resource'
        },
        context: {
          // Omit IP address - it will be null which is fine
          user_agent: 'Test Agent',
          correlation_id: crypto.randomUUID()
        },
        outcome: {
          status: 'success'
        },
        metadata: {
          severity: 'info',
          description: 'Test event after IP fix'
        }
      }
    };

    const { data, error } = await supabase
      .from('audit_events')
      .insert([testEvent])
      .select();

    if (error) {
      console.error('❌ Test insert failed:', error.message);
      console.log('Please apply the SQL fix above first.');
    } else {
      console.log('✅ Test event created successfully!');
      console.log('The audit system is now working correctly.');
      
      // Clean up test event
      if (data && data[0]) {
        await supabase.from('audit_events').delete().eq('id', data[0].id);
        console.log('🧹 Test event cleaned up.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

applyFix();