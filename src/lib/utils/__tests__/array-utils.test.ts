import { describe, it, expect } from '@jest/globals';

describe('Array Utilities', () => {
  // Array helper functions
  const groupBy = (array, key) => {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  };
  
  const sortBy = (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  };
  
  const unique = (array, key) => {
    if (!key) return [...new Set(array)];
    
    const seen = new Set();
    return array.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  };
  
  const partition = (array, predicate) => {
    const pass = [];
    const fail = [];
    
    array.forEach(item => {
      if (predicate(item)) {
        pass.push(item);
      } else {
        fail.push(item);
      }
    });
    
    return [pass, fail];
  };
  
  const pluck = (array, key) => {
    return array.map(item => item[key]);
  };
  
  describe('groupBy', () => {
    it('should group array by key', () => {
      const users = [
        { name: 'Alice', role: 'admin' },
        { name: 'Bob', role: 'user' },
        { name: 'Charlie', role: 'admin' },
        { name: 'David', role: 'user' }
      ];
      
      const grouped = groupBy(users, 'role');
      
      expect(grouped.admin).toHaveLength(2);
      expect(grouped.user).toHaveLength(2);
      expect(grouped.admin[0].name).toBe('Alice');
    });
    
    it('should handle empty arrays', () => {
      expect(groupBy([], 'key')).toEqual({});
    });
  });
  
  describe('sortBy', () => {
    it('should sort by key ascending', () => {
      const items = [
        { id: 3, name: 'C' },
        { id: 1, name: 'A' },
        { id: 2, name: 'B' }
      ];
      
      const sorted = sortBy(items, 'id');
      expect(sorted[0].id).toBe(1);
      expect(sorted[2].id).toBe(3);
    });
    
    it('should sort by key descending', () => {
      const items = [{ value: 1 }, { value: 3 }, { value: 2 }];
      const sorted = sortBy(items, 'value', 'desc');
      
      expect(sorted[0].value).toBe(3);
      expect(sorted[2].value).toBe(1);
    });
  });
  
  describe('unique', () => {
    it('should get unique primitive values', () => {
      const numbers = [1, 2, 2, 3, 3, 3, 4];
      expect(unique(numbers)).toEqual([1, 2, 3, 4]);
    });
    
    it('should get unique by object key', () => {
      const items = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 1, name: 'C' },
        { id: 3, name: 'D' }
      ];
      
      const uniqueItems = unique(items, 'id');
      expect(uniqueItems).toHaveLength(3);
      expect(uniqueItems[0].name).toBe('A'); // First occurrence kept
    });
  });
  
  describe('partition', () => {
    it('should partition array by predicate', () => {
      const numbers = [1, 2, 3, 4, 5, 6];
      const [even, odd] = partition(numbers, n => n % 2 === 0);
      
      expect(even).toEqual([2, 4, 6]);
      expect(odd).toEqual([1, 3, 5]);
    });
  });
  
  describe('pluck', () => {
    it('should extract values by key', () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];
      
      expect(pluck(users, 'name')).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(pluck(users, 'id')).toEqual([1, 2, 3]);
    });
  });
});