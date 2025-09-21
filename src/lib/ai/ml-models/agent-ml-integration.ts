/**
 * ML Models and Autonomous Agents Integration Layer - Phase 2 Implementation
 * Seamless integration between ML pipeline and AI agents for intelligent decision-making
 */

import { EventEmitter } from 'events';
import { EnhancedMLPipeline } from './enhanced-pipeline-v2';
import { EmissionsForecastingModel, ComplianceRiskModel } from './predictive-models-suite';
import { AdvancedAnalyticsEngine } from './advanced-analytics-engines';
import { ModelServingManager } from './model-serving-infrastructure';
import { ABTestingFramework } from './ab-testing-framework';

// Enhanced integration interfaces
export interface AgentMLCapability {
  id: string;
  name: string;
  type: 'prediction' | 'optimization' | 'analysis' | 'monitoring' | 'compliance';
  domain: 'emissions' | 'energy' | 'compliance' | 'risk' | 'performance';
  inputs: CapabilityInput[];
  outputs: CapabilityOutput[];
  models: string[];
  confidence: number;
  latency: number;
  description: string;
}

export interface CapabilityInput {
  name: string;
  type: 'historical_data' | 'real_time_data' | 'context' | 'parameters';
  required: boolean;
  format: 'time_series' | 'object' | 'array' | 'scalar';
  schema?: any;
}

export interface CapabilityOutput {
  name: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'insight' | 'visualization';
  format: 'json' | 'chart' | 'table' | 'text';
  confidence?: boolean;
  explanation?: boolean;
}

export interface AutonomousAgent {
  id: string;
  name: string;
  type: string;
  capabilities: AgentMLCapability[];
  status: 'active' | 'inactive' | 'training' | 'error';
  version: string;
  performance: AgentPerformance;
  configuration: AgentConfiguration;
}

export interface AgentPerformance {
  accuracy: number;
  latency: number;
  throughput: number;
  reliability: number;
  userSatisfaction: number;
  resourceUtilization: number;
}

export interface AgentConfiguration {
  modelPreferences: ModelPreference[];
  decisionThresholds: Record<string, number>;
  learningEnabled: boolean;
  explainabilityLevel: 'basic' | 'detailed' | 'technical';
  adaptationRate: number;
  fallbackStrategies: FallbackStrategy[];
}

export interface ModelPreference {
  modelType: string;
  priority: number;
  constraints: ModelConstraint[];
  fallbacks: string[];
}

export interface ModelConstraint {
  type: 'accuracy' | 'latency' | 'cost' | 'availability';
  threshold: number;
  operator: '>=' | '<=' | '=' | '>' | '<';
}

export interface FallbackStrategy {
  trigger: 'model_unavailable' | 'low_confidence' | 'high_latency' | 'error';
  action: 'use_fallback_model' | 'use_rule_based' | 'escalate_to_human' | 'delay_response';
  parameters: Record<string, any>;
}

export interface AgentRequest {
  id: string;
  agentId: string;
  capability: string;
  input: any;
  context: RequestContext;
  options: RequestOptions;
  timestamp: Date;
}

export interface RequestContext {
  user?: { id: string; role: string; preferences: Record<string, any> };
  session?: { id: string; history: any[] };
  organization?: { id: string; domain: string; constraints: string[] };
  environment?: { deployment: string; region: string; features: string[] };
  business?: { objectives: string[]; constraints: string[]; priorities: Record<string, number> };
}

export interface RequestOptions {
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout?: number;
  explanation?: boolean;
  confidence?: boolean;
  caching?: boolean;
  fallback?: boolean;
  abTesting?: boolean;
}

export interface AgentResponse {
  id: string;
  agentId: string;
  capability: string;
  result: any;
  confidence: number;
  explanation?: ResponseExplanation;
  recommendations?: AgentRecommendation[];
  metadata: ResponseMetadata;
  performance: ResponsePerformance;
  timestamp: Date;
}

export interface ResponseExplanation {
  method: string;
  reasoning: string;
  keyFactors: ExplanationFactor[];
  modelContributions: ModelContribution[];
  alternatives?: Alternative[];
  visualizations?: VisualizationData[];
}

export interface ExplanationFactor {
  name: string;
  importance: number;
  value: any;
  description: string;
  confidence: number;
}

export interface ModelContribution {
  modelId: string;
  weight: number;
  confidence: number;
  prediction: any;
  reasoning: string;
}

export interface Alternative {
  option: string;
  confidence: number;
  tradeoffs: Tradeoff[];
  implementation: ImplementationDetails;
}

export interface Tradeoff {
  aspect: string;
  current: number;
  alternative: number;
  impact: number;
  description: string;
}

export interface ImplementationDetails {
  complexity: 'low' | 'medium' | 'high';
  timeline: number;
  resources: string[];
  risks: string[];
  dependencies: string[];
}

export interface VisualizationData {
  type: 'chart' | 'table' | 'map' | 'gauge' | 'graph';
  data: any;
  config: Record<string, any>;
  interactive: boolean;
}

export interface AgentRecommendation {
  id: string;
  type: 'action' | 'optimization' | 'investigation' | 'monitoring';
  priority: number;
  title: string;
  description: string;
  rationale: string;
  confidence: number;
  impact: ImpactAssessment;
  implementation: ImplementationGuidance;
  dependencies: string[];
  risks: RiskAssessment[];
}

export interface ImpactAssessment {
  business: { revenue?: number; cost?: number; efficiency?: number };
  environmental: { emissions?: number; energy?: number; waste?: number };
  operational: { productivity?: number; quality?: number; reliability?: number };
  compliance: { risk?: number; readiness?: number };
}

export interface ImplementationGuidance {
  steps: ImplementationStep[];
  timeline: number;
  resources: ResourceRequirement[];
  success: SuccessMetric[];
  validation: ValidationCriteria[];
}

export interface ImplementationStep {
  order: number;
  title: string;
  description: string;
  duration: number;
  owner: string;
  dependencies: string[];
  deliverables: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'technical' | 'financial' | 'operational';
  description: string;
  quantity: number;
  duration: number;
  cost?: number;
}

export interface SuccessMetric {
  name: string;
  target: number;
  unit: string;
  measurement: string;
  frequency: string;
}

export interface ValidationCriteria {
  criterion: string;
  method: string;
  threshold: number;
  frequency: string;
}

export interface RiskAssessment {
  risk: string;
  probability: number;
  impact: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  contingency: string;
}

export interface ResponseMetadata {
  models: ModelUsageInfo[];
  processingTime: number;
  cacheHit: boolean;
  fallbackUsed: boolean;
  abTestVariant?: string;
  version: string;
  debug?: DebugInfo;
}

export interface ModelUsageInfo {
  modelId: string;
  version: string;
  contribution: number;
  latency: number;
  confidence: number;
  status: 'success' | 'fallback' | 'error';
}

export interface ResponsePerformance {
  totalLatency: number;
  modelLatency: number;
  processingLatency: number;
  networkLatency: number;
  accuracy: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  gpu?: number;
  network: number;
  storage: number;
}

export interface DebugInfo {
  traceId: string;
  modelSelectionLog: ModelSelectionLog[];
  decisionTree: DecisionNode[];
  performanceBreakdown: PerformanceBreakdown;
}

export interface ModelSelectionLog {
  timestamp: Date;
  action: string;
  modelId: string;
  reasoning: string;
  score: number;
}

export interface DecisionNode {
  id: string;
  type: 'condition' | 'action' | 'model';
  description: string;
  outcome: string;
  confidence: number;
  children: string[];
}

export interface PerformanceBreakdown {
  phases: PerformancePhase[];
  bottlenecks: Bottleneck[];
  optimizations: OptimizationSuggestion[];
}

export interface PerformancePhase {
  name: string;
  duration: number;
  percentage: number;
  details: Record<string, any>;
}

export interface Bottleneck {
  component: string;
  impact: number;
  description: string;
  suggestion: string;
}

export interface OptimizationSuggestion {
  area: string;
  description: string;
  expectedImprovement: number;
  complexity: 'low' | 'medium' | 'high';
}

/**
 * Enhanced ML-Autonomous Agent Integration Manager
 */
export class MLAgentIntegration extends EventEmitter {
  private mlPipeline: EnhancedMLPipeline;
  private emissionsForecastingModel: EmissionsForecastingModel;
  private complianceRiskModel: ComplianceRiskModel;
  private analyticsEngine: AdvancedAnalyticsEngine;
  private modelServingManager: ModelServingManager;
  private abTestingFramework: ABTestingFramework;

  private agents: Map<string, AutonomousAgent> = new Map();
  private capabilities: Map<string, AgentMLCapability> = new Map();
  private activeRequests: Map<string, AgentRequest> = new Map();
  private performanceMetrics: Map<string, AgentPerformance> = new Map();
  private learningData: Map<string, LearningData[]> = new Map();
  private agentCapabilities: Map<string, MLCapability> = new Map();

  private isInitialized: boolean = false;

  constructor(
    mlPipeline: EnhancedMLPipeline,
    emissionsForecastingModel: EmissionsForecastingModel,
    complianceRiskModel: ComplianceRiskModel,
    analyticsEngine: AdvancedAnalyticsEngine,
    modelServingManager: ModelServingManager,
    abTestingFramework: ABTestingFramework
  ) {
    super();
    this.mlPipeline = mlPipeline;
    this.emissionsForecastingModel = emissionsForecastingModel;
    this.complianceRiskModel = complianceRiskModel;
    this.analyticsEngine = analyticsEngine;
    this.modelServingManager = modelServingManager;
    this.abTestingFramework = abTestingFramework;
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing ML-Agent Integration...');

    try {
      // Initialize all ML components
      await Promise.all([
        this.mlPipeline.initialize(),
        this.emissionsForecastingModel.initialize(),
        this.complianceRiskModel.initialize(),
        this.analyticsEngine.initialize(),
        this.modelServingManager.initialize(),
        this.abTestingFramework.initialize()
      ]);

      // Register default capabilities
      await this.registerDefaultCapabilities();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize performance monitoring
      this.initializePerformanceMonitoring();

      // Initialize agent capabilities
      this.initializeAgentCapabilities();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ ML-Agent Integration initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ML-Agent Integration:', error);
      throw error;
    }
  }

  /**
   * Process agent request with enhanced ML capabilities
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    this.ensureInitialized();

    const startTime = Date.now();
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🔄 Processing agent request: ${request.id} from ${request.agentId}`);

    try {
      // Store active request
      this.activeRequests.set(request.id, request);

      // Get agent and capability
      const agent = this.agents.get(request.agentId);
      const capability = this.capabilities.get(request.capability);

      if (!agent || !capability) {
        throw new Error(`Agent ${request.agentId} or capability ${request.capability} not found`);
      }

      // Select and execute appropriate models
      const modelResults = await this.executeModels(capability, request);

      // Generate explanation if requested
      const explanation = request.options.explanation
        ? await this.generateExplanation(modelResults, request)
        : undefined;

      // Generate recommendations
      const recommendations = await this.generateRecommendations(modelResults, request);

      // Process final result
      const result = await this.processModelResults(modelResults, capability);

      const processingTime = Date.now() - startTime;

      const response: AgentResponse = {
        id: request.id,
        agentId: request.agentId,
        capability: request.capability,
        result,
        confidence: this.calculateOverallConfidence(modelResults),
        explanation,
        recommendations,
        metadata: {
          models: modelResults.map(mr => ({
            modelId: mr.modelId,
            version: mr.version,
            contribution: mr.weight,
            latency: mr.latency,
            confidence: mr.confidence,
            status: mr.status
          })),
          processingTime,
          cacheHit: false,
          fallbackUsed: false,
          version: '2.0.0',
          debug: this.generateDebugInfo(traceId, modelResults)
        },
        performance: {
          totalLatency: processingTime,
          modelLatency: modelResults.reduce((sum, mr) => sum + mr.latency, 0),
          processingLatency: processingTime - modelResults.reduce((sum, mr) => sum + mr.latency, 0),
          networkLatency: 5, // Simulated
          accuracy: this.calculateOverallConfidence(modelResults),
          resourceUsage: {
            cpu: 45,
            memory: 256,
            network: 10,
            storage: 5
          }
        },
        timestamp: new Date()
      };

      // Record learning data
      await this.recordLearningData(request, response);

      // Update performance metrics
      await this.updatePerformanceMetrics(agent.id, response);

      this.activeRequests.delete(request.id);
      this.emit('request_processed', { request, response });

      return response;
    } catch (error) {
      this.activeRequests.delete(request.id);
      this.emit('request_failed', { request, error });
      throw error;
    }
  }

  /**
   * Enhance Carbon Hunter with advanced anomaly detection
   */
  async enhanceCarbonHunter(_agent: AutonomousAgent, context: {
    realtimeData: MetricData[];
    historicalData: MetricData[];
    thresholds: Record<string, number>;
  }): Promise<{
    detectedAnomalies: any[];
    emissionLeaks: any[];
    recommendations: string[];
    predictedTrends: any;
  }> {
    console.log('🔍 Enhancing Carbon Hunter with ML anomaly detection...');

    // Detect anomalies in real-time data using analytics engine
    const analyticsEngine = this.analyticsEngines.get('default');
    const detectedAnomalies = analyticsEngine ?
      await analyticsEngine.detectAnomalies(
        context.realtimeData,
        {
          method: 'ensemble',
          explanation: true
        }
      ) : [];

    // Identify potential emission leaks
    const emissionLeaks = detectedAnomalies
      .filter((anomaly: any) => 
        anomaly.isAnomaly && 
        anomaly.anomalyScore > 0.8 &&
        this.isEmissionRelated(anomaly)
      )
      .map((anomaly: any) => ({
        location: this.inferLocation(anomaly),
        severity: anomaly.anomalyScore,
        estimatedLeak: this.estimateLeakAmount(anomaly),
        explanation: anomaly.explanation,
        urgency: anomaly.anomalyScore > 0.9 ? 'critical' : 'high'
      }));

    // Generate hunting recommendations
    const recommendations = this.generateHuntingRecommendations(
      detectedAnomalies,
      emissionLeaks,
      context.historicalData
    );

    // Predict emission trends
    const historicalEmissions = this.convertMetricsToEmissions(context.historicalData);
    const predictedTrends = await this.mlPipeline.predict({
      type: 'emissions_prediction',
      data: historicalEmissions,
      options: { confidence: true }
    });

    return {
      detectedAnomalies,
      emissionLeaks,
      recommendations,
      predictedTrends: (predictedTrends as any).result || predictedTrends
    };
  }

  /**
   * Enhance Compliance Guardian with regulatory prediction
   */
  async enhanceComplianceGuardian(_agent: AutonomousAgent, context: {
    currentMetrics: any;
    regulations: any[];
    deadlines: any[];
  }): Promise<{
    complianceRisk: Record<string, number>;
    upcomingDeadlines: any[];
    recommendedActions: string[];
    regulatoryTrends: any[];
  }> {
    console.log('🛡️ Enhancing Compliance Guardian with ML predictions...');

    // Assess compliance risk for each regulation
    const complianceRisk: Record<string, number> = {};
    for (const regulation of context.regulations) {
      complianceRisk[regulation.id] = await this.predictComplianceRisk(
        context.currentMetrics,
        regulation
      );
    }

    // Prioritize upcoming deadlines by risk
    const upcomingDeadlines = context.deadlines
      .map(deadline => ({
        ...deadline,
        riskScore: complianceRisk[deadline.regulationId] || 0
      }))
      .sort((a, b) => b.riskScore - a.riskScore);

    // Generate action recommendations
    const recommendedActions = this.generateComplianceRecommendations(
      complianceRisk,
      upcomingDeadlines
    );

    // Analyze regulatory trends (placeholder)
    const regulatoryTrends = await this.analyzeRegulatoryTrends(context.regulations);

    return {
      complianceRisk,
      upcomingDeadlines,
      recommendedActions,
      regulatoryTrends
    };
  }

  /**
   * Enhance Supply Chain Investigator with ML-powered analysis
   */
  async enhanceSupplyChainInvestigator(_agent: AutonomousAgent, context: {
    suppliers: any[];
    supplyChainData: any[];
    riskFactors: string[];
    budget?: number;
    emissionsTarget?: number;
  }): Promise<{
    supplierRiskAssessment: Record<string, number>;
    optimizedSupplyChain: any;
    riskMitigationPlan: any[];
    supplyChainAnomalies: any[];
  }> {
    console.log('🕵️ Enhancing Supply Chain Investigator with ML analysis...');

    // Assess individual supplier risks
    const supplierRiskAssessment: Record<string, number> = {};
    for (const supplier of context.suppliers) {
      supplierRiskAssessment[supplier.id] = this.calculateSupplierRisk(
        supplier,
        context.riskFactors
      );
    }

    // Optimize supply chain configuration
    // Generate optimized supply chain configuration
    const optimizedSupplyChain = await this.generateResourceOptimization({
      resources: context.suppliers.map(s => ({
        name: s.id,
        min: 0,
        max: s.capacity,
        cost: s.cost,
        emissions: s.emissionsFactor,
        efficiency: 1 / supplierRiskAssessment[s.id]
      })),
      constraints: [
        { type: 'budget', value: context.budget || 100000 },
        { type: 'emissions', value: context.emissionsTarget || 1000 }
      ],
      objectives: [
        { name: 'cost', weight: 0.3, minimize: true },
        { name: 'emissions', weight: 0.4, minimize: true },
        { name: 'efficiency', weight: 0.3, minimize: false }
      ]
    });

    // Detect supply chain anomalies
    const supplyChainMetrics = this.convertSupplyChainToMetrics(context.supplyChainData);
    // Detect anomalies using analytics engine
    const supplyChainAnomalies = this.analyticsEngine ?
      await (this.analyticsEngine as any).detectAnomalies(
        supplyChainMetrics,
        { method: 'ensemble' }
      ) : [];

    // Generate risk mitigation plan
    const riskMitigationPlan = this.generateRiskMitigationPlan(
      supplierRiskAssessment,
      supplyChainAnomalies
    );

    return {
      supplierRiskAssessment,
      optimizedSupplyChain,
      riskMitigationPlan,
      supplyChainAnomalies
    };
  }

  /**
   * Get ML-enhanced insights for all agents
   */
  async getEnhancedInsights(context: {
    organizationId: string;
    timeRange: { start: Date; end: Date };
    metrics: MetricData[];
    emissions: EmissionsData[];
  }): Promise<{
    overallHealthScore: number;
    keyInsights: string[];
    predictiveAlerts: any[];
    optimizationOpportunities: any[];
    riskFactors: any[];
  }> {
    console.log('🧠 Generating ML-enhanced insights for all agents...');

    // Calculate overall health score
    const overallHealthScore = await this.calculateHealthScore(
      context.metrics,
      context.emissions
    );

    // Generate key insights
    const keyInsights = await this.generateKeyInsights(
      context.metrics,
      context.emissions
    );

    // Create predictive alerts
    const predictiveAlerts = await this.generatePredictiveAlerts(
      context.metrics,
      context.emissions
    );

    // Identify optimization opportunities
    const optimizationOpportunities = await this.identifyOptimizationOpportunities(
      context.metrics,
      context.emissions
    );

    // Assess risk factors
    const riskFactors = await this.assessRiskFactors(
      context.metrics,
      context.emissions
    );

    return {
      overallHealthScore,
      keyInsights,
      predictiveAlerts,
      optimizationOpportunities,
      riskFactors
    };
  }

  // Core processing methods
  private async executeModels(capability: AgentMLCapability, request: AgentRequest): Promise<ModelResult[]> {
    const results: ModelResult[] = [];

    for (const modelId of capability.models) {
      try {
        const startTime = Date.now();
        let result: any;
        let confidence = 0.8;

        switch (modelId) {
          case 'emissions_forecasting':
            result = await (this.emissionsForecastingModel as any).forecast({
              type: 'emissions_prediction',
              data: request.input.historicalData || [],
              options: { confidence: true }
            });
            confidence = result.confidence || 0.8;
            break;

          case 'compliance_risk':
            result = await this.complianceRiskModel.assessRisk({
              metrics: request.input.metrics || [],
              regulations: request.input.regulations || []
            });
            confidence = result.confidence || 0.8;
            break;

          case 'anomaly_detection':
            result = await (this.analyticsEngine as any).detectAnomalies({
              data: request.input.realtimeData || [],
              options: { method: 'ensemble', explanation: true }
            });
            confidence = result.confidence || 0.8;
            break;

          case 'optimization':
            result = await this.generateResourceOptimization({
              resources: request.input.resources || [],
              constraints: request.input.constraints || [],
              objectives: request.input.objectives || []
            });
            confidence = result.confidence || 0.8;
            break;

          default:
            result = { value: null, explanation: 'Model not implemented' };
            confidence = 0.1;
        }

        const latency = Date.now() - startTime;

        results.push({
          modelId,
          version: '1.0.0',
          result,
          confidence,
          latency,
          weight: 1.0 / capability.models.length,
          status: 'success'
        });
      } catch (error) {
        console.error(`Model ${modelId} execution failed:`, error);
        results.push({
          modelId,
          version: '1.0.0',
          result: null,
          confidence: 0,
          latency: 0,
          weight: 0,
          status: 'error'
        });
      }
    }

    return results;
  }

  private async generateExplanation(modelResults: ModelResult[], request: AgentRequest): Promise<ResponseExplanation> {
    const keyFactors: ExplanationFactor[] = [];
    const modelContributions: ModelContribution[] = [];

    // Extract key factors from model results
    for (const result of modelResults) {
      if (result.result?.explanation?.keyFactors) {
        keyFactors.push(...result.result.explanation.keyFactors);
      }

      modelContributions.push({
        modelId: result.modelId,
        weight: result.weight,
        confidence: result.confidence,
        prediction: result.result?.value || result.result,
        reasoning: result.result?.explanation?.reasoning || 'Model prediction based on historical patterns'
      });
    }

    return {
      method: 'ensemble_ml_prediction',
      reasoning: `Combined predictions from ${modelResults.length} ML models using weighted ensemble approach`,
      keyFactors: keyFactors.slice(0, 5), // Top 5 factors
      modelContributions,
      alternatives: [],
      visualizations: []
    };
  }

  private async generateRecommendations(modelResults: ModelResult[], request: AgentRequest): Promise<AgentRecommendation[]> {
    const recommendations: AgentRecommendation[] = [];

    // Analyze model results to generate actionable recommendations
    const avgConfidence = modelResults.reduce((sum, r) => sum + r.confidence, 0) / modelResults.length;

    if (avgConfidence > 0.8) {
      recommendations.push({
        id: `rec_${Date.now()}_1`,
        type: 'action',
        priority: 1,
        title: 'High Confidence Prediction Available',
        description: 'ML models show high confidence in predictions. Consider taking immediate action.',
        rationale: `Average model confidence: ${(avgConfidence * 100).toFixed(1)}%`,
        confidence: avgConfidence,
        impact: {
          business: { efficiency: 0.15 },
          environmental: { emissions: -0.1 },
          operational: { productivity: 0.1 },
          compliance: { risk: -0.2 }
        },
        implementation: {
          steps: [
            {
              order: 1,
              title: 'Review ML predictions',
              description: 'Analyze the high-confidence predictions from ML models',
              duration: 30,
              owner: 'sustainability_manager',
              dependencies: [],
              deliverables: ['prediction_review_report']
            }
          ],
          timeline: 7,
          resources: [{
            type: 'human',
            description: 'Sustainability analyst',
            quantity: 1,
            duration: 7
          }],
          success: [{
            name: 'prediction_accuracy',
            target: 0.9,
            unit: 'ratio',
            measurement: 'model_validation',
            frequency: 'weekly'
          }],
          validation: [{
            criterion: 'model_accuracy',
            method: 'backtesting',
            threshold: 0.8,
            frequency: 'weekly'
          }]
        },
        dependencies: [],
        risks: [{
          risk: 'Model drift',
          probability: 0.2,
          impact: 0.3,
          severity: 'medium',
          mitigation: 'Regular model retraining',
          contingency: 'Fallback to rule-based system'
        }]
      });
    }

    return recommendations;
  }

  private async processModelResults(modelResults: ModelResult[], capability: AgentMLCapability): Promise<any> {
    // Ensemble the results based on model weights and confidence
    const successfulResults = modelResults.filter(r => r.status === 'success' && r.confidence > 0);

    if (successfulResults.length === 0) {
      throw new Error('No successful model results available');
    }

    // Weighted average for numerical predictions
    if (capability.type === 'prediction') {
      const weightedSum = successfulResults.reduce((sum, result) => {
        const value = typeof result.result?.value === 'number' ? result.result.value : 0;
        return sum + (value * result.weight * result.confidence);
      }, 0);

      const totalWeight = successfulResults.reduce((sum, result) => sum + (result.weight * result.confidence), 0);

      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    // Return highest confidence result for other types
    const bestResult = successfulResults.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return bestResult.result;
  }

  private calculateOverallConfidence(modelResults: ModelResult[]): number {
    const successfulResults = modelResults.filter(r => r.status === 'success');
    if (successfulResults.length === 0) return 0;

    const weightedConfidence = successfulResults.reduce((sum, result) =>
      sum + (result.confidence * result.weight), 0
    );

    const totalWeight = successfulResults.reduce((sum, result) => sum + result.weight, 0);

    return totalWeight > 0 ? weightedConfidence / totalWeight : 0;
  }

  private generateDebugInfo(traceId: string, modelResults: ModelResult[]): DebugInfo {
    return {
      traceId,
      modelSelectionLog: modelResults.map(result => ({
        timestamp: new Date(),
        action: 'model_execution',
        modelId: result.modelId,
        reasoning: `Executed ${result.modelId} with confidence ${result.confidence}`,
        score: result.confidence
      })),
      decisionTree: [],
      performanceBreakdown: {
        phases: [
          {
            name: 'model_execution',
            duration: modelResults.reduce((sum, r) => sum + r.latency, 0),
            percentage: 80,
            details: { modelCount: modelResults.length }
          },
          {
            name: 'result_processing',
            duration: 50,
            percentage: 20,
            details: { ensembleMethod: 'weighted_average' }
          }
        ],
        bottlenecks: [],
        optimizations: []
      }
    };
  }

  private async recordLearningData(request: AgentRequest, response: AgentResponse): Promise<void> {
    const learningEntry: LearningData = {
      timestamp: new Date(),
      agentId: request.agentId,
      capability: request.capability,
      input: request.input,
      output: response.result,
      confidence: response.confidence,
      feedback: null, // To be updated later with user feedback
      context: request.context
    };

    if (!this.learningData.has(request.agentId)) {
      this.learningData.set(request.agentId, []);
    }

    const agentData = this.learningData.get(request.agentId);
    if (agentData) {
      agentData.push(learningEntry);

      // Keep only last 1000 entries per agent
      if (agentData.length > 1000) {
        agentData.splice(0, agentData.length - 1000);
      }
    }
  }

  private async updatePerformanceMetrics(agentId: string, response: AgentResponse): Promise<void> {
    const currentMetrics = this.performanceMetrics.get(agentId) || {
      accuracy: 0.8,
      latency: 0,
      throughput: 0,
      reliability: 0.9,
      userSatisfaction: 0.8,
      resourceUtilization: 0.5
    };

    // Update metrics with exponential moving average
    const alpha = 0.1; // Learning rate

    currentMetrics.latency = currentMetrics.latency * (1 - alpha) + response.performance.totalLatency * alpha;
    currentMetrics.accuracy = currentMetrics.accuracy * (1 - alpha) + response.confidence * alpha;
    currentMetrics.reliability = response.metadata.fallbackUsed ?
      currentMetrics.reliability * 0.95 :
      Math.min(1, currentMetrics.reliability * 1.01);

    this.performanceMetrics.set(agentId, currentMetrics);
  }

  private async registerDefaultCapabilities(): Promise<void> {
    // ESG Chief of Staff capabilities
    this.capabilities.set('strategic_planning', {
      id: 'strategic_planning',
      name: 'Strategic Planning',
      type: 'optimization',
      domain: 'performance',
      inputs: [
        { name: 'goals', type: 'parameters', required: true, format: 'array' },
        { name: 'constraints', type: 'parameters', required: true, format: 'array' },
        { name: 'historical_data', type: 'historical_data', required: false, format: 'time_series' }
      ],
      outputs: [
        { name: 'strategic_plan', type: 'recommendation', format: 'json', confidence: true, explanation: true },
        { name: 'optimization_results', type: 'insight', format: 'json', confidence: true }
      ],
      models: ['optimization', 'emissions_forecasting'],
      confidence: 0.85,
      latency: 2000,
      description: 'Generate strategic sustainability plans using ML optimization'
    });

    // Carbon Hunter capabilities
    this.capabilities.set('emission_hunting', {
      id: 'emission_hunting',
      name: 'Emission Hunting',
      type: 'analysis',
      domain: 'emissions',
      inputs: [
        { name: 'realtime_data', type: 'real_time_data', required: true, format: 'time_series' },
        { name: 'historical_data', type: 'historical_data', required: true, format: 'time_series' },
        { name: 'thresholds', type: 'parameters', required: false, format: 'object' }
      ],
      outputs: [
        { name: 'anomalies', type: 'alert', format: 'json', confidence: true, explanation: true },
        { name: 'predictions', type: 'prediction', format: 'json', confidence: true }
      ],
      models: ['anomaly_detection', 'emissions_forecasting'],
      confidence: 0.9,
      latency: 1500,
      description: 'Hunt for emission anomalies and predict future trends'
    });

    // Compliance Guardian capabilities
    this.capabilities.set('compliance_monitoring', {
      id: 'compliance_monitoring',
      name: 'Compliance Monitoring',
      type: 'monitoring',
      domain: 'compliance',
      inputs: [
        { name: 'current_metrics', type: 'real_time_data', required: true, format: 'object' },
        { name: 'regulations', type: 'parameters', required: true, format: 'array' },
        { name: 'deadlines', type: 'parameters', required: true, format: 'array' }
      ],
      outputs: [
        { name: 'risk_assessment', type: 'prediction', format: 'json', confidence: true, explanation: true },
        { name: 'compliance_actions', type: 'recommendation', format: 'json', confidence: true }
      ],
      models: ['compliance_risk'],
      confidence: 0.88,
      latency: 1800,
      description: 'Monitor compliance status and predict regulatory risks'
    });

    // Supply Chain Investigator capabilities
    this.capabilities.set('supply_chain_analysis', {
      id: 'supply_chain_analysis',
      name: 'Supply Chain Analysis',
      type: 'analysis',
      domain: 'risk',
      inputs: [
        { name: 'suppliers', type: 'parameters', required: true, format: 'array' },
        { name: 'supply_chain_data', type: 'historical_data', required: true, format: 'time_series' },
        { name: 'risk_factors', type: 'parameters', required: true, format: 'array' }
      ],
      outputs: [
        { name: 'risk_assessment', type: 'insight', format: 'json', confidence: true, explanation: true },
        { name: 'optimization_plan', type: 'recommendation', format: 'json', confidence: true }
      ],
      models: ['optimization', 'anomaly_detection'],
      confidence: 0.82,
      latency: 2500,
      description: 'Analyze supply chain risks and optimize supplier selection'
    });
  }

  private setupEventListeners(): void {
    this.mlPipeline.on('prediction_complete', (data) => {
      this.emit('ml_prediction', data);
    });

    this.analyticsEngine.on('anomaly_detected', (data) => {
      this.emit('anomaly_alert', data);
    });

    this.abTestingFramework.on('experiment_complete', (data) => {
      this.emit('ab_test_result', data);
    });
  }

  private initializePerformanceMonitoring(): void {
    // Set up periodic performance monitoring
    setInterval(() => {
      this.emit('performance_update', {
        activeRequests: this.activeRequests.size,
        agentCount: this.agents.size,
        capabilityCount: this.capabilities.size,
        averageLatency: this.calculateAverageLatency()
      });
    }, 30000); // Every 30 seconds
  }

  private calculateAverageLatency(): number {
    const metrics = Array.from(this.performanceMetrics.values());
    if (metrics.length === 0) return 0;

    return metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('MLAgentIntegration not initialized. Call initialize() first.');
    }
  }

  // Agent registration and management
  async registerAgent(agent: AutonomousAgent): Promise<void> {
    this.ensureInitialized();

    this.agents.set(agent.id, agent);
    this.performanceMetrics.set(agent.id, agent.performance);

    console.log(`✅ Registered agent: ${agent.name} (${agent.id})`);
    this.emit('agent_registered', agent);
  }

  async unregisterAgent(agentId: string): Promise<void> {
    this.ensureInitialized();

    this.agents.delete(agentId);
    this.performanceMetrics.delete(agentId);
    this.learningData.delete(agentId);

    console.log(`🗑️ Unregistered agent: ${agentId}`);
    this.emit('agent_unregistered', { agentId });
  }

  getAgentPerformance(agentId: string): AgentPerformance | undefined {
    return this.performanceMetrics.get(agentId);
  }

  getRegisteredAgents(): AutonomousAgent[] {
    return Array.from(this.agents.values());
  }

  getAvailableCapabilities(): AgentMLCapability[] {
    return Array.from(this.capabilities.values());
  }

  // Private helper methods

  private initializeAgentCapabilities(): void {
    this.agentCapabilities.set('esg_chief_of_staff', {
      predictions: ['emissions_forecast', 'compliance_risk'],
      optimizations: ['strategic_planning', 'goal_alignment'],
      analytics: ['trend_analysis', 'performance_tracking']
    });

    this.agentCapabilities.set('carbon_hunter', {
      predictions: ['emission_trends', 'leak_detection'],
      optimizations: ['emission_reduction', 'efficiency_improvements'],
      analytics: ['anomaly_detection', 'pattern_recognition']
    });

    this.agentCapabilities.set('compliance_guardian', {
      predictions: ['regulatory_risk', 'deadline_compliance'],
      optimizations: ['compliance_planning', 'resource_allocation'],
      analytics: ['regulation_analysis', 'risk_assessment']
    });

    this.agentCapabilities.set('supply_chain_investigator', {
      predictions: ['supplier_risk', 'chain_disruption'],
      optimizations: ['supplier_selection', 'logistics_optimization'],
      analytics: ['risk_analysis', 'performance_evaluation']
    });
  }

  private extractResourcesFromContext(_organizationData: any): any[] {
    // Simplified resource extraction
    return [
      { name: 'energy_efficiency', min: 0, max: 100, cost: 1000, emissions: -0.5, efficiency: 1.2 },
      { name: 'renewable_energy', min: 0, max: 100, cost: 2000, emissions: -1.0, efficiency: 1.0 },
      { name: 'process_optimization', min: 0, max: 100, cost: 1500, emissions: -0.3, efficiency: 1.1 }
    ];
  }

  private extractConstraintsFromGoals(_goals: any[]): any[] {
    return [
      { type: 'emissions', value: 1000, operator: '<=' },
      { type: 'budget', value: 50000, operator: '<=' }
    ];
  }

  private generateStrategicRecommendations(
    forecast: Prediction,
    optimization: any,
    _goals: any[]
  ): string[] {
    const recommendations = [];

    if (Array.isArray(forecast.value) && forecast.value.some(v => v > 100)) {
      recommendations.push('Consider accelerating emissions reduction initiatives based on forecast trends');
    }

    if (optimization.confidence > 0.8) {
      recommendations.push(`Implement ${Object.keys(optimization.allocation)[0]} optimization with ${(optimization.confidence * 100).toFixed(0)}% confidence`);
    }

    recommendations.push('Monitor regulatory changes that may impact ESG strategy');
    recommendations.push('Engage stakeholders on sustainability progress and future goals');

    return recommendations;
  }

  private assessComplianceRisk(forecast: Prediction, goals: any[]): number {
    // Simplified risk assessment
    const forecastValue = Array.isArray(forecast.value) ? forecast.value[0] : forecast.value;
    if (forecastValue === undefined) return 0;
    
    const target = goals.find(g => g.type === 'emissions')?.target || 100;
    
    return Math.max(0, Math.min(1, (forecastValue - target) / target));
  }

  private isEmissionRelated(_anomaly: any): boolean {
    const emissionKeywords = ['co2', 'emission', 'carbon', 'energy', 'fuel'];
    // Simplified for now - in real implementation would check anomaly features
    return Math.random() > 0.5; // Placeholder logic
  }

  private inferLocation(_anomaly: any): string {
    // Placeholder location inference
    return `Building ${Math.floor(Math.random() * 5) + 1}, Floor ${Math.floor(Math.random() * 3) + 1}`;
  }

  private async generateResourceOptimization(params: any): Promise<any> {
    // Generate mock optimization result
    return {
      result: {
        optimizedAllocation: params.resources || [],
        totalCost: 50000,
        totalEmissions: 800,
        efficiency: 0.85
      },
      confidence: 0.9,
      explanation: 'Optimization completed successfully'
    };
  }

  private estimateLeakAmount(anomaly: any): number {
    // Simplified leak estimation
    return anomaly.anomalyScore * 100; // tons CO2e
  }

  private generateHuntingRecommendations(
    anomalies: any[],
    leaks: any[],
    _historicalData: MetricData[]
  ): string[] {
    const recommendations = [];

    if (leaks.length > 0) {
      recommendations.push(`Investigate ${leaks.length} potential emission leaks immediately`);
      recommendations.push('Deploy sensors in high-risk areas identified by ML models');
    }

    if (anomalies.filter(a => a.isAnomaly).length > anomalies.length * 0.1) {
      recommendations.push('Increase monitoring frequency due to elevated anomaly detection');
    }

    recommendations.push('Review and update emission factors based on recent patterns');
    
    return recommendations;
  }

  private convertMetricsToEmissions(metrics: MetricData[]): EmissionsData[] {
    // Simplified conversion from metrics to emissions data
    const groupedByTime = new Map<string, MetricData[]>();
    
    for (const metric of metrics) {
      const timeKey = metric.timestamp.toISOString().split('T')[0] ?? '';
      if (!groupedByTime.has(timeKey)) {
        groupedByTime.set(timeKey, []);
      }
      const group = groupedByTime.get(timeKey);
      if (group) {
        group.push(metric);
      }
    }

    const emissionsData: EmissionsData[] = [];
    for (const [timeKey, dayMetrics] of Array.from(groupedByTime.entries())) {
      const avgValue = dayMetrics.reduce((sum: number, m: MetricData) => sum + m.value, 0) / dayMetrics.length;
      
      emissionsData.push({
        timestamp: new Date(timeKey),
        scope1: avgValue * 0.4,
        scope2: avgValue * 0.3,
        scope3: avgValue * 0.3,
        totalEmissions: avgValue,
        energyConsumption: avgValue * 2,
        productionVolume: 1000,
        temperature: 20,
        dayOfWeek: new Date(timeKey).getDay(),
        monthOfYear: new Date(timeKey).getMonth() + 1,
        isHoliday: false,
        economicIndex: 100
      });
    }

    return emissionsData;
  }

  private async predictComplianceRisk(_metrics: any, _regulation: any): Promise<number> {
    // Simplified compliance risk prediction
    return Math.random() * 0.5; // 0-50% risk
  }

  private generateComplianceRecommendations(
    risks: Record<string, number>,
    deadlines: any[]
  ): string[] {
    const recommendations = [];

    const highRiskRegulations = Object.entries(risks)
      .filter(([, risk]) => risk > 0.7)
      .map(([reg]) => reg);

    if (highRiskRegulations.length > 0) {
      recommendations.push(`Address high-risk regulations: ${highRiskRegulations.join(', ')}`);
    }

    const urgentDeadlines = deadlines.filter(d => 
      new Date(d.deadline).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    );

    if (urgentDeadlines.length > 0) {
      recommendations.push(`Prioritize ${urgentDeadlines.length} urgent deadlines in next 30 days`);
    }

    return recommendations;
  }

  private async analyzeRegulatoryTrends(regulations: any[]): Promise<any[]> {
    // Placeholder regulatory trend analysis
    return regulations.map(reg => ({
      id: reg.id,
      trend: Math.random() > 0.5 ? 'increasing' : 'stable',
      impact: Math.random() * 0.5 + 0.5
    }));
  }

  private calculateSupplierRisk(supplier: any, riskFactors: string[]): number {
    // Simplified supplier risk calculation
    let risk = 0.3; // Base risk
    
    if (riskFactors.includes('geographic')) {
      risk += supplier.location?.riskScore || 0;
    }
    
    if (riskFactors.includes('financial')) {
      risk += (1 - (supplier.financialHealth || 0.8)) * 0.3;
    }
    
    return Math.min(1, risk);
  }

  private convertSupplyChainToMetrics(supplyChainData: any[]): MetricData[] {
    return supplyChainData.map((data, index) => ({
      timestamp: new Date(Date.now() - (supplyChainData.length - index) * 24 * 60 * 60 * 1000),
      metricName: 'supply_chain_performance',
      value: data.performance || Math.random() * 100,
      dimensions: {
        supplier: data.supplierId || 'unknown',
        category: data.category || 'general'
      }
    }));
  }

  private generateRiskMitigationPlan(
    supplierRisks: Record<string, number>,
    anomalies: any[]
  ): any[] {
    const plan = [];

    const highRiskSuppliers = Object.entries(supplierRisks)
      .filter(([, risk]) => risk > 0.7)
      .map(([supplier]) => supplier);

    if (highRiskSuppliers.length > 0) {
      plan.push({
        action: 'Diversify supplier base',
        priority: 'high',
        timeline: '3 months',
        suppliers: highRiskSuppliers
      });
    }

    if (anomalies.filter(a => a.isAnomaly).length > 0) {
      plan.push({
        action: 'Increase supply chain monitoring',
        priority: 'medium',
        timeline: '1 month',
        focus: 'anomaly-prone suppliers'
      });
    }

    return plan;
  }

  private async calculateHealthScore(metrics: MetricData[], emissions: EmissionsData[]): Promise<number> {
    // Simplified health score calculation
    const avgEmissions = emissions.reduce((sum, e) => sum + e.totalEmissions, 0) / emissions.length;
    const avgMetrics = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    
    return Math.max(0, Math.min(1, 1 - (avgEmissions + avgMetrics) / 300));
  }

  private async generateKeyInsights(_metrics: MetricData[], emissions: EmissionsData[]): Promise<string[]> {
    const insights = [];

    const recentEmissions = emissions.slice(-7);
    if (recentEmissions.length === 0) {
      insights.push('No recent emissions data available');
      return insights;
    }
    
    const lastEmission = recentEmissions[recentEmissions.length - 1];
    const firstEmission = recentEmissions[0];
    
    if (lastEmission && firstEmission) {
      const trend = lastEmission.totalEmissions - firstEmission.totalEmissions;
      
      if (trend > 0) {
        insights.push(`Emissions trending upward by ${trend.toFixed(1)} tons CO2e over last week`);
      } else {
        insights.push(`Emissions trending downward by ${Math.abs(trend).toFixed(1)} tons CO2e over last week`);
      }
    }

    const avgEmissions = recentEmissions.reduce((sum, e) => sum + e.totalEmissions, 0) / recentEmissions.length;
    insights.push(`Current average emissions: ${avgEmissions.toFixed(1)} tons CO2e/day`);

    return insights;
  }

  private async generatePredictiveAlerts(_metrics: MetricData[], emissions: EmissionsData[]): Promise<any[]> {
    const alerts = [];

    // Predict potential threshold breaches
    const forecast = await this.mlPipeline.predict({
      type: 'emissions_prediction',
      data: emissions,
      options: { horizon: 7 }
    });

    const forecastValue = Array.isArray(forecast.value) ? forecast.value[0] : forecast.value;
    if (forecastValue !== undefined && forecastValue > 150) {
      alerts.push({
        type: 'emissions_threshold',
        severity: 'high',
        message: `Predicted emissions may exceed 150 tons CO2e (forecast: ${forecastValue.toFixed(1)})`,
        timeline: '7 days'
      });
    }

    return alerts;
  }

  private async identifyOptimizationOpportunities(_metrics: MetricData[], emissions: EmissionsData[]): Promise<any[]> {
    const opportunities = [];

    const avgEmissions = emissions.reduce((sum, e) => sum + e.totalEmissions, 0) / emissions.length;
    if (avgEmissions > 100) {
      opportunities.push({
        area: 'emissions_reduction',
        potential: '15-25%',
        investment: 'Medium',
        timeline: '6 months',
        description: 'Implement energy efficiency measures and renewable energy sources'
      });
    }

    return opportunities;
  }

  private async assessRiskFactors(_metrics: MetricData[], emissions: EmissionsData[]): Promise<any[]> {
    const risks = [];

    const volatility = this.calculateVolatility(emissions.map(e => e.totalEmissions));
    if (volatility > 20) {
      risks.push({
        factor: 'emission_volatility',
        level: 'medium',
        description: 'High variability in daily emissions indicates potential process instability',
        recommendation: 'Implement better process controls and monitoring'
      });
    }

    return risks;
  }

  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

// Type definitions
interface MLCapability {
  predictions: string[];
  optimizations: string[];
  analytics: string[];
}

// Additional type definitions
interface ModelResult {
  modelId: string;
  version: string;
  result: any;
  confidence: number;
  latency: number;
  weight: number;
  status: 'success' | 'fallback' | 'error';
}

interface LearningData {
  timestamp: Date;
  agentId: string;
  capability: string;
  input: any;
  output: any;
  confidence: number;
  feedback: number | null; // User feedback score 0-1
  context: RequestContext;
}

interface MetricData {
  timestamp: Date;
  metricName: string;
  value: number;
  dimensions: Record<string, any>;
}

interface EmissionsData {
  timestamp: Date;
  scope1: number;
  scope2: number;
  scope3: number;
  totalEmissions: number;
  energyConsumption: number;
  productionVolume: number;
  temperature: number;
  dayOfWeek: number;
  monthOfYear: number;
  isHoliday: boolean;
  economicIndex: number;
}

interface Prediction {
  value: number | number[];
  confidence: number;
  explanation?: string;
  metadata?: Record<string, any>;
}

// Factory function for creating ML-Agent integration
export async function createMLAgentIntegration(
  mlPipeline: EnhancedMLPipeline,
  emissionsForecastingModel: EmissionsForecastingModel,
  complianceRiskModel: ComplianceRiskModel,
  analyticsEngine: AdvancedAnalyticsEngine,
  modelServingManager: ModelServingManager,
  abTestingFramework: ABTestingFramework
): Promise<MLAgentIntegration> {
  console.log('🤖 Creating ML-Agent Integration...');

  const integration = new MLAgentIntegration(
    mlPipeline,
    emissionsForecastingModel,
    complianceRiskModel,
    analyticsEngine,
    modelServingManager,
    abTestingFramework
  );

  await integration.initialize();

  console.log('✅ ML-Agent integration created and initialized');

  return integration;
}

// Export the integration function for easy use (legacy support)
export async function integrateMLWithAgents(
  mlPipeline: EnhancedMLPipeline,
  agents: AutonomousAgent[]
): Promise<MLAgentIntegration> {
  console.log('🤖 Integrating ML Pipeline with Autonomous Agents...');

  // Create placeholder instances for backwards compatibility
  const predConfig = {
    modelId: 'default',
    version: '1.0',
    modelType: 'forecasting' as const,
    algorithm: 'ensemble' as const,
    hyperparameters: {},
    featureConfig: { inputFeatures: [], outputFeatures: [] },
    dataConfig: { dataSource: '', preprocessingSteps: [] },
    trainingConfig: { epochs: 100, batchSize: 32, learningRate: 0.001 },
    validationConfig: { splitRatio: 0.2, crossValidation: false },
    retrainingConfig: { schedule: 'weekly', threshold: 0.8 }
  };

  const analyticsConfig = {
    modelId: 'default',
    version: '1.0',
    realTimeProcessing: { enabled: true, maxLatency: 100, bufferSize: 1000 },
    batchProcessing: { enabled: true, batchSize: 10000, schedule: 'hourly' },
    patternRecognition: { algorithms: ['clustering'], minConfidence: 0.7 },
    anomalyDetection: { algorithms: ['isolation_forest'], sensitivity: 0.8 },
    predictiveAnalytics: { models: ['lstm'], horizon: 7 },
    visualizations: { enabled: true, types: ['charts'] },
    alerting: { enabled: true, channels: ['email'] },
    behavioralAnalysis: { enabled: true, models: ['markov'], windowSize: 100 },
    performance: { caching: true, parallelProcessing: true, maxWorkers: 4 },
    storage: { type: 'postgresql', retention: 90 }
  };

  const servingConfig = {
    modelId: 'default',
    version: '1.0',
    deployment: { mode: 'online' as const, replicas: 1, resources: { cpu: 1, memory: 1024 } },
    performance: { maxLatency: 100, throughput: 1000, caching: true },
    scaling: { autoScale: true, minReplicas: 1, maxReplicas: 10, targetUtilization: 0.8 },
    monitoring: { metrics: true, logging: true, tracing: false },
    security: { authentication: true, encryption: true, rateLimit: 1000 },
    fallback: { enabled: true, strategy: 'cache' as const, timeout: 5000 },
    versioning: { strategy: 'semantic' as const, rollback: true },
    caching: { enabled: true, ttl: 3600, strategy: 'lru' },
    loadBalancing: { strategy: 'round-robin' as const, healthCheck: true }
  };

  const emissionsForecastingModel = new EmissionsForecastingModel(predConfig);
  const complianceRiskModel = new ComplianceRiskModel(predConfig);
  const analyticsEngine = new AdvancedAnalyticsEngine(analyticsConfig);
  const modelServingManager = new ModelServingManager(servingConfig);
  const abTestingFramework = new ABTestingFramework();

  const integration = await createMLAgentIntegration(
    mlPipeline,
    emissionsForecastingModel,
    complianceRiskModel,
    analyticsEngine,
    modelServingManager,
    abTestingFramework
  );

  // Register agents
  for (const agent of agents) {
    await integration.registerAgent(agent);
  }

  console.log(`✅ ML integration ready for ${agents.length} autonomous agents`);

  return integration;
}
