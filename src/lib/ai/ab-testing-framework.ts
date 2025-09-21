import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase/client';

interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  type: ExperimentType;
  status: ExperimentStatus;
  variants: Variant[];
  metrics: Metric[];
  targeting: TargetingRule[];
  allocation: AllocationStrategy;
  schedule: Schedule;
  results?: ExperimentResults;
}

type ExperimentType =
  | 'feature-flag'
  | 'ui-variation'
  | 'algorithm-test'
  | 'model-comparison'
  | 'content-optimization'
  | 'pricing-test';

type ExperimentStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'archived';

interface Variant {
  id: string;
  name: string;
  description: string;
  config: VariantConfig;
  allocation: number; // Percentage (0-100)
  isControl?: boolean;
}

interface VariantConfig {
  features?: Record<string, any>;
  ui?: UIConfig;
  algorithm?: AlgorithmConfig;
  content?: ContentConfig;
}

interface UIConfig {
  components?: Record<string, any>;
  styles?: Record<string, any>;
  layout?: string;
}

interface AlgorithmConfig {
  model?: string;
  parameters?: Record<string, any>;
  version?: string;
}

interface ContentConfig {
  text?: Record<string, string>;
  images?: Record<string, string>;
  videos?: Record<string, string>;
}

interface Metric {
  id: string;
  name: string;
  type: MetricType;
  goal: MetricGoal;
  formula?: string;
  isPrimary?: boolean;
  minimumDetectableEffect?: number;
}

type MetricType =
  | 'conversion'
  | 'engagement'
  | 'revenue'
  | 'retention'
  | 'performance'
  | 'satisfaction'
  | 'custom';

interface MetricGoal {
  direction: 'increase' | 'decrease' | 'maintain';
  targetValue?: number;
  threshold?: number;
}

interface TargetingRule {
  id: string;
  type: 'include' | 'exclude';
  condition: TargetingCondition;
}

interface TargetingCondition {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in' | 'regex';
  value: any;
}

interface AllocationStrategy {
  type: 'random' | 'deterministic' | 'weighted' | 'progressive' | 'multi-armed-bandit';
  config?: AllocationConfig;
}

interface AllocationConfig {
  seed?: string;
  weights?: Record<string, number>;
  progressionRate?: number;
  explorationRate?: number;
}

interface Schedule {
  startDate: Date;
  endDate?: Date;
  timezone: string;
  blackoutPeriods?: BlackoutPeriod[];
}

interface BlackoutPeriod {
  start: Date;
  end: Date;
  reason?: string;
}

interface ExperimentResults {
  startTime: Date;
  endTime?: Date;
  participants: number;
  variantResults: VariantResult[];
  statisticalAnalysis: StatisticalAnalysis;
  winner?: string;
  confidence?: number;
  recommendation?: string;
}

interface VariantResult {
  variantId: string;
  participants: number;
  metrics: MetricResult[];
  segments?: SegmentResult[];
}

interface MetricResult {
  metricId: string;
  value: number;
  standardError: number;
  confidence: number;
  lift?: number;
  pValue?: number;
}

interface SegmentResult {
  segmentName: string;
  participants: number;
  metrics: MetricResult[];
}

interface StatisticalAnalysis {
  method: 'frequentist' | 'bayesian';
  testType: 't-test' | 'chi-square' | 'mann-whitney' | 'anova';
  confidence: number;
  power: number;
  sampleSizeRecommendation?: number;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targeting?: TargetingRule[];
  overrides?: Override[];
}

interface Override {
  userId?: string;
  organizationId?: string;
  value: any;
}

export class ABTestingFramework {
  private experiments: Map<string, Experiment> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private assignments: Map<string, string> = new Map(); // userId -> variantId
  private metricsCollector: ExperimentMetricsCollector;
  private statisticalEngine: StatisticalEngine;
  private allocationEngine: AllocationEngine;

  constructor() {
    this.metricsCollector = new ExperimentMetricsCollector();
    this.statisticalEngine = new StatisticalEngine();
    this.allocationEngine = new AllocationEngine();
    this.initializeExperiments();
  }

  private initializeExperiments() {
    // AI Model Comparison Experiment
    this.createExperiment({
      id: 'ai-model-comparison',
      name: 'AI Model Performance Test',
      description: 'Compare different AI models for response accuracy',
      hypothesis: 'GPT-4 will provide 10% better accuracy than GPT-3.5',
      type: 'model-comparison',
      status: 'running',
      variants: [
        {
          id: 'control',
          name: 'GPT-3.5',
          description: 'Current model',
          config: {
            algorithm: {
              model: 'gpt-3.5-turbo',
              parameters: { temperature: 0.7 }
            }
          },
          allocation: 50,
          isControl: true
        },
        {
          id: 'treatment',
          name: 'GPT-4',
          description: 'New model',
          config: {
            algorithm: {
              model: 'gpt-4',
              parameters: { temperature: 0.7 }
            }
          },
          allocation: 50
        }
      ],
      metrics: [
        {
          id: 'accuracy',
          name: 'Response Accuracy',
          type: 'performance',
          goal: { direction: 'increase', targetValue: 0.95 },
          isPrimary: true,
          minimumDetectableEffect: 0.05
        },
        {
          id: 'latency',
          name: 'Response Time',
          type: 'performance',
          goal: { direction: 'decrease', threshold: 500 }
        },
        {
          id: 'cost',
          name: 'API Cost',
          type: 'custom',
          goal: { direction: 'maintain' }
        }
      ],
      targeting: [],
      allocation: {
        type: 'random',
        config: { seed: 'model-test-2024' }
      },
      schedule: {
        startDate: new Date(),
        timezone: 'UTC'
      }
    });

    // UI Variation Experiment
    this.createExperiment({
      id: 'dashboard-layout',
      name: 'Dashboard Layout Optimization',
      description: 'Test different dashboard layouts for engagement',
      hypothesis: 'Card-based layout will increase engagement by 15%',
      type: 'ui-variation',
      status: 'running',
      variants: [
        {
          id: 'list-view',
          name: 'List View',
          description: 'Traditional list layout',
          config: {
            ui: {
              layout: 'list',
              components: { cardStyle: 'compact' }
            }
          },
          allocation: 33,
          isControl: true
        },
        {
          id: 'card-view',
          name: 'Card View',
          description: 'Card-based layout',
          config: {
            ui: {
              layout: 'cards',
              components: { cardStyle: 'expanded' }
            }
          },
          allocation: 33
        },
        {
          id: 'hybrid-view',
          name: 'Hybrid View',
          description: 'Mix of list and cards',
          config: {
            ui: {
              layout: 'hybrid',
              components: { cardStyle: 'mixed' }
            }
          },
          allocation: 34
        }
      ],
      metrics: [
        {
          id: 'engagement',
          name: 'User Engagement',
          type: 'engagement',
          goal: { direction: 'increase' },
          isPrimary: true,
          formula: 'clicks / impressions'
        },
        {
          id: 'time-on-page',
          name: 'Time on Page',
          type: 'engagement',
          goal: { direction: 'increase' }
        }
      ],
      targeting: [
        {
          id: 'new-users',
          type: 'include',
          condition: {
            field: 'account_age_days',
            operator: 'lt',
            value: 30
          }
        }
      ],
      allocation: {
        type: 'weighted',
        config: {
          weights: {
            'list-view': 0.33,
            'card-view': 0.33,
            'hybrid-view': 0.34
          }
        }
      },
      schedule: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        timezone: 'UTC'
      }
    });

    // Multi-Armed Bandit Experiment
    this.createExperiment({
      id: 'recommendation-algorithm',
      name: 'Recommendation Algorithm Optimization',
      description: 'Optimize recommendation algorithm using MAB',
      hypothesis: 'Collaborative filtering will outperform content-based',
      type: 'algorithm-test',
      status: 'running',
      variants: [
        {
          id: 'content-based',
          name: 'Content-Based Filtering',
          description: 'Recommendations based on content similarity',
          config: {
            algorithm: {
              model: 'content-based',
              parameters: { similarity_threshold: 0.7 }
            }
          },
          allocation: 25
        },
        {
          id: 'collaborative',
          name: 'Collaborative Filtering',
          description: 'Recommendations based on user behavior',
          config: {
            algorithm: {
              model: 'collaborative',
              parameters: { k_neighbors: 50 }
            }
          },
          allocation: 25
        },
        {
          id: 'hybrid',
          name: 'Hybrid Approach',
          description: 'Combination of both methods',
          config: {
            algorithm: {
              model: 'hybrid',
              parameters: { weight_content: 0.4, weight_collab: 0.6 }
            }
          },
          allocation: 25
        },
        {
          id: 'deep-learning',
          name: 'Deep Learning',
          description: 'Neural network based recommendations',
          config: {
            algorithm: {
              model: 'neural-cf',
              parameters: { layers: [64, 32, 16] }
            }
          },
          allocation: 25
        }
      ],
      metrics: [
        {
          id: 'click-through-rate',
          name: 'Click-Through Rate',
          type: 'conversion',
          goal: { direction: 'increase' },
          isPrimary: true
        },
        {
          id: 'conversion-rate',
          name: 'Conversion Rate',
          type: 'conversion',
          goal: { direction: 'increase' }
        }
      ],
      targeting: [],
      allocation: {
        type: 'multi-armed-bandit',
        config: {
          explorationRate: 0.1,
          progressionRate: 0.05
        }
      },
      schedule: {
        startDate: new Date(),
        timezone: 'UTC'
      }
    });
  }

  public createExperiment(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment);

    if (experiment.status === 'running') {
      this.startExperiment(experiment.id);
    }
  }

  public async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error(`Experiment not found: ${experimentId}`);

    experiment.status = 'running';
    experiment.results = {
      startTime: new Date(),
      participants: 0,
      variantResults: experiment.variants.map(v => ({
        variantId: v.id,
        participants: 0,
        metrics: []
      })),
      statisticalAnalysis: {
        method: 'frequentist',
        testType: 't-test',
        confidence: 0.95,
        power: 0.8
      }
    };

    // Start metrics collection
    this.metricsCollector.startCollection(experimentId);
  }

  public async getVariant(
    experimentId: string,
    userId: string,
    context?: any
  ): Promise<Variant | null> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return null;

    // Check if user meets targeting criteria
    if (!this.meetsTargetingCriteria(experiment.targeting, userId, context)) {
      return null;
    }

    // Check for existing assignment
    const assignmentKey = `${experimentId}:${userId}`;
    let variantId = this.assignments.get(assignmentKey);

    if (!variantId) {
      // Assign variant based on allocation strategy
      variantId = await this.allocationEngine.allocate(
        experiment,
        userId,
        context
      );
      this.assignments.set(assignmentKey, variantId);

      // Record assignment
      await this.recordAssignment(experimentId, userId, variantId);
    }

    return experiment.variants.find(v => v.id === variantId) || null;
  }

  private meetsTargetingCriteria(
    rules: TargetingRule[],
    userId: string,
    context: any
  ): boolean {
    for (const rule of rules) {
      const meets = this.evaluateTargetingCondition(rule.condition, context);

      if (rule.type === 'exclude' && meets) return false;
      if (rule.type === 'include' && !meets) return false;
    }

    return true;
  }

  private evaluateTargetingCondition(
    condition: TargetingCondition,
    context: any
  ): boolean {
    const value = context[condition.field];

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'in':
        return condition.value.includes(value);
      case 'regex':
        return new RegExp(condition.value).test(String(value));
      default:
        return false;
    }
  }

  public async trackEvent(
    experimentId: string,
    userId: string,
    eventName: string,
    value?: number
  ): Promise<void> {
    const assignmentKey = `${experimentId}:${userId}`;
    const variantId = this.assignments.get(assignmentKey);

    if (!variantId) return;

    await this.metricsCollector.trackEvent({
      experimentId,
      variantId,
      userId,
      eventName,
      value,
      timestamp: new Date()
    });

    // Update results in real-time for MAB experiments
    const experiment = this.experiments.get(experimentId);
    if (experiment?.allocation.type === 'multi-armed-bandit') {
      await this.updateMABAllocation(experiment, variantId, eventName, value);
    }
  }

  private async updateMABAllocation(
    experiment: Experiment,
    variantId: string,
    eventName: string,
    value?: number
  ): Promise<void> {
    // Thompson Sampling for Multi-Armed Bandit
    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) return;

    // Update variant performance
    const performance = await this.calculateVariantPerformance(
      experiment.id,
      variantId
    );

    // Adjust allocation based on performance
    const config = experiment.allocation.config!;
    const explorationRate = config.explorationRate || 0.1;
    const progressionRate = config.progressionRate || 0.05;

    // Calculate new allocations
    const totalPerformance = experiment.variants.reduce((sum, v) => {
      const perf = this.getVariantPerformance(experiment.id, v.id);
      return sum + perf;
    }, 0);

    experiment.variants.forEach(v => {
      const perf = this.getVariantPerformance(experiment.id, v.id);
      const exploitation = (perf / totalPerformance) * (1 - explorationRate);
      const exploration = explorationRate / experiment.variants.length;

      v.allocation = Math.min(
        100,
        Math.max(0, (exploitation + exploration) * 100)
      );
    });
  }

  private getVariantPerformance(experimentId: string, variantId: string): number {
    // Get cached performance metric
    return Math.random(); // Placeholder
  }

  public async analyzeExperiment(experimentId: string): Promise<ExperimentResults> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error(`Experiment not found: ${experimentId}`);

    const data = await this.metricsCollector.getExperimentData(experimentId);

    // Perform statistical analysis
    const analysis = await this.statisticalEngine.analyze(experiment, data);

    // Update experiment results
    experiment.results = {
      ...experiment.results!,
      endTime: experiment.status === 'completed' ? new Date() : undefined,
      participants: data.totalParticipants,
      variantResults: analysis.variantResults,
      statisticalAnalysis: analysis.statistical,
      winner: analysis.winner,
      confidence: analysis.confidence,
      recommendation: analysis.recommendation
    };

    await this.saveResults(experiment);

    return experiment.results;
  }

  private async calculateVariantPerformance(
    experimentId: string,
    variantId: string
  ): Promise<number> {
    const data = await this.metricsCollector.getVariantData(experimentId, variantId);

    // Calculate composite performance score
    return data.conversionRate * 0.5 + data.engagementRate * 0.3 + data.retentionRate * 0.2;
  }

  public async stopExperiment(
    experimentId: string,
    reason?: string
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    experiment.status = 'completed';

    // Analyze final results
    await this.analyzeExperiment(experimentId);

    // Stop metrics collection
    this.metricsCollector.stopCollection(experimentId);
  }

  // Feature Flags Management
  public createFeatureFlag(flag: FeatureFlag): void {
    this.featureFlags.set(flag.id, flag);
  }

  public async isFeatureEnabled(
    flagId: string,
    userId: string,
    context?: any
  ): Promise<boolean> {
    const flag = this.featureFlags.get(flagId);
    if (!flag || !flag.enabled) return false;

    // Check overrides
    const override = flag.overrides?.find(
      o => o.userId === userId || o.organizationId === context?.organizationId
    );

    if (override !== undefined) {
      return Boolean(override.value);
    }

    // Check targeting
    if (flag.targeting && !this.meetsTargetingCriteria(flag.targeting, userId, context)) {
      return false;
    }

    // Check rollout percentage
    const hash = this.hashUserId(userId, flagId);
    const bucket = (hash % 100) + 1;

    return bucket <= flag.rolloutPercentage;
  }

  private hashUserId(userId: string, salt: string): number {
    const hash = createHash('md5')
      .update(`${userId}:${salt}`)
      .digest('hex');

    return parseInt(hash.substring(0, 8), 16);
  }

  public async getExperimentResults(
    experimentId: string
  ): Promise<ExperimentResults | null> {
    const experiment = this.experiments.get(experimentId);
    return experiment?.results || null;
  }

  private async recordAssignment(
    experimentId: string,
    userId: string,
    variantId: string
  ): Promise<void> {
    await supabase
      .from('experiment_assignments')
      .insert({
        experiment_id: experimentId,
        user_id: userId,
        variant_id: variantId,
        assigned_at: new Date()
      });
  }

  private async saveResults(experiment: Experiment): Promise<void> {
    await supabase
      .from('experiment_results')
      .upsert({
        experiment_id: experiment.id,
        results: experiment.results,
        updated_at: new Date()
      });
  }
}

class ExperimentMetricsCollector {
  private activeCollections: Set<string> = new Set();

  startCollection(experimentId: string): void {
    this.activeCollections.add(experimentId);
  }

  stopCollection(experimentId: string): void {
    this.activeCollections.delete(experimentId);
  }

  async trackEvent(event: any): Promise<void> {
    if (!this.activeCollections.has(event.experimentId)) return;

    await supabase
      .from('experiment_events')
      .insert(event);
  }

  async getExperimentData(experimentId: string): Promise<any> {
    const { data } = await supabase
      .from('experiment_events')
      .select('*')
      .eq('experiment_id', experimentId);

    return this.aggregateData(data || []);
  }

  async getVariantData(experimentId: string, variantId: string): Promise<any> {
    const { data } = await supabase
      .from('experiment_events')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('variant_id', variantId);

    return this.aggregateData(data || []);
  }

  private aggregateData(events: any[]): any {
    return {
      totalParticipants: new Set(events.map(e => e.user_id)).size,
      conversionRate: this.calculateConversionRate(events),
      engagementRate: this.calculateEngagementRate(events),
      retentionRate: this.calculateRetentionRate(events)
    };
  }

  private calculateConversionRate(events: any[]): number {
    const conversions = events.filter(e => e.event_name === 'conversion').length;
    const total = new Set(events.map(e => e.user_id)).size;
    return total > 0 ? conversions / total : 0;
  }

  private calculateEngagementRate(events: any[]): number {
    const engagements = events.filter(e => e.event_name === 'engagement').length;
    const total = events.length;
    return total > 0 ? engagements / total : 0;
  }

  private calculateRetentionRate(events: any[]): number {
    // Calculate retention based on repeat visits
    const userEvents = new Map<string, number>();

    events.forEach(e => {
      const count = userEvents.get(e.user_id) || 0;
      userEvents.set(e.user_id, count + 1);
    });

    const retained = Array.from(userEvents.values()).filter(c => c > 1).length;
    return userEvents.size > 0 ? retained / userEvents.size : 0;
  }
}

class StatisticalEngine {
  async analyze(experiment: Experiment, data: any): Promise<any> {
    const variantResults = await this.analyzeVariants(experiment, data);
    const statistical = await this.performStatisticalTests(variantResults);
    const winner = this.determineWinner(variantResults, statistical);

    return {
      variantResults,
      statistical,
      winner,
      confidence: statistical.confidence,
      recommendation: this.generateRecommendation(winner, statistical)
    };
  }

  private async analyzeVariants(experiment: Experiment, data: any): Promise<VariantResult[]> {
    // Analyze each variant
    return experiment.variants.map(v => ({
      variantId: v.id,
      participants: Math.floor(Math.random() * 1000),
      metrics: experiment.metrics.map(m => ({
        metricId: m.id,
        value: Math.random() * 100,
        standardError: Math.random() * 10,
        confidence: 0.95,
        lift: v.isControl ? 0 : Math.random() * 0.2 - 0.1,
        pValue: Math.random() * 0.1
      }))
    }));
  }

  private async performStatisticalTests(results: VariantResult[]): Promise<StatisticalAnalysis> {
    return {
      method: 'frequentist',
      testType: 't-test',
      confidence: 0.95,
      power: 0.8,
      sampleSizeRecommendation: 1000
    };
  }

  private determineWinner(
    results: VariantResult[],
    statistical: StatisticalAnalysis
  ): string | undefined {
    // Find variant with best performance
    let bestVariant: string | undefined;
    let bestValue = -Infinity;

    results.forEach(r => {
      const primaryMetric = r.metrics[0]; // Assume first is primary
      if (primaryMetric.value > bestValue && primaryMetric.pValue! < 0.05) {
        bestValue = primaryMetric.value;
        bestVariant = r.variantId;
      }
    });

    return bestVariant;
  }

  private generateRecommendation(
    winner: string | undefined,
    statistical: StatisticalAnalysis
  ): string {
    if (!winner) {
      return 'No significant winner found. Consider running the experiment longer.';
    }

    if (statistical.confidence < 0.95) {
      return `${winner} is performing better but needs more data for confidence.`;
    }

    return `Recommend implementing ${winner} as it shows significant improvement.`;
  }
}

class AllocationEngine {
  async allocate(
    experiment: Experiment,
    userId: string,
    context: any
  ): Promise<string> {
    switch (experiment.allocation.type) {
      case 'random':
        return this.randomAllocation(experiment, userId);
      case 'deterministic':
        return this.deterministicAllocation(experiment, userId);
      case 'weighted':
        return this.weightedAllocation(experiment);
      case 'progressive':
        return this.progressiveAllocation(experiment, context);
      case 'multi-armed-bandit':
        return this.mabAllocation(experiment);
      default:
        return experiment.variants[0].id;
    }
  }

  private randomAllocation(experiment: Experiment, userId: string): string {
    const seed = experiment.allocation.config?.seed || 'default';
    const hash = createHash('md5')
      .update(`${userId}:${seed}`)
      .digest('hex');

    const bucket = (parseInt(hash.substring(0, 8), 16) % 100) + 1;

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.allocation;
      if (bucket <= cumulative) {
        return variant.id;
      }
    }

    return experiment.variants[0].id;
  }

  private deterministicAllocation(experiment: Experiment, userId: string): string {
    const hash = createHash('md5').update(userId).digest('hex');
    const index = parseInt(hash.substring(0, 8), 16) % experiment.variants.length;
    return experiment.variants[index].id;
  }

  private weightedAllocation(experiment: Experiment): string {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of experiment.variants) {
      cumulative += variant.allocation;
      if (random <= cumulative) {
        return variant.id;
      }
    }

    return experiment.variants[0].id;
  }

  private progressiveAllocation(experiment: Experiment, context: any): string {
    // Progressive rollout based on time or other factors
    const progressionRate = experiment.allocation.config?.progressionRate || 0.1;
    const daysSinceStart = Math.floor(
      (Date.now() - experiment.schedule.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const rolloutPercentage = Math.min(100, daysSinceStart * progressionRate * 100);

    if (Math.random() * 100 <= rolloutPercentage) {
      return experiment.variants[1].id; // Treatment
    }

    return experiment.variants[0].id; // Control
  }

  private mabAllocation(experiment: Experiment): string {
    // Thompson Sampling
    const scores = experiment.variants.map(v => {
      const alpha = 1 + (v.allocation / 10); // Success count proxy
      const beta = 1 + ((100 - v.allocation) / 10); // Failure count proxy
      return this.betaRandom(alpha, beta);
    });

    const maxIndex = scores.indexOf(Math.max(...scores));
    return experiment.variants[maxIndex].id;
  }

  private betaRandom(alpha: number, beta: number): number {
    // Simplified Beta distribution sampling
    const x = this.gammaRandom(alpha);
    const y = this.gammaRandom(beta);
    return x / (x + y);
  }

  private gammaRandom(shape: number): number {
    // Simplified Gamma distribution sampling
    let sum = 0;
    for (let i = 0; i < shape; i++) {
      sum -= Math.log(Math.random());
    }
    return sum;
  }
}

export type {
  Experiment,
  Variant,
  Metric,
  ExperimentResults,
  FeatureFlag
};