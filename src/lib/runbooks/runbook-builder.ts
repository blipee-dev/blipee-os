/**
 * Runbook Builder
 * Phase 4, Task 4.4: Fluent API for building runbooks
 */

import { 
  Runbook, 
  RunbookStep, 
  StepType,
  runbookEngine 
} from './runbook-engine';

/**
 * Fluent builder for creating runbooks
 */
export class RunbookBuilder {
  private runbook: Partial<Runbook> = {
    steps: [],
    context: {}
  };
  private currentStep: Partial<RunbookStep> | null = null;

  /**
   * Set runbook metadata
   */
  withMetadata(metadata: {
    id: string;
    name: string;
    description: string;
    version?: string;
    tags?: string[];
  }): this {
    this.runbook.id = metadata.id;
    this.runbook.name = metadata.name;
    this.runbook.description = metadata.description;
    this.runbook.version = metadata.version || '1.0.0';
    this.runbook.tags = metadata.tags;
    return this;
  }

  /**
   * Set triggers
   */
  withTriggers(...triggers: string[]): this {
    this.runbook.triggers = triggers;
    return this;
  }

  /**
   * Set initial context
   */
  withContext(context: Record<string, any>): this {
    this.runbook.context = { ...this.runbook.context, ...context };
    return this;
  }

  /**
   * Configure notifications
   */
  withNotifications(config: {
    onStart?: boolean;
    onComplete?: boolean;
    onFailure?: boolean;
    channels?: string[];
  }): this {
    this.runbook.notifications = config;
    return this;
  }

  /**
   * Add a check step
   */
  check(
    id: string,
    name: string,
    checkFn: () => Promise<boolean>
  ): this {
    this.finalizeCurrentStep();
    
    this.currentStep = {
      id,
      name,
      type: StepType.CHECK,
      check: checkFn
    };
    
    return this;
  }

  /**
   * Add an action step
   */
  action(
    id: string,
    name: string,
    actionFn: () => Promise<any>
  ): this {
    this.finalizeCurrentStep();
    
    this.currentStep = {
      id,
      name,
      type: StepType.ACTION,
      action: actionFn
    };
    
    return this;
  }

  /**
   * Add a decision step
   */
  decision(
    id: string,
    name: string,
    conditionFn: (context: any) => string
  ): this {
    this.finalizeCurrentStep();
    
    this.currentStep = {
      id,
      name,
      type: StepType.DECISION,
      condition: conditionFn,
      options: { branches: {} }
    };
    
    return this;
  }

  /**
   * Add a notification step
   */
  notify(
    id: string,
    name: string,
    message: string,
    channels?: string[]
  ): this {
    this.finalizeCurrentStep();
    
    this.currentStep = {
      id,
      name,
      type: StepType.NOTIFICATION,
      options: { message, channels }
    };
    
    return this;
  }

  /**
   * Add a wait step
   */
  wait(
    id: string,
    name: string,
    duration: number
  ): this {
    this.finalizeCurrentStep();
    
    this.currentStep = {
      id,
      name,
      type: StepType.WAIT,
      options: { duration }
    };
    
    return this;
  }

  /**
   * Add parallel execution
   */
  parallel(
    id: string,
    name: string,
    ...stepIds: string[]
  ): this {
    this.finalizeCurrentStep();
    
    this.currentStep = {
      id,
      name,
      type: StepType.PARALLEL,
      options: { steps: stepIds }
    };
    
    return this;
  }

  /**
   * Add loop execution
   */
  loop(
    id: string,
    name: string,
    items: any[],
    stepId: string
  ): this {
    this.finalizeCurrentStep();
    
    this.currentStep = {
      id,
      name,
      type: StepType.LOOP,
      options: { items, step: stepId }
    };
    
    return this;
  }

  /**
   * Set description for current step
   */
  withDescription(description: string): this {
    if (!this.currentStep) {
      throw new Error('No current step to add description to');
    }
    this.currentStep.description = description;
    return this;
  }

  /**
   * Set timeout for current step
   */
  withTimeout(timeout: number): this {
    if (!this.currentStep) {
      throw new Error('No current step to set timeout for');
    }
    this.currentStep.timeout = timeout;
    return this;
  }

  /**
   * Make current step retryable
   */
  retryable(): this {
    if (!this.currentStep) {
      throw new Error('No current step to make retryable');
    }
    this.currentStep.retryable = true;
    return this;
  }

  /**
   * Define success path
   */
  onSuccess(...stepIds: string[]): this {
    if (!this.currentStep) {
      throw new Error('No current step to define success path for');
    }
    this.currentStep.onSuccess = stepIds.length === 1 ? stepIds[0] : stepIds;
    return this;
  }

  /**
   * Define failure path
   */
  onFailure(...stepIds: string[]): this {
    if (!this.currentStep) {
      throw new Error('No current step to define failure path for');
    }
    this.currentStep.onFailure = stepIds.length === 1 ? stepIds[0] : stepIds;
    return this;
  }

  /**
   * Add branch for decision step
   */
  branch(value: string, ...stepIds: string[]): this {
    if (!this.currentStep || this.currentStep.type !== StepType.DECISION) {
      throw new Error('Can only add branches to decision steps');
    }
    
    if (!this.currentStep.options) {
      this.currentStep.options = { branches: {} };
    }
    
    this.currentStep.options.branches[value] = stepIds;
    return this;
  }

  /**
   * Set initial step
   */
  startWith(stepId: string): this {
    this.runbook.initialStep = stepId;
    return this;
  }

  /**
   * Build the runbook
   */
  build(): Runbook {
    this.finalizeCurrentStep();

    if (!this.runbook.id || !this.runbook.name || !this.runbook.description) {
      throw new Error('Runbook must have id, name, and description');
    }

    if (!this.runbook.initialStep) {
      throw new Error('Runbook must have an initial step');
    }

    if (this.runbook.steps!.length === 0) {
      throw new Error('Runbook must have at least one step');
    }

    return this.runbook as Runbook;
  }

  /**
   * Build and register the runbook
   */
  register(): Runbook {
    const runbook = this.build();
    runbookEngine.register(runbook);
    return runbook;
  }

  /**
   * Finalize current step
   */
  private finalizeCurrentStep(): void {
    if (this.currentStep && this.currentStep.id) {
      this.runbook.steps!.push(this.currentStep as RunbookStep);
      this.currentStep = null;
    }
  }
}

/**
 * Create a new runbook builder
 */
export function runbook(): RunbookBuilder {
  return new RunbookBuilder();
}

/**
 * Pre-built step factories
 */
export const Steps = {
  /**
   * Health check step
   */
  healthCheck: (
    id: string,
    service: string,
    url: string
  ): RunbookStep => ({
    id,
    name: `Health check ${service}`,
    type: StepType.CHECK,
    description: `Check if ${service} is responding`,
    check: async () => {
      try {
        const response = await fetch(url);
        return response.ok;
      } catch {
        return false;
      }
    },
    timeout: 5000,
    retryable: true
  }),

  /**
   * Database check step
   */
  databaseCheck: (
    id: string,
    queryFn: () => Promise<any>
  ): RunbookStep => ({
    id,
    name: 'Database connectivity check',
    type: StepType.CHECK,
    description: 'Verify database is accessible',
    check: async () => {
      try {
        await queryFn();
        return true;
      } catch {
        return false;
      }
    },
    timeout: 10000,
    retryable: true
  }),

  /**
   * Service restart step
   */
  restartService: (
    id: string,
    service: string,
    restartFn: () => Promise<void>
  ): RunbookStep => ({
    id,
    name: `Restart ${service}`,
    type: StepType.ACTION,
    description: `Restart the ${service} service`,
    action: restartFn,
    timeout: 60000
  }),

  /**
   * Scale service step
   */
  scaleService: (
    id: string,
    service: string,
    scaleFn: (replicas: number) => Promise<void>,
    replicas: number
  ): RunbookStep => ({
    id,
    name: `Scale ${service} to ${replicas} replicas`,
    type: StepType.ACTION,
    description: `Scale the ${service} service`,
    action: () => scaleFn(replicas),
    timeout: 30000
  }),

  /**
   * Clear cache step
   */
  clearCache: (
    id: string,
    cacheName: string,
    clearFn: () => Promise<void>
  ): RunbookStep => ({
    id,
    name: `Clear ${cacheName} cache`,
    type: StepType.ACTION,
    description: `Clear the ${cacheName} cache to resolve issues`,
    action: clearFn,
    timeout: 10000
  }),

  /**
   * Rollback deployment step
   */
  rollback: (
    id: string,
    service: string,
    rollbackFn: () => Promise<void>
  ): RunbookStep => ({
    id,
    name: `Rollback ${service} deployment`,
    type: StepType.ACTION,
    description: `Rollback ${service} to previous version`,
    action: rollbackFn,
    timeout: 120000
  }),

  /**
   * Send alert step
   */
  alert: (
    id: string,
    message: string,
    severity: 'info' | 'warning' | 'error',
    channels: string[] = ['slack', 'email']
  ): RunbookStep => ({
    id,
    name: `Send ${severity} alert`,
    type: StepType.NOTIFICATION,
    description: `Send alert notification`,
    options: {
      message,
      severity,
      channels
    }
  }),

  /**
   * Circuit breaker check
   */
  checkCircuitBreaker: (
    id: string,
    serviceName: string
  ): RunbookStep => ({
    id,
    name: `Check ${serviceName} circuit breaker`,
    type: StepType.CHECK,
    description: `Check if circuit breaker is healthy`,
    check: async () => {
      const { circuitBreakerRegistry } = await import('@/lib/resilience');
      const breaker = circuitBreakerRegistry.get(serviceName);
      return breaker?.getHealth().isHealthy ?? false;
    },
    timeout: 1000
  }),

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker: (
    id: string,
    serviceName: string
  ): RunbookStep => ({
    id,
    name: `Reset ${serviceName} circuit breaker`,
    type: StepType.ACTION,
    description: `Reset circuit breaker to closed state`,
    action: async () => {
      const { circuitBreakerRegistry } = await import('@/lib/resilience');
      const breaker = circuitBreakerRegistry.get(serviceName);
      breaker?.reset();
    },
    timeout: 1000
  })
};