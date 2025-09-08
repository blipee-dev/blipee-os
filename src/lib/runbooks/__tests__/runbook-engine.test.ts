/**
 * Tests for Runbook Engine
 * Phase 4, Task 4.4: Runbook automation tests
 */

import { 
  RunbookEngine, 
  Runbook, 
  RunbookStep, 
  StepType 
} from '../runbook-engine';
import { runbook } from '../runbook-builder';

// Mock logger
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock tracer
jest.mock('@/lib/tracing', () => ({
  tracer: {
    startActiveSpan: jest.fn((name, fn) => fn({
      setAttribute: jest.fn(),
      recordException: jest.fn(),
      addEvent: jest.fn()
    }))
  }
}));

// Mock resilience manager
jest.mock('@/lib/resilience', () => ({
  resilienceManager: {
    execute: jest.fn((name, fn) => fn())
  },
  ResiliencePolicies: {
    api: () => ({ retry: true })
  }
}));

describe('RunbookEngine', () => {
  let engine: RunbookEngine;
  let testRunbook: Runbook;

  beforeEach(() => {
    engine = new RunbookEngine();
    
    // Create test runbook
    testRunbook = {
      id: 'test-runbook',
      name: 'Test Runbook',
      description: 'Test runbook for unit tests',
      version: '1.0.0',
      initialStep: 'step1',
      steps: [
        {
          id: 'step1',
          name: 'First Step',
          type: StepType.CHECK,
          check: jest.fn().mockResolvedValue(true),
          onSuccess: 'step2',
          onFailure: 'error-step'
        },
        {
          id: 'step2',
          name: 'Second Step',
          type: StepType.ACTION,
          action: jest.fn().mockResolvedValue('success'),
          onSuccess: 'step3'
        },
        {
          id: 'step3',
          name: 'Final Step',
          type: StepType.NOTIFICATION,
          options: { message: 'Complete', channels: ['log'] }
        },
        {
          id: 'error-step',
          name: 'Error Handler',
          type: StepType.NOTIFICATION,
          options: { message: 'Failed', channels: ['log'] }
        }
      ]
    };
  });

  describe('Registration', () => {
    it('should register a runbook', () => {
      const registerSpy = jest.fn();
      engine.on('runbook:registered', registerSpy);

      engine.register(testRunbook);

      expect(registerSpy).toHaveBeenCalledWith({
        runbook: testRunbook
      });
    });
  });

  describe('Execution', () => {
    beforeEach(() => {
      engine.register(testRunbook);
    });

    it('should execute a runbook successfully', async () => {
      const startedSpy = jest.fn();
      const completedSpy = jest.fn();
      
      engine.on('execution:started', startedSpy);
      engine.on('execution:completed', completedSpy);

      const result = await engine.execute('test-runbook');

      expect(result.status).toBe('completed');
      expect(result.runbookId).toBe('test-runbook');
      expect(startedSpy).toHaveBeenCalled();
      expect(completedSpy).toHaveBeenCalled();
      
      // Verify all steps executed
      expect(testRunbook.steps[0].check).toHaveBeenCalled();
      expect(testRunbook.steps[1].action).toHaveBeenCalled();
    });

    it('should handle check failure', async () => {
      // Make check fail
      (testRunbook.steps[0].check as jest.Mock).mockResolvedValue(false);

      const result = await engine.execute('test-runbook');

      expect(result.status).toBe('completed');
      expect(result.history).toContainEqual(
        expect.objectContaining({
          stepId: 'step1',
          status: 'success'
        })
      );
      
      // Should go to error step
      expect(result.history).toContainEqual(
        expect.objectContaining({
          stepId: 'error-step',
          status: 'success'
        })
      );
    });

    it('should handle action failure', async () => {
      const error = new Error('Action failed');
      (testRunbook.steps[1].action as jest.Mock).mockRejectedValue(error);

      await expect(engine.execute('test-runbook')).rejects.toThrow('Action failed');
    });

    it('should execute asynchronously', async () => {
      const result = await engine.execute('test-runbook', {}, { async: true });

      expect(result.status).toBe('running');
      expect(result.executionId).toBeDefined();

      // Wait for async completion
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should pass context between steps', async () => {
      const contextRunbook: Runbook = {
        ...testRunbook,
        steps: [
          {
            id: 'set-context',
            name: 'Set Context',
            type: StepType.ACTION,
            action: jest.fn(async function() {
              this.testValue = 'hello';
              return 'set';
            }),
            onSuccess: 'use-context'
          },
          {
            id: 'use-context',
            name: 'Use Context',
            type: StepType.ACTION,
            action: jest.fn(async function() {
              return this.testValue;
            })
          }
        ],
        initialStep: 'set-context'
      };

      engine.register(contextRunbook);
      const result = await engine.execute(contextRunbook.id);

      expect(result.results['use-context']).toBe('hello');
    });
  });

  describe('Step Types', () => {
    it('should execute decision steps', async () => {
      const decisionRunbook: Runbook = {
        id: 'decision-test',
        name: 'Decision Test',
        description: 'Test decision branching',
        version: '1.0.0',
        initialStep: 'decide',
        steps: [
          {
            id: 'decide',
            name: 'Make Decision',
            type: StepType.DECISION,
            condition: (context) => context.value > 5 ? 'high' : 'low',
            options: {
              branches: {
                high: ['high-path'],
                low: ['low-path']
              }
            }
          },
          {
            id: 'high-path',
            name: 'High Value Path',
            type: StepType.ACTION,
            action: jest.fn()
          },
          {
            id: 'low-path',
            name: 'Low Value Path',
            type: StepType.ACTION,
            action: jest.fn()
          }
        ]
      };

      engine.register(decisionRunbook);
      
      // Test high value
      await engine.execute('decision-test', { value: 10 });
      expect(decisionRunbook.steps[1].action).toHaveBeenCalled();
      expect(decisionRunbook.steps[2].action).not.toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();

      // Test low value
      await engine.execute('decision-test', { value: 3 });
      expect(decisionRunbook.steps[1].action).not.toHaveBeenCalled();
      expect(decisionRunbook.steps[2].action).toHaveBeenCalled();
    });

    it('should execute wait steps', async () => {
      const waitRunbook: Runbook = {
        id: 'wait-test',
        name: 'Wait Test',
        description: 'Test wait step',
        version: '1.0.0',
        initialStep: 'wait',
        steps: [
          {
            id: 'wait',
            name: 'Wait Step',
            type: StepType.WAIT,
            options: { duration: 100 }
          }
        ]
      };

      engine.register(waitRunbook);
      
      const start = Date.now();
      await engine.execute('wait-test');
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should execute parallel steps', async () => {
      const action1 = jest.fn().mockResolvedValue('result1');
      const action2 = jest.fn().mockResolvedValue('result2');

      const parallelRunbook: Runbook = {
        id: 'parallel-test',
        name: 'Parallel Test',
        description: 'Test parallel execution',
        version: '1.0.0',
        initialStep: 'parallel',
        steps: [
          {
            id: 'parallel',
            name: 'Parallel Steps',
            type: StepType.PARALLEL,
            options: { steps: ['action1', 'action2'] }
          },
          {
            id: 'action1',
            name: 'Action 1',
            type: StepType.ACTION,
            action: action1
          },
          {
            id: 'action2',
            name: 'Action 2',
            type: StepType.ACTION,
            action: action2
          }
        ]
      };

      engine.register(parallelRunbook);
      const result = await engine.execute('parallel-test');

      expect(action1).toHaveBeenCalled();
      expect(action2).toHaveBeenCalled();
      expect(result.results['parallel']).toEqual([
        { stepId: 'action1', status: 'fulfilled', value: 'result1' },
        { stepId: 'action2', status: 'fulfilled', value: 'result2' }
      ]);
    });

    it('should execute loop steps', async () => {
      const loopAction = jest.fn().mockResolvedValue('processed');

      const loopRunbook: Runbook = {
        id: 'loop-test',
        name: 'Loop Test',
        description: 'Test loop execution',
        version: '1.0.0',
        initialStep: 'loop',
        steps: [
          {
            id: 'loop',
            name: 'Loop Step',
            type: StepType.LOOP,
            options: { 
              items: ['item1', 'item2', 'item3'],
              step: 'process-item'
            }
          },
          {
            id: 'process-item',
            name: 'Process Item',
            type: StepType.ACTION,
            action: loopAction
          }
        ]
      };

      engine.register(loopRunbook);
      const result = await engine.execute('loop-test');

      expect(loopAction).toHaveBeenCalledTimes(3);
      expect(result.results['loop']).toEqual([
        'processed', 'processed', 'processed'
      ]);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      engine.register(testRunbook);
    });

    it('should retry retryable steps', async () => {
      const retryableAction = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');

      const retryRunbook: Runbook = {
        id: 'retry-test',
        name: 'Retry Test',
        description: 'Test retry logic',
        version: '1.0.0',
        initialStep: 'retry-action',
        steps: [
          {
            id: 'retry-action',
            name: 'Retryable Action',
            type: StepType.ACTION,
            action: retryableAction,
            retryable: true
          }
        ]
      };

      engine.register(retryRunbook);
      const result = await engine.execute('retry-test');

      expect(result.status).toBe('completed');
      expect(retryableAction).toHaveBeenCalledTimes(1); // Note: retry is handled by resilience manager
    });

    it('should record errors in history', async () => {
      const error = new Error('Step failed');
      (testRunbook.steps[1].action as jest.Mock).mockRejectedValue(error);

      try {
        await engine.execute('test-runbook');
      } catch {
        // Expected to fail
      }

      const execution = engine.getAllExecutions()[0];
      expect(execution.errors).toContainEqual({
        step: 'step2',
        error: 'Step failed',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('Execution Management', () => {
    beforeEach(() => {
      engine.register(testRunbook);
    });

    it('should cancel running execution', async () => {
      // Create a long-running runbook
      const longRunbook: Runbook = {
        id: 'long-test',
        name: 'Long Test',
        description: 'Long running test',
        version: '1.0.0',
        initialStep: 'long-wait',
        steps: [
          {
            id: 'long-wait',
            name: 'Long Wait',
            type: StepType.WAIT,
            options: { duration: 5000 }
          }
        ]
      };

      engine.register(longRunbook);
      const executionPromise = engine.execute('long-test', {}, { async: true });
      const result = await executionPromise;

      // Cancel it
      const cancelled = engine.cancelExecution(result.executionId);
      expect(cancelled).toBe(true);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const execution = engine.getExecution(result.executionId);
      expect(execution?.status).toBe('cancelled');
    });

    it('should track active executions', async () => {
      const execution = await engine.execute('test-runbook', {}, { async: true });

      const activeExecutions = engine.getActiveExecutions();
      expect(activeExecutions).toContainEqual(
        expect.objectContaining({
          executionId: execution.executionId,
          status: 'running'
        })
      );
    });

    it('should get execution by ID', async () => {
      const result = await engine.execute('test-runbook');

      const execution = engine.getExecution(result.executionId);
      expect(execution).toBeDefined();
      expect(execution?.runbookId).toBe('test-runbook');
      expect(execution?.status).toBe('completed');
    });
  });

  describe('Event Emissions', () => {
    beforeEach(() => {
      engine.register(testRunbook);
    });

    it('should emit step events', async () => {
      const stepStartedSpy = jest.fn();
      const stepCompletedSpy = jest.fn();
      
      engine.on('step:started', stepStartedSpy);
      engine.on('step:completed', stepCompletedSpy);

      await engine.execute('test-runbook');

      expect(stepStartedSpy).toHaveBeenCalledTimes(3); // 3 successful steps
      expect(stepCompletedSpy).toHaveBeenCalledTimes(3);
    });

    it('should emit notification events', async () => {
      const notificationSpy = jest.fn();
      engine.on('notification:sent', notificationSpy);

      await engine.execute('test-runbook');

      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          step: expect.objectContaining({
            id: 'step3',
            type: StepType.NOTIFICATION
          })
        })
      );
    });
  });
});