import { cn } from '../utils';

describe('cn (classname utility)', () => {
  it('should merge single class string', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('should merge multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('should handle null values', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('should handle false values', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar');
  });

  it('should handle true with class string', () => {
    expect(cn('foo', true && 'bar')).toBe('foo bar');
  });

  it('should handle false with class string', () => {
    expect(cn('foo', false && 'bar')).toBe('foo');
  });

  it('should handle empty strings', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle nested arrays', () => {
    expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle conflicting Tailwind classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should preserve important modifiers', () => {
    expect(cn('!font-bold', 'font-normal')).toBe('!font-bold font-normal');
  });

  it('should handle arbitrary values', () => {
    expect(cn('bg-[#1234]', 'bg-[#5678]')).toBe('bg-[#5678]');
  });

  it('should handle complex class combinations', () => {
    expect(
      cn(
        'bg-white text-black',
        'hover:bg-gray-100',
        'focus:outline-none',
        'disabled:opacity-50'
      )
    ).toBe('bg-white text-black hover:bg-gray-100 focus:outline-none disabled:opacity-50');
  });

  it('should handle responsive classes', () => {
    expect(cn('sm:px-2 md:px-4', 'lg:px-6')).toBe('sm:px-2 md:px-4 lg:px-6');
  });

  it('should handle duplicate classes', () => {
    // cn doesn't deduplicate by default, it passes through to clsx
    const result = cn('foo foo bar bar');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('should handle mixed input types', () => {
    expect(
      cn(
        'base-class',
        ['array-class'],
        { 'object-class': true },
        undefined,
        null,
        false,
        ''
      )
    ).toBe('base-class array-class object-class');
  });

  it('should return empty string for no valid inputs', () => {
    expect(cn()).toBe('');
    expect(cn(undefined, null, false)).toBe('');
  });

  it('should handle number values', () => {
    expect(cn('foo', 0, 'bar')).toBe('foo bar');
    expect(cn('foo', 1 && 'baz', 'bar')).toBe('foo baz bar');
  });

  it('should handle deeply nested structures', () => {
    expect(
      cn([
        'foo',
        ['bar', { baz: true, qux: false }],
        [[['deeply'], 'nested'], 'array']
      ])
    ).toBe('foo bar baz deeply nested array');
  });

  it('should handle variant group syntax', () => {
    expect(cn('hover:(bg-gray-100 text-black)', 'focus:ring-2')).toBe('hover:(bg-gray-100 text-black) focus:ring-2');
  });

  it('should handle modifiers with arbitrary values', () => {
    expect(cn('hover:bg-[#123456]', 'focus:bg-[#654321]')).toBe('hover:bg-[#123456] focus:bg-[#654321]');
  });

  it('should preserve custom CSS properties', () => {
    expect(cn('[--custom-prop:value]', 'other-class')).toBe('[--custom-prop:value] other-class');
  });

  it('should handle edge case with only falsy values', () => {
    expect(cn(false, null, undefined, '', 0)).toBe('');
  });

  it('should handle very long class strings', () => {
    const longClass = 'a'.repeat(1000);
    expect(cn(longClass)).toBe(longClass);
  });

  it('should handle special characters in class names', () => {
    expect(cn('class-with-dash', 'class_with_underscore', 'class.with.dot')).toBe('class-with-dash class_with_underscore class.with.dot');
  });
});