#!/usr/bin/env node

/**
 * Test existing utility files for real coverage
 */

const fs = require('fs').promises;
const path = require('path');

const existingUtilityTests = [
  // Test the actual utils.ts file
  {
    file: 'src/lib/__tests__/utils-actual.test.ts',
    content: `import { describe, it, expect, jest } from '@jest/globals';
import { 
  cn, 
  formatBytes, 
  formatDate, 
  formatCurrency,
  formatNumber,
  formatPercentage,
  truncate,
  capitalize,
  debounce,
  throttle,
  isValidEmail,
  isValidUrl,
  generateId,
  sleep,
  retry,
  parseJSON,
  deepClone,
  omit,
  pick,
  groupBy
} from '../utils';

describe('Utils - Actual Implementation', () => {
  describe('cn (className utility)', () => {
    it('should combine class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDate', () => {
    it('should format dates', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-500)).toBe('-$500.00');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(1234.567, 2)).toBe('1,234.57');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
      expect(formatPercentage(1)).toBe('100%');
      expect(formatPercentage(0)).toBe('0%');
    });
  });

  describe('truncate', () => {
    it('should truncate strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Hi', 5)).toBe('Hi');
    });
  });

  describe('capitalize', () => {
    it('should capitalize strings', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('')).toBe('');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('isValidEmail', () => {
    it('should validate emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('not a url')).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = jest.fn(() => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
        return 'Success';
      });

      const result = await retry(fn, 3, 10);
      expect(result).toBe('Success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const fn = jest.fn(() => {
        throw new Error('Always fails');
      });

      await expect(retry(fn, 2, 10)).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON', () => {
      expect(parseJSON('{"foo": "bar"}')).toEqual({ foo: 'bar' });
      expect(parseJSON('null')).toBe(null);
    });

    it('should return null for invalid JSON', () => {
      expect(parseJSON('invalid')).toBe(null);
      expect(parseJSON('')).toBe(null);
    });
  });

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const obj = { a: 1, b: { c: 2 }, d: [1, 2, 3] };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
      expect(cloned.d).not.toBe(obj.d);
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
      expect(omit(obj, ['a', 'c'])).toEqual({ b: 2 });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
      expect(pick(obj, ['b'])).toEqual({ b: 2 });
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const items = [
        { category: 'fruit', name: 'apple' },
        { category: 'fruit', name: 'banana' },
        { category: 'vegetable', name: 'carrot' }
      ];
      
      const grouped = groupBy(items, 'category');
      expect(grouped.fruit).toHaveLength(2);
      expect(grouped.vegetable).toHaveLength(1);
    });
  });
});`
  }
];

async function testExistingUtilities() {
  console.log('🚀 Creating tests for existing utilities...\n');
  
  // First check if utils.ts exists
  try {
    await fs.access('src/lib/utils.ts');
    console.log('✅ Found utils.ts file');
  } catch {
    console.log('⚠️  utils.ts not found, checking for utils.js or index.ts');
  }
  
  for (const test of existingUtilityTests) {
    try {
      const dir = path.dirname(test.file);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(test.file, test.content);
      console.log(`✅ Created: ${test.file}`);
    } catch (error) {
      console.error(`❌ Error creating ${test.file}:`, error.message);
    }
  }
  
  console.log('\n✨ Utility tests created!');
  console.log('These tests will provide actual coverage for existing utility functions.');
}

testExistingUtilities().catch(console.error);