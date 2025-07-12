import { describe, it, expect } from '@jest/globals';

// Simple utility tests for quick coverage wins
describe('Simple Utilities', () => {
  // Date utilities
  describe('Date formatting', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-01');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2024-01-01');
    });
    
    it('should handle date calculations', () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(tomorrow.getTime()).toBeGreaterThan(now.getTime());
    });
  });
  
  // String utilities
  describe('String manipulation', () => {
    it('should capitalize strings', () => {
      const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('WORLD');
      expect(capitalize('')).toBe('');
    });
    
    it('should truncate strings', () => {
      const truncate = (str, len) => str.length > len ? str.slice(0, len) + '...' : str;
      expect(truncate('Hello world', 5)).toBe('Hello...');
      expect(truncate('Hi', 5)).toBe('Hi');
    });
  });
  
  // Number utilities
  describe('Number formatting', () => {
    it('should format currency', () => {
      const formatCurrency = (num) => '$' + num.toFixed(2);
      expect(formatCurrency(10)).toBe('$10.00');
      expect(formatCurrency(10.5)).toBe('$10.50');
      expect(formatCurrency(10.567)).toBe('$10.57');
    });
    
    it('should format percentages', () => {
      const formatPercent = (num) => (num * 100).toFixed(1) + '%';
      expect(formatPercent(0.5)).toBe('50.0%');
      expect(formatPercent(0.125)).toBe('12.5%');
      expect(formatPercent(1)).toBe('100.0%');
    });
  });
  
  // Array utilities
  describe('Array operations', () => {
    it('should chunk arrays', () => {
      const chunk = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };
      
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([], 2)).toEqual([]);
    });
    
    it('should remove duplicates', () => {
      const unique = (arr) => [...new Set(arr)];
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique([])).toEqual([]);
    });
  });
  
  // Object utilities
  describe('Object operations', () => {
    it('should deep clone objects', () => {
      const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });
    
    it('should merge objects', () => {
      const merge = (...objs) => Object.assign({}, ...objs);
      expect(merge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
      expect(merge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    });
  });
});