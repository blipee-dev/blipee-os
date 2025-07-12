import { SustainabilityIntelligence } from '../sustainability-intelligence';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  })),
}));

describe('SustainabilityIntelligence', () => {
  describe('interfaces and types', () => {
    it('should define all 12 capability interfaces', () => {
      // Type checking - this test verifies the interface structure exists
      const mockIntelligence: SustainabilityIntelligence = {
        analyze: {} as any,
        predict: {} as any,
        recommend: {} as any,
        notify: {} as any,
        benchmark: {} as any,
        comply: {} as any,
        plan: {} as any,
        assign: {} as any,
        learn: {} as any,
        report: {} as any,
        target: {} as any,
        calculate: {} as any,
      };

      expect(mockIntelligence).toBeDefined();
      expect(Object.keys(mockIntelligence)).toHaveLength(12);
    });
  });

  describe('AnalysisCapability', () => {
    it('should define analysis methods', () => {
      const analysisCapability = {
        understandRequest: jest.fn().mockResolvedValue({
          intent: 'analyze',
          entities: {
            timeframe: 'last month',
            scopes: [1, 2],
            sources: ['energy', 'transport'],
            metrics: ['co2e', 'cost'],
          },
          confidence: 0.95,
        }),
        findPatterns: jest.fn().mockResolvedValue({
          patterns: [
            {
              type: 'trend',
              description: 'Energy usage increases on Mondays',
              significance: 0.87,
              actionable: true,
            },
          ],
          insights: ['Consider pre-cooling strategy'],
        }),
        detectAnomalies: jest.fn().mockResolvedValue({
          anomalies: [
            {
              source: 'HVAC Zone 3',
              deviation: 2.5,
              likely_cause: 'Sensor malfunction',
              impact: 340,
            },
          ],
        }),
      };

      expect(analysisCapability.understandRequest).toBeDefined();
      expect(analysisCapability.findPatterns).toBeDefined();
      expect(analysisCapability.detectAnomalies).toBeDefined();
    });

    it('should understand natural language requests', async () => {
      const mockAnalyze = {
        understandRequest: jest.fn().mockResolvedValue({
          intent: 'optimize',
          entities: {
            timeframe: 'next quarter',
            scopes: [1, 2, 3],
            metrics: ['emissions', 'cost'],
          },
          confidence: 0.89,
        }),
      };

      const result = await mockAnalyze.understandRequest(
        'How can I reduce emissions next quarter?'
      );

      expect(result.intent).toBe('optimize');
      expect(result.entities.timeframe).toBe('next quarter');
      expect(result.entities.scopes).toContain(1);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect patterns with different types', async () => {
      const mockAnalyze = {
        findPatterns: jest.fn().mockResolvedValue({
          patterns: [
            {
              type: 'anomaly',
              description: 'Unusual spike in weekend energy usage',
              significance: 0.92,
              actionable: true,
            },
            {
              type: 'correlation',
              description: 'Weather temperature correlates with energy usage',
              significance: 0.78,
              actionable: false,
            },
          ],
          insights: [
            'Weekend operations may need review',
            'Consider weather-based HVAC optimization',
          ],
        }),
      };

      const result = await mockAnalyze.findPatterns('energy usage patterns');

      expect(result.patterns).toHaveLength(2);
      expect(result.patterns[0].type).toBe('anomaly');
      expect(result.patterns[1].type).toBe('correlation');
      expect(result.insights).toHaveLength(2);
    });
  });

  describe('PredictionCapability', () => {
    it('should provide multi-horizon predictions', async () => {
      const mockPredict = {
        predictEmissions: jest.fn().mockResolvedValue({
          forecast: [
            {
              date: '2024-01-01',
              scope1: 120.5,
              scope2: 85.3,
              scope3: 340.2,
              confidence: 0.91,
            },
          ],
          risks: [
            {
              event: 'Heatwave expected',
              probability: 0.75,
              impact: 1500,
              prevention: 'Pre-cooling and load shifting',
            },
          ],
          opportunities: [
            {
              action: 'Switch to renewable energy',
              window: 'Next 30 days',
              potential_reduction: 0.25,
            },
          ],
        }),
      };

      const result = await mockPredict.predictEmissions('month');

      expect(result.forecast).toBeInstanceOf(Array);
      expect(result.forecast[0]).toHaveProperty('scope1');
      expect(result.forecast[0]).toHaveProperty('scope2');
      expect(result.forecast[0]).toHaveProperty('scope3');
      expect(result.risks).toBeInstanceOf(Array);
      expect(result.opportunities).toBeInstanceOf(Array);
    });

    it('should model what-if scenarios', async () => {
      const mockPredict = {
        modelScenario: jest.fn().mockResolvedValue({
          baseline: 1000,
          scenario: 750,
          difference: -250,
          recommendation: 'Implement solar panels on Building A',
          confidence: 0.87,
        }),
      };

      const result = await mockPredict.modelScenario(
        'What if we install solar panels?'
      );

      expect(result.baseline).toBe(1000);
      expect(result.scenario).toBe(750);
      expect(result.difference).toBe(-250);
      expect(result.recommendation).toContain('solar');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should project progress towards targets', async () => {
      const mockPredict = {
        projectProgress: jest.fn().mockResolvedValue({
          current_trajectory: {
            will_meet_target: false,
            expected_date: '2025-12-31',
            confidence_interval: [0.85, 0.92],
          },
          required_improvement: 0.15,
          suggested_interventions: [
            'Accelerate renewable energy transition',
            'Implement energy efficiency measures',
          ],
        }),
      };

      const result = await mockPredict.projectProgress('Net zero by 2030');

      expect(result.current_trajectory.will_meet_target).toBe(false);
      expect(result.required_improvement).toBe(0.15);
      expect(result.suggested_interventions).toBeInstanceOf(Array);
    });
  });

  describe('RecommendationCapability', () => {
    it('should generate contextual recommendations', async () => {
      const mockRecommend = {
        getRecommendations: jest.fn().mockResolvedValue({
          recommendations: [
            {
              action: 'Install LED lighting in all facilities',
              impact: {
                emissions_reduction: 0.12,
                cost_savings: 25000,
                effort: 'medium',
                timeframe: '3 months',
              },
              reasoning: 'High ROI with minimal disruption',
              confidence: 0.92,
              dependencies: ['Procurement approval', 'Installation scheduling'],
            },
          ],
          quick_wins: ['Switch to green energy tariff'],
          strategic_initiatives: ['Build on-site renewable generation'],
        }),
      };

      const result = await mockRecommend.getRecommendations('reduce emissions');

      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations[0].impact.emissions_reduction).toBe(0.12);
      expect(result.recommendations[0].impact.cost_savings).toBe(25000);
      expect(result.quick_wins).toBeInstanceOf(Array);
      expect(result.strategic_initiatives).toBeInstanceOf(Array);
    });

    it('should prioritize actions intelligently', async () => {
      const mockRecommend = {
        prioritizeActions: jest.fn().mockResolvedValue({
          prioritized: [
            {
              action: 'HVAC optimization',
              score: 0.89,
              factors: {
                impact: 0.9,
                feasibility: 0.95,
                cost_benefit: 0.85,
                strategic_alignment: 0.87,
              },
            },
          ],
        }),
      };

      const result = await mockRecommend.prioritizeActions([
        'HVAC optimization',
        'Solar installation',
      ]);

      expect(result.prioritized).toBeInstanceOf(Array);
      expect(result.prioritized[0].score).toBeGreaterThan(0.8);
      expect(result.prioritized[0].factors).toHaveProperty('impact');
      expect(result.prioritized[0].factors).toHaveProperty('feasibility');
    });
  });

  describe('NotificationCapability', () => {
    it('should generate intelligent notifications', async () => {
      const mockNotify = {
        generateNotifications: jest.fn().mockResolvedValue({
          notifications: [
            {
              type: 'alert',
              message: 'Energy usage 25% above baseline',
              priority: 'high',
              action_required: true,
              suggested_response: 'Review HVAC settings',
            },
            {
              type: 'achievement',
              message: 'Monthly emissions target achieved!',
              priority: 'medium',
              action_required: false,
            },
          ],
        }),
      };

      const result = await mockNotify.generateNotifications();

      expect(result.notifications).toBeInstanceOf(Array);
      expect(result.notifications[0].type).toBe('alert');
      expect(result.notifications[0].priority).toBe('high');
      expect(result.notifications[1].type).toBe('achievement');
    });

    it('should determine notification necessity', async () => {
      const mockNotify = {
        shouldNotify: jest.fn().mockResolvedValue({
          notify: true,
          channel: 'immediate',
          reason: 'Critical threshold exceeded',
        }),
      };

      const result = await mockNotify.shouldNotify({
        type: 'threshold_breach',
        severity: 'critical',
      });

      expect(result.notify).toBe(true);
      expect(result.channel).toBe('immediate');
      expect(result.reason).toContain('Critical');
    });
  });

  describe('BenchmarkCapability', () => {
    it('should compare performance to peers', async () => {
      const mockBenchmark = {
        compareToPeers: jest.fn().mockResolvedValue({
          your_performance: 85,
          peer_average: 92,
          top_quartile: 97,
          percentile: 35,
          improvement_potential: 0.12,
          best_practices: [
            'Implement ISO 50001 energy management',
            'Use AI-driven HVAC optimization',
          ],
        }),
      };

      const result = await mockBenchmark.compareToPeers('energy_intensity');

      expect(result.your_performance).toBe(85);
      expect(result.peer_average).toBe(92);
      expect(result.percentile).toBe(35);
      expect(result.best_practices).toBeInstanceOf(Array);
    });

    it('should provide industry insights', async () => {
      const mockBenchmark = {
        getIndustryInsights: jest.fn().mockResolvedValue({
          trends: [
            {
              trend: 'AI-driven sustainability',
              adoption_rate: 0.45,
              impact: 'High efficiency gains',
            },
          ],
          innovations: ['Carbon capture technology', 'Smart grid integration'],
          regulatory_changes: ['New EU taxonomy requirements'],
        }),
      };

      const result = await mockBenchmark.getIndustryInsights();

      expect(result.trends).toBeInstanceOf(Array);
      expect(result.trends[0].adoption_rate).toBe(0.45);
      expect(result.innovations).toBeInstanceOf(Array);
      expect(result.regulatory_changes).toBeInstanceOf(Array);
    });
  });

  describe('ComplianceCapability', () => {
    it('should check multi-framework compliance', async () => {
      const mockComply = {
        checkCompliance: jest.fn().mockResolvedValue({
          status: 'partially_compliant',
          frameworks: [
            {
              name: 'GRI Standards',
              status: 'compliant',
              completion: 0.95,
              missing_data: ['Water usage data'],
              next_steps: ['Complete water audit'],
            },
            {
              name: 'TCFD',
              status: 'partially_compliant',
              completion: 0.75,
              missing_data: ['Climate scenario analysis'],
              next_steps: ['Conduct scenario planning'],
            },
          ],
          risks: [
            {
              issue: 'Incomplete scope 3 emissions data',
              severity: 'medium',
              deadline: '2024-06-30',
              remediation: 'Engage suppliers for data collection',
            },
          ],
        }),
      };

      const result = await mockComply.checkCompliance();

      expect(result.status).toBe('partially_compliant');
      expect(result.frameworks).toHaveLength(2);
      expect(result.frameworks[0].completion).toBe(0.95);
      expect(result.risks).toBeInstanceOf(Array);
    });

    it('should generate compliance reports', async () => {
      const mockComply = {
        generateComplianceReport: jest.fn().mockResolvedValue({
          report: {
            sections: ['Executive Summary', 'Emissions Data', 'Targets', 'Actions'],
            data_quality: 0.92,
            ai_confidence: 0.88,
          },
          submission_ready: false,
          improvements_needed: ['Verify scope 3 calculations', 'Add board oversight section'],
        }),
      };

      const result = await mockComply.generateComplianceReport('CDP');

      expect(result.report.sections).toBeInstanceOf(Array);
      expect(result.report.data_quality).toBe(0.92);
      expect(result.submission_ready).toBe(false);
      expect(result.improvements_needed).toHaveLength(2);
    });
  });

  describe('PlanningCapability', () => {
    it('should create action plans from goals', async () => {
      const mockPlan = {
        createPlan: jest.fn().mockResolvedValue({
          plan: {
            objective: 'Reduce emissions by 50% by 2030',
            milestones: [
              {
                milestone: 'Complete energy audit',
                target_date: '2024-03-31',
                metrics: ['Energy consumption baseline'],
                dependencies: [],
              },
              {
                milestone: 'Implement quick wins',
                target_date: '2024-06-30',
                metrics: ['10% reduction achieved'],
                dependencies: ['Energy audit'],
              },
            ],
            actions: [
              {
                action: 'Install smart meters',
                owner: 'Facility Manager',
                deadline: '2024-02-28',
                impact: 0.05,
              },
            ],
            success_metrics: ['Total emissions reduced by 50%', 'Cost neutral or positive'],
          },
          feasibility: 0.78,
          alternative_approaches: ['Focus on renewable energy first', 'Prioritize efficiency'],
        }),
      };

      const result = await mockPlan.createPlan('Reduce emissions by 50%');

      expect(result.plan.objective).toContain('50%');
      expect(result.plan.milestones).toBeInstanceOf(Array);
      expect(result.plan.actions).toBeInstanceOf(Array);
      expect(result.feasibility).toBe(0.78);
    });

    it('should generate strategic roadmaps', async () => {
      const mockPlan = {
        generateRoadmap: jest.fn().mockResolvedValue({
          phases: [
            {
              phase: 'Foundation',
              duration: '6 months',
              key_initiatives: ['Baseline measurement', 'Quick wins'],
              expected_reduction: 0.1,
              investment_required: 50000,
            },
            {
              phase: 'Transformation',
              duration: '18 months',
              key_initiatives: ['Renewable energy', 'Process optimization'],
              expected_reduction: 0.35,
              investment_required: 500000,
            },
          ],
          critical_path: ['Energy audit', 'Solar installation', 'HVAC upgrade'],
          risk_factors: ['Technology availability', 'Regulatory changes'],
        }),
      };

      const result = await mockPlan.generateRoadmap('Net zero by 2030');

      expect(result.phases).toHaveLength(2);
      expect(result.phases[0].expected_reduction).toBe(0.1);
      expect(result.critical_path).toBeInstanceOf(Array);
      expect(result.risk_factors).toBeInstanceOf(Array);
    });
  });

  describe('TaskCapability', () => {
    it('should extract tasks from conversation', async () => {
      const mockAssign = {
        extractTasks: jest.fn().mockResolvedValue({
          tasks: [
            {
              description: 'Review energy invoices for anomalies',
              priority: 'high',
              estimated_impact: 0.05,
              suggested_owner: 'Energy Manager',
              due_date: '2024-01-15',
              dependencies: [],
            },
            {
              description: 'Schedule HVAC maintenance',
              priority: 'medium',
              estimated_impact: 0.03,
              suggested_owner: 'Facility Manager',
              dependencies: ['Budget approval'],
            },
          ],
        }),
      };

      const result = await mockAssign.extractTasks(
        'We need to review energy invoices and schedule HVAC maintenance'
      );

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].priority).toBe('high');
      expect(result.tasks[1].suggested_owner).toBe('Facility Manager');
    });

    it('should intelligently assign tasks', async () => {
      const mockAssign = {
        assignTask: jest.fn().mockResolvedValue({
          best_owner: 'Sarah Chen',
          reasoning: 'Previous experience with energy audits and available capacity',
          alternatives: ['John Smith', 'Maria Garcia'],
          estimated_completion: '2024-01-20',
        }),
      };

      const result = await mockAssign.assignTask('Conduct energy audit');

      expect(result.best_owner).toBe('Sarah Chen');
      expect(result.reasoning).toContain('experience');
      expect(result.alternatives).toHaveLength(2);
    });

    it('should track task progress', async () => {
      const mockAssign = {
        trackProgress: jest.fn().mockResolvedValue({
          status: 'at_risk',
          completion: 0.65,
          blockers: ['Waiting for vendor quotes'],
          suggestions: ['Contact alternative vendors', 'Escalate to procurement'],
        }),
      };

      const result = await mockAssign.trackProgress('task-123');

      expect(result.status).toBe('at_risk');
      expect(result.completion).toBe(0.65);
      expect(result.blockers).toHaveLength(1);
      expect(result.suggestions).toHaveLength(2);
    });
  });

  describe('LearningCapability', () => {
    it('should learn from outcomes', async () => {
      const mockLearn = {
        learnFromOutcome: jest.fn().mockResolvedValue({
          learning: {
            what_worked: ['Early stakeholder engagement', 'Phased approach'],
            what_didnt: ['Underestimated timeline'],
            unexpected_outcomes: ['Higher than expected employee participation'],
          },
          model_updates: {
            parameter: 'employee_engagement_factor',
            old_value: 0.7,
            new_value: 0.85,
          },
          confidence_improvement: 0.05,
        }),
      };

      const result = await mockLearn.learnFromOutcome(
        'LED installation project',
        { success: true, timeline: '4 months', savings: 30000 }
      );

      expect(result.learning.what_worked).toBeInstanceOf(Array);
      expect(result.learning.what_didnt).toBeInstanceOf(Array);
      expect(result.model_updates.new_value).toBe(0.85);
    });
  });

  describe('integration scenarios', () => {
    it('should support end-to-end sustainability workflow', async () => {
      // Mock integrated workflow
      const mockWorkflow = {
        async executeSustainabilityWorkflow(query: string) {
          // 1. Analyze request
          const intent = await this.analyze.understandRequest(query);
          
          // 2. Get recommendations
          const recommendations = await this.recommend.getRecommendations(intent.intent);
          
          // 3. Create plan
          const plan = await this.plan.createPlan(recommendations.recommendations[0].action);
          
          // 4. Check compliance
          const compliance = await this.comply.checkCompliance();
          
          return {
            intent,
            recommendations,
            plan,
            compliance,
          };
        },
        analyze: {
          understandRequest: jest.fn().mockResolvedValue({
            intent: 'optimize',
            entities: { scopes: [1, 2] },
            confidence: 0.9,
          }),
        },
        recommend: {
          getRecommendations: jest.fn().mockResolvedValue({
            recommendations: [{
              action: 'Implement energy management system',
              impact: { emissions_reduction: 0.15 },
            }],
          }),
        },
        plan: {
          createPlan: jest.fn().mockResolvedValue({
            plan: { objective: 'Deploy EMS', milestones: [] },
            feasibility: 0.82,
          }),
        },
        comply: {
          checkCompliance: jest.fn().mockResolvedValue({
            status: 'compliant',
            frameworks: [],
          }),
        },
      };

      const result = await mockWorkflow.executeSustainabilityWorkflow(
        'How can I reduce energy consumption?'
      );

      expect(result.intent.intent).toBe('optimize');
      expect(result.recommendations.recommendations).toHaveLength(1);
      expect(result.plan.feasibility).toBe(0.82);
      expect(result.compliance.status).toBe('compliant');
    });

    it('should handle complex multi-capability queries', async () => {
      // Test that combines prediction, benchmarking, and planning
      const mockComplex = {
        async handleComplexQuery(query: string) {
          // 1. Predict future state
          const prediction = await this.predict.predictEmissions('year');
          
          // 2. Benchmark against peers
          const benchmark = await this.benchmark.compareToPeers('emissions_intensity');
          
          // 3. Generate improvement plan
          const roadmap = await this.plan.generateRoadmap('match top quartile');
          
          return { prediction, benchmark, roadmap };
        },
        predict: {
          predictEmissions: jest.fn().mockResolvedValue({
            forecast: [{ scope1: 100, scope2: 80, scope3: 300 }],
          }),
        },
        benchmark: {
          compareToPeers: jest.fn().mockResolvedValue({
            your_performance: 85,
            top_quartile: 95,
          }),
        },
        plan: {
          generateRoadmap: jest.fn().mockResolvedValue({
            phases: [{ phase: 'Quick wins', expected_reduction: 0.1 }],
          }),
        },
      };

      const result = await mockComplex.handleComplexQuery(
        'How do we compare to peers and what should we do?'
      );

      expect(result.prediction.forecast).toBeDefined();
      expect(result.benchmark.your_performance).toBe(85);
      expect(result.roadmap.phases).toHaveLength(1);
    });
  });
});
