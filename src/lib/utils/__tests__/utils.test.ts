import { cn } from '../../utils';

describe('utils', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toBe('base-class additional-class');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', {
        'active': true,
        'disabled': false
      });
      expect(result).toBe('base active');
    });

    it('should handle arrays', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });

    it('should handle empty strings', () => {
      const result = cn('', 'class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should return empty string for no valid inputs', () => {
      const result = cn(undefined, null, false, '');
      expect(result).toBe('');
    });
  });
});