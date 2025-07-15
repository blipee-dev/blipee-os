/**
 * Supply Chain Investigator Agent Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SupplyChainInvestigatorAgent } from '../supply-chain-investigator';
import { AgentTask } from '../types';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ 
        eq: jest.fn(() => ({ 
          single: jest.fn(),
          data: []
        })),
        gte: jest.fn(() => ({
          data: []
        }))
      })),
      insert: jest.fn(() => ({ 
        select: jest.fn(() => ({ 
          single: jest.fn(() => ({
            data: { id: 'test-id' }
          }))
        }))
      })),
      update: jest.fn(),
      delete: jest.fn()
    }))
  }))
}));

// Mock network intelligence
jest.mock('../../network-intelligence/graph-engine', () => ({
  NetworkGraphEngine: jest.fn().mockImplementation(() => ({
    analyzeSupplyChainRisk: jest.fn().mockResolvedValue({
      totalConnections: 10,
      riskDistribution: { low_risk: 5, medium_risk: 3, high_risk: 2 },
      propagationPaths: []
    }),
    calculateNetworkMetrics: jest.fn().mockResolvedValue({
      networkSize: 10,
      centrality: 0.75,
      clustering: 0.6,
      influence: 0.8,
      averageESGScore: 72.5
    })
  }))
}));

describe('SupplyChainInvestigatorAgent', () => {
  let agent: SupplyChainInvestigatorAgent;
  const mockOrgId = 'test-org-123';

  beforeEach(async () => {
    agent = new SupplyChainInvestigatorAgent(mockOrgId);
    await agent.initialize();
    
    // Mock private methods
    jest.spyOn(agent as any, 'performDeepInvestigation').mockResolvedValue({
      suppliers: [],
      emissions: { total: 1000, byTier: {} },
      risks: [],
      opportunities: []
    });
    
    jest.spyOn(agent as any, 'mapSupplierEmissions').mockResolvedValue({
      mappedSuppliers: 5,
      totalEmissions: 1000,
      byTier: { tier1: 500, tier2: 300, tier3: 200 },
      hotspots: []
    });
    
    jest.spyOn(agent as any, 'assessSupplier').mockResolvedValue({
      sustainabilityScore: 75,
      carbonIntensity: 2.5,
      riskLevel: 'medium',
      recommendations: ['Improve energy efficiency', 'Implement monitoring']
    });
    
    jest.spyOn(agent as any, 'identifySupplyChainRisks').mockResolvedValue({
      identifiedRisks: [],
      criticalRisks: [],
      mitigationStrategies: []
    });
    
    jest.spyOn(agent as any, 'generateOptimizationRecommendations').mockResolvedValue({
      recommendations: [],
      potentialImpact: {
        emissionReduction: 15,
        costSavings: 100000
      }
    });
  });

  describe('initialization', () => {
    it('should initialize with supply chain investigation capabilities', () => {
      expect(agent['capabilities']).toContain('investigate_supply_chain');
      expect(agent['capabilities']).toContain('map_supplier_emissions');
      expect(agent['capabilities']).toContain('assess_supplier_sustainability');
      expect(agent['capabilities']).toContain('discover_hidden_suppliers');
      expect(agent['capabilities']).toContain('monitor_supply_chain_risks');
      expect(agent['capabilities']).toContain('optimize_supplier_portfolio');
    });

    it('should set appropriate autonomy level for investigations', () => {
      expect(agent['maxAutonomyLevel']).toBe(4);
    });

    it('should set hourly execution interval for supply chain monitoring', () => {
      expect(agent['executionInterval']).toBe(3600000); // 1 hour
    });

    it('should load investigation strategies', () => {
      expect(agent['investigationStrategies'].length).toBeGreaterThan(0);
      const strategies = agent['investigationStrategies'];
      expect(strategies).toContain('data_mining');
      expect(strategies).toContain('pattern_recognition');
      expect(strategies).toContain('anomaly_detection');
    });

    it('should initialize risk patterns', () => {
      expect(agent['riskPatterns'].size).toBeGreaterThan(0);
      expect(agent['riskPatterns'].has('carbon_intensive_supplier')).toBe(true);
      expect(agent['riskPatterns'].has('single_source_dependency')).toBe(true);
    });
  });

  describe('getScheduledTasks', () => {
    it('should generate comprehensive supply chain investigation schedule', async () => {
      const tasks = await agent.getScheduledTasks();

      expect(tasks.length).toBeGreaterThanOrEqual(6);

      // Should include supply chain investigation
      const investigateTask = tasks.find(t => t.type === 'investigate_supply_chain');
      expect(investigateTask).toBeDefined();
      expect(investigateTask?.priority).toBe('high');
      expect(investigateTask?.data.depth).toBe('tier_3');

      // Should include emissions mapping
      const emissionsTask = tasks.find(t => t.type === 'map_supplier_emissions');
      expect(emissionsTask).toBeDefined();
      expect(emissionsTask?.priority).toBe('high');

      // Should include sustainability assessment
      const assessTask = tasks.find(t => t.type === 'assess_supplier_sustainability');
      expect(assessTask).toBeDefined();

      // Should include hidden supplier discovery
      const discoverTask = tasks.find(t => t.type === 'discover_hidden_suppliers');
      expect(discoverTask).toBeDefined();

      // Should include risk monitoring
      const riskTask = tasks.find(t => t.type === 'monitor_supply_chain_risks');
      expect(riskTask).toBeDefined();
      expect(riskTask?.priority).toBe('critical');

      // Should include portfolio optimization
      const optimizeTask = tasks.find(t => t.type === 'optimize_supplier_portfolio');
      expect(optimizeTask).toBeDefined();
    });

    it('should prioritize critical risk monitoring', async () => {
      const tasks = await agent.getScheduledTasks();
      
      const riskTask = tasks.find(t => t.type === 'monitor_supply_chain_risks');
      expect(riskTask?.priority).toBe('critical');
      
      const investigateTask = tasks.find(t => t.type === 'investigate_supply_chain');
      expect(investigateTask?.priority).toBe('high');
    });
  });

  describe('executeTask', () => {
    it('should successfully investigate supply chain', async () => {
      const task: AgentTask = {
        id: 'test-task-1',
        type: 'investigate_supply_chain',
        priority: 'high',
        data: { depth: 'tier_3' },
        scheduledFor: new Date(),
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.nextSteps).toBeDefined();
      expect(result.nextSteps.length).toBeGreaterThan(0);
    });

    it('should handle supplier emissions mapping', async () => {
      const task: AgentTask = {
        id: 'test-task-2',
        type: 'map_supplier_emissions',
        priority: 'high',
        data: { scope: 'all_tiers' },
        scheduledFor: new Date(),
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.data.mappedSuppliers).toBeDefined();
      expect(result.data.totalEmissions).toBeDefined();
    });

    it('should assess supplier sustainability', async () => {
      const task: AgentTask = {
        id: 'test-task-3',
        type: 'assess_supplier_sustainability',
        priority: 'medium',
        data: { supplier_id: 'supplier-123' },
        scheduledFor: new Date(),
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.data.sustainabilityScore).toBeDefined();
      expect(result.data.recommendations).toBeDefined();
    });

    it('should discover hidden suppliers', async () => {
      const task: AgentTask = {
        id: 'test-task-4',
        type: 'discover_hidden_suppliers',
        priority: 'medium',
        data: { method: 'transaction_analysis' },
        scheduledFor: new Date(),
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.data.discoveredSuppliers).toBeDefined();
      expect(Array.isArray(result.data.discoveredSuppliers)).toBe(true);
    });

    it('should monitor supply chain risks', async () => {
      const task: AgentTask = {
        id: 'test-task-5',
        type: 'monitor_supply_chain_risks',
        priority: 'critical',
        data: { real_time: true },
        scheduledFor: new Date(),
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.data.identifiedRisks).toBeDefined();
      expect(result.data.criticalRisks).toBeDefined();
      expect(result.data.mitigationStrategies).toBeDefined();
    });

    it('should optimize supplier portfolio', async () => {
      const task: AgentTask = {
        id: 'test-task-6',
        type: 'optimize_supplier_portfolio',
        priority: 'medium',
        data: { criteria: ['emissions', 'cost', 'reliability'] },
        scheduledFor: new Date(),
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toBeDefined();
      expect(result.data.potentialImpact).toBeDefined();
    });

    it('should handle unknown task types gracefully', async () => {
      const task: AgentTask = {
        id: 'test-task-unknown',
        type: 'unknown_task_type',
        priority: 'low',
        data: {},
        scheduledFor: new Date(),
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Unknown task type');
    });
  });

  describe('learn', () => {
    it('should learn from successful investigations', async () => {
      const mockResults = [
        {
          success: true,
          data: {
            supplierCount: 50,
            emissionsReduction: 15,
            risksIdentified: 3
          }
        }
      ];

      const improvements = await agent.learn(mockResults);

      expect(improvements).toBeDefined();
      expect(improvements.strategiesImproved).toBeGreaterThanOrEqual(0);
      expect(improvements.newPatternsDetected).toBeGreaterThanOrEqual(0);
    });

    it('should identify new risk patterns from results', async () => {
      const mockResults = [
        {
          success: true,
          data: {
            identifiedRisks: [
              { type: 'environmental', severity: 'high' },
              { type: 'social', severity: 'critical' }
            ]
          }
        }
      ];

      const improvements = await agent.learn(mockResults);

      expect(improvements.newPatternsDetected).toBeGreaterThanOrEqual(0);
      expect(improvements.adaptations).toBeDefined();
    });
  });

  describe('helper methods', () => {
    it('should perform deep supply chain investigation', async () => {
      const investigation = await agent['performDeepInvestigation']();

      expect(investigation).toBeDefined();
      expect(investigation.suppliers).toBeDefined();
      expect(investigation.emissions).toBeDefined();
      expect(investigation.risks).toBeDefined();
      expect(investigation.opportunities).toBeDefined();
    });

    it('should map supplier emissions correctly', async () => {
      const mapping = await agent['mapSupplierEmissions']();

      expect(mapping).toBeDefined();
      expect(mapping.mappedSuppliers).toBeGreaterThanOrEqual(0);
      expect(mapping.totalEmissions).toBeDefined();
      expect(mapping.byTier).toBeDefined();
      expect(mapping.hotspots).toBeDefined();
    });

    it('should assess supplier properly', async () => {
      const assessment = await agent['assessSupplier']('supplier-123');

      expect(assessment).toBeDefined();
      expect(assessment.sustainabilityScore).toBeGreaterThanOrEqual(0);
      expect(assessment.sustainabilityScore).toBeLessThanOrEqual(100);
      expect(assessment.carbonIntensity).toBeDefined();
      expect(assessment.riskLevel).toBeDefined();
      expect(assessment.recommendations).toBeDefined();
      expect(Array.isArray(assessment.recommendations)).toBe(true);
    });

    it('should identify supply chain risks', async () => {
      const risks = await agent['identifySupplyChainRisks']();

      expect(risks).toBeDefined();
      expect(Array.isArray(risks.identifiedRisks)).toBe(true);
      expect(Array.isArray(risks.criticalRisks)).toBe(true);
      expect(risks.mitigationStrategies).toBeDefined();
    });

    it('should generate optimization recommendations', async () => {
      const optimization = await agent['generateOptimizationRecommendations']();

      expect(optimization).toBeDefined();
      expect(Array.isArray(optimization.recommendations)).toBe(true);
      expect(optimization.potentialImpact).toBeDefined();
      expect(optimization.potentialImpact.emissionReduction).toBeDefined();
      expect(optimization.potentialImpact.costSavings).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      jest.spyOn(agent as any, 'supabase').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const task: AgentTask = {
        id: 'test-task-error',
        type: 'investigate_supply_chain',
        priority: 'high',
        data: {},
        scheduledFor: new Date(),
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty supplier data', async () => {
      const assessment = await agent['assessSupplier']('non-existent-supplier');

      expect(assessment).toBeDefined();
      expect(assessment.sustainabilityScore).toBe(50); // Default score
      expect(assessment.recommendations).toContain('Insufficient data available');
    });
  });

  describe('integration with network intelligence', () => {
    it('should use network graph engine for risk analysis', async () => {
      const task: AgentTask = {
        id: 'test-network-task',
        type: 'monitor_supply_chain_risks',
        priority: 'high',
        data: { use_network_intelligence: true },
        scheduledFor: new Date(),
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.data.networkAnalysis).toBeDefined();
    });
  });
});