#!/usr/bin/env tsx

/**
 * Test Railway Workers Integration
 *
 * Creates test jobs in Supabase to verify Railway workers
 * can process tasks from V2
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🧪 Testing Railway Workers Integration\n');

  // Test 1: Check if agent_task_queue table exists
  console.log('1️⃣ Checking agent_task_queue table...');
  const { data: tasks, error: tasksError } = await supabase
    .from('agent_task_queue')
    .select('*')
    .limit(1);

  if (tasksError) {
    console.error('❌ Error accessing agent_task_queue:', tasksError.message);
    return;
  }
  console.log('✅ agent_task_queue table exists\n');

  // Test 2: Check optimization_jobs table
  console.log('2️⃣ Checking optimization_jobs table...');
  const { data: jobs, error: jobsError } = await supabase
    .from('optimization_jobs')
    .select('*')
    .limit(1);

  if (jobsError) {
    console.error('❌ Error accessing optimization_jobs:', jobsError.message);
    console.log('   (This table might not exist yet - it\'s OK)\n');
  } else {
    console.log('✅ optimization_jobs table exists\n');
  }

  // Get a test organization ID
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single();

  if (!orgs) {
    console.error('❌ No organizations found. Cannot create test task.');
    return;
  }

  // Test 3: Create a test agent task
  console.log('3️⃣ Creating test agent task...');
  const testTask = {
    agent_id: 'carbon_hunter',
    organization_id: orgs.id,
    type: 'analysis',
    priority: 'medium',
    data: {
      test: true,
      source: 'v2',
      description: 'Test task from V2 to verify Railway worker integration',
      timestamp: new Date().toISOString()
    },
    status: 'pending',
  };

  const { data: newTask, error: createError } = await supabase
    .from('agent_task_queue')
    .insert(testTask)
    .select()
    .single();

  if (createError) {
    console.error('❌ Error creating task:', createError.message);
    return;
  }

  console.log(`✅ Task created with ID: ${newTask.id}`);
  console.log(`   Agent: ${newTask.agent_id}`);
  console.log(`   Organization: ${newTask.organization_id}`);
  console.log(`   Status: ${newTask.status}\n`);

  // Test 4: Monitor task status for 30 seconds
  console.log('4️⃣ Monitoring task status (30 seconds)...');
  console.log('   (Waiting for Railway worker to pick it up)\n');

  let processed = false;
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s

    const { data: updatedTask } = await supabase
      .from('agent_task_queue')
      .select('*')
      .eq('id', newTask.id)
      .single();

    if (updatedTask) {
      console.log(`   [${i * 5}s] Status: ${updatedTask.status}`);

      if (updatedTask.status !== 'pending') {
        processed = true;
        console.log(`\n🎉 Task processed by Railway worker!`);
        console.log(`   Final status: ${updatedTask.status}`);
        if (updatedTask.result) {
          console.log(`   Result:`, JSON.stringify(updatedTask.result, null, 2));
        }
        break;
      }
    }
  }

  if (!processed) {
    console.log('\n⏱️  Task still pending after 30s');
    console.log('   This might mean:');
    console.log('   - Railway worker is not running');
    console.log('   - Worker polling interval is longer than 30s');
    console.log('   - Worker is processing other tasks\n');
    console.log('   Check Railway logs to see worker activity');
  }

  // Test 5: Show recent agent activity
  console.log('\n5️⃣ Recent agent activity:');
  const { data: recentTasks } = await supabase
    .from('agent_task_queue')
    .select('id, agent_type, task_type, status, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentTasks && recentTasks.length > 0) {
    recentTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. ${task.agent_type} - ${task.task_type}`);
      console.log(`      Status: ${task.status}`);
      console.log(`      Created: ${new Date(task.created_at).toLocaleString()}`);
    });
  } else {
    console.log('   No recent tasks');
  }

  console.log('\n✅ Test complete!');
}

main().catch(console.error);
