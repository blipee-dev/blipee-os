import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuditTable() {
  try {
    // First check if table exists
    const { data: tables, error: tablesError } = await supabase
      .from('audit_events')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.log('Table does not exist or error:', tablesError.message);
      console.log('\nTable needs to be created. Please run the migration through Supabase dashboard.');
      console.log('\nGo to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
      console.log('And paste the contents of: supabase/migrations/20250113_enterprise_audit_events.sql');
    } else {
      console.log('✅ audit_events table exists!');
      
      // Try to fetch some recent events
      const { data: events, error: eventsError } = await supabase
        .from('audit_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (eventsError) {
        console.log('Error fetching events:', eventsError);
      } else {
        console.log(`\nFound ${events?.length || 0} audit events`);
        if (events && events.length > 0) {
          console.log('\nRecent events:');
          events.forEach(event => {
            console.log(`- ${event.created_at}: ${event.action_type} by ${event.actor_email}`);
          });
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuditTable();