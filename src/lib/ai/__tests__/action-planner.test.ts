import { IntelligentActionPlanner, intelligentActionPlanner } from '../action-planner';
import { aiContextEngine } from '../context-engine';
import { aiService } from '../service';

// Mock dependencies
jest.mock('../context-engine');
jest.mock('../service');

describe('IntelligentActionPlanner', () => {
  let actionPlanner: IntelligentActionPlanner;
  let mockContext: any;
  let mockAiAnalysis: any;

  beforeEach(() => {
    actionPlanner = new IntelligentActionPlanner();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Setup mock context
    mockContext = {
      building: { name: 'Test Building', id: 'test-building-1' },
      realTimeMetrics: {
        energy: {
          currentUsage: 4500,
          trend: 'increasing',
          efficiency: 87,
          peakToday: 5200,
          baseline: 4300
        },
        comfort: {
          temperature: { current: 22.5, target: 22.5, zones: [] },
          humidity: { current: 45, target: 50 },
          airQuality: { co2: 420, pm25: 8, voc: 0.3 }
        },
        occupancy: {
          current: 150,
          capacity: 200,
          distribution: [],
          patterns: []
        },
        equipment: {
          hvac: [],
          lighting: [],
          security: [],
          elevators: []
        }
      },
      historicalPatterns: [
        {
          type: 'energy',
          pattern: 'Energy usage spikes 25% on Monday mornings',
          confidence: 0.89,
          impact: 'high',
          recommendations: ['Pre-cooling', 'Staggered startup']
        }
      ],
      environmentalFactors: {
        weather: {
          current: { temp: 75, humidity: 65, pressure: 1013 },
          forecast: [],
          impact: 'Moderate cooling load'
        },
        timeContext: {
          timeOfDay: 'afternoon',
          dayOfWeek: 'Monday',
          season: 'summer',
          isHoliday: false,
          specialEvents: []
        },
        economicFactors: {
          energyPrices: { current: 0.12, peak: 0.18, offPeak: 0.08 },
          demandCharges: { threshold: 500, rate: 12.5 },
          incentives: []
        }
      },
      userProfile: {
        firstName: 'Alex',
        expertise: 'intermediate',
        role: 'facility_manager',
        preferences: {
          communicationStyle: 'business',
          visualizationPreference: 'mixed',
          notificationFrequency: 'daily'
        },
        goals: ['Reduce energy costs by 20%'],
        previousInteractions: []
      },
      conversationMemory: {
        currentSession: [],
        recentTopics: ['energy optimization'],
        unresolved: [],
        actionItems: [],
        learnings: []
      },
      predictiveInsights: [
        {
          type: 'opportunity',
          prediction: 'Shifting lighting loads could save $1,840/month',
          confidence: 0.87,
          timeframe: 'immediate',
          impact: { financial: 1840, operational: 'No disruption' },
          recommendedAction: 'Implement automated lighting schedule',
          urgency: 'medium'
        }
      ],
      deviceCapabilities: [
        {
          name: 'HVAC System',
          capabilities: ['temperature_control', 'scheduling', 'efficiency_monitoring']
        }
      ],
      plannedActivities: []
    };

    // Setup mock AI analysis
    mockAiAnalysis = {
      message: 'Based on analysis, implementing energy optimization strategies.',
      intent: 'energy_optimization',
      insights: ['High energy usage detected'],
      recommendations: ['Optimize HVAC scheduling']
    };

    // Mock the context engine
    (aiContextEngine.buildEnrichedContext as jest.Mock).mockResolvedValue(mockContext);
    (aiContextEngine.buildSuperchargedPrompt as jest.Mock).mockResolvedValue('Test prompt');

    // Mock the AI service
    (aiService.complete as jest.Mock).mockResolvedValue({
      content: 'AI response content'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processIntelligentRequest', () => {
    it('should process user request and return complete intelligent response', async () => {
      const userMessage = 'How can I optimize energy usage?';
      const _userId = 'test-user-123';

      const response = await actionPlanner.processIntelligentRequest(userMessage, userId);

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.actionPlan).toBeDefined();
      expect(response.components).toBeDefined();
      expect(response.predictions).toBeDefined();
      expect(response.automations).toBeDefined();
      expect(response.learnings).toBeDefined();
    });

    it('should build enriched context with user message', async () => {
      const userMessage = 'Show me HVAC efficiency';
      const _userId = 'test-user-123';

      await actionPlanner.processIntelligentRequest(userMessage, userId);

      expect(aiContextEngine.buildEnrichedContext).toHaveBeenCalledWith(userMessage, userId);
    });

    it('should generate supercharged prompt', async () => {
      const userMessage = 'Analyze building performance';

      await actionPlanner.processIntelligentRequest(userMessage);

      expect(aiContextEngine.buildSuperchargedPrompt).toHaveBeenCalledWith(
        userMessage,
        mockContext
      );
    });

    it('should call AI service with enriched prompt', async () => {
      const userMessage = 'What are the energy trends?';

      await actionPlanner.processIntelligentRequest(userMessage);

      expect(aiService.complete).toHaveBeenCalledWith(
        'Test prompt',
        expect.objectContaining({
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: expect.stringContaining('Blipee')
        })
      );
    });
  });

  describe('action plan generation', () => {
    it('should generate comprehensive action plan', async () => {
      const userMessage = 'Optimize energy consumption';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      expect(response.actionPlan).toMatchObject({
        intent: expect.any(String),
        steps: expect.any(Array),
        priority: expect.stringMatching(/^(low|medium|high|critical)$/),
        timeline: expect.any(String),
        estimatedImpact: expect.objectContaining({
          financial: expect.any(Object),
          operational: expect.any(Object),
          environmental: expect.any(Object),
          compliance: expect.any(Object)
        }),
        confidence: expect.any(Number),
        requiredApprovals: expect.any(Array)
      });
    });

    it('should generate executable steps for energy optimization', async () => {
      const userMessage = 'Reduce energy costs';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const steps = response.actionPlan.steps;
      expect(steps).toBeInstanceOf(Array);
      
      if (steps.length > 0) {
        const step = steps[0];
        expect(step).toMatchObject({
          id: expect.any(String),
          action: expect.any(String),
          description: expect.any(String),
          automatable: expect.any(Boolean),
          estimated_duration: expect.any(String),
          risk_level: expect.stringMatching(/^(low|medium|high)$/),
          dependencies: expect.any(Array),
          parameters: expect.any(Object),
          rollback_plan: expect.any(String)
        });
      }
    });

    it('should calculate financial impact', async () => {
      const userMessage = 'What savings can I achieve?';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const impact = response.actionPlan.estimatedImpact;
      expect(impact.financial).toMatchObject({
        savings: expect.any(Number),
        costs: expect.any(Number),
        roi: expect.any(Number),
        payback: expect.any(String)
      });
    });

    it('should assess priority based on impact', async () => {
      const userMessage = 'Find cost savings opportunities';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      // With expected savings > $1000, priority should be high
      expect(response.actionPlan.priority).toMatch(/^(high|critical)$/);
    });

    it('should identify required approvals', async () => {
      const userMessage = 'Implement major energy changes';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const approvals = response.actionPlan.requiredApprovals;
      expect(approvals).toBeInstanceOf(Array);
      
      // With high savings, should require facility manager approval
      expect(approvals.some(a => a.includes('Facility Manager'))).toBe(true);
    });
  });

  describe('UI component generation', () => {
    it('should generate energy visualization for energy-related requests', async () => {
      const userMessage = 'Show energy usage';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const energyComponent = response.components.find(c => c.type === 'energy-dashboard');
      expect(energyComponent).toBeDefined();
      expect(energyComponent?.props).toMatchObject({
        title: expect.any(String),
        currentUsage: expect.any(Number),
        trend: expect.any(String),
        efficiency: expect.any(Number),
        breakdown: expect.any(Array),
        predictions: expect.any(Object)
      });
    });

    it('should include interactivity specifications', async () => {
      const userMessage = 'Control building energy';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const interactiveComponent = response.components.find(c => c.interactivity);
      expect(interactiveComponent?.interactivity).toMatchObject({
        clickable: expect.any(Boolean),
        controls: expect.any(Array),
        realtime_updates: expect.any(Boolean),
        animations: expect.any(Array)
      });
    });

    it('should generate optimization dashboard for optimization requests', async () => {
      const userMessage = 'Optimize building operations';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const optimizationComponent = response.components.find(
        c => c.type === 'optimization-dashboard'
      );
      expect(optimizationComponent).toBeDefined();
      expect(optimizationComponent?.props.opportunities).toBeInstanceOf(Array);
      expect(optimizationComponent?.props.totalSavings).toBeDefined();
    });

    it('should generate action panel for high priority actions', async () => {
      const userMessage = 'Emergency energy reduction needed';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const actionPanel = response.components.find(c => c.type === 'action-panel');
      expect(actionPanel).toBeDefined();
      expect(actionPanel?.props.priority).toBeDefined();
      expect(actionPanel?.props.steps).toBeInstanceOf(Array);
    });

    it('should always include insights panel', async () => {
      const userMessage = 'Any message';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const insightsPanel = response.components.find(c => c.type === 'insights-panel');
      expect(insightsPanel).toBeDefined();
      expect(insightsPanel?.props.insights).toBeInstanceOf(Array);
    });
  });

  describe('predictions generation', () => {
    it('should generate energy predictions', async () => {
      const userMessage = 'Predict energy usage';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const energyPrediction = response.predictions.find(p => p.type === 'energy');
      expect(energyPrediction).toBeDefined();
      expect(energyPrediction).toMatchObject({
        type: 'energy',
        description: expect.any(String),
        probability: expect.any(Number),
        timeframe: expect.any(String),
        severity: expect.stringMatching(/^(info|warning|critical)$/),
        recommended_action: expect.any(String),
        financial_impact: expect.any(Number)
      });
    });

    it('should generate maintenance predictions randomly', async () => {
      // Run multiple times to test randomness
      let foundMaintenance = false;
      for (let i = 0; i < 10; i++) {
        const response = await actionPlanner.processIntelligentRequest('test');
        const maintenancePrediction = response.predictions.find(p => p.type === 'maintenance');
        if (maintenancePrediction) {
          foundMaintenance = true;
          expect(maintenancePrediction.severity).toBe('critical');
          expect(maintenancePrediction.financial_impact).toBeLessThan(0);
          break;
        }
      }
      // Should find at least one maintenance prediction in 10 runs
      expect(foundMaintenance).toBe(true);
    });

    it('should generate cost optimization predictions', async () => {
      const userMessage = 'Find cost savings';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const costPrediction = response.predictions.find(p => p.type === 'cost');
      expect(costPrediction).toBeDefined();
      expect(costPrediction?.financial_impact).toBeGreaterThan(0);
      expect(costPrediction?.probability).toBeGreaterThan(0.8);
    });
  });

  describe('automations generation', () => {
    it('should generate smart HVAC automation', async () => {
      const userMessage = 'Automate HVAC';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const hvacAutomation = response.automations.find(a => a.id === 'smart-hvac-schedule');
      expect(hvacAutomation).toBeDefined();
      expect(hvacAutomation).toMatchObject({
        id: 'smart-hvac-schedule',
        name: expect.any(String),
        trigger: expect.any(String),
        action: expect.any(String),
        conditions: expect.any(Object),
        enabled: true,
        learning_enabled: true,
        safety_limits: expect.objectContaining({
          min_indoor_temp: expect.any(Number),
          max_energy_increase: expect.any(Number)
        })
      });
    });

    it('should generate demand response automation', async () => {
      const userMessage = 'Setup demand response';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const demandResponse = response.automations.find(a => a.id === 'demand-response');
      expect(demandResponse).toBeDefined();
      expect(demandResponse?.conditions).toHaveProperty('demand_response_signal');
      expect(demandResponse?.safety_limits).toHaveProperty('max_load_reduction');
    });

    it('should include safety limits in all automations', async () => {
      const userMessage = 'Create automations';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      response.automations.forEach(automation => {
        expect(automation.safety_limits).toBeDefined();
        expect(Object.keys(automation.safety_limits).length).toBeGreaterThan(0);
      });
    });
  });

  describe('learnings extraction', () => {
    it('should extract user behavior patterns', async () => {
      const userMessage = 'Optimize energy';
      const _userId = 'test-user';

      const response = await actionPlanner.processIntelligentRequest(userMessage, userId);

      expect(response.learnings).toBeInstanceOf(Array);
      expect(response.learnings.length).toBeGreaterThan(0);
      
      const learning = response.learnings[0];
      expect(learning).toMatchObject({
        pattern: expect.any(String),
        confidence: expect.any(Number),
        application: expect.any(String),
        validation: expect.any(String)
      });
    });

    it('should include user role in learning patterns', async () => {
      const userMessage = 'Energy analysis';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const learning = response.learnings[0];
      expect(learning.pattern).toContain('facility_manager');
      expect(learning.pattern).toContain('afternoon');
    });
  });

  describe('helper methods', () => {
    it('should calculate timeline based on steps duration', async () => {
      const userMessage = 'Quick optimization';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      // With 2 steps of 2 and 5 minutes
      expect(response.actionPlan.timeline).toMatch(/\d+\s+(minutes|hours)/);
    });

    it('should set confidence level appropriately', async () => {
      const userMessage = 'Analyze patterns';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      expect(response.actionPlan.confidence).toBeGreaterThan(0);
      expect(response.actionPlan.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('component props generation', () => {
    it('should generate energy breakdown with correct proportions', async () => {
      const userMessage = 'Show energy breakdown';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const energyDashboard = response.components.find(c => c.type === 'energy-dashboard');
      const breakdown = energyDashboard?.props.breakdown;
      
      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown?.length).toBe(3);
      
      const total = breakdown?.reduce((sum, item) => sum + item.value, 0) || 0;
      const expectedTotal = mockContext.realTimeMetrics.energy.currentUsage;
      expect(total).toBeCloseTo(expectedTotal, -1);
    });

    it('should generate efficiency controls with options', async () => {
      const userMessage = 'Show efficiency controls';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const efficiencyControls = response.components.find(c => c.type === 'efficiency-controls');
      expect(efficiencyControls).toBeDefined();
      
      const controls = efficiencyControls?.props.controls;
      expect(controls).toBeInstanceOf(Array);
      controls?.forEach(control => {
        expect(control.name).toBeDefined();
        expect(control.current).toBeDefined();
        expect(control.options).toBeInstanceOf(Array);
        expect(control.impact).toBeDefined();
      });
    });

    it('should generate impact projections with timeline', async () => {
      const userMessage = 'Show impact analysis';

      const response = await actionPlanner.processIntelligentRequest(userMessage);

      const impactProjection = response.components.find(c => c.type === 'impact-projection');
      if (impactProjection) {
        expect(impactProjection.props.timeline).toBeInstanceOf(Array);
        expect(impactProjection.props.timeline.length).toBe(3);
        
        const timeline = impactProjection.props.timeline;
        expect(timeline[0].period).toBe('1 Week');
        expect(timeline[1].period).toBe('1 Month');
        expect(timeline[2].period).toBe('1 Year');
        expect(timeline[2].savings).toBeGreaterThan(timeline[1].savings);
      }
    });
  });

  describe('error handling', () => {
    it('should handle AI service errors gracefully', async () => {
      (aiService.complete as jest.Mock).mockRejectedValueOnce(new Error('AI service error'));

      const userMessage = 'Test error handling';

      // Should not throw, but handle gracefully
      await expect(
        actionPlanner.processIntelligentRequest(userMessage)
      ).resolves.toBeDefined();
    });

    it('should handle context building errors', async () => {
      (aiContextEngine.buildEnrichedContext as jest.Mock).mockRejectedValueOnce(
        new Error('Context error')
      );

      const userMessage = 'Test context error';

      await expect(
        actionPlanner.processIntelligentRequest(userMessage)
      ).rejects.toThrow('Context error');
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(intelligentActionPlanner).toBeDefined();
      expect(intelligentActionPlanner).toBeInstanceOf(IntelligentActionPlanner);
    });
  });
});
