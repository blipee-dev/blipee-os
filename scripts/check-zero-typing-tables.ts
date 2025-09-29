/**
 * Script to check Zero-Typing tables in Supabase
 * Uses service role key for admin access
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

console.log('🔍 Checking Zero-Typing tables in Supabase...');
console.log('URL:', supabaseUrl);
console.log('---');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTables() {
  const tables = [
    'card_definitions',
    'user_card_preferences',
    'card_interactions',
    'predicted_cards',
    'card_data_cache',
    'card_learning_patterns',
    'card_realtime_subscriptions',
    'card_templates'
  ];

  console.log('📊 Checking Zero-Typing tables:\n');

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Found (${count || 0} records)`);
        
        // Show sample data for card_definitions
        if (table === 'card_definitions' && data && data.length > 0) {
          console.log('   Sample:', {
            id: data[0].id,
            title: data[0].title,
            card_type: data[0].card_type,
            agent_id: data[0].agent_id
          });
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err}`);
    }
  }

  // Check card_definitions in detail
  console.log('\n📋 Card Definitions Details:\n');
  try {
    const { data: cards, error } = await supabase
      .from('card_definitions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.log('❌ Error fetching card definitions:', error.message);
    } else if (cards && cards.length > 0) {
      console.log(`Found ${cards.length} card definitions:\n`);
      cards.forEach(card => {
        console.log(`  • ${card.title} (${card.card_type})${card.agent_id ? ` - Agent: ${card.agent_id}` : ''}`);
      });
    } else {
      console.log('⚠️  No card definitions found. Running seed data...');
      await seedCardDefinitions();
    }
  } catch (err) {
    console.log('❌ Error:', err);
  }

  // Check if we need to seed data
  console.log('\n🌱 Checking seed data status...');
  const { count } = await supabase
    .from('card_definitions')
    .select('*', { count: 'exact', head: true });
  
  if (count === 0) {
    console.log('No data found. Would you like to seed the database?');
  } else {
    console.log(`✅ Database has ${count} card definitions`);
  }
}

async function seedCardDefinitions() {
  console.log('\n🌱 Seeding card definitions...');

  const agentCards = [
    {
      card_type: 'agent',
      agent_id: 'esg-chief',
      title: 'ESG Chief of Staff',
      description: 'Strategic sustainability overview',
      layout_config: { layout: 'hero', size: 'large', color: 'purple' },
      update_frequency: 'hourly'
    },
    {
      card_type: 'agent',
      agent_id: 'carbon-hunter',
      title: 'Carbon Hunter',
      description: 'Emissions tracking and reduction',
      layout_config: { layout: 'standard', size: 'medium', color: 'green' },
      update_frequency: 'realtime'
    },
    {
      card_type: 'agent',
      agent_id: 'compliance-guardian',
      title: 'Compliance Guardian',
      description: 'Regulatory compliance status',
      layout_config: { layout: 'standard', size: 'medium', color: 'blue' },
      update_frequency: 'daily'
    },
    {
      card_type: 'agent',
      agent_id: 'supply-chain',
      title: 'Supply Chain Investigator',
      description: 'Scope 3 emissions analysis',
      layout_config: { layout: 'standard', size: 'medium', color: 'orange' },
      update_frequency: 'daily'
    }
  ];

  const metricCards = [
    {
      card_type: 'metric',
      title: 'Total Emissions',
      description: 'Current total emissions across all scopes',
      layout_config: { layout: 'metric', size: 'small', showTrend: true },
      update_frequency: 'realtime'
    },
    {
      card_type: 'metric',
      title: 'Energy Usage',
      description: 'Current energy consumption',
      layout_config: { layout: 'metric', size: 'small', showTrend: true },
      update_frequency: 'realtime'
    },
    {
      card_type: 'alert',
      title: 'Active Alerts',
      description: 'Current system alerts and warnings',
      layout_config: { layout: 'alert', size: 'wide', priority: 'high' },
      update_frequency: 'realtime'
    },
    {
      card_type: 'chart',
      title: 'Emissions Trend',
      description: '30-day emissions trend chart',
      layout_config: { layout: 'chart', chartType: 'line', size: 'large' },
      update_frequency: 'hourly'
    }
  ];

  const allCards = [...agentCards, ...metricCards];

  for (const card of allCards) {
    const { error } = await supabase
      .from('card_definitions')
      .insert(card);
    
    if (error) {
      console.log(`❌ Failed to insert ${card.title}: ${error.message}`);
    } else {
      console.log(`✅ Inserted: ${card.title}`);
    }
  }
}

// Run the check
checkTables().then(() => {
  console.log('\n✅ Check complete!');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});