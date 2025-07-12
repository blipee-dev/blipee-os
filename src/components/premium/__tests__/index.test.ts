import { GlassCard, GradientButton } from '../index';

describe('Premium components index', () => {
  it('should export GlassCard component', () => {
    expect(GlassCard).toBeDefined();
    expect(typeof GlassCard).toBe('function');
  });

  it('should export GradientButton component', () => {
    expect(GradientButton).toBeDefined();
    expect(typeof GradientButton).toBe('function');
  });

  it('should export all expected components', () => {
    const exports = { GlassCard, GradientButton };
    expect(Object.keys(exports)).toHaveLength(2);
    expect(Object.keys(exports)).toContain('GlassCard');
    expect(Object.keys(exports)).toContain('GradientButton');
  });
});