import { describe, it, expect } from '@jest/globals';

describe('Object Utilities', () => {
  // Object helper functions
  const pick = (obj, keys) => {
    const result = {};
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  };
  
  const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  };
  
  const isEmpty = (obj) => {
    if (obj == null) return true;
    if (typeof obj === 'object') {
      return Object.keys(obj).length === 0;
    }
    if (typeof obj === 'string' || Array.isArray(obj)) {
      return obj.length === 0;
    }
    return false;
  };
  
  const deepMerge = (target, source) => {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  };
  
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    
    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
    
    return flattened;
  };
  
  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });
    
    it('should ignore non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, ['a', 'x', 'y'])).toEqual({ a: 1 });
    });
  });
  
  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 });
    });
    
    it('should handle non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      expect(omit(obj, ['x', 'y'])).toEqual({ a: 1, b: 2 });
    });
  });
  
  describe('isEmpty', () => {
    it('should check empty objects', () => {
      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ a: 1 })).toBe(false);
    });
    
    it('should check empty arrays', () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty([1])).toBe(false);
    });
    
    it('should check empty strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('a')).toBe(false);
    });
    
    it('should check null/undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });
  });
  
  describe('deepMerge', () => {
    it('should merge nested objects', () => {
      const obj1 = { a: 1, b: { c: 2, d: 3 } };
      const obj2 = { b: { d: 4, e: 5 }, f: 6 };
      
      const merged = deepMerge(obj1, obj2);
      
      expect(merged).toEqual({
        a: 1,
        b: { c: 2, d: 4, e: 5 },
        f: 6
      });
    });
    
    it('should handle arrays as values', () => {
      const obj1 = { a: [1, 2] };
      const obj2 = { a: [3, 4] };
      
      const merged = deepMerge(obj1, obj2);
      expect(merged.a).toEqual([3, 4]); // Arrays are replaced, not merged
    });
  });
  
  describe('flattenObject', () => {
    it('should flatten nested objects', () => {
      const nested = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        }
      };
      
      expect(flattenObject(nested)).toEqual({
        'a': 1,
        'b.c': 2,
        'b.d.e': 3
      });
    });
    
    it('should handle arrays in objects', () => {
      const obj = { a: [1, 2, 3], b: { c: [4, 5] } };
      expect(flattenObject(obj)).toEqual({
        'a': [1, 2, 3],
        'b.c': [4, 5]
      });
    });
  });
});