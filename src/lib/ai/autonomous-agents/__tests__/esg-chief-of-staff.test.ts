/**
 * ESG Chief of Staff Agent Tests
 */

import { ESGChiefOfStaffAgent } from '../esg-chief-of-staff';
import { AgentTask } from '../agent-framework';

describe('ESGChiefOfStaffAgent', () => {
  let agent: ESGChiefOfStaffAgent;
  const testOrgId = 'test-org-123';
  
  beforeEach(async () => {
    agent = new ESGChiefOfStaffAgent(testOrgId);
    await agent.initialize();
  });
  
  describe('Initialization', () => {
    it('should initialize with correct capabilities', () => {
      expect(agent['agentId']).toBe('esg-chief-of-staff');
      const capabilityNames = agent['capabilities'].map(c => c.name);
      expect(capabilityNames).toContain('analyze_metrics');
      expect(capabilityNames).toContain('generate_reports');
      expect(capabilityNames).toContain('send_alerts'); 
      expect(capabilityNames).toContain('optimize_operations');
      expect(agent['maxAutonomyLevel']).toBe(4);
    });
  });

  describe('Task Scheduling', () => {
    it('should generate scheduled tasks', async () => {
      const tasks = await agent.getScheduledTasks();
      
      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      
      // Check task structure
      tasks.forEach(task => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('type');
        expect(task).toHaveProperty('priority');
        expect(task).toHaveProperty('scheduledFor');
      });
    });
  });

  describe('Task Execution', () => {
    it('should execute analyze_metrics task', async () => {
      const task: AgentTask = {
        id: 'test-analyze-1',
        type: 'analyze_metrics',
        priority: 'high',
        data: {
          analysisType: 'daily_scan',
          metrics: ['emissions', 'energy', 'water']
        },
        requiresApproval: false,
        scheduledFor: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.actions).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.nextSteps).toBeDefined();
    });

    it('should execute generate_reports task', async () => {
      const task: AgentTask = {
        id: 'test-report-1',
        type: 'generate_reports',
        priority: 'medium',
        data: {
          reportType: 'weekly_summary',
          recipients: ['sustainability-team']
        },
        requiresApproval: false,
        scheduledFor: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.actions).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should handle unknown task types', async () => {
      const task: AgentTask = {
        id: 'test-unknown-1',
        type: 'unknown_task_type',
        priority: 'low',
        data: {},
        requiresApproval: false,
        scheduledFor: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Unknown task type');
    });
  });

  describe('Learning System', () => {
    it('should store learning patterns', async () => {
      const learning = {
        pattern: 'Test learning pattern',
        context: { taskType: 'analyze_metrics' },
        outcome: 'success',
        confidence: 0.8
      };

      // This should not throw an error
      await expect(agent.learn(learning)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle task execution errors gracefully', async () => {
      const task: AgentTask = {
        id: 'test-error-1',
        type: 'analyze_metrics',
        priority: 'high',
        data: null, // Invalid data to trigger error
        requiresApproval: false,
        scheduledFor: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result).toBeDefined();
      expect(result.taskId).toBe(task.id);
      // Should either succeed with error handling or fail gracefully
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Capabilities', () => {
    it('should have proper capability configuration', () => {
      const capabilities = agent['capabilities'];
      
      capabilities.forEach(capability => {
        expect(capability).toHaveProperty('name');
        expect(capability).toHaveProperty('description');
        expect(capability).toHaveProperty('requiredPermissions');
        expect(capability).toHaveProperty('maxAutonomyLevel');
        expect(Array.isArray(capability.requiredPermissions)).toBe(true);
        expect([1, 2, 3, 4, 5]).toContain(capability.maxAutonomyLevel);
      });
    });
  });
});