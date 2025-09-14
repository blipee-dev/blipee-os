import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAuditEvents() {
  try {
    // Create multiple test audit events
    const testEvents = [
      {
        event: {
          actor: {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            type: 'user',
            email: 'admin@blipee.com',
            name: 'Admin User',
            role: 'account_owner'
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
            user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            session_id: 'session_' + Date.now(),
            correlation_id: crypto.randomUUID()
          },
          outcome: {
            status: 'success',
            message: 'User successfully logged in'
          },
          metadata: {
            severity: 'info',
            description: 'Successful authentication'
          }
        }
      },
      {
        event: {
          actor: {
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            type: 'user',
            email: 'john.doe@example.com',
            name: 'John Doe',
            role: 'admin'
          },
          action: {
            type: 'create',
            category: 'data',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          resource: {
            type: 'organization',
            id: 'org_123',
            name: 'Acme Corporation'
          },
          context: {
            organization_id: '550e8400-e29b-41d4-a716-446655440000',
            ip: '10.0.0.1',
            user_agent: 'Mozilla/5.0 Chrome/120.0.0.0',
            session_id: 'session_xyz',
            correlation_id: crypto.randomUUID()
          },
          outcome: {
            status: 'success'
          },
          changes: {
            after: {
              name: 'Acme Corporation',
              industry: 'Technology',
              employees: 500
            }
          },
          metadata: {
            severity: 'info',
            description: 'New organization created'
          }
        }
      },
      {
        event: {
          actor: {
            id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
            type: 'user',
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
            role: 'viewer'
          },
          action: {
            type: 'login_failed',
            category: 'auth',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          },
          resource: {
            type: 'authentication',
            id: 'auth_attempt_456'
          },
          context: {
            ip: '203.0.113.0',
            user_agent: 'Mozilla/5.0 Firefox/120.0',
            correlation_id: crypto.randomUUID()
          },
          outcome: {
            status: 'failure',
            error: 'Invalid password'
          },
          metadata: {
            severity: 'warning',
            description: 'Failed login attempt - invalid credentials'
          }
        }
      },
      {
        event: {
          actor: {
            id: 'system',
            type: 'system',
            name: 'System'
          },
          action: {
            type: 'backup_created',
            category: 'system',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          },
          resource: {
            type: 'backup',
            id: 'backup_789',
            name: 'Daily Backup'
          },
          context: {
            correlation_id: crypto.randomUUID()
          },
          outcome: {
            status: 'success',
            message: 'Backup completed successfully'
          },
          metadata: {
            severity: 'info',
            description: 'Scheduled daily backup completed',
            backup_size: '2.5GB',
            duration_ms: 45000
          }
        }
      },
      {
        event: {
          actor: {
            id: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
            type: 'user',
            email: 'security@blipee.com',
            name: 'Security Admin',
            role: 'security_admin'
          },
          action: {
            type: 'suspicious_activity',
            category: 'security',
            timestamp: new Date(Date.now() - 1800000).toISOString()
          },
          resource: {
            type: 'user_account',
            id: 'user_suspicious',
            name: 'suspicious.user@example.com'
          },
          context: {
            organization_id: '550e8400-e29b-41d4-a716-446655440000',
            ip: '198.51.100.0',
            user_agent: 'curl/7.68.0',
            correlation_id: crypto.randomUUID()
          },
          outcome: {
            status: 'failure',
            error: 'Multiple failed login attempts detected'
          },
          metadata: {
            severity: 'critical',
            description: 'Potential brute force attack detected',
            failed_attempts: 15,
            time_window: '5 minutes',
            tags: ['security', 'alert', 'investigation-required']
          }
        }
      }
    ];

    console.log('Creating test audit events...');
    
    for (const event of testEvents) {
      const { data, error } = await supabase
        .from('audit_events')
        .insert([event])
        .select();

      if (error) {
        console.error('Error creating event:', error.message);
      } else {
        console.log(`✅ Created: ${event.event.action.type} by ${event.event.actor.email || 'System'}`);
      }
    }

    // Now fetch recent events to verify
    const { data: events, error: fetchError } = await supabase
      .from('audit_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching events:', fetchError);
    } else {
      console.log(`\n📋 Found ${events.length} recent audit events:`);
      events.forEach(event => {
        const severity = event.event?.metadata?.severity || 'info';
        const severityEmoji = {
          info: '🔵',
          warning: '🟡',
          error: '🔴',
          critical: '🔴'
        }[severity];
        
        console.log(`${severityEmoji} ${event.created_at}: ${event.action_type} by ${event.actor_email || 'System'} - ${event.outcome_status}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestAuditEvents();