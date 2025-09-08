/**
 * Tests for Circuit Breaker
 * Phase 4, Task 4.3: Circuit breaker pattern tests
 */

import { CircuitBreaker, CircuitState, createCircuitBreaker } from '../circuit-breaker';
import { logger } from '@/lib/logging';

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
      addEvent: jest.fn(),
      recordException: jest.fn()
    }))
  }
}));

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    jest.clearAllMocks();
    breaker = createCircuitBreaker('test-service', {
      failureThreshold: 3,
      failureRateThreshold: 0.5,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 5000,
      volumeThreshold: 5
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('State Transitions', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open after consecutive failures', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Failed'));

      // First 2 failures - should remain closed
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('Failed');
        expect(breaker.getState()).toBe(CircuitState.CLOSED);
      }

      // Third failure - should open
      await expect(breaker.execute(failingOperation)).rejects.toThrow('Failed');
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    it('should reject calls when OPEN', async () => {
      // Force open
      breaker.forceOpen();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      const operation = jest.fn().mockResolvedValue('success');

      await expect(breaker.execute(operation)).rejects.toThrow('Circuit breaker is OPEN');
      expect(operation).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      jest.useFakeTimers();

      // Open the circuit
      breaker.forceOpen();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Advance time by reset timeout
      jest.advanceTimersByTime(5000);

      // Should be half-open now
      await new Promise(resolve => setImmediate(resolve));
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close from HALF_OPEN after consecutive successes', async () => {
      jest.useFakeTimers();

      // Force to half-open state
      breaker.forceOpen();
      jest.advanceTimersByTime(5000);
      await new Promise(resolve => setImmediate(resolve));
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      const successOperation = jest.fn().mockResolvedValue('success');

      // First success - still half-open
      await breaker.execute(successOperation);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Second success - should close
      await breaker.execute(successOperation);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen from HALF_OPEN on failure', async () => {
      jest.useFakeTimers();

      // Force to half-open state
      breaker.forceOpen();
      jest.advanceTimersByTime(5000);
      await new Promise(resolve => setImmediate(resolve));
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      const failingOperation = jest.fn().mockRejectedValue(new Error('Failed'));

      // Single failure in half-open should reopen
      await expect(breaker.execute(failingOperation)).rejects.toThrow('Failed');
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Failure Rate Threshold', () => {
    it('should open based on failure rate', async () => {
      const breaker = createCircuitBreaker('rate-test', {
        failureThreshold: 100, // High threshold
        failureRateThreshold: 0.5,
        volumeThreshold: 4
      });

      const successOp = jest.fn().mockResolvedValue('success');
      const failOp = jest.fn().mockRejectedValue(new Error('Failed'));

      // 2 successes, 2 failures = 50% failure rate
      await breaker.execute(successOp);
      await breaker.execute(successOp);
      await expect(breaker.execute(failOp)).rejects.toThrow();
      await expect(breaker.execute(failOp)).rejects.toThrow();

      // Should not open yet (exactly at threshold)
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // One more failure tips it over
      await expect(breaker.execute(failOp)).rejects.toThrow();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should not open if volume threshold not met', async () => {
      const failOp = jest.fn().mockRejectedValue(new Error('Failed'));

      // Only 4 calls, need 5 for volume threshold
      for (let i = 0; i < 4; i++) {
        await expect(breaker.execute(failOp)).rejects.toThrow();
      }

      // Should still be closed
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long operations', async () => {
      const slowOperation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('done'), 2000))
      );

      await expect(breaker.execute(slowOperation)).rejects.toThrow('timeout');
      expect(slowOperation).toHaveBeenCalled();
    });

    it('should count timeouts as failures', async () => {
      const slowOp = () => new Promise(resolve => setTimeout(resolve, 2000));

      // Three timeouts should open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(slowOp)).rejects.toThrow('timeout');
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Metrics', () => {
    it('should track success metrics', async () => {
      const successOp = jest.fn().mockResolvedValue('success');

      await breaker.execute(successOp);
      await breaker.execute(successOp);

      const metrics = breaker.getMetrics();
      expect(metrics.successes).toBe(2);
      expect(metrics.totalCalls).toBe(2);
      expect(metrics.consecutiveSuccesses).toBe(2);
    });

    it('should track failure metrics', async () => {
      const failOp = jest.fn().mockRejectedValue(new Error('Failed'));

      await expect(breaker.execute(failOp)).rejects.toThrow();
      await expect(breaker.execute(failOp)).rejects.toThrow();

      const metrics = breaker.getMetrics();
      expect(metrics.failures).toBe(2);
      expect(metrics.totalCalls).toBe(2);
      expect(metrics.consecutiveFailures).toBe(2);
    });

    it('should track slow calls', async () => {
      const breaker = createCircuitBreaker('slow-test', {
        failureThreshold: 10,
        timeout: 2000,
        slowCallDurationThreshold: 500
      });

      const slowOp = () => new Promise(resolve => setTimeout(() => resolve('done'), 600));
      const fastOp = () => Promise.resolve('done');

      await breaker.execute(slowOp);
      await breaker.execute(fastOp);

      const metrics = breaker.getMetrics();
      expect(metrics.slowCalls).toBe(1);
      expect(metrics.successes).toBe(2);
    });
  });

  describe('Health Status', () => {
    it('should report healthy when closed with low failure rate', async () => {
      const successOp = () => Promise.resolve('success');
      
      for (let i = 0; i < 10; i++) {
        await breaker.execute(successOp);
      }

      const health = breaker.getHealth();
      expect(health.isHealthy).toBe(true);
      expect(health.state).toBe(CircuitState.CLOSED);
      expect(health.failureRate).toBe(0);
    });

    it('should report unhealthy when open', () => {
      breaker.forceOpen();

      const health = breaker.getHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.state).toBe(CircuitState.OPEN);
    });

    it('should calculate correct failure rate', async () => {
      const successOp = () => Promise.resolve('success');
      const failOp = () => Promise.reject(new Error('Failed'));

      // 7 successes, 3 failures = 30% failure rate
      for (let i = 0; i < 7; i++) {
        await breaker.execute(successOp);
      }
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failOp)).rejects.toThrow();
      }

      const health = breaker.getHealth();
      expect(health.failureRate).toBeCloseTo(0.3, 1);
    });
  });

  describe('Manual Controls', () => {
    it('should reset metrics and state', async () => {
      const failOp = () => Promise.reject(new Error('Failed'));

      // Generate some failures
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failOp)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      const metrics = breaker.getMetrics();
      expect(metrics.failures).toBe(0);
      expect(metrics.successes).toBe(0);
    });

    it('should force open', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      
      breaker.forceOpen();
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should force close', () => {
      breaker.forceOpen();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      
      breaker.forceClose();
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Events', () => {
    it('should emit state change events', async () => {
      const stateChangeSpy = jest.fn();
      breaker.on('stateChange', stateChangeSpy);

      const failOp = () => Promise.reject(new Error('Failed'));

      // Trigger open
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failOp)).rejects.toThrow();
      }

      expect(stateChangeSpy).toHaveBeenCalledWith({
        name: 'test-service',
        previousState: CircuitState.CLOSED,
        currentState: CircuitState.OPEN,
        metrics: expect.any(Object)
      });
    });

    it('should emit call events', async () => {
      const callSpy = jest.fn();
      breaker.on('call', callSpy);

      await breaker.execute(() => Promise.resolve('success'));

      expect(callSpy).toHaveBeenCalledWith({
        name: 'test-service',
        success: true,
        duration: expect.any(Number),
        state: CircuitState.CLOSED
      });
    });

    it('should emit reset events', () => {
      const resetSpy = jest.fn();
      breaker.on('reset', resetSpy);

      breaker.reset();

      expect(resetSpy).toHaveBeenCalledWith({
        name: 'test-service'
      });
    });
  });

  describe('Slow Call Rate Threshold', () => {
    it('should open based on slow call rate', async () => {
      const breaker = createCircuitBreaker('slow-rate-test', {
        failureThreshold: 100,
        timeout: 2000,
        slowCallDurationThreshold: 500,
        slowCallRateThreshold: 0.5,
        volumeThreshold: 4
      });

      const slowOp = () => new Promise(resolve => setTimeout(() => resolve('done'), 600));
      const fastOp = () => Promise.resolve('done');

      // 2 fast, 3 slow = 60% slow rate
      await breaker.execute(fastOp);
      await breaker.execute(fastOp);
      await breaker.execute(slowOp);
      await breaker.execute(slowOp);
      await breaker.execute(slowOp);

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });
});