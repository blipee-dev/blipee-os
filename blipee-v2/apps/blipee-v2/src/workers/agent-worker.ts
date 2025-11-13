#!/usr/bin/env tsx

/**
 * Blipee AI Agent Worker - V2 Simplified
 *
 * Background worker que processa tasks dos 8 agentes autónomos
 * Serve tanto V1 como V2 (partilham o mesmo Supabase)
 *
 * Deploy: Railway (24/7)
 * Port: 8080
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import http from 'http';
import { createClient } from '@supabase/supabase-js';
import { initializeAutonomousAgents, getAIWorkforceStatus } from '../lib/ai/autonomous-agents';

// Load env before imports
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Environment loaded from .env.local');
}

const PORT = process.env.PORT || 8080;
const POLL_INTERVAL = 60 * 1000; // 1 minute
const HEALTH_CHECK_INTERVAL = 30 * 1000; // 30 seconds

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Worker stats
const stats = {
  startTime: new Date(),
  tasksProcessed: 0,
  tasksFailed: 0,
  agentsInitialized: false,
  lastPollAt: null as Date | null,
  lastHealthCheckAt: null as Date | null,
};

let workforce: any = null;

/**
 * Health check server
 */
function startHealthServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        uptime: Math.floor((Date.now() - stats.startTime.getTime()) / 1000),
        stats: {
          ...stats,
          lastPollAt: stats.lastPollAt?.toISOString(),
          lastHealthCheckAt: stats.lastHealthCheckAt?.toISOString(),
        },
        timestamp: new Date().toISOString(),
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, () => {
    console.log(`🏥 Health server on port ${PORT}`);
    console.log(`   GET /health`);
  });

  return server;
}

/**
 * Poll agent_task_queue for pending tasks
 */
async function pollTaskQueue() {
  try {
    stats.lastPollAt = new Date();

    // Get pending tasks (oldest first)
    const { data: tasks, error } = await supabase
      .from('agent_task_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching tasks:', error.message);
      return;
    }

    if (!tasks || tasks.length === 0) {
      return; // No tasks
    }

    console.log(`\n📋 Found ${tasks.length} pending tasks`);

    for (const task of tasks) {
      await processTask(task);
    }

  } catch (error) {
    console.error('❌ Poll error:', error);
    stats.tasksFailed++;
  }
}

/**
 * Process a single task
 */
async function processTask(task: any) {
  console.log(`\n⚙️  Processing task ${task.id}`);
  console.log(`   Agent: ${task.agent_id}`);
  console.log(`   Type: ${task.type}`);
  console.log(`   Org: ${task.organization_id}`);

  try {
    // Mark as processing
    await supabase
      .from('agent_task_queue')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    // Execute task based on agent type
    const result = await executeAgentTask(task);

    // Mark as completed
    await supabase
      .from('agent_task_queue')
      .update({
        status: 'completed',
        result: result,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    stats.tasksProcessed++;
    console.log(`✅ Task ${task.id} completed`);

  } catch (error: any) {
    console.error(`❌ Task ${task.id} failed:`, error.message);

    // Mark as failed
    await supabase
      .from('agent_task_queue')
      .update({
        status: 'failed',
        result: { error: error.message },
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    stats.tasksFailed++;
  }
}

/**
 * Execute task by agent type
 */
async function executeAgentTask(task: any): Promise<any> {
  const { agent_id, type, data, organization_id } = task;

  // Log execution
  console.log(`   Executing ${agent_id}.${type}...`);

  // For now, return mock result
  // TODO: Integrate with actual agent logic
  return {
    success: true,
    agent: agent_id,
    type: type,
    organization_id: organization_id,
    message: `Task processed by ${agent_id}`,
    data: data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Main worker loop
 */
async function startWorker() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Blipee AI Agent Worker                           ║');
  console.log('║  Serves V1 + V2 (Shared Supabase)                 ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log(`🚀 Starting Agent Worker...`);
  console.log(`📅 ${new Date().toISOString()}\n`);

  // Start health server
  startHealthServer();

  // Initialize agents
  try {
    console.log('👥 Initializing 8 autonomous agents...');
    workforce = await initializeAutonomousAgents();
    stats.agentsInitialized = true;
    console.log('✅ Agents initialized\n');

    const status = await getAIWorkforceStatus();
    console.log(`📊 Workforce: ${status.employeeCount}/8 active`);
    console.log(`   Health: ${status.systemHealth}\n`);
  } catch (error: any) {
    console.error('⚠️  Agent initialization warning:', error.message);
    console.log('   Continuing without agents (will process tasks anyway)\n');
  }

  // Poll for tasks every minute
  setInterval(async () => {
    await pollTaskQueue();
  }, POLL_INTERVAL);

  // Health check every 30s
  setInterval(() => {
    stats.lastHealthCheckAt = new Date();
  }, HEALTH_CHECK_INTERVAL);

  // Initial poll
  await pollTaskQueue();

  console.log('✅ Worker running');
  console.log(`   Polling every ${POLL_INTERVAL / 1000}s`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
  console.log('🔄 Waiting for tasks...\n');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM - Shutting down...');
  console.log(`📊 Final: ${stats.tasksProcessed} processed, ${stats.tasksFailed} failed`);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT - Shutting down...');
  console.log(`📊 Final: ${stats.tasksProcessed} processed, ${stats.tasksFailed} failed`);
  process.exit(0);
});

// Start
startWorker().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
