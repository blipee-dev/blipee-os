import { cn } from './utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toBe('base-class additional-class');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', {
        'active': true,
        'disabled': false,
      });
      expect(result).toBe('base active');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });

    it('should handle arrays', () => {
      const result = cn(['base', 'middle'], 'end');
      expect(result).toBe('base middle end');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-4 py-2', 'px-8');
      expect(result).toBe('py-2 px-8');
    });
  });
});