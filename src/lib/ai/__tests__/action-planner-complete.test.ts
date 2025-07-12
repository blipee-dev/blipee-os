import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ActionPlanner } from '../action-planner';
import { SustainabilityIntelligence } from '../sustainability-intelligence';

jest.mock('../sustainability-intelligence');

describe('AI Action Planner - Complete Tests', () => {
  let actionPlanner: ActionPlanner;
  let mockIntelligence: jest.Mocked<SustainabilityIntelligence>;

  beforeEach(() => {
    actionPlanner = new ActionPlanner();
    mockIntelligence = new SustainabilityIntelligence() as jest.Mocked<SustainabilityIntelligence>;
  });

  describe('Goal-based Planning', () => {
    it('should create action plan for emission reduction goal', async () => {
      const goal = {
        type: 'emission_reduction',
        target: 30, // 30% reduction
        timeframe: '12m',
        baseline: 1000 // tons CO2
      };

      const context = {
        building: {
          currentEmissions: 1000,
          energySources: { grid: 70, solar: 30 },
          equipment: ['hvac', 'lighting', 'servers']
        }
      };

      const plan = await actionPlanner.createPlan(goal, context);

      expect(plan.steps).toBeInstanceOf(Array);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.estimatedReduction).toBeGreaterThanOrEqual(300);
      expect(plan.timeline).toBeDefined();
      expect(plan.priority).toBe('high');

      // Verify specific actions
      const actions = plan.steps.map(s => s.action);
      expect(actions).toContain('optimize_hvac_schedule');
      expect(actions).toContain('increase_solar_capacity');
      expect(actions).toContain('upgrade_lighting_to_led');
    });

    it('should prioritize cost-effective actions', async () => {
      const goal = {
        type: 'cost_reduction',
        target: 20,
        constraints: { budget: 50000 }
      };

      const plan = await actionPlanner.createPlan(goal, {});

      // Should be sorted by ROI
      expect(plan.steps[0].roi).toBeGreaterThan(plan.steps[1].roi);
      
      // Total cost should be within budget
      const totalCost = plan.steps.reduce((sum, step) => sum + step.cost, 0);
      expect(totalCost).toBeLessThanOrEqual(50000);
    });

    it('should handle multi-objective optimization', async () => {
      const goals = [
        { type: 'emission_reduction', target: 25, weight: 0.6 },
        { type: 'cost_reduction', target: 15, weight: 0.4 }
      ];

      const plan = await actionPlanner.createMultiObjectivePlan(goals, {});

      expect(plan.tradeoffs).toBeDefined();
      expect(plan.paretoOptimal).toBe(true);
      expect(plan.scores.emission).toBeGreaterThan(0);
      expect(plan.scores.cost).toBeGreaterThan(0);
    });
  });

  describe('Adaptive Planning', () => {
    it('should adapt plan based on progress', async () => {
      const originalPlan = {
        id: 'plan123',
        steps: [
          { id: 'step1', status: 'completed' },
          { id: 'step2', status: 'in_progress' },
          { id: 'step3', status: 'pending' }
        ],
        target: 30
      };

      const progress = {
        achieved: 10, // Only 10% reduction so far
        daysElapsed: 60,
        totalDays: 365
      };

      const adaptedPlan = await actionPlanner.adaptPlan(originalPlan, progress);

      expect(adaptedPlan.adjusted).toBe(true);
      expect(adaptedPlan.newSteps.length).toBeGreaterThan(0);
      expect(adaptedPlan.urgency).toBe('high');
    });

    it('should suggest alternative approaches when blocked', async () => {
      const blockedStep = {
        action: 'install_solar_panels',
        reason: 'regulatory_approval_denied'
      };

      const alternatives = await actionPlanner.getAlternatives(blockedStep);

      expect(alternatives).toContainEqual(
        expect.objectContaining({
          action: 'purchase_renewable_energy_credits'
        })
      );
      expect(alternatives).toContainEqual(
        expect.objectContaining({
          action: 'join_community_solar_program'
        })
      );
    });
  });

  describe('Scenario Analysis', () => {
    it('should simulate plan outcomes', async () => {
      const plan = {
        steps: [
          { action: 'upgrade_hvac', impact: 15 },
          { action: 'solar_installation', impact: 25 }
        ]
      };

      const scenarios = await actionPlanner.runScenarios(plan, {
        monteCarloRuns: 1000,
        variables: ['energy_prices', 'weather', 'occupancy']
      });

      expect(scenarios.bestCase.reduction).toBeGreaterThan(40);
      expect(scenarios.worstCase.reduction).toBeLessThan(30);
      expect(scenarios.mostLikely.reduction).toBeCloseTo(38, 1);
      expect(scenarios.confidence).toBeGreaterThan(0.8);
    });
  });
});