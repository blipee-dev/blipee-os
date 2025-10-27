/**
 * Blipee AI Autonomous Agent Worker
 *
 * Background process that runs the 8 autonomous agents 24/7
 * Generates proactive messages for users based on agent findings
 *
 * Deploy separately to Railway/Render/long-running service
 *
 * Start with: npm run agents:start
 */

import { initializeAutonomousAgents, getAIWorkforceStatus } from '@/lib/ai/autonomous-agents';
import { createClient } from '@supabase/supabase-js';
import { AgentMessageGenerator } from '@/lib/ai/autonomous-agents/message-generator';
import http from 'http';
import cron from 'node-cron';
import {
  analyzeConversationPatterns,
  savePatternInsights,
} from '@/lib/ai/analytics/pattern-analyzer';
import {
  generateABTestVariants,
  savePromptVariant,
} from '@/lib/ai/analytics/prompt-variant-generator';
import {
  setupQuickExperiment,
  getActiveExperiments,
  getExperimentResults,
  completeExperiment,
} from '@/lib/ai/analytics/ab-testing';
import { BASE_SYSTEM_PROMPT } from '@/lib/ai/agents/sustainability-agent';
import { MetricsPreComputeService } from './services/metrics-precompute-service';
import { DataCleanupService } from './services/data-cleanup-service';
import { NotificationQueueService } from './services/notification-queue-service';
import { OptimizationOpportunitiesService } from './services/optimization-opportunities-service';
import { DatabaseOptimizationService } from './services/database-optimization-service';
import { WeatherDataService } from './services/weather-data-service';
import { ReportGenerationService } from './services/report-generation-service';
import { MLTrainingService } from './services/ml-training-service';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key for background operations
);

class AgentWorker {
  private isRunning = false;
  private globalWorkforce: any = null; // Single global workforce for all orgs
  private organizationIds: Set<string> = new Set(); // Track active organizations
  private messageGenerator: AgentMessageGenerator;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthServer: http.Server | null = null;
  private startTime: number = Date.now();

  // Prompt Optimization intervals
  private patternAnalysisInterval: NodeJS.Timeout | null = null;
  private experimentCheckInterval: NodeJS.Timeout | null = null;

  // Prompt Optimization stats
  private promptStats = {
    patternsAnalyzed: 0,
    variantsGenerated: 0,
    experimentsCreated: 0,
    experimentsCompleted: 0,
    lastAnalysisAt: null as Date | null,
    lastExperimentCheckAt: null as Date | null,
  };

  // Phase 1 Services
  private metricsService: MetricsPreComputeService;
  private cleanupService: DataCleanupService;
  private notificationService: NotificationQueueService;

  // Phase 2 Services
  private optimizationService: OptimizationOpportunitiesService;
  private databaseOptService: DatabaseOptimizationService;
  private weatherService: WeatherDataService;

  // Phase 3 Services
  private reportService: ReportGenerationService;
  private mlTrainingService: MLTrainingService;

  // Cron job references
  private cronJobs: cron.ScheduledTask[] = [];

  constructor() {
    this.messageGenerator = new AgentMessageGenerator(supabaseAdmin);

    // Initialize Phase 1 Services
    this.metricsService = new MetricsPreComputeService();
    this.cleanupService = new DataCleanupService();
    this.notificationService = new NotificationQueueService();

    // Initialize Phase 2 Services
    this.optimizationService = new OptimizationOpportunitiesService();
    this.databaseOptService = new DatabaseOptimizationService();
    this.weatherService = new WeatherDataService();

    // Initialize Phase 3 Services
    this.reportService = new ReportGenerationService();
    this.mlTrainingService = new MLTrainingService();
  }

  async start() {
    console.log('🚀 Starting Blipee AI Global Agent Worker...');
    console.log('📅 Current time:', new Date().toISOString());
    this.isRunning = true;

    // Start health check HTTP server
    this.startHealthCheckServer();

    // Initialize GLOBAL workforce (single instance for all organizations)
    console.log('\n🌍 Initializing global AI workforce...');
    try {
      this.globalWorkforce = await initializeAutonomousAgents();
      console.log('✅ Global workforce initialized successfully');
      console.log(`   • ${this.globalWorkforce.config.totalEmployees} agents active globally`);
      console.log(`   • Mode: ${this.globalWorkforce.config.operationalMode}`);
      console.log(`   • Cross-org benchmarking: ${this.globalWorkforce.config.crossOrgBenchmarkingEnabled}`);
    } catch (error) {
      console.error('❌ Failed to initialize global workforce:', error);
      return;
    }

    // Get all organizations (just to track them)
    const { data: orgs, error } = await supabaseAdmin
      .from('organizations')
      .select('id, name, created_at');

    if (error) {
      console.error('❌ Failed to fetch organizations:', error);
      return;
    }

    if (!orgs || orgs.length === 0) {
      console.log('⚠️  No organizations found. Global agents ready and waiting...');
    } else {
      console.log(`📊 Found ${orgs.length} organization(s)`);
      // Track organization IDs
      for (const org of orgs) {
        this.organizationIds.add(org.id);
        console.log(`   • ${org.name} (${org.id})`);
      }
    }

    // Start GLOBAL task listener (listens to ALL organizations)
    this.startGlobalTaskListener();

    // Start health monitoring
    this.startHealthMonitoring();

    // Start prompt optimization
    this.startPromptOptimization();

    // Start Phase 1 Services
    this.startPhase1Services();

    // Start Phase 2 & 3 Services
    this.startPhase2And3Services();

    // Watch for new organizations
    this.watchForNewOrganizations();

    console.log('\n✅ Global agent worker fully operational');
    console.log('🌍 8 autonomous agents working globally across all organizations');
    console.log('📊 Cross-organizational benchmarking enabled');
    console.log('📨 Proactive messages will appear in user chats');
    console.log('🎯 Prompt optimization running in background');
    console.log('💚 Phase 1: Metrics, cleanup, and notifications running');
    console.log('🔍 Phase 2: Optimization, database monitoring, weather tracking');
    console.log('📊 Phase 3: Report generation and ML model training');
  }

  /**
   * Start GLOBAL task listener for ALL organizations
   * Single subscription that receives task results from any organization
   */
  private startGlobalTaskListener() {
    console.log('👂 Starting global task listener for all organizations...');

    // Subscribe to ALL agent task results (no organization filter)
    const channel = supabaseAdmin
      .channel('global-agent-tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_task_results'
          // No filter - listen to ALL organizations
        },
        async (payload) => {
          const taskResult = payload.new;
          console.log(`\n📨 New task result from ${taskResult.agent_id} (org: ${taskResult.organization_id})`);
          console.log(`   • Task type: ${taskResult.task_type}`);
          console.log(`   • Success: ${taskResult.success}`);
          console.log(`   • Execution time: ${taskResult.execution_time_ms}ms`);

          // Generate proactive message if needed
          await this.handleTaskResult(taskResult);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to global task results (all organizations)');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Global channel error');
        }
      });
  }

  /**
   * Handle completed agent task and decide if user should be notified
   */
  private async handleTaskResult(taskResult: any) {
    const { agent_id, result, priority, organization_id, success } = taskResult;

    // Skip failed tasks
    if (!success) {
      console.log(`   ⏭️  Skipping failed task`);
      return;
    }

    // Determine if this finding is worth notifying users about
    const shouldNotify = await this.messageGenerator.shouldNotifyUsers(taskResult);

    if (!shouldNotify) {
      console.log(`   ℹ️  No user notification needed (routine task)`);
      return;
    }

    console.log(`   🔔 Important finding! Notifying users...`);

    // Get users to notify (admins, sustainability managers)
    const { data: members } = await supabaseAdmin
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', organization_id)
      .in('role', ['account_owner', 'sustainability_manager', 'analyst']);

    if (!members || members.length === 0) {
      console.log(`   ⚠️  No users found to notify for org ${organization_id}`);
      return;
    }

    console.log(`   📧 Notifying ${members.length} user(s)...`);

    // Generate proactive message for each user
    let messagesCreated = 0;
    for (const member of members) {
      try {
        const message = await this.messageGenerator.createProactiveMessage({
          userId: member.user_id,
          organizationId: organization_id,
          agentId: agent_id,
          taskResult: result,
          priority: priority || 'info'
        });

        if (message) {
          messagesCreated++;
        }
      } catch (error) {
        console.error(`   ❌ Failed to create message for user ${member.user_id}:`, error);
      }
    }

    console.log(`   ✅ Created ${messagesCreated} proactive message(s)`);
  }

  /**
   * Start HTTP health check server for Railway/Render
   */
  private startHealthCheckServer() {
    const port = parseInt(process.env.PORT || '8080', 10);

    this.healthServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        const uptime = Date.now() - this.startTime;
        const globalAgentCount = this.globalWorkforce?.config?.totalEmployees || 0;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          uptime: Math.floor(uptime / 1000), // seconds
          agents: {
            mode: 'global',
            totalAgents: globalAgentCount,
            organizations: this.organizationIds.size,
            crossOrgBenchmarking: this.globalWorkforce?.config?.crossOrgBenchmarkingEnabled || false,
          },
          promptOptimization: {
            ...this.promptStats,
            lastAnalysisAt: this.promptStats.lastAnalysisAt?.toISOString(),
            lastExperimentCheckAt: this.promptStats.lastExperimentCheckAt?.toISOString(),
          },
          phase1Services: {
            metrics: this.metricsService.getHealth(),
            cleanup: this.cleanupService.getHealth(),
            notifications: this.notificationService.getHealth(),
          },
          phase2Services: {
            optimization: this.optimizationService.getHealth(),
            databaseOpt: this.databaseOptService.getHealth(),
            weather: this.weatherService.getHealth(),
          },
          phase3Services: {
            reports: this.reportService.getHealth(),
            mlTraining: this.mlTrainingService.getHealth(),
          },
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.healthServer.listen(port, () => {
      console.log(`🏥 Health check server listening on port ${port}`);
      console.log(`   Endpoint: http://localhost:${port}/health`);
    });
  }

  /**
   * Monitor global agent health
   */
  private startHealthMonitoring() {
    console.log('\n💚 Starting global health monitoring (checks every 5 minutes)...');

    this.healthCheckInterval = setInterval(async () => {
      if (!this.isRunning) return;

      const timestamp = new Date().toISOString();
      console.log(`\n💚 Global health check at ${timestamp}`);

      try {
        const status = await getAIWorkforceStatus();

        console.log(`   🌍 Global workforce: ${status.systemHealth}`);
        console.log(`   • Agents active: ${status.employeeCount}/8`);
        console.log(`   • Organizations: ${this.organizationIds.size}`);

        if (status.systemHealth === 'offline') {
          console.error('   🚨 Global workforce is offline! Critical issue detected.');
        } else if (status.systemHealth === 'degraded') {
          console.warn(`   ⚠️  Workforce degraded (${status.employeeCount}/8 active)`);
        } else {
          console.log('   ✅ All systems operational');
        }
      } catch (error) {
        console.error('   ❌ Health check failed:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Watch for new organizations being created
   * Just tracks them - global agents already handle all orgs
   */
  private watchForNewOrganizations() {
    console.log('👀 Watching for new organizations...');

    supabaseAdmin
      .channel('new-organizations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organizations'
        },
        async (payload) => {
          const newOrg = payload.new;
          console.log(`\n🆕 New organization created: ${newOrg.name} (${newOrg.id})`);
          console.log('   ✅ Global agents automatically handle new organization');

          // Track the new organization
          this.organizationIds.add(newOrg.id);
        }
      )
      .subscribe();
  }

  /**
   * Run pattern analysis for prompt optimization
   */
  private async runPatternAnalysis() {
    try {
      console.log('\n🔍 [Prompt Optimization] Starting pattern analysis...');

      const analysis = await analyzeConversationPatterns(7, supabaseAdmin);

      console.log(`📊 [Prompt Optimization] Analyzed ${analysis.overallMetrics.totalConversations} conversations`);
      console.log(`   Avg Rating: ${analysis.overallMetrics.avgRating.toFixed(2)}/5`);
      console.log(`   Tool Success: ${analysis.overallMetrics.toolSuccessRate.toFixed(1)}%`);
      console.log(`   Patterns Found: ${analysis.patterns.length}`);

      if (analysis.patterns.length > 0) {
        await savePatternInsights(analysis.patterns, supabaseAdmin);
        this.promptStats.patternsAnalyzed += analysis.patterns.length;
        console.log(`✅ [Prompt Optimization] Saved ${analysis.patterns.length} actionable patterns`);
      } else {
        console.log(`✅ [Prompt Optimization] No issues detected - system performing well`);
      }

      this.promptStats.lastAnalysisAt = new Date();

    } catch (error) {
      console.error('❌ [Prompt Optimization] Pattern analysis error:', error);
    }
  }

  /**
   * Monitor and complete A/B experiments
   */
  private async runExperimentMonitoring() {
    try {
      console.log('\n🧪 [Prompt Optimization] Checking experiments...');

      const experiments = await getActiveExperiments(supabaseAdmin);

      if (!experiments || experiments.length === 0) {
        console.log('ℹ️  [Prompt Optimization] No active experiments');
        return;
      }

      console.log(`📋 [Prompt Optimization] Monitoring ${experiments.length} experiments`);

      for (const experiment of experiments) {
        const results = await getExperimentResults(experiment.id, supabaseAdmin);

        // Auto-complete if sufficient data and high confidence winner
        if (results.totalConversations > 100 && results.winnerConfidence > 0.9) {
          await completeExperiment(experiment.id, results.winner, supabaseAdmin);
          this.promptStats.experimentsCompleted++;
          console.log(`✅ [Prompt Optimization] Auto-completed experiment: ${experiment.name}`);
          console.log(`   Winner: ${results.winner} (${(results.winnerConfidence * 100).toFixed(1)}% confidence)`);
        }
      }

      this.promptStats.lastExperimentCheckAt = new Date();

    } catch (error) {
      console.error('❌ [Prompt Optimization] Experiment monitoring error:', error);
    }
  }

  /**
   * Start prompt optimization intervals
   */
  private startPromptOptimization() {
    console.log('\n🎯 Starting prompt optimization service...');

    // Run pattern analysis every hour
    this.patternAnalysisInterval = setInterval(async () => {
      if (!this.isRunning) return;
      await this.runPatternAnalysis();
    }, 60 * 60 * 1000); // 1 hour

    // Monitor experiments every 15 minutes
    this.experimentCheckInterval = setInterval(async () => {
      if (!this.isRunning) return;
      await this.runExperimentMonitoring();
    }, 15 * 60 * 1000); // 15 minutes

    // Run initial analysis after 1 minute
    setTimeout(async () => {
      if (this.isRunning) await this.runPatternAnalysis();
    }, 60 * 1000);

    console.log('✅ Prompt optimization service started');
    console.log('   • Pattern analysis: Every hour');
    console.log('   • Experiment monitoring: Every 15 minutes');
  }

  /**
   * Start Phase 1 Services with smart scheduling
   */
  private startPhase1Services() {
    console.log('\n🚀 Starting Phase 1 Services...');

    // 1. Metrics Pre-Computation - Daily at 2:00 AM UTC
    const metricsJob = cron.schedule('0 2 * * *', async () => {
      if (!this.isRunning) return;
      try {
        await this.metricsService.run();
      } catch (error) {
        console.error('❌ Metrics pre-computation failed:', error);
      }
    }, {
      timezone: 'UTC'
    });
    this.cronJobs.push(metricsJob);

    // 2. Data Cleanup - Daily at 3:00 AM UTC (after metrics)
    const cleanupJob = cron.schedule('0 3 * * *', async () => {
      if (!this.isRunning) return;
      try {
        await this.cleanupService.run();
      } catch (error) {
        console.error('❌ Data cleanup failed:', error);
      }
    }, {
      timezone: 'UTC'
    });
    this.cronJobs.push(cleanupJob);

    // 3. Notification Queue - Every 5 minutes
    const notificationInterval = setInterval(async () => {
      if (!this.isRunning) return;
      try {
        await this.notificationService.run();
      } catch (error) {
        console.error('❌ Notification processing failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Store interval in a way we can clear it later
    (notificationInterval as any)._isInterval = true;
    this.cronJobs.push(notificationInterval as any);

    console.log('✅ Phase 1 Services started');
    console.log('   • Metrics pre-computation: Daily at 2:00 AM UTC');
    console.log('   • Data cleanup: Daily at 3:00 AM UTC');
    console.log('   • Notification queue: Every 5 minutes');
  }

  /**
   * Start Phase 2 & 3 Services with smart scheduling
   */
  private startPhase2And3Services() {
    console.log('\n🚀 Starting Phase 2 & 3 Services...');

    // PHASE 2: Intelligence & Optimization

    // 1. Optimization Opportunities - Daily at 4:00 AM UTC (after cleanup)
    const optimizationJob = cron.schedule('0 4 * * *', async () => {
      if (!this.isRunning) return;
      try {
        await this.optimizationService.run();
      } catch (error) {
        console.error('❌ Optimization opportunities analysis failed:', error);
      }
    }, {
      timezone: 'UTC'
    });
    this.cronJobs.push(optimizationJob);

    // 2. Database Optimization - Weekly on Sundays at 1:00 AM UTC
    const dbOptJob = cron.schedule('0 1 * * 0', async () => {
      if (!this.isRunning) return;
      try {
        await this.databaseOptService.run();
      } catch (error) {
        console.error('❌ Database optimization failed:', error);
      }
    }, {
      timezone: 'UTC'
    });
    this.cronJobs.push(dbOptJob);

    // 3. Weather Data Polling - Every hour at :00 minutes
    const weatherJob = cron.schedule('0 * * * *', async () => {
      if (!this.isRunning) return;
      try {
        await this.weatherService.run();
      } catch (error) {
        console.error('❌ Weather data polling failed:', error);
      }
    }, {
      timezone: 'UTC'
    });
    this.cronJobs.push(weatherJob);

    // PHASE 3: Advanced Analytics

    // 4. Report Generation - Monthly on 1st day at 6:00 AM UTC
    const reportJob = cron.schedule('0 6 1 * *', async () => {
      if (!this.isRunning) return;
      try {
        await this.reportService.run();
      } catch (error) {
        console.error('❌ Report generation failed:', error);
      }
    }, {
      timezone: 'UTC'
    });
    this.cronJobs.push(reportJob);

    // 5. ML Model Training - Monthly on 15th day at 2:00 AM UTC
    const mlTrainingJob = cron.schedule('0 2 15 * *', async () => {
      if (!this.isRunning) return;
      try {
        await this.mlTrainingService.run();
      } catch (error) {
        console.error('❌ ML model training failed:', error);
      }
    }, {
      timezone: 'UTC'
    });
    this.cronJobs.push(mlTrainingJob);

    console.log('✅ Phase 2 & 3 Services started');
    console.log('\n   Phase 2 - Intelligence & Optimization:');
    console.log('   • Optimization opportunities: Daily at 4:00 AM UTC');
    console.log('   • Database optimization: Weekly (Sundays) at 1:00 AM UTC');
    console.log('   • Weather data polling: Hourly');
    console.log('\n   Phase 3 - Advanced Analytics:');
    console.log('   • Report generation: Monthly (1st) at 6:00 AM UTC');
    console.log('   • ML model training: Monthly (15th) at 2:00 AM UTC');
  }

  /**
   * Graceful shutdown
   */
  async stop() {
    console.log('\n🛑 Stopping agent worker...');
    this.isRunning = false;

    // Close health check server
    if (this.healthServer) {
      console.log('   • Closing health check server');
      this.healthServer.close();
    }

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Clear prompt optimization intervals
    if (this.patternAnalysisInterval) {
      console.log('   • Stopping pattern analysis');
      clearInterval(this.patternAnalysisInterval);
    }

    if (this.experimentCheckInterval) {
      console.log('   • Stopping experiment monitoring');
      clearInterval(this.experimentCheckInterval);
    }

    // Stop all Phase 1 cron jobs
    console.log('   • Stopping Phase 1 Services');
    for (const job of this.cronJobs) {
      if (typeof (job as any).stop === 'function') {
        // It's a cron job
        (job as any).stop();
      } else if ((job as any)._isInterval) {
        // It's a setInterval
        clearInterval(job as any);
      }
    }
    this.cronJobs = [];

    // Stop global workforce
    if (this.globalWorkforce) {
      console.log('   • Stopping global workforce');
      // Add cleanup logic here if needed
    }

    // Unsubscribe from all channels
    await supabaseAdmin.removeAllChannels();

    console.log('✅ Global agent worker stopped gracefully');
  }
}

// Initialize worker
const worker = new AgentWorker();

// Handle shutdown signals
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT (Ctrl+C), shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start worker
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  Blipee AI Global Worker - Complete Platform            ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║  CORE FEATURES:                                          ║');
console.log('║  • 8 Global Autonomous Agents (all organizations)        ║');
console.log('║  • Cross-Organizational Benchmarking & Insights          ║');
console.log('║  • ML-Based Prompt Optimization                          ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║  PHASE 1 - Foundation Services:                          ║');
console.log('║  • Sustainability Metrics Pre-Computation (Daily)        ║');
console.log('║  • GDPR Data Cleanup & Retention (Daily)                 ║');
console.log('║  • Async Notification Queue (Every 5min)                 ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║  PHASE 2 - Intelligence & Optimization:                  ║');
console.log('║  • Optimization Opportunities Analysis (Daily)           ║');
console.log('║  • Database Query Optimization (Weekly)                  ║');
console.log('║  • Weather Data Polling & Correlation (Hourly)           ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║  PHASE 3 - Advanced Analytics:                           ║');
console.log('║  • Monthly Sustainability Reports (Auto-generated)       ║');
console.log('║  • ML Model Training Pipeline (Auto-improvement)         ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

worker.start().catch((error) => {
  console.error('❌ Failed to start agent worker:', error);
  process.exit(1);
});
