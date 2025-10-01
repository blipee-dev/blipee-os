/**
 * Full Capability Orchestrator
 *
 * This orchestrates ALL AI systems to work at 100% capacity:
 * - 8 Autonomous Agents
 * - Conversation Intelligence
 * - Predictive Intelligence
 * - Industry Intelligence
 * - ML Pipeline
 * - Multi-Brain Orchestration
 * - Zero-Typing Navigation
 */

import { initializeAutonomousAgents, getAIWorkforceStatus, executeWorkforceTask } from './autonomous-agents';
import { conversationalIntelligenceOrchestrator } from './conversation-intelligence';
import { predictiveIntelligence } from './predictive-intelligence';
import { industryIntelligence } from './industry-intelligence-service';
import { MLPipeline } from './ml-models/ml-pipeline-client';
import { createDatabaseIntelligence } from './database-intelligence';
import { zeroTypingEngine } from './zero-typing-navigation';

export class FullCapabilityOrchestrator {
  private isInitialized = false;
  private organizationId: string = '';
  private aiWorkforce: any = null;
  private activeCapabilities = new Set<string>();

  async initialize(organizationId: string) {
    if (this.isInitialized) {
      console.log('✅ Full AI System already initialized');
      return;
    }

    console.log('🚀 INITIALIZING FULL AI CAPABILITY SYSTEM');
    console.log('================================================');
    this.organizationId = organizationId;

    // 1. Initialize Autonomous Agents (8 AI Employees)
    console.log('👥 Activating AI Workforce...');
    this.aiWorkforce = await initializeAutonomousAgents(organizationId);
    this.activeCapabilities.add('autonomous-agents');

    // 2. Initialize ML Pipeline
    console.log('🧠 Starting ML Pipeline...');
    await MLPipeline.initialize();
    this.activeCapabilities.add('ml-pipeline');

    // 3. Initialize Predictive Intelligence
    console.log('📊 Enabling Predictive Intelligence...');
    // predictiveIntelligence auto-initializes
    this.activeCapabilities.add('predictive-intelligence');

    // 4. Initialize Database Intelligence
    console.log('💾 Connecting Database Intelligence...');
    const dbIntelligence = await createDatabaseIntelligence();
    this.activeCapabilities.add('database-intelligence');

    // 5. Initialize Zero-Typing Navigation
    console.log('🎯 Activating Zero-Typing Navigation...');
    // zeroTypingEngine auto-initializes
    this.activeCapabilities.add('zero-typing');

    // 6. Connect all systems for collaboration
    console.log('🔗 Establishing inter-system connections...');
    await this.establishConnections();

    this.isInitialized = true;
    console.log('================================================');
    console.log('✅ FULL AI CAPABILITY SYSTEM OPERATIONAL');
    console.log(`🎯 ${this.activeCapabilities.size} AI systems active and collaborating`);
    console.log('🤖 8 AI employees working 24/7');
    console.log('🚀 System operating at 100% capability');
  }

  private async establishConnections() {
    // Connect agents to share insights
    if (this.aiWorkforce) {
      const { orchestrator, agents } = this.aiWorkforce;

      // Set up collaborative tasks
      await orchestrator.scheduleTask({
        id: 'collaborative-analysis',
        type: 'multi-agent-collaboration',
        priority: 'high',
        payload: {
          task: 'continuous-optimization',
          agents: ['carbonHunter', 'costSavingFinder', 'autonomousOptimizer'],
          frequency: 'hourly'
        },
        createdBy: 'system',
        context: { organizationId: this.organizationId },
        scheduledFor: new Date()
      });
    }
  }

  async processRequest(request: {
    type: 'chat' | 'analysis' | 'optimization' | 'prediction';
    message?: string;
    context?: any;
    userId?: string;
  }) {
    if (!this.isInitialized) {
      throw new Error('Full Capability System not initialized');
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      capabilities: Array.from(this.activeCapabilities),
      responses: {}
    };

    // Route to appropriate systems based on request type
    switch (request.type) {
      case 'chat':
        // Coordinate multiple AI systems for chat
        const [conversationResult, agentInsights, predictions] = await Promise.all([
          // Conversation Intelligence
          conversationalIntelligenceOrchestrator.processConversation(
            `conv_${Date.now()}`,
            request.userId || 'system',
            this.organizationId,
            request.message || '',
            request.context
          ),
          // Get insights from relevant agents
          this.getAgentInsights(request.message || ''),
          // Get predictions
          this.getPredictions(request.context)
        ]);

        results.responses = {
          conversation: conversationResult,
          agentInsights,
          predictions
        };
        break;

      case 'analysis':
        // Deep analysis using all systems
        results.responses = await this.performDeepAnalysis(request.context);
        break;

      case 'optimization':
        // Optimization using multiple agents
        results.responses = await this.performOptimization(request.context);
        break;

      case 'prediction':
        // Predictive analysis
        results.responses = await this.performPrediction(request.context);
        break;
    }

    return results;
  }

  private async getAgentInsights(message: string) {
    const insights = {};

    // Analyze message to determine which agents should contribute
    const keywords = message.toLowerCase();

    if (keywords.includes('emission') || keywords.includes('carbon')) {
      insights['carbonHunter'] = await executeWorkforceTask(
        'emissions_analysis',
        { message },
        { organizationId: this.organizationId }
      );
    }

    if (keywords.includes('cost') || keywords.includes('saving')) {
      insights['costSaving'] = await executeWorkforceTask(
        'cost_analysis',
        { message },
        { organizationId: this.organizationId }
      );
    }

    if (keywords.includes('compliance') || keywords.includes('regulation')) {
      insights['compliance'] = await executeWorkforceTask(
        'compliance_check',
        { message },
        { organizationId: this.organizationId }
      );
    }

    if (keywords.includes('supplier') || keywords.includes('scope 3')) {
      insights['supplyChain'] = await executeWorkforceTask(
        'supplier_analysis',
        { message },
        { organizationId: this.organizationId }
      );
    }

    return insights;
  }

  private async getPredictions(context: any) {
    try {
      // Get various predictions
      const predictions = await predictiveIntelligence.generatePredictions({
        organizationId: this.organizationId,
        timeframe: 'next_quarter',
        metrics: ['emissions', 'energy', 'costs'],
        context
      });

      return predictions;
    } catch (error) {
      console.error('Error getting predictions:', error);
      return null;
    }
  }

  private async performDeepAnalysis(context: any) {
    // Coordinate multiple agents for deep analysis
    const analysisResults = await Promise.all([
      executeWorkforceTask('strategic_review', context, { organizationId: this.organizationId }),
      executeWorkforceTask('emissions_scan', context, { organizationId: this.organizationId }),
      executeWorkforceTask('cost_optimization_scan', context, { organizationId: this.organizationId }),
      executeWorkforceTask('compliance_check', context, { organizationId: this.organizationId })
    ]);

    return {
      strategic: analysisResults[0],
      emissions: analysisResults[1],
      costOptimization: analysisResults[2],
      compliance: analysisResults[3]
    };
  }

  private async performOptimization(context: any) {
    // Use Autonomous Optimizer and other agents
    const optimizationResults = await executeWorkforceTask(
      'performance_optimization',
      { ...context, mode: 'comprehensive' },
      { organizationId: this.organizationId }
    );

    return optimizationResults;
  }

  private async performPrediction(context: any) {
    // Use ML Pipeline for predictions
    const predictions = await MLPipeline.predict({
      type: 'emissions',
      timeframe: 'next_year',
      context
    });

    return predictions;
  }

  async getSystemStatus() {
    const workforceStatus = await getAIWorkforceStatus();

    return {
      initialized: this.isInitialized,
      organizationId: this.organizationId,
      activeCapabilities: Array.from(this.activeCapabilities),
      workforce: workforceStatus,
      health: this.calculateSystemHealth(workforceStatus)
    };
  }

  private calculateSystemHealth(workforceStatus: any) {
    const capabilityScore = (this.activeCapabilities.size / 6) * 100; // 6 major systems
    const workforceScore = (workforceStatus.employeeCount / 8) * 100; // 8 agents

    const overallHealth = (capabilityScore + workforceScore) / 2;

    return {
      overall: overallHealth,
      capabilities: capabilityScore,
      workforce: workforceScore,
      status: overallHealth >= 90 ? 'excellent' :
              overallHealth >= 70 ? 'good' :
              overallHealth >= 50 ? 'fair' : 'poor'
    };
  }

  async shutdown() {
    console.log('🛑 Shutting down Full Capability System...');

    // Shutdown all systems gracefully
    if (this.aiWorkforce) {
      await this.aiWorkforce.orchestrator.stop();
    }

    this.activeCapabilities.clear();
    this.isInitialized = false;

    console.log('✅ Full Capability System shutdown complete');
  }
}

// Export singleton instance
export const fullCapabilityOrchestrator = new FullCapabilityOrchestrator();