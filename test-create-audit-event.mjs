import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjkyMjIsImV4cCI6MjA2NzQwNTIyMn0._w2Ofr8W1Oouka_pNbFbdkzDX9Rge_MoY5JQq3zcz6A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestAuditEvent() {
  try {
    // Create a test audit event
    const testEvent = {
      event: {
        actor: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          type: 'user',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin'
        },
        action: {
          type: 'login',
          category: 'auth',
          timestamp: new Date().toISOString()
        },
        resource: {
          type: 'session',
          id: 'session_' + Date.now(),
          name: 'User Session'
        },
        context: {
          organization_id: null,
          ip: '192.168.1.1',
          user_agent: 'Mozilla/5.0 Test Browser',
          session_id: 'session_' + Date.now(),
          correlation_id: crypto.randomUUID()
        },
        outcome: {
          status: 'success',
          message: 'User successfully logged in'
        },
        metadata: {
          severity: 'info',
          description: 'Test audit event for verification'
        }
      }
    };

    console.log('Creating test audit event...');
    
    const { data, error } = await supabase
      .from('audit_events')
      .insert([testEvent])
      .select();

    if (error) {
      console.error('Error creating audit event:', error);
    } else {
      console.log('✅ Test audit event created successfully!');
      console.log('Event ID:', data[0].id);
      console.log('Created at:', data[0].created_at);
    }

    // Now fetch recent events to verify
    const { data: events, error: fetchError } = await supabase
      .from('audit_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('Error fetching events:', fetchError);
    } else {
      console.log(`\n📋 Found ${events.length} recent audit events`);
      events.forEach(event => {
        console.log(`- ${event.created_at}: ${event.action_type} by ${event.actor_email || 'System'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestAuditEvent();