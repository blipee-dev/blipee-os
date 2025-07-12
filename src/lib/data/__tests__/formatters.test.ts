import { describe, it, expect } from '@jest/globals';

describe('Data Formatters', () => {
  // Number formatting
  describe('Number formatting', () => {
    const formatNumber = (num, decimals = 0) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(num);
    };
    
    const formatCompact = (num) => {
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short'
      }).format(num);
    };
    
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(1234.56, 2)).toBe('1,234.56');
    });
    
    it('should format compact numbers', () => {
      expect(formatCompact(1000)).toBe('1K');
      expect(formatCompact(1000000)).toBe('1M');
      expect(formatCompact(1500000)).toBe('1.5M');
    });
  });
  
  // Date formatting
  describe('Date formatting', () => {
    const formatDate = (date, options = {}) => {
      return new Intl.DateTimeFormat('en-US', options).format(date);
    };
    
    const formatRelative = (date) => {
      const now = new Date();
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return days + 'd ago';
      if (hours > 0) return hours + 'h ago';
      if (minutes > 0) return minutes + 'm ago';
      return 'just now';
    };
    
    it('should format dates', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('1/15/2024');
      expect(formatDate(date, { month: 'long', day: 'numeric', year: 'numeric' }))
        .toBe('January 15, 2024');
    });
    
    it('should format relative times', () => {
      const now = new Date();
      expect(formatRelative(now)).toBe('just now');
      
      const hourAgo = new Date(now - 60 * 60 * 1000);
      expect(formatRelative(hourAgo)).toBe('1h ago');
      
      const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
      expect(formatRelative(dayAgo)).toBe('1d ago');
    });
  });
  
  // String formatting
  describe('String formatting', () => {
    const slugify = (str) => {
      return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };
    
    const titleCase = (str) => {
      return str.replace(/\b\w+/g, word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      );
    };
    
    it('should create slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test & Example')).toBe('test-example');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });
    
    it('should convert to title case', () => {
      expect(titleCase('hello world')).toBe('Hello World');
      expect(titleCase('HELLO WORLD')).toBe('Hello World');
      expect(titleCase('hELLo WoRLd')).toBe('Hello World');
    });
  });
});