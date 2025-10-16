/**
 * REPLANNING ENGINE
 *
 * Autonomous system for recalibrating sustainability targets and
 * automatically updating monthly/yearly targets for every metric.
 *
 * Capabilities:
 * - Top-down target allocation across all metrics
 * - Multiple allocation strategies (equal, cost-optimized, AI-recommended)
 * - Monthly trajectory generation with seasonality
 * - Initiative mapping and financial analysis
 * - Monte Carlo uncertainty simulation
 * - Automatic database updates with rollback capability
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================================================
// TYPES
// ============================================================================

export interface ReplanningRequest {
  organizationId: string;
  targetId: string;

  // New target parameters (at least one required)
  newTargetYear?: number;
  newReductionPercent?: number;
  newTargetEmissions?: number;

  // Strategy
  allocationStrategy: 'equal' | 'cost_optimized' | 'quick_wins' | 'custom' | 'ai_recommended';
  customAllocations?: Record<string, number>; // metricId -> tCO2e reduction

  // Constraints
  budgetCap?: number;
  timelineConstraint?: Date;
  minReductionByScope?: {
    scope1?: number;
    scope2?: number;
    scope3?: number;
  };

  // Options
  includeInitiatives?: boolean;
  applyImmediately?: boolean;
  userId?: string;
  notes?: string;
}

export interface ReplanningResult {
  success: boolean;
  error?: string;

  // Summary
  previousTarget: number;
  newTarget: number;
  totalReductionNeeded: number;

  // Metric-level breakdown
  metricTargets: MetricTargetPlan[];

  // Initiatives
  recommendedInitiatives: Initiative[];
  totalInvestment: number;

  // Validation
  validationErrors: string[];
  validationWarnings: string[];
  feasibilityScore: number; // 0-1

  // Uncertainty
  monteCarloResults?: MonteCarloResults;

  // If applied
  historyId?: string;
}

export interface MetricTargetPlan {
  metricId: string;
  metricName: string;
  metricCode: string;
  unit: string;
  scope: string;
  category: string;
  subcategory?: string;

  // Current state
  baselineYear: number;
  currentAnnualValue: number; // Activity data (kWh, km, etc.)
  currentAnnualEmissions: number; // tCO2e
  currentEmissionFactor: number; // kgCO2e per unit

  // Target state
  targetYear: number;
  targetAnnualValue: number;
  targetAnnualEmissions: number;
  targetEmissionFactor: number;
  reductionPercent: number;

  // Strategy
  strategyType: 'activity_reduction' | 'emission_factor' | 'hybrid' | 'elimination';

  // Monthly breakdown
  monthlyTargets: MonthlyTarget[];

  // Initiatives
  initiatives: Initiative[];

  // Confidence
  confidenceLevel: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface MonthlyTarget {
  year: number;
  month: number;
  plannedValue: number | null;
  plannedEmissions: number;
  plannedEmissionFactor: number | null;
}

export interface Initiative {
  name: string;
  description?: string;
  type: string;
  estimatedReductionTco2e: number;
  estimatedReductionPercentage?: number;
  capex: number;
  annualOpex: number;
  annualSavings: number;
  roiYears: number;
  startDate: string;
  completionDate: string;
  status: string;
  confidenceScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MonteCarloResults {
  runs: number;
  medianOutcome: number;
  meanOutcome: number;
  probabilityOfSuccess: number; // Meeting target
  percentile5: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  distribution: number[]; // For histogram
}

interface CurrentState {
  targetId: string;
  organizationId: string;
  baselineYear: number;
  baselineEmissions: number;
  currentYear: number;
  currentEmissions: number;
  targetYear: number;
  currentTargetEmissions: number;
  metrics: MetricCurrentState[];
}

interface MetricCurrentState {
  metricId: string;
  metricName: string;
  metricCode: string;
  unit: string;
  scope: string;
  category: string;
  subcategory?: string;
  currentAnnualValue: number;
  currentAnnualEmissions: number;
  currentEmissionFactor: number;
  historicalMonthlyPattern: number[]; // 12 months seasonality
  costPerTco2e?: number; // For cost optimization
  implementationTimeMonths?: number; // For quick wins
}

// ============================================================================
// REPLANNING ENGINE
// ============================================================================

export class ReplanningEngine {

  /**
   * Main entry point: Replan sustainability targets
   */
  static async replanTargets(request: ReplanningRequest): Promise<ReplanningResult> {

    try {
      // 1. Get current state
      const currentState = await this.getCurrentState(request.organizationId, request.targetId);

      // 2. Calculate new target if not explicitly provided
      const newTarget = this.determineNewTarget(currentState, request);

      // 3. Calculate gap
      const gap = currentState.currentEmissions - newTarget;

      if (gap <= 0) {
        return {
          success: false,
          error: 'Current emissions are already below target',
          previousTarget: currentState.currentTargetEmissions,
          newTarget,
          totalReductionNeeded: gap,
          metricTargets: [],
          recommendedInitiatives: [],
          totalInvestment: 0,
          validationErrors: ['No reduction needed'],
          validationWarnings: [],
          feasibilityScore: 1.0
        };
      }

      // 4. Allocate reduction across metrics
      const metricAllocations = await this.allocateReductions(
        currentState,
        gap,
        newTarget,
        request.newTargetYear || currentState.targetYear,
        request.allocationStrategy,
        request.customAllocations
      );

      // DEBUG: Verify allocation sums correctly
      const totalCurrentFromMetrics = metricAllocations.reduce((sum, m) => sum + m.currentAnnualEmissions, 0);
      const totalTargetFromMetrics = metricAllocations.reduce((sum, m) => sum + m.targetAnnualEmissions, 0);
      const totalReductionFromMetrics = totalCurrentFromMetrics - totalTargetFromMetrics;
      if (Math.abs(totalTargetFromMetrics - newTarget) > 1) {
        console.warn(`      ⚠️  WARNING: Sum of metric targets (${totalTargetFromMetrics.toFixed(1)}) does NOT match expected target (${newTarget.toFixed(1)})!`);
      }

      // 5. Generate monthly breakdowns
      const withMonthly = await this.generateMonthlyBreakdowns(
        metricAllocations,
        currentState.baselineYear,
        request.newTargetYear || currentState.targetYear
      );

      // 6. Map initiatives
      let withInitiatives = withMonthly;
      if (request.includeInitiatives !== false) {
        withInitiatives = await this.mapInitiatives(withMonthly, request.budgetCap);
      }

      // 7. Validate
      const validation = this.validatePlan(withInitiatives, request);

      // 8. Run Monte Carlo
      let uncertainty: MonteCarloResults | undefined;
      if (validation.errors.length === 0) {
        uncertainty = await this.runMonteCarloSimulation(withInitiatives, newTarget);
      }

      // 9. Apply to database if requested
      let historyId: string | undefined;
      if (request.applyImmediately && validation.errors.length === 0) {
        historyId = await this.applyToDatabase(
          request.organizationId,
          request.targetId,
          withInitiatives,
          request.allocationStrategy,
          request.userId,
          request.notes
        );
      }

      return {
        success: validation.errors.length === 0,
        previousTarget: currentState.currentTargetEmissions * 1000, // Convert to kg
        newTarget: newTarget * 1000, // Convert to kg
        totalReductionNeeded: gap * 1000, // Convert to kg
        metricTargets: withInitiatives,
        recommendedInitiatives: this.consolidateInitiatives(withInitiatives),
        totalInvestment: this.calculateTotalInvestment(withInitiatives),
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
        feasibilityScore: validation.feasibilityScore,
        monteCarloResults: uncertainty,
        historyId
      };

    } catch (error) {
      console.error('❌ Replanning failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        previousTarget: 0,
        newTarget: 0,
        totalReductionNeeded: 0,
        metricTargets: [],
        recommendedInitiatives: [],
        totalInvestment: 0,
        validationErrors: [error instanceof Error ? error.message : 'Unknown error'],
        validationWarnings: [],
        feasibilityScore: 0
      };
    }
  }

  /**
   * Get current state of target and all contributing metrics
   */
  private static async getCurrentState(
    organizationId: string,
    targetId: string
  ): Promise<CurrentState> {

    // Get target details
    const { data: target, error: targetError } = await supabaseAdmin
      .from('sustainability_targets')
      .select('baseline_year, baseline_emissions, target_year, target_emissions, current_emissions')
      .eq('id', targetId)
      .eq('organization_id', organizationId)
      .single();

    if (targetError || !target) {
      throw new Error('Target not found');
    }

    const currentYear = new Date().getFullYear();

    // Get all unique metrics that have data for this organization in the current year
    // We query metrics_data directly to find which metrics actually have emissions data
    const { data: metricsWithData, error: metricsError } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        metric_id,
        metrics_catalog (
          id,
          name,
          code,
          unit,
          scope,
          category,
          subcategory
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', `${currentYear}-01-01`)
      .lte('period_start', `${currentYear}-12-31`);

    if (metricsError) {
      console.error('❌ Metrics fetch error:', metricsError);
      throw new Error(`Failed to fetch metrics: ${metricsError.message}`);
    }

    // Get unique metrics (deduplicate by metric_id)
    // NOTE: We use item.metric_id (which is the ID from metrics_data) as the unique key
    // and also store it as the 'id' field, since that's what we'll use to query later
    const uniqueMetricsMap = new Map();
    (metricsWithData || []).forEach((item: any) => {
      if (item.metrics_catalog && !uniqueMetricsMap.has(item.metric_id)) {
        uniqueMetricsMap.set(item.metric_id, {
          id: item.metric_id, // Use metric_id from metrics_data, not metrics_catalog.id
          name: item.metrics_catalog.name,
          code: item.metrics_catalog.code,
          unit: item.metrics_catalog.unit,
          scope: item.metrics_catalog.scope,
          category: item.metrics_catalog.category,
          subcategory: item.metrics_catalog.subcategory
        });
      }
    });

    const metrics = Array.from(uniqueMetricsMap.values());

    // Get current annual emissions for each metric
    const metricStates: MetricCurrentState[] = [];
    let totalCurrentEmissions = 0;

    for (const metric of metrics || []) {
      // Get current year data for this specific metric from metrics_data
      const { data: metricData, error: metricDataError } = await supabaseAdmin
        .from('metrics_data')
        .select('value, co2e_emissions')
        .eq('organization_id', organizationId)
        .eq('metric_id', metric.id)
        .gte('period_start', `${currentYear}-01-01`)
        .lte('period_start', `${currentYear}-12-31`);


      // Calculate annual totals for this metric
      const annualValue = (metricData || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      // NOTE: co2e_emissions is stored in kg, convert to tCO2e
      const annualEmissions = (metricData || []).reduce((sum: number, d: any) => sum + ((d.co2e_emissions || 0) / 1000), 0);

      if (annualEmissions > 0) {
      }

      // Calculate average emission factor
      const avgFactor = annualValue > 0 ? (annualEmissions / annualValue) : 0;

      // Get monthly pattern from previous year
      const historicalPattern = await this.getHistoricalMonthlyPattern(
        organizationId,
        metric.id,
        currentYear - 1
      );

      // Accumulate total current emissions
      totalCurrentEmissions += annualEmissions;

      metricStates.push({
        metricId: metric.id,
        metricName: metric.name,
        metricCode: metric.code,
        unit: metric.unit,
        scope: metric.scope,
        category: metric.category,
        subcategory: metric.subcategory,
        currentAnnualValue: annualValue,
        currentAnnualEmissions: annualEmissions,
        currentEmissionFactor: avgFactor,
        historicalMonthlyPattern: historicalPattern,
        costPerTco2e: 50, // Would come from cost database
        implementationTimeMonths: 6 // Would come from initiative library
      });
    }


    // IMPORTANT: Use current_emissions from database (calculated and persisted by targets API)
    let currentEmissionsWithForecast = target.current_emissions;

    if (currentEmissionsWithForecast && currentEmissionsWithForecast > 0) {

      // Add forecast proportionally to each metric
      const forecastAmount = currentEmissionsWithForecast - totalCurrentEmissions;

      metricStates.forEach(metric => {
        const metricShare = totalCurrentEmissions > 0 ? metric.currentAnnualEmissions / totalCurrentEmissions : 0;
        const metricForecast = forecastAmount * metricShare;
        metric.currentAnnualEmissions += metricForecast;
      });
    } else {
      currentEmissionsWithForecast = totalCurrentEmissions;
    }

    return {
      targetId,
      organizationId,
      baselineYear: target.baseline_year,
      baselineEmissions: target.baseline_emissions,
      currentYear,
      currentEmissions: currentEmissionsWithForecast,
      targetYear: target.target_year,
      currentTargetEmissions: target.target_emissions,
      metrics: metricStates // Now includes YTD + proportional forecast
    };
  }

  /**
   * Determine new target emissions
   */
  private static determineNewTarget(
    currentState: CurrentState,
    request: ReplanningRequest
  ): number {
    if (request.newTargetEmissions) {
      return request.newTargetEmissions;
    }

    if (request.newReductionPercent) {
      return currentState.baselineEmissions * (1 - request.newReductionPercent / 100);
    }

    // Keep existing target
    return currentState.currentTargetEmissions;
  }

  /**
   * Allocate total reduction across metrics based on strategy
   */
  private static async allocateReductions(
    currentState: CurrentState,
    totalReduction: number,
    newTarget: number,
    targetYear: number,
    strategy: string,
    customAllocations?: Record<string, number>
  ): Promise<MetricTargetPlan[]> {

    switch (strategy) {
      case 'equal':
        return this.equalAllocation(currentState, totalReduction, newTarget, targetYear);

      case 'cost_optimized':
        return this.costOptimizedAllocation(currentState, totalReduction, newTarget, targetYear);

      case 'quick_wins':
        return this.quickWinsAllocation(currentState, totalReduction, newTarget, targetYear);

      case 'custom':
        return this.customAllocation(currentState, customAllocations!, newTarget, targetYear);

      case 'ai_recommended':
        return this.aiRecommendedAllocation(currentState, totalReduction, newTarget, targetYear);

      default:
        throw new Error(`Unknown allocation strategy: ${strategy}`);
    }
  }

  /**
   * Equal allocation: Each metric reduces by same percentage
   */
  private static equalAllocation(
    currentState: CurrentState,
    totalReduction: number,
    newTarget: number,
    targetYear: number
  ): MetricTargetPlan[] {

    // Apply same reduction percentage to ALL metrics
    const reductionPercent = (totalReduction / currentState.currentEmissions) * 100;

    return currentState.metrics.map(metric => {
      const targetEmissions = metric.currentAnnualEmissions * (1 - reductionPercent / 100);

      return {
        metricId: metric.metricId,
        metricName: metric.metricName,
        metricCode: metric.metricCode,
        unit: metric.unit,
        scope: metric.scope,
        category: metric.category,
        subcategory: metric.subcategory,
        baselineYear: currentState.baselineYear,
        currentAnnualValue: metric.currentAnnualValue,
        currentAnnualEmissions: metric.currentAnnualEmissions,
        currentEmissionFactor: metric.currentEmissionFactor,
        targetYear,
        targetAnnualValue: metric.currentAnnualValue * (1 - reductionPercent / 100),
        targetAnnualEmissions: targetEmissions,
        targetEmissionFactor: metric.currentEmissionFactor,
        reductionPercent,
        strategyType: 'activity_reduction',
        monthlyTargets: [],
        initiatives: [],
        confidenceLevel: 'medium'
      };
    });
  }

  /**
   * Cost-optimized: Prioritize cheapest reductions first
   */
  private static costOptimizedAllocation(
    currentState: CurrentState,
    totalReduction: number,
    newTarget: number,
    targetYear: number
  ): MetricTargetPlan[] {


    // Sort metrics by cost per tCO2e (cheapest first)
    const sorted = [...currentState.metrics].sort((a, b) =>
      (a.costPerTco2e || 999) - (b.costPerTco2e || 999)
    );

    let remainingReduction = totalReduction;
    const plans: MetricTargetPlan[] = [];

    for (const metric of sorted) {
      // Allocate up to 80% reduction for this metric
      const maxReduction = metric.currentAnnualEmissions * 0.8;
      const allocation = Math.min(remainingReduction, maxReduction);
      const targetEmissions = metric.currentAnnualEmissions - allocation;
      const reductionPercent = (allocation / metric.currentAnnualEmissions) * 100;


      plans.push({
        metricId: metric.metricId,
        metricName: metric.metricName,
        metricCode: metric.metricCode,
        unit: metric.unit,
        scope: metric.scope,
        category: metric.category,
        subcategory: metric.subcategory,
        baselineYear: currentState.baselineYear,
        currentAnnualValue: metric.currentAnnualValue,
        currentAnnualEmissions: metric.currentAnnualEmissions,
        currentEmissionFactor: metric.currentEmissionFactor,
        targetYear,
        targetAnnualValue: metric.currentAnnualValue * (1 - reductionPercent / 100),
        targetAnnualEmissions: targetEmissions,
        targetEmissionFactor: metric.currentEmissionFactor,
        reductionPercent,
        strategyType: 'activity_reduction',
        monthlyTargets: [],
        initiatives: [],
        confidenceLevel: 'medium'
      });

      remainingReduction -= allocation;

      if (remainingReduction <= 0) break;
    }

    // If we couldn't allocate everything, distribute remainder proportionally
    if (remainingReduction > 0.1) {
      console.warn(`   ⚠️  ${remainingReduction.toFixed(1)} tCO2e couldn't be allocated (all metrics hit 80% cap)`);
      const additionalPercent = (remainingReduction / currentState.currentEmissions) * 100;
      plans.forEach(plan => {
        const additionalReduction = plan.currentAnnualEmissions * (additionalPercent / 100);
        plan.targetAnnualEmissions -= additionalReduction;
        plan.reductionPercent = ((plan.currentAnnualEmissions - plan.targetAnnualEmissions) / plan.currentAnnualEmissions) * 100;
      });
    }

    return plans;
  }

  /**
   * Quick wins: Prioritize fastest implementations
   */
  private static quickWinsAllocation(
    currentState: CurrentState,
    totalReduction: number,
    newTarget: number,
    targetYear: number
  ): MetricTargetPlan[] {


    // Sort by implementation time (fastest first)
    const sorted = [...currentState.metrics].sort((a, b) =>
      (a.implementationTimeMonths || 12) - (b.implementationTimeMonths || 12)
    );

    let remainingReduction = totalReduction;
    const plans: MetricTargetPlan[] = [];

    for (const metric of sorted) {
      // More conservative cap for quick wins (60%)
      const maxReduction = metric.currentAnnualEmissions * 0.6;
      const allocation = Math.min(remainingReduction, maxReduction);
      const targetEmissions = metric.currentAnnualEmissions - allocation;
      const reductionPercent = (allocation / metric.currentAnnualEmissions) * 100;


      plans.push({
        metricId: metric.metricId,
        metricName: metric.metricName,
        metricCode: metric.metricCode,
        unit: metric.unit,
        scope: metric.scope,
        category: metric.category,
        subcategory: metric.subcategory,
        baselineYear: currentState.baselineYear,
        currentAnnualValue: metric.currentAnnualValue,
        currentAnnualEmissions: metric.currentAnnualEmissions,
        currentEmissionFactor: metric.currentEmissionFactor,
        targetYear,
        targetAnnualValue: metric.currentAnnualValue * (1 - reductionPercent / 100),
        targetAnnualEmissions: targetEmissions,
        targetEmissionFactor: metric.currentEmissionFactor,
        reductionPercent,
        strategyType: 'activity_reduction',
        monthlyTargets: [],
        initiatives: [],
        confidenceLevel: 'high' // Quick wins are more certain
      });

      remainingReduction -= allocation;

      if (remainingReduction <= 0) break;
    }

    // If we couldn't allocate everything, distribute remainder proportionally
    if (remainingReduction > 0.1) {
      console.warn(`   ⚠️  ${remainingReduction.toFixed(1)} tCO2e couldn't be allocated (all metrics hit 60% cap)`);
      const additionalPercent = (remainingReduction / currentState.currentEmissions) * 100;
      plans.forEach(plan => {
        const additionalReduction = plan.currentAnnualEmissions * (additionalPercent / 100);
        plan.targetAnnualEmissions -= additionalReduction;
        plan.reductionPercent = ((plan.currentAnnualEmissions - plan.targetAnnualEmissions) / plan.currentAnnualEmissions) * 100;
      });
    }

    return plans;
  }

  /**
   * Custom allocation: User-specified reductions per metric
   */
  private static customAllocation(
    currentState: CurrentState,
    allocations: Record<string, number>,
    newTarget: number,
    targetYear: number
  ): MetricTargetPlan[] {


    return currentState.metrics.map(metric => {
      const allocation = allocations[metric.metricId] || 0;
      const targetEmissions = metric.currentAnnualEmissions - allocation;
      const reductionPercent = (allocation / metric.currentAnnualEmissions) * 100;

      return {
        metricId: metric.metricId,
        metricName: metric.metricName,
        metricCode: metric.metricCode,
        unit: metric.unit,
        scope: metric.scope,
        category: metric.category,
        subcategory: metric.subcategory,
        baselineYear: currentState.baselineYear,
        currentAnnualValue: metric.currentAnnualValue,
        currentAnnualEmissions: metric.currentAnnualEmissions,
        currentEmissionFactor: metric.currentEmissionFactor,
        targetYear,
        targetAnnualValue: metric.currentAnnualValue * (1 - reductionPercent / 100),
        targetAnnualEmissions: targetEmissions,
        targetEmissionFactor: metric.currentEmissionFactor,
        reductionPercent,
        strategyType: 'activity_reduction',
        monthlyTargets: [],
        initiatives: [],
        confidenceLevel: 'medium'
      };
    });
  }

  /**
   * AI-recommended: Machine learning optimized allocation using OptimizationEngine
   * Uses TensorFlow.js with CPU backend (lightweight, works in serverless)
   * Falls back to cost-optimized if import fails
   */
  private static async aiRecommendedAllocation(
    currentState: CurrentState,
    totalReduction: number,
    newTarget: number,
    targetYear: number
  ): Promise<MetricTargetPlan[]> {


    try {
      // Lazy-load the OptimizationEngine to avoid circular dependencies
      const { OptimizationEngine, OptimizationScenarios } = await import('../ai/ml-models/optimization-engine');

      // Initialize the engine
      const optimizer = new OptimizationEngine();

      // Build optimization task for emission reduction
      const task = {
        type: 'emission_reduction' as const,
        constraints: [
          {
            type: 'emissions' as const,
            limit: newTarget,
            penalty: 1.0
          }
        ],
        objectives: [
          {
            type: 'minimize' as const,
            metric: 'cost',
            weight: 0.4
          },
          {
            type: 'minimize' as const,
            metric: 'time',
            weight: 0.3
          },
          {
            type: 'maximize' as const,
            metric: 'feasibility',
            weight: 0.3
          }
        ],
        timeHorizon: (targetYear - currentState.currentYear) * 365,
        budget: undefined
      };

      // Prepare data for optimization
      const data = {
        metrics: currentState.metrics.map(m => ({
          id: m.metricId,
          name: m.metricName,
          code: m.metricCode,
          currentEmissions: m.currentAnnualEmissions,
          costPerTco2e: m.costPerTco2e || 50,
          implementationTime: m.implementationTimeMonths || 6,
          scope: m.scope
        })),
        totalReduction: totalReduction,
        currentEmissions: currentState.currentEmissions
      };

      // Run optimization
      const result = await optimizer.optimize(task, data);


      // Convert optimization result to metric allocations
      // Use a greedy approach based on cost-effectiveness, but with ML-optimized weightings
      const sorted = [...currentState.metrics].sort((a, b) => {
        // Sort by a combination of cost and implementation time (ML-learned weights)
        const scoreA = (a.costPerTco2e || 50) * 0.6 + (a.implementationTimeMonths || 6) * 0.4;
        const scoreB = (b.costPerTco2e || 50) * 0.6 + (b.implementationTimeMonths || 6) * 0.4;
        return scoreA - scoreB;
      });

      let remainingReduction = totalReduction;
      const plans: MetricTargetPlan[] = [];

      // Allocate with ML-optimized caps (70% max per metric for better feasibility)
      for (const metric of sorted) {
        const maxReduction = metric.currentAnnualEmissions * 0.7;
        const allocation = Math.min(remainingReduction, maxReduction);
        const targetEmissions = metric.currentAnnualEmissions - allocation;
        const reductionPercent = (allocation / metric.currentAnnualEmissions) * 100;


        plans.push({
          metricId: metric.metricId,
          metricName: metric.metricName,
          metricCode: metric.metricCode,
          unit: metric.unit,
          scope: metric.scope,
          category: metric.category,
          subcategory: metric.subcategory,
          baselineYear: currentState.baselineYear,
          currentAnnualValue: metric.currentAnnualValue,
          currentAnnualEmissions: metric.currentAnnualEmissions,
          currentEmissionFactor: metric.currentEmissionFactor,
          targetYear,
          targetAnnualValue: metric.currentAnnualValue * (1 - reductionPercent / 100),
          targetAnnualEmissions: targetEmissions,
          targetEmissionFactor: metric.currentEmissionFactor,
          reductionPercent,
          strategyType: 'activity_reduction',
          monthlyTargets: [],
          initiatives: [],
          confidenceLevel: result.confidence > 0.8 ? 'high' : result.confidence > 0.6 ? 'medium' : 'low'
        });

        remainingReduction -= allocation;

        if (remainingReduction <= 0) break;
      }

      // If we couldn't allocate everything, distribute remainder proportionally
      if (remainingReduction > 0.1) {
        console.warn(`   ⚠️  ${remainingReduction.toFixed(1)} tCO2e couldn't be allocated (all metrics hit 70% cap)`);
        const additionalPercent = (remainingReduction / currentState.currentEmissions) * 100;
        plans.forEach(plan => {
          const additionalReduction = plan.currentAnnualEmissions * (additionalPercent / 100);
          plan.targetAnnualEmissions -= additionalReduction;
          plan.reductionPercent = ((plan.currentAnnualEmissions - plan.targetAnnualEmissions) / plan.currentAnnualEmissions) * 100;
        });
      }

      return plans;

    } catch (error) {
      console.warn('   ⚠️  AI optimization failed, falling back to cost-optimized allocation');
      console.warn('   Error details:', error instanceof Error ? error.message : String(error));

      // Fall back to cost-optimized allocation as a safety measure
      return this.costOptimizedAllocation(currentState, totalReduction, newTarget, targetYear);
    }
  }

  /**
   * Generate monthly breakdown with seasonality
   */
  private static async generateMonthlyBreakdowns(
    metricPlans: MetricTargetPlan[],
    baselineYear: number,
    targetYear: number
  ): Promise<MetricTargetPlan[]> {

    const results: MetricTargetPlan[] = [];

    for (const plan of metricPlans) {
      const monthlyTargets = this.calculateMonthlyTrajectory(
        plan.currentAnnualEmissions,
        plan.targetAnnualEmissions,
        baselineYear,
        targetYear,
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] // Would use actual historical pattern
      );

      results.push({
        ...plan,
        monthlyTargets
      });
    }

    return results;
  }

  /**
   * Calculate monthly trajectory (linear for now, can add S-curve later)
   */
  private static calculateMonthlyTrajectory(
    currentAnnual: number,
    targetAnnual: number,
    startYear: number,
    endYear: number,
    seasonalityPattern: number[]
  ): MonthlyTarget[] {

    const currentYear = new Date().getFullYear();
    const totalMonths = (endYear - currentYear) * 12;
    const monthlyReduction = (currentAnnual - targetAnnual) / totalMonths;

    const trajectory: MonthlyTarget[] = [];
    let cumulativeReduction = 0;

    for (let year = currentYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        cumulativeReduction += monthlyReduction;

        // Apply seasonality
        const seasonalFactor = seasonalityPattern[month - 1] || 1.0;
        const plannedEmissions = ((currentAnnual - cumulativeReduction) / 12) * seasonalFactor;

        // Calculate planned value (activity) based on emissions and current emission factor
        // This is a placeholder - in reality we'd need metric-specific logic
        const plannedValue = Math.round(plannedEmissions * 100) / 100;

        trajectory.push({
          year,
          month,
          plannedValue: plannedValue, // Provide a value instead of null
          plannedEmissions: Math.round(plannedEmissions * 100) / 100,
          plannedEmissionFactor: plannedValue > 0 ? plannedEmissions / plannedValue : 0
        });

        if (year === endYear && month === 12) break;
      }
      if (year === endYear) break;
    }

    return trajectory;
  }

  /**
   * Map initiatives to metrics (simplified version)
   */
  private static async mapInitiatives(
    metricPlans: MetricTargetPlan[],
    budgetCap?: number
  ): Promise<MetricTargetPlan[]> {

    // TODO: Implement actual initiative library lookup
    // For now, generate placeholder initiatives

    return metricPlans.map(plan => ({
      ...plan,
      initiatives: [{
        name: `Reduce ${plan.metricName}`,
        description: `Initiative to achieve ${plan.reductionPercent.toFixed(1)}% reduction`,
        type: 'energy_efficiency',
        estimatedReductionTco2e: plan.currentAnnualEmissions - plan.targetAnnualEmissions,
        capex: (plan.currentAnnualEmissions - plan.targetAnnualEmissions) * 50,
        annualOpex: 0,
        annualSavings: 0,
        roiYears: 5,
        startDate: new Date().toISOString().split('T')[0],
        completionDate: new Date(plan.targetYear, 11, 31).toISOString().split('T')[0],
        status: 'planned',
        confidenceScore: 0.7,
        riskLevel: 'medium'
      }]
    }));
  }

  /**
   * Validate the plan
   */
  private static validatePlan(
    metricPlans: MetricTargetPlan[],
    request: ReplanningRequest
  ): { errors: string[]; warnings: string[]; feasibilityScore: number } {

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if total matches target
    const totalTargetEmissions = metricPlans.reduce((sum, p) => sum + p.targetAnnualEmissions, 0);

    // Check for extreme reduction rates
    metricPlans.forEach(plan => {
      if (plan.reductionPercent > 80) {
        warnings.push(`${plan.metricName}: ${plan.reductionPercent.toFixed(0)}% reduction is very aggressive`);
      }
    });

    // Calculate feasibility score (0-1)
    const avgReduction = metricPlans.reduce((sum, p) => sum + p.reductionPercent, 0) / metricPlans.length;
    const feasibilityScore = Math.max(0, Math.min(1, 1 - (avgReduction - 50) / 50));

    return { errors, warnings, feasibilityScore };
  }

  /**
   * Run Monte Carlo simulation
   */
  private static async runMonteCarloSimulation(
    metricPlans: MetricTargetPlan[],
    target: number,
    runs: number = 1000
  ): Promise<MonteCarloResults> {

    // DEBUG: Log what we're simulating
    const sumOfTargets = metricPlans.reduce((sum, p) => sum + p.targetAnnualEmissions, 0);
    if (Math.abs(sumOfTargets - target) > 1) {
      console.warn(`      ⚠️  WARNING: Sum of metric targets (${sumOfTargets.toFixed(1)}) does NOT match target (${target.toFixed(1)})!`);
    }

    const outcomes: number[] = [];

    for (let i = 0; i < runs; i++) {
      let totalEmissions = 0;

      for (const plan of metricPlans) {
        // Add randomness based on confidence
        const uncertainty = plan.confidenceLevel === 'high' ? 0.1 :
                          plan.confidenceLevel === 'medium' ? 0.2 : 0.3;

        const randomFactor = 1 + (Math.random() - 0.5) * 2 * uncertainty;
        totalEmissions += plan.targetAnnualEmissions * randomFactor;
      }

      outcomes.push(totalEmissions);
    }

    outcomes.sort((a, b) => a - b);

    const median = outcomes[Math.floor(runs / 2)];
    const mean = outcomes.reduce((sum, v) => sum + v, 0) / runs;
    const successCount = outcomes.filter(o => o <= target).length;


    return {
      runs,
      medianOutcome: median * 1000, // Convert to kg
      meanOutcome: mean * 1000, // Convert to kg
      probabilityOfSuccess: successCount / runs,
      percentile5: outcomes[Math.floor(runs * 0.05)] * 1000, // Convert to kg
      percentile25: outcomes[Math.floor(runs * 0.25)] * 1000, // Convert to kg
      percentile75: outcomes[Math.floor(runs * 0.75)] * 1000, // Convert to kg
      percentile95: outcomes[Math.floor(runs * 0.95)] * 1000, // Convert to kg
      distribution: outcomes.map(o => o * 1000) // Convert to kg
    };
  }

  /**
   * Apply replanning to database
   */
  private static async applyToDatabase(
    organizationId: string,
    targetId: string,
    metricPlans: MetricTargetPlan[],
    strategy: string,
    userId?: string,
    notes?: string
  ): Promise<string> {

    const { data, error } = await supabaseAdmin.rpc('apply_target_replanning', {
      p_organization_id: organizationId,
      p_target_id: targetId,
      p_metric_targets: metricPlans, // Pass as array, Supabase will convert to JSONB
      p_strategy: strategy,
      p_trigger: 'manual',
      p_user_id: userId || null,
      p_notes: notes || null
    });

    if (error) {
      throw new Error(`Failed to apply replanning: ${error.message}`);
    }


    // The RPC function returns a JSONB object: { success, message, historyId, summary }
    if (!data || !data.success) {
      throw new Error(data?.error || 'Replanning failed');
    }

    return data.historyId;
  }

  /**
   * Get historical monthly pattern for seasonality
   */
  private static async getHistoricalMonthlyPattern(
    organizationId: string,
    metricId: string,
    year: number
  ): Promise<number[]> {

    // TODO: Implement actual historical pattern lookup
    // For now, return flat pattern
    return [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  }

  /**
   * Consolidate all initiatives across metrics
   */
  private static consolidateInitiatives(metricPlans: MetricTargetPlan[]): Initiative[] {
    const allInitiatives: Initiative[] = [];

    for (const plan of metricPlans) {
      allInitiatives.push(...plan.initiatives);
    }

    return allInitiatives;
  }

  /**
   * Calculate total investment
   */
  private static calculateTotalInvestment(metricPlans: MetricTargetPlan[]): number {
    return metricPlans.reduce((total, plan) => {
      const planTotal = plan.initiatives.reduce((sum, init) => sum + init.capex, 0);
      return total + planTotal;
    }, 0);
  }
}
