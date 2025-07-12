import { describe, it, expect } from '@jest/globals';
import { cn } from '../utils';

describe('Utils - cn (className utility)', () => {
  it('should combine class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('px-2 py-1', 'p-3')).toBe('p-3');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
    expect(cn('base', { active: false, disabled: true })).toBe('base disabled');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn(['base', null, undefined, 'end'])).toBe('base end');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null)).toBe('');
    expect(cn(undefined)).toBe('');
  });

  it('should merge Tailwind classes properly', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });
});