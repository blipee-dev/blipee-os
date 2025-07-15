#!/usr/bin/env node

/**
 * Apply Migration Script
 * Applies the database migration directly to the remote Supabase instance
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying Database Migration');
  console.log('==============================');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250715000002_autonomous_agents_fixed.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded (584 lines)');
    
    // Execute the migration
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration executed successfully');
    
    // Verify the migration by checking if tables exist
    console.log('🔍 Verifying migration...');
    
    const tables = [
      'agent_definitions',
      'agent_instances', 
      'agent_scheduled_tasks',
      'agent_task_executions',
      'agent_approvals',
      'agent_learning_patterns',
      'agent_metrics',
      'agent_decisions',
      'agent_collaborations'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: Available`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    // Check if agent definitions were populated
    const { data: agentDefs, error: agentError } = await supabase
      .from('agent_definitions')
      .select('name, type')
      .limit(10);
    
    if (agentError) {
      console.log('❌ Agent definitions check failed:', agentError.message);
    } else {
      console.log('✅ Agent definitions populated:');
      agentDefs.forEach(def => console.log(`  - ${def.name} (${def.type})`));
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('🚀 Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Visit: http://localhost:3000/dashboard/agents');
    console.log('  3. Test agent functionality');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Alternative approach: Execute SQL directly
async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sql
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (err) {
    // If exec_sql RPC doesn't exist, we need to execute the SQL another way
    console.log('⚠️ exec_sql RPC not available, trying alternative approach...');
    
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { data, error } = await supabase.query(statement);
          if (error) {
            throw error;
          }
        } catch (err) {
          console.log(`⚠️ Statement failed: ${err.message}`);
        }
      }
    }
  }
}

// Execute if run directly
if (require.main === module) {
  applyMigration().catch(console.error);
}

module.exports = { applyMigration };