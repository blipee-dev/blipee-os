import { AutonomousAgent, AgentTask, AgentResult, AgentConfig } from '../agent-framework';
import { createClient } from '@supabase/supabase-js';

// Mock AI service
jest.mock('../../service', () => ({
  aiService: {
    sendMessage: jest.fn()
  }
}));

// Mock chain of thought engine
jest.mock('../../chain-of-thought', () => ({
  chainOfThoughtEngine: {
    processWithReasoning: jest.fn()
  }
}));

// Test implementation of AutonomousAgent
class TestAgent extends AutonomousAgent {
  async executeTask(task: AgentTask): Promise<AgentResult> {
    return {
      taskId: task.id,
      success: true,
      actions: [{
        type: 'test_action',
        description: 'Test action executed',
        impact: { test: true },
        reversible: true,
        rollbackPlan: 'Test rollback'
      }],
      insights: ['Test insight'],
      nextSteps: ['Test next step'],
      learnings: [{
        pattern: 'Test pattern',
        confidence: 0.8,
        applicableTo: ['test']
      }]
    };
  }
  
  async getScheduledTasks(): Promise<AgentTask[]> {
    return [{
      id: 'test-task-1',
      type: 'test_task',
      priority: 'medium',
      data: { test: true },
      requiresApproval: false
    }];
  }
  
  async learn(result: AgentResult): Promise<void> {
    // Test learning implementation
    await this.updateKnowledge(result.learnings[0]);
  }
}

describe('AutonomousAgent Framework', () => {
  let agent: TestAgent;
  const testOrgId = 'test-org-123';
  const testConfig: AgentConfig = {
    agentId: 'test-agent',
    capabilities: [{
      name: 'test_capability',
      description: 'Test capability',
      requiredPermissions: ['read:test'],
      maxAutonomyLevel: 3
    }],
    maxAutonomyLevel: 3,
    executionInterval: 1000
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    agent = new TestAgent(testOrgId, testConfig);
  });
  
  describe('Agent Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(agent['organizationId']).toBe(testOrgId);
      expect(agent['agentId']).toBe('test-agent');
      expect(agent['capabilities']).toHaveLength(1);
      expect(agent['maxAutonomyLevel']).toBe(3);
    });
    
    it('should use default values when not provided', () => {
      const minimalConfig: AgentConfig = {
        agentId: 'minimal-agent',
        capabilities: []
      };
      
      const minimalAgent = new TestAgent(testOrgId, minimalConfig);
      expect(minimalAgent['maxAutonomyLevel']).toBe(3);
      expect(minimalAgent['executionInterval']).toBe(3600000);
    });
  });
  
  describe('Agent Lifecycle', () => {
    it('should start successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      await agent.start();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🤖 test-agent starting')
      );
    });
    
    it('should stop successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      await agent.start();
      await agent.stop();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🛑 test-agent stopping')
      );
    });
    
    it('should log events during lifecycle', async () => {
      const mockSupabase = createClient('', '');
      await agent.start();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_events');
    });
  });
  
  describe('Task Execution', () => {
    it('should execute tasks successfully', async () => {
      const task: AgentTask = {
        id: 'test-task',
        type: 'test_task',
        priority: 'high',
        data: { test: true },
        requiresApproval: false
      };
      
      const result = await agent.executeTask(task);
      
      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.actions).toHaveLength(1);
      expect(result.insights).toContain('Test insight');
    });
    
    it('should get scheduled tasks', async () => {
      const tasks = await agent.getScheduledTasks();
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].type).toBe('test_task');
    });
  });
  
  describe('Permission System', () => {
    it('should check task permissions', async () => {
      const task: AgentTask = {
        id: 'test-task',
        type: 'test_capability',
        priority: 'medium',
        data: {},
        requiresApproval: false
      };
      
      const canExecute = await agent['canExecuteTask'](task);
      expect(canExecute).toBe(true);
    });
    
    it('should request approval for high-autonomy tasks', async () => {
      const task: AgentTask = {
        id: 'test-task',
        type: 'test_task',
        priority: 'critical',
        data: {},
        requiresApproval: true
      };
      
      const canExecute = await agent['canExecuteTask'](task);
      expect(canExecute).toBe(true); // Mocked to return approved
    });
    
    it('should deny tasks without required capabilities', async () => {
      const task: AgentTask = {
        id: 'test-task',
        type: 'unauthorized_task',
        priority: 'medium',
        data: {},
        requiresApproval: false
      };
      
      const canExecute = await agent['canExecuteTask'](task);
      expect(canExecute).toBe(false);
    });
  });
  
  describe('Learning System', () => {
    it('should update knowledge after task execution', async () => {
      const mockSupabase = createClient('', '');
      const learning = {
        pattern: 'Test learning pattern',
        confidence: 0.85,
        applicableTo: ['test']
      };
      
      await agent['updateKnowledge'](learning);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_knowledge');
    });
    
    it('should call learn method with task result', async () => {
      const learnSpy = jest.spyOn(agent, 'learn');
      const result: AgentResult = {
        taskId: 'test-task',
        success: true,
        actions: [],
        insights: [],
        nextSteps: [],
        learnings: [{
          pattern: 'Test pattern',
          confidence: 0.8,
          applicableTo: ['test']
        }]
      };
      
      await agent.learn(result);
      
      expect(learnSpy).toHaveBeenCalledWith(result);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const mockSupabase = createClient('', '');
      const error = new Error('Test error');
      
      await agent['handleError'](error);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_errors');
    });
    
    it('should attempt recovery after error', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const error = new Error('Test error');
      
      // Start agent first
      await agent.start();
      await agent['handleError'](error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔄 test-agent attempting recovery')
      );
    });
  });
  
  describe('Health Check', () => {
    it('should return health status', async () => {
      const health = await agent.getHealth();
      
      expect(health).toEqual({
        agentId: 'test-agent',
        organizationId: testOrgId,
        isRunning: false,
        capabilities: 1,
        maxAutonomyLevel: 3,
        learningEnabled: true
      });
    });
    
    it('should reflect running status', async () => {
      await agent.start();
      const health = await agent.getHealth();
      
      expect(health.isRunning).toBe(true);
    });
  });
  
  describe('Knowledge Retrieval', () => {
    it('should retrieve agent knowledge', async () => {
      const mockSupabase = createClient('', '');
      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              ilike: jest.fn(() => Promise.resolve({
                data: [{
                  learning: {
                    pattern: 'Test pattern',
                    confidence: 0.8,
                    applicableTo: ['test']
                  }
                }],
                error: null
              }))
            }))
          }))
        }))
      });
      
      const knowledge = await agent['getAgentKnowledge']('test');
      
      expect(knowledge).toHaveLength(1);
      expect(knowledge[0].pattern).toBe('Test pattern');
    });
  });
  
  describe('Result Reporting', () => {
    it('should report task results', async () => {
      const mockSupabase = createClient('', '');
      const result: AgentResult = {
        taskId: 'test-task',
        success: true,
        actions: [],
        insights: ['Test insight'],
        nextSteps: ['Next step'],
        learnings: []
      };
      
      await agent['reportResult'](result);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_results');
    });
  });
  
  describe('Approval System', () => {
    it('should wait for approval with timeout', async () => {
      const mockSupabase = createClient('', '');
      let callCount = 0;
      
      (mockSupabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => {
              callCount++;
              // Return pending first, then approved
              return Promise.resolve({
                data: { status: callCount === 1 ? 'pending' : 'approved' },
                error: null
              });
            })
          }))
        }))
      }));
      
      const approved = await agent['waitForApproval']('test-approval-id', 10000);
      
      expect(approved).toBe(true);
      expect(callCount).toBeGreaterThan(1);
    });
    
    it('should timeout waiting for approval', async () => {
      const mockSupabase = createClient('', '');
      
      (mockSupabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { status: 'pending' },
              error: null
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }));
      
      const approved = await agent['waitForApproval']('test-approval-id', 100); // Very short timeout
      
      expect(approved).toBe(false);
    });
  });
});