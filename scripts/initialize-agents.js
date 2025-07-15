#!/usr/bin/env node

/**
 * Agent Initialization Script
 * Creates agent instances for existing organizations
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeAgents() {
  console.log('🚀 Initializing Autonomous Agents');
  console.log('==================================');
  
  try {
    // Get all organizations
    console.log('📋 Fetching organizations...');
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(10);
    
    if (orgError) {
      console.error('❌ Error fetching organizations:', orgError);
      return;
    }
    
    console.log(`✅ Found ${organizations.length} organizations`);
    
    // Get agent definitions
    console.log('🤖 Fetching agent definitions...');
    const { data: agentDefs, error: agentError } = await supabase
      .from('agent_definitions')
      .select('id, name, type, default_autonomy_level, configuration');
    
    if (agentError) {
      console.error('❌ Error fetching agent definitions:', agentError);
      return;
    }
    
    console.log(`✅ Found ${agentDefs.length} agent definitions:`);
    agentDefs.forEach(def => console.log(`  - ${def.name} (${def.type})`));
    
    // Initialize agents for each organization
    console.log('\n🔄 Initializing agents for organizations...');
    
    for (const org of organizations) {
      console.log(`\n📊 Processing organization: ${org.name}`);
      
      // Check existing agents
      const { data: existingAgents, error: existingError } = await supabase
        .from('agent_instances')
        .select('id, agent_definition_id, name, status')
        .eq('organization_id', org.id);
      
      if (existingError) {
        console.error(`❌ Error checking existing agents for ${org.name}:`, existingError);
        continue;
      }
      
      console.log(`  📈 Found ${existingAgents.length} existing agents`);
      
      // Create missing agents
      const existingDefIds = existingAgents.map(a => a.agent_definition_id);
      const missingDefs = agentDefs.filter(def => !existingDefIds.includes(def.id));
      
      if (missingDefs.length === 0) {
        console.log(`  ✅ All agents already exist for ${org.name}`);
        continue;
      }
      
      console.log(`  🔧 Creating ${missingDefs.length} missing agents...`);
      
      for (const def of missingDefs) {
        const agentData = {
          organization_id: org.id,
          agent_definition_id: def.id,
          name: def.name,
          status: 'stopped',
          autonomy_level: def.default_autonomy_level,
          configuration: def.configuration,
          health_score: 1.0
        };
        
        const { data: newAgent, error: createError } = await supabase
          .from('agent_instances')
          .insert(agentData)
          .select()
          .single();
        
        if (createError) {
          console.error(`    ❌ Error creating ${def.name}:`, createError);
        } else {
          console.log(`    ✅ Created ${def.name} (ID: ${newAgent.id})`);
        }
      }
    }
    
    // Final summary
    console.log('\n📊 Agent Initialization Summary');
    console.log('===============================');
    
    const { data: allAgents, error: summaryError } = await supabase
      .from('agent_instances')
      .select(`
        id,
        name,
        status,
        autonomy_level,
        health_score,
        organization:organizations(name),
        agent_definition:agent_definitions(type)
      `);
    
    if (summaryError) {
      console.error('❌ Error fetching summary:', summaryError);
      return;
    }
    
    console.log(`✅ Total agents in system: ${allAgents.length}`);
    console.log('\n🎯 Agent Distribution:');
    
    const agentsByType = {};
    allAgents.forEach(agent => {
      const type = agent.agent_definition.type;
      if (!agentsByType[type]) {
        agentsByType[type] = [];
      }
      agentsByType[type].push(agent);
    });
    
    Object.keys(agentsByType).forEach(type => {
      console.log(`  ${type}: ${agentsByType[type].length} instances`);
    });
    
    console.log('\n📈 Agent Status:');
    const statusCount = {};
    allAgents.forEach(agent => {
      statusCount[agent.status] = (statusCount[agent.status] || 0) + 1;
    });
    
    Object.keys(statusCount).forEach(status => {
      console.log(`  ${status}: ${statusCount[status]} agents`);
    });
    
    console.log('\n🏆 Agent Health Summary:');
    const avgHealth = allAgents.reduce((sum, agent) => sum + agent.health_score, 0) / allAgents.length;
    console.log(`  Average health score: ${avgHealth.toFixed(2)}`);
    console.log(`  Agents with perfect health: ${allAgents.filter(a => a.health_score === 1.0).length}`);
    
    console.log('\n🎉 Agent initialization completed successfully!');
    console.log('🚀 Agents are ready for activation!');
    console.log('\n📋 Next steps:');
    console.log('  1. Start development server: npm run dev');
    console.log('  2. Visit: http://localhost:3001/dashboard/agents');
    console.log('  3. Sign in and activate agents');
    console.log('  4. Test agent functionality');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  initializeAgents().catch(console.error);
}

module.exports = { initializeAgents };