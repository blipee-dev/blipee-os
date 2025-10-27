#!/usr/bin/env tsx

/**
 * AI Prompt Optimization Worker (Railway)
 *
 * Autonomous 24/7 service that continuously optimizes AI prompts through ML:
 * - Analyzes conversation patterns every hour
 * - Generates improved prompt variants
 * - Creates and monitors A/B test experiments
 * - Auto-promotes winning variants
 *
 * Runs on Railway as a background worker service
 */

import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import {
  analyzeConversationPatterns,
  savePatternInsights,
} from '../lib/ai/analytics/pattern-analyzer';
import {
  generateABTestVariants,
  savePromptVariant,
} from '../lib/ai/analytics/prompt-variant-generator';
import {
  setupQuickExperiment,
  getActiveExperiments,
  getExperimentResults,
  completeExperiment,
} from '../lib/ai/analytics/ab-testing';
import { BASE_SYSTEM_PROMPT } from '../lib/ai/agents/sustainability-agent';

const PORT = process.env.PORT || 8081;
const POLL_INTERVAL = 60 * 1000; // 1 minute
const ANALYSIS_INTERVAL = 60 * 60 * 1000; // 1 hour
const EXPERIMENT_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '00000000-0000-0000-0000-000000000000';

// Worker stats
const stats = {
  startTime: new Date(),
  jobsCompleted: 0,
  jobsFailed: 0,
  patternsAnalyzed: 0,
  variantsGenerated: 0,
  experimentsCreated: 0,
  experimentsCompleted: 0,
  lastJobAt: null as Date | null,
  lastAnalysisAt: null as Date | null,
  lastExperimentCheckAt: null as Date | null,
};

/**
 * Health check server
 */
function startHealthServer() {
  const server = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        uptime: Math.floor((Date.now() - stats.startTime.getTime()) / 1000),
        stats: {
          ...stats,
          lastJobAt: stats.lastJobAt?.toISOString(),
          lastAnalysisAt: stats.lastAnalysisAt?.toISOString(),
          lastExperimentCheckAt: stats.lastExperimentCheckAt?.toISOString(),
        },
        timestamp: new Date().toISOString(),
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, () => {
    console.log(`🏥 Health check server listening on port ${PORT}`);
    console.log(`   Endpoint: http://localhost:${PORT}/health`);
  });
}

/**
 * Analyze conversation patterns
 */
async function runPatternAnalysis() {
  try {
    console.log('\n🔍 [Pattern Analysis] Starting...');

    const analysis = await analyzeConversationPatterns(7);

    console.log(`📊 [Pattern Analysis] Analyzed ${analysis.overallMetrics.totalConversations} conversations`);
    console.log(`   Avg Rating: ${analysis.overallMetrics.avgRating.toFixed(2)}/5`);
    console.log(`   Tool Success: ${analysis.overallMetrics.toolSuccessRate.toFixed(1)}%`);
    console.log(`   Patterns Found: ${analysis.patterns.length}`);

    if (analysis.patterns.length > 0) {
      await savePatternInsights(analysis.patterns);
      stats.patternsAnalyzed += analysis.patterns.length;
      console.log(`✅ [Pattern Analysis] Saved ${analysis.patterns.length} actionable patterns`);
    } else {
      console.log(`✅ [Pattern Analysis] No issues detected - system performing well`);
    }

    stats.lastAnalysisAt = new Date();
    stats.jobsCompleted++;

  } catch (error) {
    console.error('❌ [Pattern Analysis] Error:', error);
    stats.jobsFailed++;
  }
}

/**
 * Generate prompt variants from patterns
 */
async function runVariantGeneration() {
  try {
    console.log('\n🤖 [Variant Generation] Starting...');

    // Get actionable patterns
    const { data: patterns } = await supabase
      .from('ai_pattern_insights')
      .select('*')
      .eq('is_actionable', true)
      .eq('is_resolved', false)
      .order('frequency', { ascending: false })
      .limit(5);

    if (!patterns || patterns.length === 0) {
      console.log('ℹ️  [Variant Generation] No actionable patterns - skipping');
      return;
    }

    console.log(`📋 [Variant Generation] Using ${patterns.length} patterns`);

    const variants = await generateABTestVariants(
      BASE_SYSTEM_PROMPT,
      patterns.map((p) => ({
        type: p.pattern_type,
        description: p.pattern_description,
        exampleQueries: p.example_queries,
        frequency: p.frequency,
        suggestedImprovements: p.suggested_prompt_improvements,
        confidenceScore: p.confidence_score,
      }))
    );

    let savedCount = 0;
    for (const variant of variants) {
      const id = await savePromptVariant(variant);
      if (id) savedCount++;
    }

    stats.variantsGenerated += savedCount;
    stats.jobsCompleted++;
    console.log(`✅ [Variant Generation] Created ${savedCount} variants`);

  } catch (error) {
    console.error('❌ [Variant Generation] Error:', error);
    stats.jobsFailed++;
  }
}

/**
 * Create A/B test experiments
 */
async function runExperimentCreation() {
  try {
    console.log('\n🧪 [Experiment Creation] Starting...');

    // Check if we already have active experiments
    const activeExperiments = await getActiveExperiments();
    if (activeExperiments.length > 0) {
      console.log(`ℹ️  [Experiment Creation] ${activeExperiments.length} active experiments - skipping`);
      return;
    }

    // Get latest variants
    const { data: versions } = await supabase
      .from('ai_prompt_versions')
      .select('*')
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!versions || versions.length < 2) {
      console.log('ℹ️  [Experiment Creation] Need at least 2 variants - skipping');
      return;
    }

    console.log(`📝 [Experiment Creation] Using ${versions.length} variants`);

    const experimentId = await setupQuickExperiment(
      `Auto-experiment ${new Date().toISOString().split('T')[0]}`,
      versions.map((v) => v.id),
      7, // 7 days
      ADMIN_USER_ID
    );

    if (experimentId) {
      // Start the experiment
      await supabase
        .from('ai_ab_experiments')
        .update({ status: 'running' })
        .eq('id', experimentId);

      stats.experimentsCreated++;
      stats.jobsCompleted++;
      console.log(`✅ [Experiment Creation] Started experiment ${experimentId}`);
    }

  } catch (error) {
    console.error('❌ [Experiment Creation] Error:', error);
    stats.jobsFailed++;
  }
}

/**
 * Monitor and auto-complete experiments
 */
async function runExperimentMonitoring() {
  try {
    console.log('\n📈 [Experiment Monitor] Checking active experiments...');

    const experiments = await getActiveExperiments();

    if (experiments.length === 0) {
      console.log('ℹ️  [Experiment Monitor] No active experiments');
      return;
    }

    console.log(`📊 [Experiment Monitor] Monitoring ${experiments.length} experiments`);

    for (const exp of experiments) {
      const results = await getExperimentResults(exp.id);

      if (!results) continue;

      console.log(`   ${exp.name}:`);
      console.log(`     Conversations: ${results.totalConversations}`);
      console.log(`     Winner: ${results.winnerVariantId || 'TBD'}`);
      console.log(`     Confidence: ${results.confidenceLevel}%`);

      // Auto-complete high confidence winners
      if (
        results.winnerVariantId &&
        (results.confidenceLevel || 0) > 90 &&
        results.totalConversations > 100
      ) {
        console.log(`   🏆 [Experiment Monitor] High confidence winner detected!`);
        await completeExperiment(exp.id, true);
        stats.experimentsCompleted++;
        console.log(`   ✅ [Experiment Monitor] Experiment completed, winner promoted`);
      }
    }

    stats.lastExperimentCheckAt = new Date();
    stats.jobsCompleted++;

  } catch (error) {
    console.error('❌ [Experiment Monitor] Error:', error);
    stats.jobsFailed++;
  }
}

/**
 * Process pending optimization jobs from database
 */
async function processPendingJobs() {
  try {
    // Check for pending jobs in optimization_jobs table
    const { data: jobs } = await supabase
      .from('optimization_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (!jobs || jobs.length === 0) {
      return; // No pending jobs
    }

    const job = jobs[0];
    console.log(`\n⚙️  [Job] Processing: ${job.job_type} (${job.id})`);

    // Mark as running
    await supabase
      .from('optimization_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', job.id);

    // Execute job based on type
    switch (job.job_type) {
      case 'pattern_analysis':
        await runPatternAnalysis();
        break;
      case 'variant_generation':
        await runVariantGeneration();
        break;
      case 'experiment_creation':
        await runExperimentCreation();
        break;
      case 'experiment_monitoring':
        await runExperimentMonitoring();
        break;
      case 'full_cycle':
        await runPatternAnalysis();
        await runVariantGeneration();
        await runExperimentCreation();
        break;
      default:
        console.log(`⚠️  [Job] Unknown job type: ${job.job_type}`);
    }

    // Mark as completed
    await supabase
      .from('optimization_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: { success: true, stats }
      })
      .eq('id', job.id);

    stats.lastJobAt = new Date();
    console.log(`✅ [Job] Completed: ${job.job_type}`);

  } catch (error) {
    console.error('❌ [Job] Error processing job:', error);
    stats.jobsFailed++;
  }
}

/**
 * Main worker loop
 */
async function startWorker() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Blipee AI Prompt Optimization Worker             ║');
  console.log('║  Autonomous ML-Based Prompt Improvement           ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log('🚀 Starting Prompt Optimization Worker...');
  console.log(`📅 Current time: ${new Date().toISOString()}`);
  console.log('╔════════════════════════════════════════════════════╗\n');

  // Start health check server
  startHealthServer();

  // Poll for jobs every minute
  setInterval(async () => {
    await processPendingJobs();
  }, POLL_INTERVAL);

  // Run pattern analysis every hour
  setInterval(async () => {
    await runPatternAnalysis();
  }, ANALYSIS_INTERVAL);

  // Monitor experiments every 15 minutes
  setInterval(async () => {
    await runExperimentMonitoring();
  }, EXPERIMENT_CHECK_INTERVAL);

  // Initial run
  await processPendingJobs();
  await runExperimentMonitoring();

  console.log('\n✅ Worker initialized and polling for jobs');
  console.log(`   Job polling: Every ${POLL_INTERVAL / 1000}s`);
  console.log(`   Pattern analysis: Every ${ANALYSIS_INTERVAL / 1000 / 60}min`);
  console.log(`   Experiment checks: Every ${EXPERIMENT_CHECK_INTERVAL / 1000 / 60}min`);
  console.log('\n🔄 Worker running...\n');
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  console.log(`📊 Final stats: ${stats.jobsCompleted} jobs completed, ${stats.jobsFailed} failed`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  console.log(`📊 Final stats: ${stats.jobsCompleted} jobs completed, ${stats.jobsFailed} failed`);
  process.exit(0);
});

// Start the worker
startWorker().catch((error) => {
  console.error('❌ Fatal error starting worker:', error);
  process.exit(1);
});
