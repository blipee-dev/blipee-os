/**
 * Simple test to verify Stream C testing framework works
 */

import { IndustryClassification } from '../types';

describe('Simple Stream C Test', () => {
  it('should import types correctly', () => {
    expect(IndustryClassification.MANUFACTURING).toBe('manufacturing');
    expect(IndustryClassification.TECHNOLOGY).toBe('technology');
    expect(IndustryClassification.OIL_AND_GAS).toBe('oil_and_gas');
  });

  it('should perform basic calculations', () => {
    const data = {
      emissions: 1000,
      efficiency: 0.8
    };

    const score = (data.efficiency * 100) - (data.emissions / 100);
    expect(score).toBe(70);
  });

  it('should handle arrays properly', () => {
    const industries = [
      IndustryClassification.MANUFACTURING,
      IndustryClassification.TECHNOLOGY,
      IndustryClassification.CONSTRUCTION
    ];

    expect(industries.length).toBe(3);
    expect(industries).toContain(IndustryClassification.MANUFACTURING);
  });
});