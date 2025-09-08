/**
 * Runbook Engine
 * Phase 4, Task 4.4: Automated runbook execution
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logging';
import { tracer } from '@/lib/tracing';
import { resilienceManager, ResiliencePolicies } from '@/lib/resilience';

/**
 * Runbook step types
 */
export enum StepType {
  CHECK = 'CHECK',
  ACTION = 'ACTION',
  DECISION = 'DECISION',
  NOTIFICATION = 'NOTIFICATION',
  WAIT = 'WAIT',
  PARALLEL = 'PARALLEL',
  LOOP = 'LOOP'
}

/**
 * Runbook step definition
 */
export interface RunbookStep {
  id: string;
  name: string;
  type: StepType;
  description?: string;
  action?: () => Promise<any>;
  check?: () => Promise<boolean>;
  condition?: (context: any) => boolean;
  options?: any;
  onSuccess?: string | string[]; // Next step(s)
  onFailure?: string | string[];
  retryable?: boolean;
  timeout?: number;
}

/**
 * Runbook definition
 */
export interface Runbook {
  id: string;
  name: string;
  description: string;
  version: string;
  triggers?: string[];
  tags?: string[];
  steps: RunbookStep[];
  initialStep: string;
  context?: Record<string, any>;
  notifications?: {
    onStart?: boolean;
    onComplete?: boolean;
    onFailure?: boolean;
    channels?: string[];
  };
}

/**
 * Execution state
 */
export interface ExecutionState {
  runbookId: string;
  executionId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  startTime: Date;
  endTime?: Date;
  context: Record<string, any>;
  results: Record<string, any>;
  errors: Array<{ step: string; error: string; timestamp: Date }>;
  history: Array<{
    stepId: string;
    status: 'success' | 'failure' | 'skipped';
    startTime: Date;
    endTime: Date;
    result?: any;
    error?: string;
  }>;
}

/**
 * Runbook execution engine
 */
export class RunbookEngine extends EventEmitter {
  private runbooks: Map<string, Runbook> = new Map();
  private executions: Map<string, ExecutionState> = new Map();
  private activeExecutions: Set<string> = new Set();

  /**
   * Register a runbook
   */
  register(runbook: Runbook): void {
    this.runbooks.set(runbook.id, runbook);
    
    logger.info('Runbook registered', {
      id: runbook.id,
      name: runbook.name,
      version: runbook.version,
      stepCount: runbook.steps.length
    });

    this.emit('runbook:registered', { runbook });
  }

  /**
   * Execute a runbook
   */
  async execute(
    runbookId: string,
    initialContext?: Record<string, any>,
    options?: {
      async?: boolean;
      notificationOverrides?: Runbook['notifications'];
    }
  ): Promise<ExecutionState> {
    const runbook = this.runbooks.get(runbookId);
    if (!runbook) {
      throw new Error(`Runbook ${runbookId} not found`);
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const state: ExecutionState = {
      runbookId,
      executionId,
      status: 'running',
      startTime: new Date(),
      context: { ...runbook.context, ...initialContext },
      results: {},
      errors: [],
      history: []
    };

    this.executions.set(executionId, state);
    this.activeExecutions.add(executionId);

    logger.info('Runbook execution started', {
      runbookId,
      executionId,
      runbookName: runbook.name
    });

    this.emit('execution:started', { executionId, runbook, context: state.context });

    // Send start notification if configured
    if (runbook.notifications?.onStart) {
      await this.sendNotification('start', runbook, state);
    }

    // Execute asynchronously if requested
    if (options?.async) {
      this.executeRunbook(runbook, state).catch(error => {
        logger.error('Async runbook execution failed', error);
      });
      return state;
    }

    // Execute synchronously
    return this.executeRunbook(runbook, state);
  }

  /**
   * Execute runbook steps
   */
  private async executeRunbook(
    runbook: Runbook,
    state: ExecutionState
  ): Promise<ExecutionState> {
    return tracer.startActiveSpan(
      `runbook.${runbook.id}`,
      async (span) => {
        span.setAttribute('runbook.id', runbook.id);
        span.setAttribute('runbook.name', runbook.name);
        span.setAttribute('execution.id', state.executionId);

        try {
          // Find initial step
          const initialStep = runbook.steps.find(s => s.id === runbook.initialStep);
          if (!initialStep) {
            throw new Error(`Initial step ${runbook.initialStep} not found`);
          }

          // Execute steps
          await this.executeStep(initialStep, runbook, state);

          // Mark as completed if not failed
          if (state.status === 'running') {
            state.status = 'completed';
            state.endTime = new Date();
          }

          // Send completion notification
          if (runbook.notifications?.onComplete && state.status === 'completed') {
            await this.sendNotification('complete', runbook, state);
          }

          span.setAttribute('execution.status', state.status);
          span.setAttribute('execution.duration', 
            (state.endTime!.getTime() - state.startTime.getTime()));

          logger.info('Runbook execution completed', {
            runbookId: runbook.id,
            executionId: state.executionId,
            status: state.status,
            duration: state.endTime!.getTime() - state.startTime.getTime()
          });

          this.emit('execution:completed', { executionId: state.executionId, state });

        } catch (error) {
          state.status = 'failed';
          state.endTime = new Date();
          
          span.recordException(error as Error);
          
          logger.error('Runbook execution failed', error as Error, {
            runbookId: runbook.id,
            executionId: state.executionId,
            currentStep: state.currentStep
          });

          // Send failure notification
          if (runbook.notifications?.onFailure) {
            await this.sendNotification('failure', runbook, state, error as Error);
          }

          this.emit('execution:failed', { 
            executionId: state.executionId, 
            error: error as Error,
            state 
          });

          throw error;

        } finally {
          this.activeExecutions.delete(state.executionId);
        }

        return state;
      }
    );
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: RunbookStep,
    runbook: Runbook,
    state: ExecutionState
  ): Promise<void> {
    // Check if execution was cancelled
    if (state.status === 'cancelled') {
      logger.info('Execution cancelled, skipping step', {
        executionId: state.executionId,
        stepId: step.id
      });
      return;
    }

    state.currentStep = step.id;
    const stepStart = new Date();

    logger.info('Executing runbook step', {
      executionId: state.executionId,
      stepId: step.id,
      stepName: step.name,
      stepType: step.type
    });

    this.emit('step:started', { 
      executionId: state.executionId, 
      step,
      context: state.context 
    });

    try {
      let result: any;
      let nextSteps: string[] = [];

      // Execute based on step type
      switch (step.type) {
        case StepType.CHECK:
          result = await this.executeCheck(step, state);
          nextSteps = result ? this.toArray(step.onSuccess) : this.toArray(step.onFailure);
          break;

        case StepType.ACTION:
          result = await this.executeAction(step, state);
          nextSteps = this.toArray(step.onSuccess);
          break;

        case StepType.DECISION:
          result = await this.executeDecision(step, state);
          nextSteps = this.toArray(result.nextSteps);
          break;

        case StepType.NOTIFICATION:
          await this.executeNotification(step, state);
          nextSteps = this.toArray(step.onSuccess);
          break;

        case StepType.WAIT:
          await this.executeWait(step, state);
          nextSteps = this.toArray(step.onSuccess);
          break;

        case StepType.PARALLEL:
          result = await this.executeParallel(step, runbook, state);
          nextSteps = this.toArray(step.onSuccess);
          break;

        case StepType.LOOP:
          result = await this.executeLoop(step, runbook, state);
          nextSteps = this.toArray(step.onSuccess);
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Store result
      if (result !== undefined) {
        state.results[step.id] = result;
        state.context[`${step.id}_result`] = result;
      }

      // Record in history
      state.history.push({
        stepId: step.id,
        status: 'success',
        startTime: stepStart,
        endTime: new Date(),
        result
      });

      this.emit('step:completed', { 
        executionId: state.executionId, 
        step,
        result,
        nextSteps 
      });

      // Execute next steps
      for (const nextStepId of nextSteps) {
        const nextStep = runbook.steps.find(s => s.id === nextStepId);
        if (nextStep) {
          await this.executeStep(nextStep, runbook, state);
        } else {
          logger.warn('Next step not found', {
            executionId: state.executionId,
            nextStepId
          });
        }
      }

    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Record error
      state.errors.push({
        step: step.id,
        error: errorMessage,
        timestamp: new Date()
      });

      state.history.push({
        stepId: step.id,
        status: 'failure',
        startTime: stepStart,
        endTime: new Date(),
        error: errorMessage
      });

      this.emit('step:failed', { 
        executionId: state.executionId, 
        step,
        error: error as Error 
      });

      // Handle failure path
      if (step.onFailure) {
        logger.info('Executing failure path', {
          executionId: state.executionId,
          stepId: step.id,
          failureSteps: step.onFailure
        });

        const failureSteps = this.toArray(step.onFailure);
        for (const failureStepId of failureSteps) {
          const failureStep = runbook.steps.find(s => s.id === failureStepId);
          if (failureStep) {
            await this.executeStep(failureStep, runbook, state);
          }
        }
      } else if (!step.retryable) {
        // No failure path and not retryable, propagate error
        throw error;
      }
    }
  }

  /**
   * Execute check step
   */
  private async executeCheck(
    step: RunbookStep,
    state: ExecutionState
  ): Promise<boolean> {
    if (!step.check) {
      throw new Error(`Check step ${step.id} missing check function`);
    }

    const result = await resilienceManager.execute(
      `runbook.check.${step.id}`,
      step.check,
      {
        timeout: step.timeout || 30000,
        retry: step.retryable ? ResiliencePolicies.api().retry : false
      }
    );

    logger.info('Check step result', {
      executionId: state.executionId,
      stepId: step.id,
      result
    });

    return result;
  }

  /**
   * Execute action step
   */
  private async executeAction(
    step: RunbookStep,
    state: ExecutionState
  ): Promise<any> {
    if (!step.action) {
      throw new Error(`Action step ${step.id} missing action function`);
    }

    const result = await resilienceManager.execute(
      `runbook.action.${step.id}`,
      () => step.action!.call(state.context),
      {
        timeout: step.timeout || 60000,
        retry: step.retryable ? ResiliencePolicies.api().retry : false
      }
    );

    logger.info('Action step completed', {
      executionId: state.executionId,
      stepId: step.id
    });

    return result;
  }

  /**
   * Execute decision step
   */
  private async executeDecision(
    step: RunbookStep,
    state: ExecutionState
  ): Promise<{ decision: string; nextSteps: string[] }> {
    if (!step.condition) {
      throw new Error(`Decision step ${step.id} missing condition function`);
    }

    const decision = step.condition(state.context);
    const nextSteps = step.options?.branches?.[decision] || [];

    logger.info('Decision step result', {
      executionId: state.executionId,
      stepId: step.id,
      decision,
      nextSteps
    });

    return { decision, nextSteps };
  }

  /**
   * Execute notification step
   */
  private async executeNotification(
    step: RunbookStep,
    state: ExecutionState
  ): Promise<void> {
    const message = step.options?.message || `Runbook step ${step.name} executed`;
    const channels = step.options?.channels || ['log'];

    for (const channel of channels) {
      logger.info('Sending notification', {
        executionId: state.executionId,
        stepId: step.id,
        channel,
        message
      });

      // In real implementation, send to actual channels
      this.emit('notification:sent', {
        executionId: state.executionId,
        step,
        channel,
        message
      });
    }
  }

  /**
   * Execute wait step
   */
  private async executeWait(
    step: RunbookStep,
    state: ExecutionState
  ): Promise<void> {
    const duration = step.options?.duration || 1000;
    
    logger.info('Wait step started', {
      executionId: state.executionId,
      stepId: step.id,
      duration
    });

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Execute parallel steps
   */
  private async executeParallel(
    step: RunbookStep,
    runbook: Runbook,
    state: ExecutionState
  ): Promise<any[]> {
    const parallelStepIds = step.options?.steps || [];
    const parallelSteps = parallelStepIds
      .map((id: string) => runbook.steps.find(s => s.id === id))
      .filter(Boolean);

    logger.info('Executing parallel steps', {
      executionId: state.executionId,
      stepId: step.id,
      parallelSteps: parallelStepIds
    });

    const results = await Promise.allSettled(
      parallelSteps.map(s => this.executeStep(s!, runbook, state))
    );

    return results.map((r, i) => ({
      stepId: parallelStepIds[i],
      status: r.status,
      value: r.status === 'fulfilled' ? state.results[parallelStepIds[i]] : undefined,
      error: r.status === 'rejected' ? r.reason : undefined
    }));
  }

  /**
   * Execute loop step
   */
  private async executeLoop(
    step: RunbookStep,
    runbook: Runbook,
    state: ExecutionState
  ): Promise<any[]> {
    const items = step.options?.items || [];
    const loopStepId = step.options?.step;
    const loopStep = runbook.steps.find(s => s.id === loopStepId);

    if (!loopStep) {
      throw new Error(`Loop step ${loopStepId} not found`);
    }

    const results = [];

    for (const item of items) {
      state.context.loopItem = item;
      state.context.loopIndex = results.length;

      await this.executeStep(loopStep, runbook, state);
      results.push(state.results[loopStep.id]);
    }

    delete state.context.loopItem;
    delete state.context.loopIndex;

    return results;
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId: string): boolean {
    const state = this.executions.get(executionId);
    if (!state || state.status !== 'running') {
      return false;
    }

    state.status = 'cancelled';
    state.endTime = new Date();

    logger.info('Runbook execution cancelled', {
      executionId,
      runbookId: state.runbookId
    });

    this.emit('execution:cancelled', { executionId, state });
    return true;
  }

  /**
   * Get execution state
   */
  getExecution(executionId: string): ExecutionState | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions
   */
  getAllExecutions(): ExecutionState[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ExecutionState[] {
    return Array.from(this.activeExecutions)
      .map(id => this.executions.get(id))
      .filter(Boolean) as ExecutionState[];
  }

  /**
   * Send notification
   */
  private async sendNotification(
    type: 'start' | 'complete' | 'failure',
    runbook: Runbook,
    state: ExecutionState,
    error?: Error
  ): Promise<void> {
    const channels = runbook.notifications?.channels || ['log'];
    
    const message = {
      type,
      runbook: {
        id: runbook.id,
        name: runbook.name,
        version: runbook.version
      },
      execution: {
        id: state.executionId,
        status: state.status,
        startTime: state.startTime,
        endTime: state.endTime,
        duration: state.endTime ? 
          state.endTime.getTime() - state.startTime.getTime() : undefined
      },
      error: error?.message,
      context: state.context
    };

    for (const channel of channels) {
      this.emit('notification:send', { channel, message });
    }
  }

  /**
   * Utility to convert to array
   */
  private toArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
}

/**
 * Global runbook engine instance
 */
export const runbookEngine = new RunbookEngine();