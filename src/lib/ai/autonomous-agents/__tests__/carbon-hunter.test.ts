/**
 * Carbon Hunter Agent Tests
 */

import { CarbonHunterAgent } from '../carbon-hunter';
import { AgentTask } from '../agent-framework';

describe('CarbonHunterAgent', () => {
  let agent: CarbonHunterAgent;
  const mockOrgId = 'test-org-123';

  beforeEach(async () => {
    agent = new CarbonHunterAgent(mockOrgId);
    await agent.initialize();
  });

  describe('initialization', () => {
    it('should initialize with carbon hunting capabilities', () => {
      expect(agent['capabilities']).toContain('hunt_carbon_opportunities');
      expect(agent['capabilities']).toContain('detect_emission_anomalies');
      expect(agent['capabilities']).toContain('analyze_carbon_trends');
      expect(agent['capabilities']).toContain('optimize_carbon_efficiency');
      expect(agent['capabilities']).toContain('forecast_emissions');
      expect(agent['capabilities']).toContain('benchmark_performance');
    });

    it('should set highest autonomy level for carbon optimization', () => {
      expect(agent['maxAutonomyLevel']).toBe(5);
    });

    it('should set 30-minute execution interval for active hunting', () => {
      expect(agent['executionInterval']).toBe(1800000);
    });

    it('should load detection algorithms', () => {
      expect(agent['detectionAlgorithms'].size).toBeGreaterThan(0);
      expect(agent['detectionAlgorithms'].has('spike_detection')).toBe(true);
      expect(agent['detectionAlgorithms'].has('trend_analysis')).toBe(true);
    });

    it('should load optimization strategies', () => {
      expect(agent['optimizationStrategies'].length).toBeGreaterThan(0);
    });
  });

  describe('getScheduledTasks', () => {
    it('should generate comprehensive carbon hunting schedule', async () => {
      const tasks = await agent.getScheduledTasks();

      expect(tasks.length).toBeGreaterThanOrEqual(5);

      // Should include carbon opportunity hunting
      const huntingTask = tasks.find(t => t.type === 'hunt_carbon_opportunities');
      expect(huntingTask).toBeDefined();
      expect(huntingTask?.priority).toBe('high');
      expect(huntingTask?.data.scope).toBe('comprehensive');

      // Should include anomaly detection
      const anomalyTask = tasks.find(t => t.type === 'detect_emission_anomalies');
      expect(anomalyTask).toBeDefined();
      expect(anomalyTask?.priority).toBe('critical');

      // Should include trend analysis
      const trendTask = tasks.find(t => t.type === 'analyze_carbon_trends');
      expect(trendTask).toBeDefined();

      // Should include optimization review
      const optimizationTask = tasks.find(t => t.type === 'optimize_carbon_efficiency');
      expect(optimizationTask).toBeDefined();

      // Should include forecasting
      const forecastTask = tasks.find(t => t.type === 'forecast_emissions');
      expect(forecastTask).toBeDefined();
    });

    it('should schedule high-frequency monitoring tasks', async () => {
      const tasks = await agent.getScheduledTasks();
      
      // Anomaly detection should be most frequent (15 min)
      const anomalyTask = tasks.find(t => t.type === 'detect_emission_anomalies');
      expect(anomalyTask?.priority).toBe('critical');

      // Carbon hunting should be frequent (30 min)
      const huntingTask = tasks.find(t => t.type === 'hunt_carbon_opportunities');
      expect(huntingTask?.priority).toBe('high');
    });
  });

  describe('executeTask - hunt_carbon_opportunities', () => {
    it('should successfully hunt for carbon opportunities', async () => {
      const task: AgentTask = {
        id: 'test-hunt-1',
        type: 'hunt_carbon_opportunities',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: {
          scope: 'comprehensive',
          targets: ['energy', 'waste'],
          minReduction: 1.0
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.insights).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.metadata?.opportunities_found).toBeDefined();
      
      // Should include total potential reduction
      const reductionInsight = result.insights.find(i => i.includes('potential reduction'));
      expect(reductionInsight).toBeDefined();

      // Should include investment information
      const investmentInsight = result.insights.find(i => i.includes('investment required'));
      expect(investmentInsight).toBeDefined();
    });

    it('should identify quick wins when available', async () => {
      // Mock finding quick win opportunities
      jest.spyOn(agent as any, 'findEnergyOpportunities').mockResolvedValue([
        {
          id: 'quick-win-1',
          type: 'energy_efficiency',
          title: 'Quick LED Retrofit',
          estimatedReduction: 5.0,
          estimatedCost: 5000,
          paybackPeriod: 8,
          difficulty: 'low',
          priority: 'critical',
          roi: 35.0,
          confidence: 0.95
        }
      ]);

      const task: AgentTask = {
        id: 'test-quick-wins',
        type: 'hunt_carbon_opportunities',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: { targets: ['energy'] }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.actions.some(a => a.type === 'quick_win_identified')).toBe(true);
      expect(result.insights.some(i => i.includes('quick wins identified'))).toBe(true);
    });

    it('should filter opportunities by minimum reduction threshold', async () => {
      const task: AgentTask = {
        id: 'test-filtering',
        type: 'hunt_carbon_opportunities',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: {
          targets: ['energy'],
          minReduction: 10.0 // High threshold
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.opportunities_found).toBeDefined();
    });
  });

  describe('executeTask - detect_emission_anomalies', () => {
    it('should detect emission anomalies successfully', async () => {
      const task: AgentTask = {
        id: 'test-anomaly-1',
        type: 'detect_emission_anomalies',
        scheduledFor: new Date().toISOString(),
        priority: 'critical',
        data: {
          timeWindow: '1h',
          sensitivity: 'high',
          sources: 'all'
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.anomalies_detected).toBeDefined();
      expect(result.metadata?.critical_anomalies).toBeDefined();
      expect(result.metadata?.average_deviation).toBeDefined();
    });

    it('should trigger immediate action for critical anomalies', async () => {
      // Mock critical anomaly detection
      jest.spyOn(agent as any, 'runAnomalyDetection').mockResolvedValue([
        {
          id: 'critical-anomaly-1',
          source: 'electricity',
          severity: 'critical',
          deviation_percentage: 50.0,
          anomaly_type: 'spike'
        }
      ]);

      const task: AgentTask = {
        id: 'test-critical-anomaly',
        type: 'detect_emission_anomalies',
        scheduledFor: new Date().toISOString(),
        priority: 'critical',
        data: { sensitivity: 'high' }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.actions.some(a => a.type === 'critical_anomaly_detected')).toBe(true);
      expect(result.insights.some(i => i.includes('critical anomalies require immediate attention'))).toBe(true);
    });

    it('should auto-investigate anomalies when autonomy allows', async () => {
      // Ensure high autonomy level
      agent['maxAutonomyLevel'] = 5;

      jest.spyOn(agent as any, 'runAnomalyDetection').mockResolvedValue([
        {
          id: 'auto-investigate-anomaly',
          source: 'natural_gas',
          severity: 'critical',
          deviation_percentage: 35.0
        }
      ]);

      const task: AgentTask = {
        id: 'test-auto-investigate',
        type: 'detect_emission_anomalies',
        scheduledFor: new Date().toISOString(),
        priority: 'critical',
        data: {}
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.actions.some(a => a.type === 'auto_investigation_initiated')).toBe(true);
    });
  });

  describe('executeTask - analyze_carbon_trends', () => {
    it('should perform comprehensive trend analysis', async () => {
      const task: AgentTask = {
        id: 'test-trends-1',
        type: 'analyze_carbon_trends',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: {
          timeRange: '30d',
          analysisTypes: ['seasonal', 'weekly', 'operational'],
          includeForecasting: true
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.insights_generated).toBeGreaterThan(0);
      expect(result.metadata?.actionable_insights).toBeDefined();
      expect(result.metadata?.high_confidence_insights).toBeDefined();
    });

    it('should identify actionable insights from trends', async () => {
      // Mock actionable insight generation
      jest.spyOn(agent as any, 'generateTrendInsight').mockResolvedValue({
        id: 'actionable-insight-1',
        type: 'trend_analysis',
        actionable: true,
        related_opportunities: ['energy-efficiency-1'],
        confidence: 0.9
      });

      const task: AgentTask = {
        id: 'test-actionable-trends',
        type: 'analyze_carbon_trends',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: { analysisTypes: ['seasonal'] }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.actions.some(a => a.type === 'trend_opportunity_identified')).toBe(true);
    });
  });

  describe('executeTask - optimize_carbon_efficiency', () => {
    it('should identify optimization opportunities', async () => {
      const task: AgentTask = {
        id: 'test-optimization-1',
        type: 'optimize_carbon_efficiency',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: {
          reviewType: 'comprehensive',
          includeROI: true,
          prioritizeQuickWins: true
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.optimizations_identified).toBeDefined();
      expect(result.metadata?.total_reduction_potential).toBeDefined();
      expect(result.metadata?.total_investment).toBeDefined();
    });

    it('should prioritize quick wins when requested', async () => {
      // Mock optimization strategies with quick wins
      agent['optimizationStrategies'] = [
        {
          id: 'quick-win-opt',
          category: 'energy',
          strategy: 'Quick optimization',
          applicability: ['office'],
          impact_potential: 'medium',
          implementation_complexity: 'simple',
          estimated_reduction: 5.0,
          estimated_cost: 2000,
          timeline: '1 month',
          prerequisites: []
        }
      ];

      const task: AgentTask = {
        id: 'test-quick-wins-opt',
        type: 'optimize_carbon_efficiency',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: { prioritizeQuickWins: true }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.actions.some(a => a.type === 'optimization_recommended')).toBeTruthy();
    });
  });

  describe('executeTask - forecast_emissions', () => {
    it('should generate emission forecasts for multiple scenarios', async () => {
      const task: AgentTask = {
        id: 'test-forecast-1',
        type: 'forecast_emissions',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: {
          forecastHorizon: '12m',
          scenarios: ['current_trend', 'optimistic', 'conservative'],
          includeBenchmarking: true
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.forecasts_generated).toBe(3);
      expect(result.metadata?.scenarios_analyzed).toBe(3);
      expect(result.insights.some(i => i.includes('forecasts for 12m horizon'))).toBe(true);
    });

    it('should identify target risks in forecasts', async () => {
      // Mock forecast that exceeds targets
      jest.spyOn(agent as any, 'compareForecastToTargets').mockReturnValue({
        exceeds_target: true,
        gap: 50.5,
        risk_level: 'high'
      });

      const task: AgentTask = {
        id: 'test-target-risk',
        type: 'forecast_emissions',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        data: { scenarios: ['current_trend'] }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.actions.some(a => a.type === 'target_risk_identified')).toBe(true);
      expect(result.insights.some(i => i.includes('WARNING'))).toBe(true);
    });
  });

  describe('executeTask - benchmark_performance', () => {
    it('should benchmark performance against industry standards', async () => {
      const task: AgentTask = {
        id: 'test-benchmark-1',
        type: 'benchmark_performance',
        scheduledFor: new Date().toISOString(),
        priority: 'low',
        data: {
          benchmarkType: 'industry',
          metrics: ['carbon_intensity', 'energy_efficiency']
        }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.metrics_benchmarked).toBe(2);
      expect(result.metadata?.top_quartile_metrics).toBeDefined();
      expect(result.metadata?.improvement_opportunities).toBeDefined();
    });

    it('should identify best practices and improvement opportunities', async () => {
      // Mock benchmark results
      jest.spyOn(agent as any, 'performMetricBenchmarking')
        .mockResolvedValueOnce({
          metric: 'carbon_intensity',
          performance: 'top_quartile',
          current_value: 0.3
        })
        .mockResolvedValueOnce({
          metric: 'energy_efficiency',
          performance: 'below_average',
          current_value: 0.5,
          gap: 0.1
        });

      const task: AgentTask = {
        id: 'test-benchmark-insights',
        type: 'benchmark_performance',
        scheduledFor: new Date().toISOString(),
        priority: 'low',
        data: { metrics: ['carbon_intensity', 'energy_efficiency'] }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.actions.some(a => a.type === 'best_practice_identified')).toBe(true);
      expect(result.actions.some(a => a.type === 'improvement_opportunity_identified')).toBe(true);
    });
  });

  describe('learn', () => {
    it('should store carbon hunting specific learning patterns', async () => {
      const mockResult = {
        success: true,
        executionTimeMs: 2500,
        actions: [{ type: 'test', description: 'test action', timestamp: new Date().toISOString() }],
        insights: ['Test insight'],
        nextSteps: ['Test step'],
        metadata: {
          opportunities_found: 3,
          anomalies_detected: 1,
          optimizations_identified: 2
        }
      };

      const storePatternSpy = jest.spyOn(agent as any, 'storePattern').mockResolvedValue(undefined);

      await agent.learn(mockResult);

      expect(storePatternSpy).toHaveBeenCalledWith(
        'carbon_hunting',
        expect.objectContaining({
          hunting_success_rate: 1,
          opportunities_per_hunt: 3,
          anomaly_detection_rate: 1,
          optimization_effectiveness: 2
        }),
        0.95,
        expect.objectContaining({
          task_type: 'carbon_hunter_task'
        })
      );
    });
  });

  describe('opportunity prioritization', () => {
    it('should prioritize opportunities correctly', () => {
      const opportunities = [
        { id: '1', priority: 'low', roi: 10.0, estimatedReduction: 5.0 },
        { id: '2', priority: 'critical', roi: 15.0, estimatedReduction: 8.0 },
        { id: '3', priority: 'high', roi: 20.0, estimatedReduction: 3.0 },
        { id: '4', priority: 'critical', roi: 25.0, estimatedReduction: 12.0 }
      ];

      const prioritized = agent['prioritizeOpportunities'](opportunities);

      // Should prioritize by priority first, then ROI, then impact
      expect(prioritized[0].id).toBe('4'); // Critical + highest ROI
      expect(prioritized[1].id).toBe('2'); // Critical + lower ROI
      expect(prioritized[2].id).toBe('3'); // High priority
      expect(prioritized[3].id).toBe('1'); // Low priority
    });

    it('should prioritize quick wins when requested', () => {
      const optimizations = [
        { id: '1', payback_period: 24, estimated_reduction: 10.0 },
        { id: '2', payback_period: 6, estimated_reduction: 5.0 },
        { id: '3', payback_period: 18, estimated_reduction: 8.0 }
      ];

      const prioritized = agent['prioritizeQuickWins'](optimizations);

      // Quick wins (≤12 months) should come first
      expect(prioritized[0].id).toBe('2'); // 6 month payback
    });
  });

  describe('anomaly analysis', () => {
    it('should analyze anomaly patterns correctly', () => {
      const anomalies = [
        { id: '1', anomaly_type: 'spike', severity: 'high' },
        { id: '2', anomaly_type: 'spike', severity: 'medium' },
        { id: '3', anomaly_type: 'sustained_increase', severity: 'high' },
        { id: '4', anomaly_type: 'spike', severity: 'low' }
      ];

      const patterns = agent['analyzeAnomalyPatterns'](anomalies);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toContain('Most common anomaly type: spike');
    });

    it('should handle empty anomaly list', () => {
      const patterns = agent['analyzeAnomalyPatterns']([]);
      expect(patterns).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle unknown task types gracefully', async () => {
      const task: AgentTask = {
        id: 'test-unknown',
        type: 'unknown_carbon_task' as any,
        scheduledFor: new Date().toISOString(),
        priority: 'low',
        data: {}
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown task type');
      expect(result.nextSteps).toContain('Review carbon hunting configuration');
    });

    it('should handle task execution errors', async () => {
      // Mock error in opportunity hunting
      jest.spyOn(agent as any, 'findEnergyOpportunities').mockRejectedValue(new Error('Data access error'));

      const task: AgentTask = {
        id: 'test-error-handling',
        type: 'hunt_carbon_opportunities',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: { targets: ['energy'] }
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Data access error');
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle end-to-end carbon hunting cycle', async () => {
      const tasks = await agent.getScheduledTasks();
      const huntingTask = tasks.find(t => t.type === 'hunt_carbon_opportunities');
      
      if (huntingTask) {
        const result = await agent.executeTask(huntingTask);
        expect(result.success).toBe(true);
        
        await agent.learn(result);
        
        expect(result.insights.length).toBeGreaterThan(0);
        expect(result.nextSteps.length).toBeGreaterThan(0);
      }
    });

    it('should coordinate anomaly detection with opportunity hunting', async () => {
      // Execute anomaly detection first
      const anomalyTask: AgentTask = {
        id: 'anomaly-integration',
        type: 'detect_emission_anomalies',
        scheduledFor: new Date().toISOString(),
        priority: 'critical',
        data: {}
      };

      const anomalyResult = await agent.executeTask(anomalyTask);
      expect(anomalyResult.success).toBe(true);

      // Then hunt for opportunities
      const huntingTask: AgentTask = {
        id: 'hunting-integration',
        type: 'hunt_carbon_opportunities',
        scheduledFor: new Date().toISOString(),
        priority: 'high',
        data: {}
      };

      const huntingResult = await agent.executeTask(huntingTask);
      expect(huntingResult.success).toBe(true);

      // Both should provide complementary insights
      expect(anomalyResult.insights.length).toBeGreaterThan(0);
      expect(huntingResult.insights.length).toBeGreaterThan(0);
    });
  });
});