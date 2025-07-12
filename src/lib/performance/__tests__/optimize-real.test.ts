import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { 
  debounce, 
  throttle, 
  memoize, 
  lazyLoad,
  whenIdle,
  prefetchOnHover
} from '../optimize';

describe('Performance Optimization Utils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('a');
      debounced('b');
      debounced('c');

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('c');
    });

    it('should handle multiple rapid calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      // Call multiple times rapidly
      for (let i = 0; i < 5; i++) {
        debounced(i);
      }

      jest.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(4); // Last call wins
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled('a');
      throttled('b');
      throttled('c');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');

      jest.advanceTimersByTime(100);
      throttled('d');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('d');
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      const expensive = jest.fn((n: number) => n * 2);
      const memoized = memoize(expensive);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(expensive).toHaveBeenCalledTimes(1);

      expect(memoized(10)).toBe(20);
      expect(expensive).toHaveBeenCalledTimes(2);
    });

    it('should use custom resolver', () => {
      const fn = jest.fn((a: any, b: any) => a + b);
      const memoized = memoize(fn, (a, b) => `${a}-${b}`);

      memoized(1, 2);
      memoized(1, 2);
      memoized(2, 1);

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('whenIdle', () => {
    it('should execute callback when idle', () => {
      const callback = jest.fn();
      const mockRequestIdleCallback = jest.fn((cb) => {
        cb({ timeRemaining: () => 50 });
        return 1;
      });
      
      // Mock window for Node environment
      (global as any).window = { requestIdleCallback: mockRequestIdleCallback };
      
      whenIdle(callback);
      expect(callback).toHaveBeenCalled();
      
      delete (global as any).window;
    });

    it('should fallback to setTimeout', () => {
      const callback = jest.fn();
      
      // Mock window without requestIdleCallback
      (global as any).window = {};
      
      whenIdle(callback);
      expect(callback).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalled();
      
      delete (global as any).window;
    });
  });
});