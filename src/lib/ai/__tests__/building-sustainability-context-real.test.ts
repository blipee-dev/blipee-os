import { describe, it, expect } from '@jest/globals';
import { formatEmissions, getEmissionContext } from '../building-sustainability-context';

describe('Building Sustainability Context Utils', () => {
  describe('formatEmissions', () => {
    it('should format emissions in kg CO2', () => {
      expect(formatEmissions(100)).toBe('100 kg CO2');
      expect(formatEmissions(1500)).toBe('1,500 kg CO2');
      expect(formatEmissions(0)).toBe('0 kg CO2');
    });

    it('should handle decimal values', () => {
      expect(formatEmissions(123.456)).toBe('123.46 kg CO2');
      expect(formatEmissions(0.1)).toBe('0.1 kg CO2');
    });

    it('should handle negative values', () => {
      expect(formatEmissions(-100)).toBe('-100 kg CO2');
    });
  });

  describe('getEmissionContext', () => {
    it('should provide context for emissions', () => {
      const lowContext = getEmissionContext(50);
      expect(lowContext).toContain('low');
      
      const medContext = getEmissionContext(500);
      expect(medContext).toContain('moderate');
      
      const highContext = getEmissionContext(5000);
      expect(highContext).toContain('high');
    });

    it('should handle edge cases', () => {
      expect(getEmissionContext(0)).toBeDefined();
      expect(getEmissionContext(-100)).toBeDefined();
      expect(getEmissionContext(999999)).toBeDefined();
    });
  });
});