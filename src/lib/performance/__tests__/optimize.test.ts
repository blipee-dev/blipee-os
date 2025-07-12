import { jest } from '@jest/globals';
import { 
  memoize,
  debounce,
  throttle
} from '../optimize';

describe('optimize', () => {
  describe('memoize', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const expensive = memoize((n: number) => {
        callCount++;
        return n * 2;
      });

      expect(expensive(5)).toBe(10);
      expect(expensive(5)).toBe(10);
      expect(callCount).toBe(1);
    });

    it('should handle different arguments', () => {
      const fn = memoize((a: number, b: number) => a + b);
      
      expect(fn(1, 2)).toBe(3);
      expect(fn(2, 3)).toBe(5);
      expect(fn(1, 2)).toBe(3);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass latest arguments', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('first');
      debounced('second');
      debounced('third');

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('third');
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should throttle function calls', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

});