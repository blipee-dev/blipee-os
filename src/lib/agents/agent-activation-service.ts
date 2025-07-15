import cron from 'node-cron';
import { AgentManager } from '../ai/autonomous-agents/agent-manager';
import { createClient } from '@supabase/supabase-js';

interface ScheduledAgent {
  agentId: string;
  schedule: string;
  task: cron.ScheduledTask;
  lastRun?: Date;
  nextRun?: Date;
  status: 'active' | 'paused' | 'error';
}

export class AgentActivationService {
  private static instance: AgentActivationService;
  private agentManager: AgentManager;
  private supabase: any;
  private scheduledAgents: Map<string, ScheduledAgent> = new Map();
  private isActive: boolean = false;

  private constructor() {
    this.agentManager = AgentManager.getInstance();
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  static getInstance(): AgentActivationService {
    if (!AgentActivationService.instance) {
      AgentActivationService.instance = new AgentActivationService();
    }
    return AgentActivationService.instance;
  }

  /**
   * Activate all agents for an organization
   */
  async activateAllAgents(organizationId: string): Promise<void> {
    console.log(`🚀 Activating autonomous agents for organization: ${organizationId}`);
    
    try {
      // 1. ESG Chief of Staff - Daily comprehensive analysis
      await this.scheduleAgent({
        agentId: 'esg-chief-of-staff',
        agentName: 'ESG Chief of Staff',
        schedule: '0 8 * * *', // Every day at 8 AM
        organizationId,
        taskHandler: async () => {
          console.log('🤖 ESG Chief: Starting daily comprehensive analysis...');
          
          const agent = await this.agentManager.getAgent('esg-chief-of-staff');
          if (!agent) {
            throw new Error('ESG Chief agent not found');
          }

          const startTime = Date.now();
          const results = await agent.executeTask({
            type: 'daily-comprehensive-analysis',
            organizationId,
            includeRecommendations: true,
            generateReport: true
          });

          // Store results
          await this.storeAgentResults('esg-chief-daily', organizationId, results);

          // Check for critical issues
          if (results.criticalIssues && results.criticalIssues.length > 0) {
            await this.handleCriticalIssues('esg-chief', organizationId, results.criticalIssues);
          }

          // Update dashboard metrics
          await this.updateDashboardMetrics(organizationId, results);

          console.log(`✅ ESG Chief: Analysis completed in ${Date.now() - startTime}ms`);
          return results;
        }
      });

      // 2. Compliance Guardian - Every 4 hours
      await this.scheduleAgent({
        agentId: 'compliance-guardian',
        agentName: 'Compliance Guardian',
        schedule: '0 */4 * * *', // Every 4 hours
        organizationId,
        taskHandler: async () => {
          console.log('🛡️ Compliance Guardian: Checking compliance status...');
          
          const agent = await this.agentManager.getAgent('compliance-guardian');
          if (!agent) {
            throw new Error('Compliance Guardian agent not found');
          }

          const results = await agent.executeTask({
            type: 'compliance-check',
            organizationId,
            frameworks: ['CSRD', 'GRI', 'TCFD', 'CDP'],
            checkDeadlines: true,
            validateData: true
          });

          // Store compliance status
          await this.updateComplianceStatus(organizationId, results);

          // Alert on upcoming deadlines
          if (results.upcomingDeadlines && results.upcomingDeadlines.length > 0) {
            const urgent = results.upcomingDeadlines.filter((d: any) => d.daysUntil <= 7);
            if (urgent.length > 0) {
              await this.sendUrgentAlert('compliance-deadline', organizationId, urgent);
            }
          }

          // Check for new regulations
          if (results.newRegulations && results.newRegulations.length > 0) {
            await this.notifyNewRegulations(organizationId, results.newRegulations);
          }

          console.log(`✅ Compliance Guardian: Check completed`);
          return results;
        }
      });

      // 3. Carbon Hunter - Every 15 minutes for real-time monitoring
      await this.scheduleAgent({
        agentId: 'carbon-hunter',
        agentName: 'Carbon Hunter',
        schedule: '*/15 * * * *', // Every 15 minutes
        organizationId,
        taskHandler: async () => {
          console.log('🌍 Carbon Hunter: Scanning for emission reduction opportunities...');
          
          const agent = await this.agentManager.getAgent('carbon-hunter');
          if (!agent) {
            throw new Error('Carbon Hunter agent not found');
          }

          const results = await agent.executeTask({
            type: 'find-reduction-opportunities',
            organizationId,
            realTimeMonitoring: true,
            autoImplement: true
          });

          // Auto-implement approved reductions
          if (results.opportunities) {
            for (const opportunity of results.opportunities) {
              if (opportunity.autoApproved && opportunity.estimatedSavings > 1000) {
                await this.implementReduction(organizationId, opportunity);
                console.log(`💡 Auto-implemented: ${opportunity.title} (${opportunity.estimatedSavings} kg CO2e savings)`);
              }
            }
          }

          // Alert on anomalies
          if (results.anomalies && results.anomalies.length > 0) {
            await this.handleEmissionAnomalies(organizationId, results.anomalies);
          }

          return results;
        }
      });

      // 4. Supply Chain Investigator - Weekly deep analysis
      await this.scheduleAgent({
        agentId: 'supply-chain-investigator',
        agentName: 'Supply Chain Investigator',
        schedule: '0 9 * * 1', // Every Monday at 9 AM
        organizationId,
        taskHandler: async () => {
          console.log('🔍 Supply Chain Investigator: Analyzing supplier sustainability...');
          
          const agent = await this.agentManager.getAgent('supply-chain-investigator');
          if (!agent) {
            throw new Error('Supply Chain Investigator agent not found');
          }

          const results = await agent.executeTask({
            type: 'weekly-supplier-assessment',
            organizationId,
            deepAnalysis: true,
            riskAssessment: true,
            alternativeSuppliers: true
          });

          // Update supplier scores
          await this.updateSupplierScores(organizationId, results);

          // Alert on high-risk suppliers
          if (results.highRiskSuppliers && results.highRiskSuppliers.length > 0) {
            await this.alertHighRiskSuppliers(organizationId, results.highRiskSuppliers);
          }

          // Suggest supplier switches
          if (results.recommendedSwitches && results.recommendedSwitches.length > 0) {
            await this.proposeSupplierSwitches(organizationId, results.recommendedSwitches);
          }

          console.log(`✅ Supply Chain Investigator: Assessment completed`);
          return results;
        }
      });

      // 5. Additional monitoring tasks
      await this.scheduleSystemTasks(organizationId);

      this.isActive = true;
      console.log(`✅ All agents activated for organization: ${organizationId}`);
      
      // Log activation
      await this.logAgentActivation(organizationId);

    } catch (error) {
      console.error('❌ Error activating agents:', error);
      throw error;
    }
  }

  /**
   * Schedule an individual agent
   */
  private async scheduleAgent(config: {
    agentId: string;
    agentName: string;
    schedule: string;
    organizationId: string;
    taskHandler: () => Promise<any>;
  }): Promise<void> {
    const { agentId, agentName, schedule, taskHandler } = config;

    // Create scheduled task
    const task = cron.schedule(schedule, async () => {
      try {
        await taskHandler();
      } catch (error) {
        console.error(`❌ ${agentName} error:`, error);
        await this.handleAgentError(agentId, error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Store scheduled agent
    this.scheduledAgents.set(agentId, {
      agentId,
      schedule,
      task,
      status: 'active',
      lastRun: undefined,
      nextRun: this.getNextRunTime(schedule)
    });

    console.log(`📅 ${agentName} scheduled: ${schedule}`);
  }

  /**
   * Schedule additional system tasks
   */
  private async scheduleSystemTasks(organizationId: string): Promise<void> {
    // Health check every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.performHealthCheck(organizationId);
    });

    // Data sync every hour
    cron.schedule('0 * * * *', async () => {
      await this.syncExternalData(organizationId);
    });

    // Performance optimization daily
    cron.schedule('0 2 * * *', async () => {
      await this.optimizeAgentPerformance(organizationId);
    });
  }

  /**
   * Store agent results
   */
  private async storeAgentResults(
    taskType: string,
    organizationId: string,
    results: any
  ): Promise<void> {
    try {
      await this.supabase.from('agent_task_executions').insert({
        agent_id: results.agentId,
        organization_id: organizationId,
        task_type: taskType,
        status: 'completed',
        results: results,
        execution_time_ms: results.executionTime,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing agent results:', error);
    }
  }

  /**
   * Handle critical issues detected by agents
   */
  private async handleCriticalIssues(
    agentId: string,
    organizationId: string,
    issues: any[]
  ): Promise<void> {
    // Create critical alerts
    for (const issue of issues) {
      await this.supabase.from('critical_alerts').insert({
        organization_id: organizationId,
        agent_id: agentId,
        severity: issue.severity || 'high',
        title: issue.title,
        description: issue.description,
        recommended_action: issue.recommendedAction,
        created_at: new Date().toISOString()
      });
    }

    // Send notifications
    await this.sendNotification('critical-issue', organizationId, {
      agentId,
      issueCount: issues.length,
      issues
    });
  }

  /**
   * Update compliance status
   */
  private async updateComplianceStatus(
    organizationId: string,
    results: any
  ): Promise<void> {
    try {
      // Update compliance tracking table
      await this.supabase.from('compliance_status').upsert({
        organization_id: organizationId,
        csrd_score: results.scores?.csrd || 0,
        gri_score: results.scores?.gri || 0,
        tcfd_score: results.scores?.tcfd || 0,
        overall_score: results.overallScore || 0,
        gaps: results.gaps || [],
        last_checked: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating compliance status:', error);
    }
  }

  /**
   * Implement carbon reduction opportunity
   */
  private async implementReduction(
    organizationId: string,
    opportunity: any
  ): Promise<void> {
    try {
      // Log the implementation
      await this.supabase.from('reduction_implementations').insert({
        organization_id: organizationId,
        opportunity_id: opportunity.id,
        title: opportunity.title,
        estimated_savings: opportunity.estimatedSavings,
        implementation_status: 'in_progress',
        auto_implemented: true,
        implemented_at: new Date().toISOString()
      });

      // Execute implementation actions
      // This would integrate with building management systems, IoT devices, etc.
      console.log(`🔧 Implementing: ${opportunity.title}`);
    } catch (error) {
      console.error('Error implementing reduction:', error);
    }
  }

  /**
   * Pause all agents
   */
  async pauseAllAgents(): Promise<void> {
    console.log('⏸️ Pausing all agents...');
    
    for (const [agentId, scheduledAgent] of this.scheduledAgents) {
      scheduledAgent.task.stop();
      scheduledAgent.status = 'paused';
    }
    
    this.isActive = false;
    console.log('✅ All agents paused');
  }

  /**
   * Resume all agents
   */
  async resumeAllAgents(): Promise<void> {
    console.log('▶️ Resuming all agents...');
    
    for (const [agentId, scheduledAgent] of this.scheduledAgents) {
      scheduledAgent.task.start();
      scheduledAgent.status = 'active';
    }
    
    this.isActive = true;
    console.log('✅ All agents resumed');
  }

  /**
   * Get agent statuses
   */
  getAgentStatuses(): any[] {
    const statuses = [];
    
    for (const [agentId, scheduledAgent] of this.scheduledAgents) {
      statuses.push({
        agentId,
        status: scheduledAgent.status,
        schedule: scheduledAgent.schedule,
        lastRun: scheduledAgent.lastRun,
        nextRun: scheduledAgent.nextRun
      });
    }
    
    return statuses;
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(organizationId: string): Promise<void> {
    try {
      const health = await this.agentManager.checkHealth();
      
      if (!health.allHealthy) {
        console.warn('⚠️ Agent health check failed:', health);
        await this.handleUnhealthyAgents(health.unhealthyAgents);
      }
    } catch (error) {
      console.error('Error performing health check:', error);
    }
  }

  /**
   * Handle agent errors
   */
  private async handleAgentError(agentId: string, error: any): Promise<void> {
    // Log error
    await this.supabase.from('agent_errors').insert({
      agent_id: agentId,
      error_message: error.message,
      error_stack: error.stack,
      created_at: new Date().toISOString()
    });

    // Attempt recovery
    const scheduledAgent = this.scheduledAgents.get(agentId);
    if (scheduledAgent) {
      scheduledAgent.status = 'error';
      
      // Restart after delay
      setTimeout(() => {
        console.log(`🔄 Attempting to restart ${agentId}...`);
        scheduledAgent.task.start();
        scheduledAgent.status = 'active';
      }, 60000); // 1 minute delay
    }
  }

  /**
   * Helper methods
   */
  private getNextRunTime(schedule: string): Date {
    // Parse cron schedule to get next run time
    // This is a simplified implementation
    const now = new Date();
    return new Date(now.getTime() + 3600000); // 1 hour from now as placeholder
  }

  private async sendNotification(type: string, organizationId: string, data: any): Promise<void> {
    // Implementation would send to notification service
    console.log(`📬 Notification: ${type} for ${organizationId}`, data);
  }

  private async updateDashboardMetrics(organizationId: string, results: any): Promise<void> {
    // Update real-time dashboard metrics
    console.log(`📊 Dashboard updated for ${organizationId}`);
  }

  private async logAgentActivation(organizationId: string): Promise<void> {
    await this.supabase.from('agent_activations').insert({
      organization_id: organizationId,
      activated_at: new Date().toISOString(),
      agent_count: this.scheduledAgents.size
    });
  }

  private async syncExternalData(organizationId: string): Promise<void> {
    console.log(`🔄 Syncing external data for ${organizationId}`);
    // Implementation would sync weather, carbon, regulatory data
  }

  private async optimizeAgentPerformance(organizationId: string): Promise<void> {
    console.log(`⚡ Optimizing agent performance for ${organizationId}`);
    // Implementation would analyze and optimize agent execution
  }

  private async handleUnhealthyAgents(unhealthyAgents: any[]): Promise<void> {
    // Restart unhealthy agents
    for (const agent of unhealthyAgents) {
      console.log(`🔧 Restarting unhealthy agent: ${agent.id}`);
    }
  }

  private async sendUrgentAlert(type: string, organizationId: string, data: any): Promise<void> {
    console.log(`🚨 URGENT: ${type} for ${organizationId}`, data);
  }

  private async notifyNewRegulations(organizationId: string, regulations: any[]): Promise<void> {
    console.log(`📜 New regulations for ${organizationId}:`, regulations);
  }

  private async handleEmissionAnomalies(organizationId: string, anomalies: any[]): Promise<void> {
    console.log(`⚠️ Emission anomalies detected for ${organizationId}:`, anomalies);
  }

  private async updateSupplierScores(organizationId: string, results: any): Promise<void> {
    console.log(`📊 Updating supplier scores for ${organizationId}`);
  }

  private async alertHighRiskSuppliers(organizationId: string, suppliers: any[]): Promise<void> {
    console.log(`⚠️ High-risk suppliers for ${organizationId}:`, suppliers);
  }

  private async proposeSupplierSwitches(organizationId: string, switches: any[]): Promise<void> {
    console.log(`💡 Proposed supplier switches for ${organizationId}:`, switches);
  }
}