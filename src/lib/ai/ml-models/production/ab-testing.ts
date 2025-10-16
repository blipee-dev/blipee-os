/**
 * A/B Testing Framework for ML Models
 * Enables controlled experimentation with model variants in production
 */

import { BaseModel } from '../base/base-model';
import { TrainingData, EvaluationMetrics } from '../types';

export interface ABTestConfig {
  testName: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  trafficSplit: TrafficSplit;
  successMetrics: string[];
  minimumSampleSize: number;
  significanceLevel: number; // e.g., 0.05 for 95% confidence
  maxDuration?: number; // milliseconds
  enableEarlyStop?: boolean;
  randomSeed?: number;
}

export interface TrafficSplit {
  control: {
    percentage: number; // 0-100
    model: BaseModel;
    label: string;
  };
  variants: Array<{
    id: string;
    percentage: number; // 0-100
    model: BaseModel;
    label: string;
    description?: string;
  }>;
}

export interface ABTestUser {
  userId: string;
  sessionId: string;
  assignedVariant: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ABTestRequest {
  userId: string;
  sessionId: string;
  input: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ABTestResult {
  requestId: string;
  userId: string;
  sessionId: string;
  variant: string;
  prediction: any;
  confidence?: number;
  latency: number;
  timestamp: Date;
  success?: boolean;
  conversionValue?: number;
}

export interface ExperimentResults {
  testConfig: ABTestConfig;
  status: 'running' | 'completed' | 'stopped' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalRequests: number;
  variantPerformance: Map<string, VariantPerformance>;
  statisticalSignificance: StatisticalResults;
  recommendation: TestRecommendation;
  insights: string[];
}

export interface VariantPerformance {
  variantId: string;
  label: string;
  totalRequests: number;
  successfulRequests: number;
  averageLatency: number;
  averageConfidence: number;
  conversionRate: number;
  totalConversionValue: number;
  errorRate: number;
  evaluationMetrics: EvaluationMetrics;
  customMetrics: Record<string, number>;
}

export interface StatisticalResults {
  isSignificant: boolean;
  pValue: number;
  confidenceInterval: [number, number];
  winningVariant?: string;
  liftPercentage?: number;
  requiredSampleSize: number;
  currentPower: number;
}

export interface TestRecommendation {
  action: 'continue' | 'stop_and_deploy' | 'stop_and_revert' | 'extend_test';
  winningVariant?: string;
  confidence: number;
  reasoning: string[];
  nextSteps: string[];
}

export class ModelABTesting {
  private activeTests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, ABTestUser> = new Map();
  private testResults: Map<string, ABTestResult[]> = new Map();
  private randomGenerator: () => number;

  constructor(randomSeed?: number) {
    // Initialize random number generator with optional seed for reproducibility
    if (randomSeed) {
      let seed = randomSeed;
      this.randomGenerator = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    } else {
      this.randomGenerator = Math.random;
    }
  }

  /**
   * Start a new A/B test experiment
   */
  async startExperiment(config: ABTestConfig): Promise<string> {
    
    // Validate configuration
    this.validateTestConfig(config);
    
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const test = new ABTest(testId, config, this.randomGenerator);
    this.activeTests.set(testId, test);
    this.testResults.set(testId, []);
    
    
    return testId;
  }

  /**
   * Process a prediction request through the A/B test
   */
  async predict(testId: string, request: ABTestRequest): Promise<{
    prediction: any;
    variant: string;
    latency: number;
    confidence?: number;
  }> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }

    if (test.getStatus() !== 'running') {
      throw new Error(`A/B test ${testId} is not running (status: ${test.getStatus()})`);
    }

    const startTime = Date.now();
    
    // Get or assign user to variant
    const assignment = this.assignUserToVariant(testId, request.userId, request.sessionId);
    
    // Get the model for this variant
    const model = test.getModelForVariant(assignment.assignedVariant);
    
    // Make prediction
    const prediction = await model.predict(request.input);
    const latency = Date.now() - startTime;
    
    // Extract confidence if available
    const confidence = typeof prediction === 'object' && prediction.confidence ? prediction.confidence : undefined;
    
    // Record the result
    const result: ABTestResult = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: request.userId,
      sessionId: request.sessionId,
      variant: assignment.assignedVariant,
      prediction,
      confidence,
      latency,
      timestamp: new Date(),
      success: true // Will be updated when we get feedback
    };
    
    this.testResults.get(testId)!.push(result);
    test.recordRequest(assignment.assignedVariant);
    
    return {
      prediction,
      variant: assignment.assignedVariant,
      latency,
      confidence
    };
  }

  /**
   * Record the outcome of a prediction (conversion, success, etc.)
   */
  async recordOutcome(
    testId: string, 
    requestId: string, 
    success: boolean, 
    conversionValue?: number,
    customMetrics?: Record<string, number>
  ): Promise<void> {
    const results = this.testResults.get(testId);
    if (!results) {
      throw new Error(`A/B test ${testId} not found`);
    }

    const result = results.find(r => r.requestId === requestId);
    if (!result) {
      throw new Error(`Request ${requestId} not found in test ${testId}`);
    }

    result.success = success;
    result.conversionValue = conversionValue;
    
    const test = this.activeTests.get(testId)!;
    test.recordOutcome(result.variant, success, conversionValue, customMetrics);
  }

  /**
   * Get current experiment results
   */
  async getExperimentResults(testId: string): Promise<ExperimentResults> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }

    const results = this.testResults.get(testId)!;
    
    // Calculate performance for each variant
    const variantPerformance = new Map<string, VariantPerformance>();
    const config = test.getConfig();
    
    // Process control group
    const controlResults = results.filter(r => r.variant === 'control');
    variantPerformance.set('control', this.calculateVariantPerformance(
      'control',
      config.trafficSplit.control.label,
      controlResults
    ));
    
    // Process variants
    for (const variant of config.trafficSplit.variants) {
      const variantResults = results.filter(r => r.variant === variant.id);
      variantPerformance.set(variant.id, this.calculateVariantPerformance(
        variant.id,
        variant.label,
        variantResults
      ));
    }
    
    // Calculate statistical significance
    const statisticalResults = this.calculateStatisticalSignificance(variantPerformance, config);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(variantPerformance, statisticalResults, config);
    
    // Generate insights
    const insights = this.generateInsights(variantPerformance, statisticalResults, config);
    
    return {
      testConfig: config,
      status: test.getStatus(),
      startTime: test.getStartTime(),
      endTime: test.getEndTime(),
      totalRequests: results.length,
      variantPerformance,
      statisticalSignificance: statisticalResults,
      recommendation,
      insights
    };
  }

  /**
   * Stop an active experiment
   */
  async stopExperiment(testId: string, reason?: string): Promise<ExperimentResults> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }

    test.stop(reason);
    
    if (reason) {
    }
    
    return await this.getExperimentResults(testId);
  }

  /**
   * List all active experiments
   */
  getActiveExperiments(): Array<{
    testId: string;
    testName: string;
    status: string;
    startTime: Date;
    totalRequests: number;
  }> {
    return Array.from(this.activeTests.entries()).map(([testId, test]) => ({
      testId,
      testName: test.getConfig().testName,
      status: test.getStatus(),
      startTime: test.getStartTime(),
      totalRequests: this.testResults.get(testId)?.length || 0
    }));
  }

  /**
   * Assign user to variant based on consistent hashing
   */
  private assignUserToVariant(testId: string, userId: string, sessionId: string): ABTestUser {
    const assignmentKey = `${testId}_${userId}`;
    
    // Check if user already assigned
    if (this.userAssignments.has(assignmentKey)) {
      return this.userAssignments.get(assignmentKey)!;
    }
    
    const test = this.activeTests.get(testId)!;
    const config = test.getConfig();
    
    // Use consistent hashing for assignment
    const hash = this.hashString(`${userId}_${testId}`);
    const assignment = hash % 100; // 0-99
    
    let assignedVariant = 'control';
    let currentThreshold = config.trafficSplit.control.percentage;
    
    if (assignment >= currentThreshold) {
      for (const variant of config.trafficSplit.variants) {
        currentThreshold += variant.percentage;
        if (assignment < currentThreshold) {
          assignedVariant = variant.id;
          break;
        }
      }
    }
    
    const userAssignment: ABTestUser = {
      userId,
      sessionId,
      assignedVariant,
      timestamp: new Date()
    };
    
    this.userAssignments.set(assignmentKey, userAssignment);
    return userAssignment;
  }

  /**
   * Calculate performance metrics for a variant
   */
  private calculateVariantPerformance(
    variantId: string,
    label: string,
    results: ABTestResult[]
  ): VariantPerformance {
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success === true).length;
    const totalLatency = results.reduce((sum, r) => sum + r.latency, 0);
    const totalConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0);
    const totalConversionValue = results.reduce((sum, r) => sum + (r.conversionValue || 0), 0);
    const errorCount = results.filter(r => r.success === false).length;
    
    return {
      variantId,
      label,
      totalRequests,
      successfulRequests,
      averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      averageConfidence: totalRequests > 0 ? totalConfidence / totalRequests : 0,
      conversionRate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
      totalConversionValue,
      errorRate: totalRequests > 0 ? errorCount / totalRequests : 0,
      evaluationMetrics: {
        accuracy: totalRequests > 0 ? successfulRequests / totalRequests : 0,
        precision: 0, // Would need ground truth labels
        recall: 0,    // Would need ground truth labels
        f1Score: 0,   // Would need ground truth labels
        auc: 0        // Would need ground truth labels
      },
      customMetrics: {}
    };
  }

  /**
   * Calculate statistical significance using two-proportion z-test
   */
  private calculateStatisticalSignificance(
    variantPerformance: Map<string, VariantPerformance>,
    config: ABTestConfig
  ): StatisticalResults {
    const control = variantPerformance.get('control')!;
    
    // Find best performing variant
    let bestVariant: VariantPerformance | null = null;
    let bestVariantId = 'control';
    
    for (const [variantId, performance] of variantPerformance) {
      if (variantId !== 'control') {
        if (!bestVariant || performance.conversionRate > bestVariant.conversionRate) {
          bestVariant = performance;
          bestVariantId = variantId;
        }
      }
    }
    
    if (!bestVariant || bestVariant.totalRequests < config.minimumSampleSize) {
      return {
        isSignificant: false,
        pValue: 1.0,
        confidenceInterval: [0, 0],
        requiredSampleSize: config.minimumSampleSize,
        currentPower: 0
      };
    }
    
    // Two-proportion z-test
    const p1 = control.conversionRate;
    const p2 = bestVariant.conversionRate;
    const n1 = control.totalRequests;
    const n2 = bestVariant.totalRequests;
    
    if (n1 === 0 || n2 === 0) {
      return {
        isSignificant: false,
        pValue: 1.0,
        confidenceInterval: [0, 0],
        requiredSampleSize: config.minimumSampleSize,
        currentPower: 0
      };
    }
    
    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    
    const zScore = standardError > 0 ? (p2 - p1) / standardError : 0;
    const pValue = 2 * (1 - this.standardNormalCDF(Math.abs(zScore)));
    
    const isSignificant = pValue < config.significanceLevel;
    const liftPercentage = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;
    
    // Confidence interval for difference in proportions
    const diffSE = Math.sqrt((p1 * (1-p1) / n1) + (p2 * (1-p2) / n2));
    const zCritical = 1.96; // 95% confidence
    const diff = p2 - p1;
    const confidenceInterval: [number, number] = [
      diff - zCritical * diffSE,
      diff + zCritical * diffSE
    ];
    
    return {
      isSignificant,
      pValue,
      confidenceInterval,
      winningVariant: isSignificant && p2 > p1 ? bestVariantId : undefined,
      liftPercentage,
      requiredSampleSize: config.minimumSampleSize,
      currentPower: this.calculateStatisticalPower(n1, n2, p1, p2, config.significanceLevel)
    };
  }

  /**
   * Generate test recommendation
   */
  private generateRecommendation(
    variantPerformance: Map<string, VariantPerformance>,
    statisticalResults: StatisticalResults,
    config: ABTestConfig
  ): TestRecommendation {
    const reasoning: string[] = [];
    const nextSteps: string[] = [];
    
    if (statisticalResults.isSignificant && statisticalResults.winningVariant) {
      const winningPerf = variantPerformance.get(statisticalResults.winningVariant)!;
      const controlPerf = variantPerformance.get('control')!;
      
      if (winningPerf.conversionRate > controlPerf.conversionRate) {
        reasoning.push(`Variant ${statisticalResults.winningVariant} shows statistically significant improvement`);
        reasoning.push(`Conversion rate: ${(winningPerf.conversionRate * 100).toFixed(2)}% vs ${(controlPerf.conversionRate * 100).toFixed(2)}% (control)`);
        reasoning.push(`Lift: ${statisticalResults.liftPercentage?.toFixed(1)}%`);
        reasoning.push(`P-value: ${statisticalResults.pValue.toFixed(4)} (< ${config.significanceLevel})`);
        
        nextSteps.push('Deploy winning variant to 100% of traffic');
        nextSteps.push('Monitor performance for any degradation');
        nextSteps.push('Document learnings for future experiments');
        
        return {
          action: 'stop_and_deploy',
          winningVariant: statisticalResults.winningVariant,
          confidence: 1 - statisticalResults.pValue,
          reasoning,
          nextSteps
        };
      }
    }
    
    const totalRequests = Array.from(variantPerformance.values())
      .reduce((sum, perf) => sum + perf.totalRequests, 0);
    
    if (totalRequests < config.minimumSampleSize) {
      reasoning.push(`Insufficient sample size: ${totalRequests} < ${config.minimumSampleSize}`);
      reasoning.push(`Current statistical power: ${(statisticalResults.currentPower * 100).toFixed(1)}%`);
      
      nextSteps.push('Continue test to reach minimum sample size');
      nextSteps.push('Monitor for early signs of significance');
      
      return {
        action: 'continue',
        confidence: statisticalResults.currentPower,
        reasoning,
        nextSteps
      };
    }
    
    if (!statisticalResults.isSignificant) {
      reasoning.push('No statistically significant difference detected');
      reasoning.push(`P-value: ${statisticalResults.pValue.toFixed(4)} (>= ${config.significanceLevel})`);
      reasoning.push('Variants perform similarly to control');
      
      nextSteps.push('Consider stopping test to avoid opportunity cost');
      nextSteps.push('Analyze for potential user segments or conditions');
      nextSteps.push('Plan next iteration with different approaches');
      
      return {
        action: 'stop_and_revert',
        confidence: 1 - statisticalResults.pValue,
        reasoning,
        nextSteps
      };
    }
    
    return {
      action: 'continue',
      confidence: 0.5,
      reasoning: ['Test in progress, monitoring for significance'],
      nextSteps: ['Continue monitoring test progress']
    };
  }

  /**
   * Generate insights from test results
   */
  private generateInsights(
    variantPerformance: Map<string, VariantPerformance>,
    statisticalResults: StatisticalResults,
    config: ABTestConfig
  ): string[] {
    const insights: string[] = [];
    
    // Performance insights
    const performances = Array.from(variantPerformance.values());
    const avgLatency = performances.reduce((sum, p) => sum + p.averageLatency, 0) / performances.length;
    const avgConversion = performances.reduce((sum, p) => sum + p.conversionRate, 0) / performances.length;
    
    if (performances.some(p => p.averageLatency > avgLatency * 1.5)) {
      insights.push('Some variants show significantly higher latency than others');
    }
    
    if (performances.some(p => p.errorRate > 0.05)) {
      insights.push('High error rates detected in some variants - investigate model stability');
    }
    
    if (statisticalResults.currentPower < 0.8) {
      insights.push('Statistical power is below 80% - consider increasing sample size');
    }
    
    const control = variantPerformance.get('control')!;
    const bestVariant = Array.from(variantPerformance.values())
      .filter(p => p.variantId !== 'control')
      .reduce((best, current) => 
        !best || current.conversionRate > best.conversionRate ? current : best, null);
    
    if (bestVariant && bestVariant.conversionRate > control.conversionRate) {
      const improvement = ((bestVariant.conversionRate - control.conversionRate) / control.conversionRate) * 100;
      insights.push(`Best variant shows ${improvement.toFixed(1)}% improvement over control`);
    }
    
    return insights;
  }

  /**
   * Validate test configuration
   */
  private validateTestConfig(config: ABTestConfig): void {
    const totalPercentage = config.trafficSplit.control.percentage + 
      config.trafficSplit.variants.reduce((sum, v) => sum + v.percentage, 0);
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Traffic split must sum to 100%, got ${totalPercentage}%`);
    }
    
    if (config.trafficSplit.variants.length === 0) {
      throw new Error('At least one variant is required');
    }
    
    if (config.minimumSampleSize < 1) {
      throw new Error('Minimum sample size must be at least 1');
    }
    
    if (config.significanceLevel <= 0 || config.significanceLevel >= 1) {
      throw new Error('Significance level must be between 0 and 1');
    }
  }

  /**
   * Hash string to consistent integer
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Standard normal cumulative distribution function
   */
  private standardNormalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Calculate statistical power
   */
  private calculateStatisticalPower(
    n1: number, 
    n2: number, 
    p1: number, 
    p2: number, 
    alpha: number
  ): number {
    if (n1 === 0 || n2 === 0 || p1 === p2) return 0;
    
    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se1 = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const se2 = Math.sqrt((p1 * (1-p1) / n1) + (p2 * (1-p2) / n2));
    
    const zAlpha = this.inverseNormalCDF(1 - alpha/2);
    const zBeta = (Math.abs(p2 - p1) - zAlpha * se1) / se2;
    
    return this.standardNormalCDF(zBeta);
  }

  /**
   * Inverse normal CDF approximation
   */
  private inverseNormalCDF(p: number): number {
    // Approximation for standard normal inverse CDF
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;
    
    // Simple approximation
    if (p > 0.5) {
      return -this.inverseNormalCDF(1 - p);
    }
    
    const t = Math.sqrt(-2 * Math.log(p));
    return -(t - (2.515517 + 0.802853 * t + 0.010328 * t * t) / 
             (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t));
  }
}

/**
 * Individual A/B Test instance
 */
class ABTest {
  private status: 'running' | 'completed' | 'stopped' | 'failed' = 'running';
  private startTime: Date = new Date();
  private endTime?: Date;
  private requestCounts: Map<string, number> = new Map();
  private outcomeCounts: Map<string, { success: number; total: number; value: number }> = new Map();

  constructor(
    private testId: string,
    private config: ABTestConfig,
    private randomGenerator: () => number
  ) {
    // Initialize counters
    this.requestCounts.set('control', 0);
    this.outcomeCounts.set('control', { success: 0, total: 0, value: 0 });
    
    for (const variant of config.trafficSplit.variants) {
      this.requestCounts.set(variant.id, 0);
      this.outcomeCounts.set(variant.id, { success: 0, total: 0, value: 0 });
    }
    
    // Set auto-stop timer if configured
    if (config.maxDuration) {
      setTimeout(() => {
        if (this.status === 'running') {
          this.stop('Maximum duration reached');
        }
      }, config.maxDuration);
    }
  }

  getConfig(): ABTestConfig { return this.config; }
  getStatus(): string { return this.status; }
  getStartTime(): Date { return this.startTime; }
  getEndTime(): Date | undefined { return this.endTime; }

  getModelForVariant(variantId: string): BaseModel {
    if (variantId === 'control') {
      return this.config.trafficSplit.control.model;
    }
    
    const variant = this.config.trafficSplit.variants.find(v => v.id === variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }
    
    return variant.model;
  }

  recordRequest(variantId: string): void {
    const current = this.requestCounts.get(variantId) || 0;
    this.requestCounts.set(variantId, current + 1);
  }

  recordOutcome(
    variantId: string, 
    success: boolean, 
    value?: number,
    customMetrics?: Record<string, number>
  ): void {
    const current = this.outcomeCounts.get(variantId) || { success: 0, total: 0, value: 0 };
    current.total += 1;
    if (success) current.success += 1;
    if (value) current.value += value;
    this.outcomeCounts.set(variantId, current);
  }

  stop(reason?: string): void {
    this.status = 'stopped';
    this.endTime = new Date();
  }
}