import { conversationalEngine, ConversationalEngine } from '../ai/conversational-engine';
import { AgentManager } from '../ai/autonomous-agents/agent-manager';
import { createClient } from '@supabase/supabase-js';
import { ExternalAPIManager } from '../data/external-api-manager';
import { MLDeploymentService } from '../ml/model-deployment-service';
import { NetworkIntelligenceService } from '../network/network-intelligence-service';
import { telemetry } from '../monitoring/telemetry';

export interface UserRequest {
  message: string;
  userId: string;
  organizationId: string;
  context?: any;
}

export interface OrchestratorResponse {
  message: string;
  components?: any[];
  actions?: string[];
  data?: any;
  metadata?: {
    agent?: string;
    executionTime?: number;
    dataSource?: string;
  };
}

export class UnifiedOrchestrator {
  private conversationEngine: any;
  private agentManager: AgentManager;
  private externalAPIs: ExternalAPIManager;
  private mlService: MLDeploymentService;
  private networkService: NetworkIntelligenceService;
  private supabase: any;

  constructor() {
    // Initialize all components
    this.conversationEngine = conversationalEngine;
    this.agentManager = AgentManager.getInstance();
    this.externalAPIs = ExternalAPIManager.getInstance();
    this.mlService = MLDeploymentService.getInstance();
    this.networkService = NetworkIntelligenceService.getInstance();
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Main entry point for processing user messages
   */
  async processUserMessage(request: UserRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    
    // Start telemetry span
    const span = telemetry.createSpan('orchestrator.processMessage', {
      userId: request.userId,
      organizationId: request.organizationId
    });
    
    try {
      // 1. Analyze user intent
      const intent = await this.analyzeIntent(request.message);
      console.log(`🧠 Intent detected: ${intent.type} (${intent.confidence}% confidence)`);

      // 2. Build comprehensive context
      const context = await this.buildContext(request, intent);

      // 3. Route to appropriate handler based on intent
      let response: OrchestratorResponse;
      
      switch (intent.type) {
        case 'esg_analysis':
          response = await this.handleESGAnalysis(request, intent, context);
          break;
          
        case 'compliance_check':
          response = await this.handleComplianceCheck(request, intent, context);
          break;
          
        case 'emission_query':
          response = await this.handleEmissionQuery(request, intent, context);
          break;
          
        case 'supply_chain_analysis':
          response = await this.handleSupplyChainAnalysis(request, intent, context);
          break;
          
        case 'prediction_request':
          response = await this.handlePredictionRequest(request, intent, context);
          break;
          
        case 'target_management':
          response = await this.handleTargetManagement(request, intent, context);
          break;
          
        case 'benchmark_request':
          response = await this.handleBenchmarkRequest(request, intent, context);
          break;
          
        case 'network_intelligence':
          response = await this.handleNetworkIntelligence(request, intent, context);
          break;
          
        default:
          // Fallback to conversational AI
          response = await this.handleGeneralConversation(request, intent, context);
      }

      // 4. Enrich response with metadata
      response.metadata = {
        ...response.metadata,
        executionTime: Date.now() - startTime
      };

      // 5. Log interaction for learning
      await this.logInteraction(request, intent, response);

      // Record telemetry
      telemetry.recordBusinessMetric('message', 1, {
        intent: intent.type,
        organization: request.organizationId
      });

      span.setStatus({ code: 1 }); // Success
      span.end();

      return response;

    } catch (error) {
      console.error('❌ Orchestrator error:', error);
      
      span.setStatus({ code: 2, message: error.message });
      span.recordException(error as Error);
      span.end();
      
      return {
        message: 'I encountered an error processing your request. Please try again.',
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Analyze user intent using NLP
   */
  private async analyzeIntent(message: string): Promise<any> {
    // Intent patterns
    const intentPatterns = [
      { pattern: /esg|sustainability|environmental.*social.*governance/i, type: 'esg_analysis' },
      { pattern: /complian|regulation|csrd|gri|tcfd/i, type: 'compliance_check' },
      { pattern: /emission|carbon|co2|ghg|scope [123]/i, type: 'emission_query' },
      { pattern: /supplier|supply chain|vendor/i, type: 'supply_chain_analysis' },
      { pattern: /predict|forecast|trend|future/i, type: 'prediction_request' },
      { pattern: /target|goal|commitment|sbti/i, type: 'target_management' },
      { pattern: /benchmark|peer|compare|industry average/i, type: 'benchmark_request' },
      { pattern: /network|collective|best practice|peer learning/i, type: 'network_intelligence' }
    ];

    // Check patterns
    for (const { pattern, type } of intentPatterns) {
      if (pattern.test(message)) {
        return { type, confidence: 85 };
      }
    }

    // Use conversational AI for complex intent analysis
    // The conversational engine uses 'chat' method, not analyzeIntent
    return { type: 'general', confidence: 50 };
  }

  /**
   * Build comprehensive context from all data sources
   */
  private async buildContext(request: UserRequest, intent: any): Promise<any> {
    const context: any = {
      user: { id: request.userId, organizationId: request.organizationId },
      intent,
      timestamp: new Date().toISOString()
    };

    // Get relevant data based on intent
    if (intent.type.includes('esg') || intent.type.includes('emission')) {
      // Fetch recent emissions data
      const { data: emissions } = await this.supabase
        .from('emissions_data')
        .select('*')
        .eq('organization_id', request.organizationId)
        .order('period_start', { ascending: false })
        .limit(10);
      
      context.recentEmissions = emissions;
    }

    if (intent.type.includes('compliance')) {
      // Check compliance status
      const { data: compliance } = await this.supabase
        .from('csrd_data_completeness')
        .select('*')
        .eq('organization_id', request.organizationId)
        .single();
      
      context.complianceStatus = compliance;
    }

    // Get agent insights if available
    const agentInsights = await this.getRelevantAgentInsights(intent.type);
    if (agentInsights) {
      context.agentInsights = agentInsights;
    }

    return context;
  }

  /**
   * Handle ESG analysis requests using ESG Chief of Staff agent
   */
  private async handleESGAnalysis(
    request: UserRequest,
    intent: any,
    context: any
  ): Promise<OrchestratorResponse> {
    try {
      // Get ESG Chief agent
      const esgChief = await this.agentManager.getAgent('esg-chief-of-staff');
      if (!esgChief) {
        throw new Error('ESG Chief agent not available');
      }

      // Execute comprehensive analysis
      const analysis = await esgChief.executeTask({
        type: 'comprehensive-analysis',
        organizationId: request.organizationId,
        specificRequest: request.message
      });

      // Format response with dynamic UI components
      return {
        message: `Based on my analysis of your ESG performance:\n\n${analysis.summary}`,
        components: [
          {
            type: 'ESGScoreCard',
            data: {
              environmental: analysis.scores?.environmental || 0,
              social: analysis.scores?.social || 0,
              governance: analysis.scores?.governance || 0,
              overall: analysis.scores?.overall || 0
            }
          },
          {
            type: 'MetricsTrend',
            data: analysis.trends
          },
          {
            type: 'ActionItems',
            data: analysis.recommendations
          }
        ],
        actions: analysis.recommendations?.map((r: any) => r.action) || [],
        data: analysis,
        metadata: {
          agent: 'esg-chief-of-staff',
          dataSource: 'real-time-analysis'
        }
      };
    } catch (error) {
      console.error('ESG analysis error:', error);
      return {
        message: 'I need to gather more data for a comprehensive ESG analysis. Let me check specific metrics for you.',
        components: [],
        metadata: { agent: 'esg-chief-of-staff' }
      };
    }
  }

  /**
   * Handle compliance check requests using Compliance Guardian agent
   */
  private async handleComplianceCheck(
    request: UserRequest,
    intent: any,
    context: any
  ): Promise<OrchestratorResponse> {
    try {
      // Get Compliance Guardian agent
      const complianceGuardian = await this.agentManager.getAgent('compliance-guardian');
      if (!complianceGuardian) {
        throw new Error('Compliance Guardian agent not available');
      }

      // Run compliance check
      const complianceCheck = await complianceGuardian.executeTask({
        type: 'compliance-assessment',
        organizationId: request.organizationId,
        frameworks: this.extractFrameworks(request.message)
      });

      // Format response
      return {
        message: `Here's your compliance status:\n\n${complianceCheck.summary}`,
        components: [
          {
            type: 'ComplianceGauge',
            data: {
              csrd: complianceCheck.csrdScore || 0,
              gri: complianceCheck.griScore || 0,
              tcfd: complianceCheck.tcfdScore || 0
            }
          },
          {
            type: 'ComplianceGaps',
            data: complianceCheck.gaps
          },
          {
            type: 'UpcomingDeadlines',
            data: complianceCheck.deadlines
          }
        ],
        actions: complianceCheck.recommendations,
        data: complianceCheck,
        metadata: {
          agent: 'compliance-guardian',
          dataSource: 'compliance-analysis'
        }
      };
    } catch (error) {
      console.error('Compliance check error:', error);
      return {
        message: 'Let me check your compliance status against major frameworks.',
        components: [],
        metadata: { agent: 'compliance-guardian' }
      };
    }
  }

  /**
   * Handle emission queries with real data
   */
  private async handleEmissionQuery(
    request: UserRequest,
    intent: any,
    context: any
  ): Promise<OrchestratorResponse> {
    try {
      // Get Carbon Hunter agent for advanced analysis
      const carbonHunter = await this.agentManager.getAgent('carbon-hunter');
      
      // Get emissions data
      const { data: emissions } = await this.supabase
        .from('emissions_data')
        .select('*')
        .eq('organization_id', request.organizationId)
        .order('period_start', { ascending: false })
        .limit(12);

      // Calculate totals and trends
      const currentMonth = emissions?.[0];
      const lastMonth = emissions?.[1];
      const yearTotal = emissions?.reduce((sum, e) => sum + (e.co2e_kg || 0), 0) || 0;
      
      const trend = lastMonth 
        ? ((currentMonth.co2e_kg - lastMonth.co2e_kg) / lastMonth.co2e_kg) * 100 
        : 0;

      // Get reduction opportunities if Carbon Hunter is available
      let opportunities = [];
      if (carbonHunter) {
        const analysis = await carbonHunter.executeTask({
          type: 'find-opportunities',
          organizationId: request.organizationId
        });
        opportunities = analysis.opportunities || [];
      }

      return {
        message: `Your current emissions are ${(currentMonth?.co2e_kg / 1000).toFixed(1)} tCO2e this month, ${Math.abs(trend).toFixed(1)}% ${trend > 0 ? 'higher' : 'lower'} than last month.\n\nYear-to-date: ${(yearTotal / 1000).toFixed(1)} tCO2e`,
        components: [
          {
            type: 'EmissionsChart',
            data: emissions?.map(e => ({
              date: e.period_start,
              value: e.co2e_kg / 1000,
              scope: e.scope
            }))
          },
          {
            type: 'ReductionOpportunities',
            data: opportunities
          }
        ],
        actions: opportunities.map(o => o.action),
        data: { emissions, opportunities },
        metadata: {
          agent: carbonHunter ? 'carbon-hunter' : 'direct-query',
          dataSource: 'emissions_data'
        }
      };
    } catch (error) {
      console.error('Emission query error:', error);
      return {
        message: 'I\'m having trouble accessing emission data. Please check your data connections.',
        components: [],
        metadata: { dataSource: 'emissions_data' }
      };
    }
  }

  /**
   * Handle supply chain analysis requests
   */
  private async handleSupplyChainAnalysis(
    request: UserRequest,
    intent: any,
    context: any
  ): Promise<OrchestratorResponse> {
    try {
      // Get Supply Chain Investigator agent
      const supplyChainInvestigator = await this.agentManager.getAgent('supply-chain-investigator');
      if (!supplyChainInvestigator) {
        throw new Error('Supply Chain Investigator agent not available');
      }

      // Run supply chain analysis
      const analysis = await supplyChainInvestigator.executeTask({
        type: 'comprehensive-assessment',
        organizationId: request.organizationId
      });

      return {
        message: `Supply chain analysis complete:\n\n${analysis.summary}`,
        components: [
          {
            type: 'SupplierRiskMatrix',
            data: analysis.riskMatrix
          },
          {
            type: 'SupplyChainMap',
            data: analysis.geographicData
          },
          {
            type: 'SupplierScorecard',
            data: analysis.topSuppliers
          }
        ],
        actions: analysis.recommendations,
        data: analysis,
        metadata: {
          agent: 'supply-chain-investigator',
          dataSource: 'supplier-analysis'
        }
      };
    } catch (error) {
      console.error('Supply chain analysis error:', error);
      return {
        message: 'Let me analyze your supply chain data.',
        components: [],
        metadata: { agent: 'supply-chain-investigator' }
      };
    }
  }

  /**
   * Handle prediction requests using ML models
   */
  private async handlePredictionRequest(
    request: UserRequest,
    intent: any,
    context: any
  ): Promise<OrchestratorResponse> {
    try {
      // Determine prediction type from message
      const predictionType = this.extractPredictionType(request.message);
      
      let prediction: any;
      let message: string;
      let components: any[] = [];

      switch (predictionType) {
        case 'emissions':
          // Get emissions prediction
          prediction = await this.mlService.predictEmissions({
            organizationId: request.organizationId,
            timeframe: this.extractTimeframe(request.message) || 'week'
          });

          message = `Based on my analysis, your predicted emissions for the next ${this.extractTimeframe(request.message) || 'week'} are ${prediction.predicted.toFixed(1)} tCO2e (${prediction.confidence * 100}% confidence).\n\n`;
          
          if (prediction.predicted > prediction.baseline) {
            message += `This is ${((prediction.predicted - prediction.baseline) / prediction.baseline * 100).toFixed(1)}% higher than your baseline.`;
          } else {
            message += `This is ${((prediction.baseline - prediction.predicted) / prediction.baseline * 100).toFixed(1)}% lower than your baseline!`;
          }

          components = [
            {
              type: 'PredictionChart',
              data: {
                baseline: prediction.baseline,
                predicted: prediction.predicted,
                confidence: prediction.confidence
              }
            },
            {
              type: 'ImpactFactors',
              data: prediction.factors
            }
          ];
          break;

        case 'energy':
          // Get energy optimization recommendations
          const { data: currentUsage } = await this.supabase
            .from('energy_consumption')
            .select('total_kwh')
            .eq('organization_id', request.organizationId)
            .order('timestamp', { ascending: false })
            .limit(1);

          prediction = await this.mlService.optimizeEnergy({
            buildingId: context.buildingId || 'default',
            currentUsage: currentUsage?.[0]?.total_kwh || 1000
          });

          message = `I've analyzed your energy usage patterns and identified ${prediction.recommendations.length} optimization opportunities that could save ${prediction.totalSavings.toFixed(0)} kWh and reduce emissions by ${prediction.emissionsReduction.toFixed(1)} tCO2e.`;

          components = [
            {
              type: 'OptimizationList',
              data: prediction.recommendations
            },
            {
              type: 'SavingsMetrics',
              data: {
                energy: prediction.totalSavings,
                emissions: prediction.emissionsReduction
              }
            }
          ];
          break;

        case 'compliance':
          // Assess compliance risk
          prediction = await this.mlService.assessComplianceRisk({
            organizationId: request.organizationId,
            frameworks: ['CSRD', 'GRI', 'TCFD']
          });

          message = `Your compliance risk assessment shows ${prediction.overallRisk} risk (score: ${prediction.riskScore.toFixed(2)}).\n\n`;
          message += `Key risk factors:\n`;
          prediction.riskFactors.forEach((factor: any) => {
            message += `• ${factor.factor}: ${factor.severity}/10\n`;
          });

          components = [
            {
              type: 'RiskGauge',
              data: {
                score: prediction.riskScore,
                level: prediction.overallRisk
              }
            },
            {
              type: 'RiskTimeline',
              data: prediction.timeline
            }
          ];
          break;

        default:
          message = 'I can provide predictions for emissions, energy optimization, and compliance risk. What would you like me to predict?';
      }

      return {
        message,
        components,
        actions: prediction?.recommendations?.map((r: any) => r.action) || [],
        data: { prediction },
        metadata: {
          dataSource: 'ml-models',
          agent: 'ml-predictor'
        }
      };

    } catch (error) {
      console.error('Prediction error:', error);
      return {
        message: 'I encountered an error generating predictions. Please try again.',
        components: [],
        metadata: { dataSource: 'ml-models' }
      };
    }
  }

  /**
   * Extract prediction type from message
   */
  private extractPredictionType(message: string): string {
    if (/emission|carbon|co2/i.test(message)) return 'emissions';
    if (/energy|power|electricity/i.test(message)) return 'energy';
    if (/compliance|risk|regulation/i.test(message)) return 'compliance';
    return 'general';
  }

  /**
   * Extract timeframe from message
   */
  private extractTimeframe(message: string): 'day' | 'week' | 'month' | null {
    if (/day|daily|tomorrow/i.test(message)) return 'day';
    if (/week|weekly/i.test(message)) return 'week';
    if (/month|monthly/i.test(message)) return 'month';
    return null;
  }

  /**
   * Handle target management requests
   */
  private async handleTargetManagement(
    request: UserRequest,
    intent: any,
    context: any
  ): Promise<OrchestratorResponse> {
    try {
      // Get sustainability targets
      const { data: targets } = await this.supabase
        .from('sustainability_targets')
        .select('*')
        .eq('organization_id', request.organizationId);

      return {
        message: `You have ${targets?.length || 0} active sustainability targets.`,
        components: [
          {
            type: 'TargetProgress',
            data: targets?.map(t => ({
              name: t.target_type,
              baseline: t.baseline_value,
              current: t.current_value,
              target: t.target_value,
              year: t.target_year,
              onTrack: t.on_track
            }))
          }
        ],
        actions: ['Review targets', 'Update progress', 'Add new target'],
        data: { targets },
        metadata: { dataSource: 'sustainability_targets' }
      };
    } catch (error) {
      console.error('Target management error:', error);
      return {
        message: 'Let me check your sustainability targets.',
        components: [],
        metadata: { dataSource: 'sustainability_targets' }
      };
    }
  }

  /**
   * Handle general conversation
   */
  private async handleGeneralConversation(
    request: UserRequest,
    intent: any,
    context: any
  ): Promise<OrchestratorResponse> {
    // Use conversational AI for general queries
    const response = await this.conversationEngine.chat(
      request.message,
      request.userId,
      request.organizationId
    );

    return {
      message: response.response || 'How can I help you with your sustainability goals?',
      components: response.visualizations || [],
      actions: response.actions || [],
      data: response,
      metadata: {
        dataSource: 'conversational-ai'
      }
    };
  }

  /**
   * Get relevant insights from agents
   */
  private async getRelevantAgentInsights(intentType: string): Promise<any> {
    try {
      // Map intent types to agents
      const agentMapping: Record<string, string> = {
        'esg_analysis': 'esg-chief-of-staff',
        'compliance_check': 'compliance-guardian',
        'emission_query': 'carbon-hunter',
        'supply_chain_analysis': 'supply-chain-investigator'
      };

      const agentId = agentMapping[intentType];
      if (!agentId) return null;

      // Get latest insights from agent
      const { data: insights } = await this.supabase
        .from('agent_insights')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1);

      return insights?.[0];
    } catch (error) {
      console.error('Error fetching agent insights:', error);
      return null;
    }
  }

  /**
   * Extract frameworks from message
   */
  private extractFrameworks(message: string): string[] {
    const frameworks = [];
    const frameworkPatterns = [
      { pattern: /csrd/i, framework: 'CSRD' },
      { pattern: /gri/i, framework: 'GRI' },
      { pattern: /tcfd/i, framework: 'TCFD' },
      { pattern: /cdp/i, framework: 'CDP' },
      { pattern: /sasb/i, framework: 'SASB' }
    ];

    for (const { pattern, framework } of frameworkPatterns) {
      if (pattern.test(message)) {
        frameworks.push(framework);
      }
    }

    return frameworks.length > 0 ? frameworks : ['CSRD', 'GRI', 'TCFD'];
  }

  /**
   * Handle benchmark requests
   */
  private async handleBenchmarkRequest(
    request: UserRequest,
    intent: any,
    context: any
  ): Promise<OrchestratorResponse> {
    try {
      // Initialize network for organization
      await this.networkService.initializeForOrganization(request.organizationId);

      // Extract what to benchmark
      const metric = this.extractBenchmarkMetric(request.message);
      
      if (!metric) {
        // Get comprehensive peer comparison
        const comparison = await this.networkService.performBenchmarking(
          request.organizationId,
          'total_emissions',
          'emissions'
        );

        return {
          message: 'I can benchmark your performance against industry peers. What specific metric would you like to compare? (e.g., emissions, energy intensity, waste diversion)',
          components: [
            {
              type: 'BenchmarkOptions',
              data: {
                availableMetrics: [
                  'Total Emissions',
                  'Energy Intensity', 
                  'Waste Diversion Rate',
                  'Water Usage',
                  'Employee Satisfaction'
                ]
              }
            }
          ],
          actions: ['Compare emissions', 'Compare energy', 'View all benchmarks'],
          metadata: { dataSource: 'network-intelligence' }
        };
      }

      // Perform specific benchmark
      const benchmark = await this.networkService.performBenchmarking(
        request.organizationId,
        metric,
        this.getMetricCategory(metric)
      );

      return {
        message: `Here's how you compare to your industry peers for ${metric.replace('_', ' ')}:\n\n${benchmark.insights.join('\n')}`,
        components: [
          {
            type: 'BenchmarkGauge',
            data: {
              metric,
              yourValue: benchmark.organizationPosition,
              peerAverage: benchmark.industryAverage,
              percentile: benchmark.percentile,
              topPerformers: benchmark.topPerformers
            }
          },
          {
            type: 'ImprovementOpportunity',
            data: {
              currentGap: benchmark.improvementOpportunity,
              recommendations: benchmark.recommendations
            }
          }
        ],
        actions: benchmark.recommendations.slice(0, 3),
        data: { benchmark },
        metadata: {
          dataSource: 'peer-benchmarking',
          anonymizedPeers: benchmark.anonymizedPeers
        }
      };

    } catch (error) {
      console.error('Benchmark request error:', error);
      return {
        message: 'I need to connect you to our peer benchmarking network. Let me set that up for you.',
        components: [],
        metadata: { dataSource: 'network-intelligence' }
      };
    }
  }

  /**
   * Handle network intelligence requests
   */
  private async handleNetworkIntelligence(
    request: UserRequest,
    intent: any,
    context: any
  ): Promise<OrchestratorResponse> {
    try {
      // Get comprehensive network insights
      const insights = await this.networkService.getNetworkInsights(
        request.organizationId
      );

      // Get collective learning
      const learning = await this.networkService.getCollectiveLearning(
        request.organizationId
      );

      // Get network metrics
      const metrics = await this.networkService.getNetworkMetrics(
        request.organizationId
      );

      if (!metrics.connected) {
        return {
          message: 'You\'re not yet connected to the sustainability network. Would you like me to connect you to unlock peer insights and collective intelligence?',
          components: [
            {
              type: 'NetworkBenefits',
              data: {
                benefits: [
                  'Anonymous peer benchmarking',
                  'Industry best practices',
                  'Collective intelligence insights',
                  'Supply chain collaboration',
                  'Early trend detection'
                ]
              }
            }
          ],
          actions: ['Connect to network', 'Learn more'],
          metadata: { dataSource: 'network-intelligence' }
        };
      }

      // Format insights
      const topInsights = insights.slice(0, 5);
      const insightSummary = topInsights.map(i => 
        `• ${i.title} (${i.impact} impact)`
      ).join('\n');

      return {
        message: `Based on collective intelligence from ${metrics.networkEffects.networkSize} organizations, here are your key insights:\n\n${insightSummary}\n\nYou're connected to ${metrics.connections.totalConnections} peers, with access to ${metrics.benchmarksAvailable} industry benchmarks.`,
        components: [
          {
            type: 'NetworkInsights',
            data: {
              insights: topInsights,
              patterns: learning.patterns.slice(0, 3),
              predictions: learning.predictions.slice(0, 2)
            }
          },
          {
            type: 'NetworkMetrics',
            data: {
              networkSize: metrics.networkEffects.networkSize,
              yourConnections: metrics.connections.totalConnections,
              collectiveInsights: metrics.networkEffects.collectiveInsights,
              improvementRate: `${(metrics.networkEffects.improvementRate * 100).toFixed(1)}%`
            }
          },
          {
            type: 'ActionableRecommendations',
            data: learning.recommendations.slice(0, 5)
          }
        ],
        actions: learning.recommendations.slice(0, 3).map(r => r.action),
        data: { insights, learning, metrics },
        metadata: {
          dataSource: 'collective-intelligence',
          networkSize: metrics.networkEffects.networkSize
        }
      };

    } catch (error) {
      console.error('Network intelligence error:', error);
      return {
        message: 'Let me check your network intelligence status.',
        components: [],
        metadata: { dataSource: 'network-intelligence' }
      };
    }
  }

  /**
   * Extract benchmark metric from message
   */
  private extractBenchmarkMetric(message: string): string | null {
    const metricPatterns = [
      { pattern: /emission|carbon|co2|ghg/i, metric: 'total_emissions' },
      { pattern: /energy.*intensity|energy.*efficiency/i, metric: 'energy_intensity' },
      { pattern: /waste.*divert|recycl/i, metric: 'waste_diverted' },
      { pattern: /water|h2o/i, metric: 'water_usage' },
      { pattern: /employee.*satisf|staff.*happy/i, metric: 'employee_satisfaction' },
      { pattern: /board.*divers|leadership.*divers/i, metric: 'board_diversity' }
    ];

    for (const { pattern, metric } of metricPatterns) {
      if (pattern.test(message)) {
        return metric;
      }
    }

    return null;
  }

  /**
   * Get metric category
   */
  private getMetricCategory(metric: string): 'emissions' | 'energy' | 'waste' | 'water' | 'social' | 'governance' {
    const categoryMap: Record<string, any> = {
      'total_emissions': 'emissions',
      'energy_intensity': 'energy',
      'waste_diverted': 'waste',
      'water_usage': 'water',
      'employee_satisfaction': 'social',
      'board_diversity': 'governance'
    };

    return categoryMap[metric] || 'emissions';
  }

  /**
   * Log interaction for learning and analytics
   */
  private async logInteraction(
    request: UserRequest,
    intent: any,
    response: OrchestratorResponse
  ): Promise<void> {
    try {
      await this.supabase.from('interaction_logs').insert({
        user_id: request.userId,
        organization_id: request.organizationId,
        message: request.message,
        intent_type: intent.type,
        intent_confidence: intent.confidence,
        response_agent: response.metadata?.agent,
        response_time_ms: response.metadata?.executionTime,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }
}