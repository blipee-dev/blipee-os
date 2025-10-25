import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function applyFix() {
  try {
    console.log('Applying audit events actor_id fix...');

    // The SQL to fix the actor_id column
    const sql = `
      -- Drop the existing actor_id column and recreate with proper null handling
      ALTER TABLE audit_events DROP COLUMN IF EXISTS actor_id;

      -- Recreate actor_id column with proper null handling
      ALTER TABLE audit_events ADD COLUMN actor_id UUID GENERATED ALWAYS AS (
        CASE
          WHEN event->'actor'->>'id' IS NULL THEN NULL
          WHEN event->'actor'->>'id' = '' THEN NULL
          -- Only try to cast to UUID if it's a valid UUID format
          WHEN event->'actor'->>'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN (event->'actor'->>'id')::uuid
          ELSE NULL
        END
      ) STORED;

      -- Recreate the index for actor queries
      DROP INDEX IF EXISTS idx_audit_events_actor;
      CREATE INDEX idx_audit_events_actor ON audit_events(actor_id, created_at DESC)
        WHERE actor_id IS NOT NULL;
    `;

    console.log('\n⚠️  Please run the following SQL in your Supabase dashboard:');
    console.log('Go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
    console.log('\nPaste this SQL:');
    console.log('----------------------------------------');
    console.log(sql);
    console.log('----------------------------------------');

    // Test if we can insert events with the client-side fix
    console.log('\nTesting event insertion with null actor_id...');
    const testEvent = {
      event: {
        actor: {
          id: null, // Use null instead of 'anonymous'
          type: 'anonymous',
          email: null
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
          user_agent: 'Test Agent',
          correlation_id: crypto.randomUUID()
        },
        outcome: {
          status: 'success'
        },
        metadata: {
          severity: 'info',
          description: 'Test event with null actor_id'
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
      console.log('The audit system now handles anonymous users correctly.');

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