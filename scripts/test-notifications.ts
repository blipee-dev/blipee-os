#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestNotifications() {
  console.log('🧪 Creating test notifications...\n');

  try {
    // Get first organization and user
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1)
      .single();

    if (!org) {
      console.error('❌ No organization found');
      return;
    }

    const { data: orgUser } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', org.id)
      .limit(1)
      .single();

    if (!orgUser) {
      console.error('❌ No user found for organization');
      return;
    }

    console.log(`📊 Organization: ${org.name}`);
    console.log(`👤 User ID: ${orgUser.user_id}\n`);

    // Create test notifications with different priorities
    const testNotifications = [
      {
        type: 'high',
        title: 'High Energy Consumption Detected',
        finding: '⚡ Energy consumption increased by 25% from last month.\n\nInvestigate potential equipment malfunction or inefficient usage patterns.\n\n💰 Potential savings: $450.00',
        result: {
          type: 'energy_waste',
          priority: 'high',
          potential_savings: 450,
        },
      },
      {
        type: 'critical',
        title: 'Emission Hotspot Identified',
        finding: '🔥 Scope 3 emissions from transportation account for 42% of total emissions.\n\nConsider supplier optimization or alternative logistics.\n\n💰 Potential savings: $620.50\n🌱 Emission reduction potential: 125 kg CO2e',
        result: {
          type: 'emission_hotspot',
          priority: 'high',
          potential_savings: 620.5,
          emission_reduction: 125,
        },
      },
      {
        type: 'medium',
        title: 'Water Usage Above Average',
        finding: '💧 Current water usage is 18% above 5-month average.\n\nCheck for leaks or inefficient processes.\n\n💰 Potential savings: $85.00',
        result: {
          type: 'water_inefficiency',
          priority: 'medium',
          potential_savings: 85,
        },
      },
    ];

    for (const notif of testNotifications) {
      const { data, error } = await supabase
        .from('agent_task_results')
        .insert({
          organization_id: org.id,
          agent_id: 'test_agent',
          task_type: 'optimization_opportunity',
          task_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          priority: notif.result.priority,
          success: true,
          execution_time_ms: 100,
          result: {
            ...notif.result,
            user_id: orgUser.user_id,
            title: notif.title,
            message: notif.finding,
          },
          notification_importance: notif.type,
          notification_sent: false,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create ${notif.type} notification:`, error);
      } else {
        console.log(`✅ Created ${notif.type} notification: ${notif.title}`);
        console.log(`   Task ID: ${data.task_id}\n`);
      }
    }

    console.log('\n✅ Test notifications created!');
    console.log('\n📧 The notification queue will process them within 5 minutes.');
    console.log('💬 They will appear in the chat interface as proactive messages.\n');

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  }
}

createTestNotifications();
