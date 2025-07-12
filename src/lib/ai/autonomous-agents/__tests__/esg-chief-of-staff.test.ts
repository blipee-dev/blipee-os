import { ESGChiefOfStaffAgent } from '../esg-chief-of-staff';
import { AgentTask } from '../agent-framework';
import { createClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('../../esg-context-engine', () => ({
  esgContextEngine: {
    buildESGContext: jest.fn(() => Promise.resolve({
      esgMetrics: {
        emissions: {
          scope1: { current: 100, target: 90, trend: 'increasing' },
          scope2: { current: 50, target: 45, trend: 'stable' }
        },
        energy: { consumption: 1000, renewable: 300 }
      },
      complianceStatus: {
        frameworks: [
          {
            name: 'GRI',
            status: 'partial',
            completeness: 80,
            gaps: ['Disclosure 305-1', 'Disclosure 305-2'],
            nextDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      organization: { industry: 'Manufacturing' }
    }))
  }
}));

jest.mock('../../chain-of-thought', () => ({
  chainOfThoughtEngine: {
    processWithReasoning: jest.fn(() => Promise.resolve({
      reasoning: [
        { thought: 'Emissions are trending upward', insight: 'Immediate action needed' }
      ],
      conclusion: 'Focus on emission reduction',
      confidence: 0.85,
      followUp: ['Implement energy efficiency measures']
    }))
  }
}));

jest.mock('../../service', () => ({
  aiService: {
    sendMessage: jest.fn(() => Promise.resolve({
      content: 'Generated report content'
    }))
  }
}));

jest.mock('../error-handler', () => ({
  AgentErrorHandler: jest.fn().mockImplementation(() => ({
    handleError: jest.fn(() => Promise.resolve(true)),
    registerRollbackAction: jest.fn(),
    rollback: jest.fn(() => Promise.resolve(true))
  }))
}));

jest.mock('../learning-system', () => ({
  AgentLearningSystem: jest.fn().mockImplementation(() => ({
    getRelevantKnowledge: jest.fn(() => Promise.resolve([
      {
        pattern: 'Daily analysis most effective at 8 AM',
        confidence: 0.9,
        applicableTo: ['analyze_metrics']
      }
    ])),
    recordOutcome: jest.fn(() => Promise.resolve()),
    improveDecisionMaking: jest.fn(() => Promise.resolve())
  }))
}));

describe('ESGChiefOfStaffAgent', () => {
  let agent: ESGChiefOfStaffAgent;
  const testOrgId = 'test-org-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    agent = new ESGChiefOfStaffAgent(testOrgId);
  });
  
  describe('Initialization', () => {
    it('should initialize with correct capabilities', () => {
      expect(agent['agentId']).toBe('esg-chief-of-staff');
      expect(agent['capabilities']).toHaveLength(4);
      expect(agent['maxAutonomyLevel']).toBe(4);
    });
    
    it('should have all required capabilities', () => {
      const capabilityNames = agent['capabilities'].map(c => c.name);
      expect(capabilityNames).toContain('analyze_metrics');
      expect(capabilityNames).toContain('generate_reports');
      expect(capabilityNames).toContain('send_alerts');
      expect(capabilityNames).toContain('optimize_operations');
    });
  });
  
  describe('Task Scheduling', () => {
    it('should schedule daily analysis at 8 AM', async () => {
      // Mock current time to 8 AM
      const mockDate = new Date();
      mockDate.setHours(8, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const tasks = await agent.getScheduledTasks();
      
      const analysisTask = tasks.find(t => t.type === 'analyze_metrics');
      expect(analysisTask).toBeDefined();
      expect(analysisTask?.priority).toBe('high');
      expect(analysisTask?.data.period).toBe('daily');
    });
    
    it('should schedule weekly report on Monday 9 AM', async () => {
      // Mock current time to Monday 9 AM
      const mockDate = new Date('2024-07-08T09:00:00'); // A Monday
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const tasks = await agent.getScheduledTasks();
      
      const reportTask = tasks.find(t => t.type === 'generate_reports');
      expect(reportTask).toBeDefined();
      expect(reportTask?.data.type).toBe('executive_summary');
      expect(reportTask?.data.period).toBe('weekly');
    });
    
    it('should always schedule real-time monitoring', async () => {
      const tasks = await agent.getScheduledTasks();
      
      const monitoringTask = tasks.find(t => t.type === 'monitor_realtime');
      expect(monitoringTask).toBeDefined();
      expect(monitoringTask?.priority).toBe('medium');
    });
    
    it('should schedule optimization check every 4 hours', async () => {
      // Test at 0, 4, 8, 12, 16, 20 hours
      const hoursToTest = [0, 4, 8, 12, 16, 20];
      
      for (const hour of hoursToTest) {
        const mockDate = new Date();
        mockDate.setHours(hour, 0, 0, 0);
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
        
        const tasks = await agent.getScheduledTasks();
        const optimizationTask = tasks.find(t => t.type === 'optimize_operations');
        
        expect(optimizationTask).toBeDefined();
        expect(optimizationTask?.requiresApproval).toBe(true);
      }
    });
  });
  
  describe('Task Execution', () => {
    describe('analyzeMetrics', () => {
      it('should analyze metrics successfully', async () => {
        const task: AgentTask = {
          id: 'test-analysis',
          type: 'analyze_metrics',
          priority: 'high',
          data: { period: 'daily', depth: 'comprehensive' },
          requiresApproval: false
        };
        
        const result = await agent.executeTask(task);
        
        expect(result.success).toBe(true);
        expect(result.insights).toContain('Emissions are trending upward');
        expect(result.nextSteps).toContain('Implement energy efficiency measures');
      });
      
      it('should send alerts for critical issues', async () => {
        const task: AgentTask = {
          id: 'test-analysis',
          type: 'analyze_metrics',
          priority: 'high',
          data: { period: 'daily' },
          requiresApproval: false
        };
        
        const result = await agent.executeTask(task);
        
        const alertAction = result.actions.find(a => a.type === 'alert_sent');
        expect(alertAction).toBeDefined();
        expect(alertAction?.description).toContain('critical alert');
      });
    });
    
    describe('generateReport', () => {
      it('should generate reports successfully', async () => {
        const task: AgentTask = {
          id: 'test-report',
          type: 'generate_reports',
          priority: 'high',
          data: {
            type: 'executive_summary',
            recipients: ['ceo', 'board'],
            period: 'weekly'
          },
          requiresApproval: false
        };
        
        const result = await agent.executeTask(task);
        
        expect(result.success).toBe(true);
        expect(result.actions).toContainEqual(
          expect.objectContaining({
            type: 'report_generated',
            reversible: true
          })
        );
      });
    });
    
    describe('monitorRealtime', () => {
      it('should detect anomalies', async () => {
        // Mock anomaly detection
        jest.spyOn(agent as any, 'getCurrentMetricValue').mockResolvedValue({
          metric: 'emissions',
          value: 150,
          unit: 'tCO2e',
          change: 50,
          timestamp: new Date()
        });
        
        jest.spyOn(agent as any, 'getDynamicThreshold').mockResolvedValue({
          value: 100,
          unit: 'tCO2e',
          type: 'learned'
        });
        
        const task: AgentTask = {
          id: 'test-monitor',
          type: 'monitor_realtime',
          priority: 'medium',
          data: {
            metrics: ['emissions'],
            thresholds: 'dynamic',
            alertOnAnomaly: true
          },
          requiresApproval: false
        };
        
        const result = await agent.executeTask(task);
        
        expect(result.success).toBe(true);
        expect(result.insights.length).toBeGreaterThan(0);
        expect(result.insights[0]).toContain('exceeding threshold');
      });
    });
    
    describe('checkCompliance', () => {
      it('should check compliance status', async () => {
        const task: AgentTask = {
          id: 'test-compliance',
          type: 'check_compliance',
          priority: 'high',
          data: {
            frameworks: ['GRI', 'TCFD'],
            checkDeadlines: true,
            generateGapAnalysis: true
          },
          requiresApproval: false
        };
        
        const result = await agent.executeTask(task);
        
        expect(result.success).toBe(true);
        expect(result.insights.length).toBeGreaterThan(0);
      });
      
      it('should send compliance reminders for approaching deadlines', async () => {
        const task: AgentTask = {
          id: 'test-compliance',
          type: 'check_compliance',
          priority: 'high',
          data: {
            frameworks: ['GRI'],
            checkDeadlines: true,
            generateGapAnalysis: false
          },
          requiresApproval: false
        };
        
        const result = await agent.executeTask(task);
        
        const reminderAction = result.actions.find(a => 
          a.type === 'compliance_reminder_sent'
        );
        expect(reminderAction).toBeDefined();
      });
    });
  });
  
  describe('Learning System', () => {
    it('should apply knowledge to task execution', async () => {
      const task: AgentTask = {
        id: 'test-analysis',
        type: 'analyze_metrics',
        priority: 'high',
        data: { period: 'daily' },
        requiresApproval: false
      };
      
      const learningSystem = agent['learningSystem'];
      const getKnowledgeSpy = jest.spyOn(learningSystem, 'getRelevantKnowledge');
      
      await agent.executeTask(task);
      
      expect(getKnowledgeSpy).toHaveBeenCalledWith(
        'esg-chief-of-staff',
        testOrgId,
        'analyze_metrics',
        expect.any(Object)
      );
    });
    
    it('should record outcomes for learning', async () => {
      const task: AgentTask = {
        id: 'test-task',
        type: 'analyze_metrics',
        priority: 'high',
        data: {},
        requiresApproval: false
      };
      
      const learningSystem = agent['learningSystem'];
      const recordSpy = jest.spyOn(learningSystem, 'recordOutcome');
      
      await agent.executeTask(task);
      
      expect(recordSpy).toHaveBeenCalled();
    });
    
    it('should improve decision making after successful tasks', async () => {
      const result = {
        taskId: 'test',
        success: true,
        actions: [{ type: 'test_action' }],
        insights: [],
        nextSteps: [],
        learnings: [{
          pattern: 'Test pattern',
          confidence: 0.8,
          applicableTo: ['test']
        }]
      };
      
      const learningSystem = agent['learningSystem'];
      const improveSpy = jest.spyOn(learningSystem, 'improveDecisionMaking');
      
      await agent.learn(result as any);
      
      expect(improveSpy).toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors with recovery', async () => {
      const errorHandler = agent['errorHandler'];
      const handleSpy = jest.spyOn(errorHandler, 'handleError');
      
      // Force an error by mocking a method to throw
      jest.spyOn(agent as any, 'analyzeMetrics').mockRejectedValueOnce(
        new Error('Test error')
      );
      
      const task: AgentTask = {
        id: 'test-error',
        type: 'analyze_metrics',
        priority: 'high',
        data: {},
        requiresApproval: false
      };
      
      const result = await agent.executeTask(task);
      
      expect(handleSpy).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.insights[0]).toContain('Error occurred but recovered');
    });
  });
  
  describe('Critical Issue Detection', () => {
    it('should identify emissions exceeding target as critical', async () => {
      const context = {
        esgMetrics: {
          emissions: {
            scope1: { current: 110, target: 100, trend: 'increasing' }
          }
        }
      };
      
      const issues = agent['identifyCriticalIssues'](context);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].title).toBe('Scope 1 Emissions Exceeding Target');
      expect(issues[0].severity).toBe('critical');
    });
    
    it('should identify approaching compliance deadlines', async () => {
      const context = {
        complianceStatus: {
          frameworks: [{
            name: 'GRI',
            status: 'partial',
            gaps: ['Gap 1', 'Gap 2'],
            nextDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          }]
        }
      };
      
      const issues = agent['identifyCriticalIssues'](context);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].title).toContain('Compliance Deadline Approaching');
      expect(issues[0].severity).toBe('high');
    });
  });
  
  describe('Helper Methods', () => {
    it('should calculate severity correctly', () => {
      const testCases = [
        { current: { value: 100 }, threshold: { value: 100 }, expected: 'low' },
        { current: { value: 125 }, threshold: { value: 100 }, expected: 'medium' },
        { current: { value: 135 }, threshold: { value: 100 }, expected: 'high' },
        { current: { value: 160 }, threshold: { value: 100 }, expected: 'critical' }
      ];
      
      for (const testCase of testCases) {
        const severity = agent['calculateSeverity'](testCase.current, testCase.threshold);
        expect(severity).toBe(testCase.expected);
      }
    });
    
    it('should determine if value is anomaly', () => {
      const testCases = [
        { current: { value: 105 }, threshold: { value: 100 }, isAnomaly: false },
        { current: { value: 115 }, threshold: { value: 100 }, isAnomaly: true },
        { current: { value: 85 }, threshold: { value: 100 }, isAnomaly: true }
      ];
      
      for (const testCase of testCases) {
        const result = agent['isAnomaly'](testCase.current, testCase.threshold);
        expect(result).toBe(testCase.isAnomaly);
      }
    });
    
    it('should get first Monday of month correctly', () => {
      const testDates = [
        { date: new Date('2024-07-15'), expected: 1 },  // July 2024: First Monday is 1st
        { date: new Date('2024-08-15'), expected: 5 },  // August 2024: First Monday is 5th
        { date: new Date('2024-09-15'), expected: 2 }   // September 2024: First Monday is 2nd
      ];
      
      for (const test of testDates) {
        const firstMonday = agent['getFirstMondayOfMonth'](test.date);
        expect(firstMonday).toBe(test.expected);
      }
    });
  });
});