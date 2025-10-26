#!/usr/bin/env tsx

/**
 * AI Agent Orchestrator - Background Service
 *
 * Autonomous background service that runs AI prompt optimization cycles.
 * Completely independent from the Next.js app - runs as a separate process.
 *
 * Features:
 * - Autonomous job scheduling and execution
 * - Database-backed state persistence
 * - Automatic recovery and retry logic
 * - Health monitoring and heartbeat
 * - Process lifecycle management
 *
 * Usage:
 *   npm run agent:start    - Start the service
 *   npm run agent:stop     - Stop the service
 *   npm run agent:status   - Check service status
 *   npm run agent:logs     - View service logs
 */

import { createClient } from '@supabase/supabase-js';
import os from 'os';
import http from 'http';
import { nanoid } from 'nanoid';
import {
  analyzeConversationPatterns,
  savePatternInsights,
} from '../src/lib/ai/analytics/pattern-analyzer';
import {
  generateABTestVariants,
  savePromptVariant,
} from '../src/lib/ai/analytics/prompt-variant-generator';
import {
  setupQuickExperiment,
  getActiveExperiments,
  getExperimentResults,
  completeExperiment,
} from '../src/lib/ai/analytics/ab-testing';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const POLL_INTERVAL_MS = parseInt(process.env.AGENT_POLL_INTERVAL_MS || '60000'); // 1 minute
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.AGENT_HEARTBEAT_INTERVAL_MS || '30000'); // 30 seconds
const PORT = parseInt(process.env.PORT || '8080'); // Health check port

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Service state
const SERVICE_NAME = 'ai-agent-orchestrator';
const INSTANCE_ID = nanoid();
let isRunning = false;
let pollInterval: NodeJS.Timeout | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;
let serviceStateId: string | null = null;
let jobsCompleted = 0;
let jobsFailed = 0;
const startTime = Date.now();

// Logger
class Logger {
  static async log(level: 'debug' | 'info' | 'warn' | 'error', message: string, details?: any, jobId?: string) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Console output
    console.log(formattedMessage, details || '');

    // Save to database if job ID provided
    if (jobId) {
      await supabase.from('ai_agent_execution_logs').insert({
        job_id: jobId,
        level,
        message,
        details: details || null,
      });
    }
  }

  static debug(message: string, details?: any, jobId?: string) {
    return this.log('debug', message, details, jobId);
  }

  static info(message: string, details?: any, jobId?: string) {
    return this.log('info', message, details, jobId);
  }

  static warn(message: string, details?: any, jobId?: string) {
    return this.log('warn', message, details, jobId);
  }

  static error(message: string, details?: any, jobId?: string) {
    return this.log('error', message, details, jobId);
  }
}

/**
 * Register service in database
 */
async function registerService(): Promise<void> {
  Logger.info('Registering service instance...');

  const { data, error } = await supabase
    .from('ai_agent_service_state')
    .insert({
      service_name: SERVICE_NAME,
      instance_id: INSTANCE_ID,
      pid: process.pid,
      hostname: os.hostname(),
      status: 'starting',
      last_heartbeat: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    Logger.error('Failed to register service', error);
    throw error;
  }

  serviceStateId = data.id;
  Logger.info(`Service registered with ID: ${serviceStateId}`);
}

/**
 * Update service status
 */
async function updateServiceStatus(status: 'running' | 'stopping' | 'stopped' | 'error', errorMessage?: string): Promise<void> {
  if (!serviceStateId) return;

  const updates: any = {
    status,
    jobs_completed: jobsCompleted,
    jobs_failed: jobsFailed,
    uptime_ms: Date.now() - startTime,
  };

  if (status === 'stopped' || status === 'error') {
    updates.stopped_at = new Date().toISOString();
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  await supabase
    .from('ai_agent_service_state')
    .update(updates)
    .eq('id', serviceStateId);
}

/**
 * Send heartbeat
 */
async function sendHeartbeat(): Promise<void> {
  if (!serviceStateId) return;

  await supabase
    .from('ai_agent_service_state')
    .update({
      last_heartbeat: new Date().toISOString(),
      jobs_completed: jobsCompleted,
      jobs_failed: jobsFailed,
      uptime_ms: Date.now() - startTime,
    })
    .eq('id', serviceStateId);
}

/**
 * Execute pattern analysis job
 */
async function executePatternAnalysis(jobId: string, config: any): Promise<any> {
  await Logger.info('Starting pattern analysis...', { config }, jobId);

  const daysToAnalyze = config.daysToAnalyze || 7;
  const analysis = await analyzeConversationPatterns(daysToAnalyze);

  await Logger.info('Pattern analysis complete', {
    patternsFound: analysis.patterns.length,
    totalConversations: analysis.overallMetrics.totalConversations,
  }, jobId);

  // Save patterns to database
  await savePatternInsights(analysis.patterns);

  return {
    patternsFound: analysis.patterns.length,
    metrics: analysis.overallMetrics,
    patterns: analysis.patterns.map(p => ({
      type: p.type,
      frequency: p.frequency,
      confidence: p.confidenceScore,
    })),
  };
}

/**
 * Execute variant generation job
 */
async function executeVariantGeneration(jobId: string, config: any): Promise<any> {
  await Logger.info('Starting variant generation...', { config }, jobId);

  // Get top patterns
  const { data: patterns } = await supabase
    .from('ai_pattern_insights')
    .select('*')
    .eq('is_actionable', true)
    .eq('is_resolved', false)
    .order('frequency', { ascending: false })
    .limit(5);

  if (!patterns || patterns.length === 0) {
    await Logger.warn('No actionable patterns found for variant generation', null, jobId);
    return { variantsGenerated: 0, message: 'No patterns to address' };
  }

  await Logger.info(`Generating variants for ${patterns.length} patterns`, null, jobId);

  // Get base prompt from config or use default
  const basePrompt = config.basePrompt || process.env.AI_BASE_PROMPT || '';

  const variants = await generateABTestVariants(
    basePrompt,
    patterns.map(p => ({
      type: p.pattern_type,
      description: p.pattern_description,
      exampleQueries: p.example_queries,
      frequency: p.frequency,
      suggestedImprovements: p.suggested_prompt_improvements,
      confidenceScore: p.confidence_score,
    }))
  );

  // Save variants
  const savedIds = [];
  for (const variant of variants) {
    const id = await savePromptVariant(variant);
    if (id) savedIds.push(id);
  }

  await Logger.info('Variant generation complete', {
    variantsGenerated: savedIds.length,
  }, jobId);

  return {
    variantsGenerated: savedIds.length,
    variantIds: savedIds,
  };
}

/**
 * Execute experiment creation job
 */
async function executeExperimentCreation(jobId: string, config: any): Promise<any> {
  await Logger.info('Starting experiment creation...', { config }, jobId);

  // Get latest inactive variants
  const { data: versions } = await supabase
    .from('ai_prompt_versions')
    .select('id')
    .eq('is_active', false)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!versions || versions.length < 2) {
    await Logger.warn('Need at least 2 variants for experiment', null, jobId);
    return { experimentCreated: false, message: 'Insufficient variants' };
  }

  const duration = config.experimentDuration || 7;
  const experimentId = await setupQuickExperiment(
    `Auto-generated experiment ${new Date().toISOString().split('T')[0]}`,
    versions.map(v => v.id),
    duration,
    config.createdBy || '00000000-0000-0000-0000-000000000000'
  );

  if (!experimentId) {
    await Logger.error('Failed to create experiment', null, jobId);
    return { experimentCreated: false, message: 'Creation failed' };
  }

  // Start the experiment
  await supabase
    .from('ai_ab_experiments')
    .update({ status: 'running' })
    .eq('id', experimentId);

  await Logger.info('Experiment created and started', { experimentId }, jobId);

  return {
    experimentCreated: true,
    experimentId,
    duration,
    variantCount: versions.length,
  };
}

/**
 * Execute experiment monitoring job
 */
async function executeExperimentMonitoring(jobId: string, config: any): Promise<any> {
  await Logger.info('Starting experiment monitoring...', { config }, jobId);

  const experiments = await getActiveExperiments();

  if (experiments.length === 0) {
    await Logger.info('No active experiments to monitor', null, jobId);
    return { experimentsMonitored: 0 };
  }

  const results = [];
  for (const exp of experiments) {
    const expResults = await getExperimentResults(exp.id);
    if (!expResults) continue;

    await Logger.info(`Monitoring experiment: ${exp.name}`, {
      totalConversations: expResults.totalConversations,
      winnerVariantId: expResults.winnerVariantId,
      confidenceLevel: expResults.confidenceLevel,
    }, jobId);

    // Auto-complete if confidence > 90% and enough data
    if (
      expResults.winnerVariantId &&
      (expResults.confidenceLevel || 0) > 90 &&
      expResults.totalConversations > 100
    ) {
      await Logger.info('High confidence winner detected, completing experiment...', {
        experimentId: exp.id,
      }, jobId);

      await completeExperiment(exp.id, true); // Promote winner

      await Logger.info('Experiment completed and winner promoted', {
        experimentId: exp.id,
        winnerVariantId: expResults.winnerVariantId,
      }, jobId);
    }

    results.push({
      experimentId: exp.id,
      experimentName: exp.name,
      totalConversations: expResults.totalConversations,
      winnerVariantId: expResults.winnerVariantId,
      confidenceLevel: expResults.confidenceLevel,
    });
  }

  await Logger.info('Experiment monitoring complete', { experimentsMonitored: results.length }, jobId);

  return {
    experimentsMonitored: results.length,
    results,
  };
}

/**
 * Execute full optimization cycle
 */
async function executeFullOptimizationCycle(jobId: string, config: any): Promise<any> {
  await Logger.info('Starting full optimization cycle...', { config }, jobId);

  const results: any = {};

  // Step 1: Analyze patterns
  try {
    results.patternAnalysis = await executePatternAnalysis(jobId, config);
  } catch (error: any) {
    await Logger.error('Pattern analysis failed', error, jobId);
    results.patternAnalysis = { error: error.message };
  }

  // Step 2: Generate variants (only if patterns found)
  if (results.patternAnalysis?.patternsFound > 0) {
    try {
      results.variantGeneration = await executeVariantGeneration(jobId, config);
    } catch (error: any) {
      await Logger.error('Variant generation failed', error, jobId);
      results.variantGeneration = { error: error.message };
    }
  }

  // Step 3: Create experiment (only if variants generated)
  if (results.variantGeneration?.variantsGenerated > 0) {
    try {
      results.experimentCreation = await executeExperimentCreation(jobId, config);
    } catch (error: any) {
      await Logger.error('Experiment creation failed', error, jobId);
      results.experimentCreation = { error: error.message };
    }
  }

  // Step 4: Monitor existing experiments
  try {
    results.experimentMonitoring = await executeExperimentMonitoring(jobId, config);
  } catch (error: any) {
    await Logger.error('Experiment monitoring failed', error, jobId);
    results.experimentMonitoring = { error: error.message };
  }

  await Logger.info('Full optimization cycle complete', results, jobId);

  return results;
}

/**
 * Execute a job based on its type
 */
async function executeJob(job: any): Promise<any> {
  const jobId = job.id;
  const jobType = job.job_type;
  const config = job.config || {};

  await Logger.info(`Executing job: ${job.job_name}`, { jobType, config }, jobId);

  // Update job status to running
  await supabase
    .from('ai_agent_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  const startTime = Date.now();
  let result: any;
  let error: any = null;

  try {
    // Execute based on job type
    switch (jobType) {
      case 'pattern_analysis':
        result = await executePatternAnalysis(jobId, config);
        break;

      case 'variant_generation':
        result = await executeVariantGeneration(jobId, config);
        break;

      case 'experiment_creation':
        result = await executeExperimentCreation(jobId, config);
        break;

      case 'experiment_monitoring':
        result = await executeExperimentMonitoring(jobId, config);
        break;

      case 'full_optimization_cycle':
        result = await executeFullOptimizationCycle(jobId, config);
        break;

      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }

    // Mark job as completed
    await supabase
      .from('ai_agent_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        result,
      })
      .eq('id', jobId);

    jobsCompleted++;

    // Schedule next run if recurring
    if (job.schedule_type === 'recurring') {
      await supabase.rpc('schedule_next_run', {
        p_job_id: jobId,
        p_cron_expression: job.cron_expression,
      });
    }

    await Logger.info('Job completed successfully', { duration: Date.now() - startTime }, jobId);

  } catch (err: any) {
    error = err;
    await Logger.error('Job execution failed', err, jobId);

    // Update job with error
    const retryCount = (job.retry_count || 0) + 1;
    const maxRetries = job.max_retries || 3;

    if (retryCount < maxRetries) {
      // Retry later
      await supabase
        .from('ai_agent_jobs')
        .update({
          status: 'pending',
          retry_count: retryCount,
          error_message: err.message,
          next_run_at: new Date(Date.now() + 60000 * retryCount).toISOString(), // Exponential backoff
        })
        .eq('id', jobId);

      await Logger.info(`Job will retry (attempt ${retryCount}/${maxRetries})`, null, jobId);
    } else {
      // Max retries exceeded
      await supabase
        .from('ai_agent_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          error_message: err.message,
        })
        .eq('id', jobId);

      jobsFailed++;
    }
  }

  return result;
}

/**
 * Poll for and execute pending jobs
 */
async function pollJobs(): Promise<void> {
  try {
    // Get next pending job
    const { data: job, error } = await supabase.rpc('get_next_pending_job');

    if (error) {
      Logger.error('Error fetching next job', error);
      return;
    }

    if (!job) {
      // No jobs to execute
      return;
    }

    Logger.info(`Found pending job: ${job.job_name}`);

    // Execute the job
    await executeJob(job);

  } catch (error: any) {
    Logger.error('Error in job polling', error);
  }
}

/**
 * Start the service
 */
async function startService(): Promise<void> {
  if (isRunning) {
    Logger.warn('Service is already running');
    return;
  }

  Logger.info('Starting AI Agent Orchestrator Service...');
  Logger.info(`Instance ID: ${INSTANCE_ID}`);
  Logger.info(`Process ID: ${process.pid}`);
  Logger.info(`Hostname: ${os.hostname()}`);

  try {
    // Register service
    await registerService();

    // Update status to running
    await updateServiceStatus('running');

    isRunning = true;

    // Start health check HTTP server
    const healthServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          uptime: Date.now() - startTime,
          instanceId: INSTANCE_ID,
          jobsCompleted,
          jobsFailed,
          isRunning,
          timestamp: new Date().toISOString(),
        }));
      } else if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Blipee AI Agent Orchestrator\n');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
      }
    });

    healthServer.listen(PORT, () => {
      Logger.info(`Health check server listening on port ${PORT}`);
    });

    // Start job polling
    pollInterval = setInterval(pollJobs, POLL_INTERVAL_MS);

    // Start heartbeat
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    Logger.info('Service started successfully');
    Logger.info(`Polling for jobs every ${POLL_INTERVAL_MS}ms`);
    Logger.info(`Sending heartbeat every ${HEARTBEAT_INTERVAL_MS}ms`);

  } catch (error: any) {
    Logger.error('Failed to start service', error);
    await updateServiceStatus('error', error.message);
    process.exit(1);
  }
}

/**
 * Stop the service gracefully
 */
async function stopService(): Promise<void> {
  if (!isRunning) {
    Logger.warn('Service is not running');
    return;
  }

  Logger.info('Stopping AI Agent Orchestrator Service...');

  await updateServiceStatus('stopping');

  // Stop polling
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  // Stop heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  isRunning = false;

  await updateServiceStatus('stopped');

  Logger.info('Service stopped successfully');

  process.exit(0);
}

/**
 * Handle process signals
 */
process.on('SIGTERM', async () => {
  Logger.info('Received SIGTERM signal');
  await stopService();
});

process.on('SIGINT', async () => {
  Logger.info('Received SIGINT signal');
  await stopService();
});

process.on('uncaughtException', async (error) => {
  Logger.error('Uncaught exception', error);
  await updateServiceStatus('error', error.message);
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  Logger.error('Unhandled rejection', { reason, promise });
});

// Start the service
startService().catch(async (error) => {
  Logger.error('Fatal error starting service', error);
  process.exit(1);
});
