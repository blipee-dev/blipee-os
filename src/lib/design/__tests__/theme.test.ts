import { describe, it, expect } from '@jest/globals';
import { premiumTheme, glassmorphism, gradientText } from '../theme';

describe('Premium Theme', () => {
  describe('Colors', () => {
    it('should have correct background colors', () => {
      expect(premiumTheme.colors.background.primary).toBe('#0A0A0A');
      expect(premiumTheme.colors.background.secondary).toBe('#111111');
      expect(premiumTheme.colors.background.glass).toBe('rgba(255, 255, 255, 0.02)');
      expect(premiumTheme.colors.background.glassBorder).toBe('rgba(255, 255, 255, 0.05)');
    });

    it('should have correct text colors', () => {
      expect(premiumTheme.colors.text.primary).toBe('#FFFFFF');
      expect(premiumTheme.colors.text.secondary).toBe('#94A3B8');
      expect(premiumTheme.colors.text.tertiary).toBe('#64748B');
    });

    it('should have correct brand colors', () => {
      expect(premiumTheme.colors.brand.purple).toBe('#8B5CF6');
      expect(premiumTheme.colors.brand.blue).toBe('#0EA5E9');
      expect(premiumTheme.colors.brand.green).toBe('#10B981');
      expect(premiumTheme.colors.brand.orange).toBe('#F59E0B');
      expect(premiumTheme.colors.brand.pink).toBe('#EC4899');
      expect(premiumTheme.colors.brand.red).toBe('#EF4444');
    });

    it('should have correct gradients', () => {
      expect(premiumTheme.colors.gradients.primary).toBe('linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)');
      expect(premiumTheme.colors.gradients.blue).toBe('linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)');
      expect(premiumTheme.colors.gradients.success).toBe('linear-gradient(135deg, #10B981 0%, #059669 100%)');
      expect(premiumTheme.colors.gradients.coral).toBe('linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)');
      expect(premiumTheme.colors.gradients.brand).toBe('linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)');
      expect(premiumTheme.colors.gradients.dark).toBe('linear-gradient(135deg, #1e293b 0%, #0f172a 100%)');
    });

    it('should have correct status colors', () => {
      expect(premiumTheme.colors.status.success).toBe('#10B981');
      expect(premiumTheme.colors.status.successBg).toBe('rgba(16, 185, 129, 0.1)');
      expect(premiumTheme.colors.status.error).toBe('#EF4444');
      expect(premiumTheme.colors.status.errorBg).toBe('rgba(239, 68, 68, 0.1)');
      expect(premiumTheme.colors.status.warning).toBe('#F59E0B');
      expect(premiumTheme.colors.status.warningBg).toBe('rgba(245, 158, 11, 0.1)');
      expect(premiumTheme.colors.status.info).toBe('#0EA5E9');
      expect(premiumTheme.colors.status.infoBg).toBe('rgba(14, 165, 233, 0.1)');
    });
  });

  describe('Border Radius', () => {
    it('should have correct border radius values', () => {
      expect(premiumTheme.borderRadius.xs).toBe('0.375rem');
      expect(premiumTheme.borderRadius.sm).toBe('0.5rem');
      expect(premiumTheme.borderRadius.md).toBe('0.75rem');
      expect(premiumTheme.borderRadius.lg).toBe('1rem');
      expect(premiumTheme.borderRadius.xl).toBe('1.5rem');
      expect(premiumTheme.borderRadius.pill).toBe('9999px');
    });
  });

  describe('Shadows', () => {
    it('should have correct shadow values', () => {
      expect(premiumTheme.shadows.sm).toBe('0 2px 8px rgba(0, 0, 0, 0.1)');
      expect(premiumTheme.shadows.md).toBe('0 4px 16px rgba(0, 0, 0, 0.15)');
      expect(premiumTheme.shadows.lg).toBe('0 8px 32px rgba(0, 0, 0, 0.2)');
      expect(premiumTheme.shadows.glow).toBe('0 0 32px rgba(139, 92, 246, 0.25)');
    });
  });

  describe('Transitions', () => {
    it('should have correct transition values', () => {
      expect(premiumTheme.transitions.fast).toBe('150ms cubic-bezier(0.4, 0, 0.2, 1)');
      expect(premiumTheme.transitions.base).toBe('300ms cubic-bezier(0.4, 0, 0.2, 1)');
      expect(premiumTheme.transitions.slow).toBe('500ms cubic-bezier(0.4, 0, 0.2, 1)');
    });
  });

  describe('Typography', () => {
    it('should have correct display large typography', () => {
      expect(premiumTheme.typography.sizes.displayLarge).toEqual({
        size: '3.5rem',
        weight: 700,
        lineHeight: 1.1,
        letterSpacing: '-0.02em'
      });
    });

    it('should have correct display medium typography', () => {
      expect(premiumTheme.typography.sizes.displayMedium).toEqual({
        size: '2.5rem',
        weight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.01em'
      });
    });

    it('should have correct heading typography', () => {
      expect(premiumTheme.typography.sizes.h1).toEqual({
        size: '2rem',
        weight: 600,
        lineHeight: 1.3
      });
      expect(premiumTheme.typography.sizes.h2).toEqual({
        size: '1.5rem',
        weight: 600,
        lineHeight: 1.4
      });
      expect(premiumTheme.typography.sizes.h3).toEqual({
        size: '1.25rem',
        weight: 600,
        lineHeight: 1.5
      });
    });

    it('should have correct body typography', () => {
      expect(premiumTheme.typography.sizes.body).toEqual({
        size: '1rem',
        weight: 400,
        lineHeight: 1.6
      });
      expect(premiumTheme.typography.sizes.small).toEqual({
        size: '0.875rem',
        weight: 400,
        lineHeight: 1.5
      });
    });
  });

  describe('Animations', () => {
    it('should have fadeIn animation', () => {
      expect(premiumTheme.animations.fadeIn).toContain('@keyframes fadeIn');
      expect(premiumTheme.animations.fadeIn).toContain('from { opacity: 0; }');
      expect(premiumTheme.animations.fadeIn).toContain('to { opacity: 1; }');
    });

    it('should have fadeInUp animation', () => {
      expect(premiumTheme.animations.fadeInUp).toContain('@keyframes fadeInUp');
      expect(premiumTheme.animations.fadeInUp).toContain('opacity: 0');
      expect(premiumTheme.animations.fadeInUp).toContain('transform: translateY(20px)');
    });

    it('should have slideIn animation', () => {
      expect(premiumTheme.animations.slideIn).toContain('@keyframes slideIn');
      expect(premiumTheme.animations.slideIn).toContain('transform: translateX(-100%)');
      expect(premiumTheme.animations.slideIn).toContain('transform: translateX(0)');
    });

    it('should have pulse animation', () => {
      expect(premiumTheme.animations.pulse).toContain('@keyframes pulse');
      expect(premiumTheme.animations.pulse).toContain('opacity: 1');
      expect(premiumTheme.animations.pulse).toContain('opacity: 0.5');
    });
  });
});

describe('Glassmorphism', () => {
  it('should have correct glassmorphism properties', () => {
    expect(glassmorphism.background).toBe('rgba(255, 255, 255, 0.02)');
    expect(glassmorphism.backdropFilter).toBe('blur(20px)');
    expect(glassmorphism.WebkitBackdropFilter).toBe('blur(20px)');
    expect(glassmorphism.border).toBe('1px solid rgba(255, 255, 255, 0.05)');
    expect(glassmorphism.boxShadow).toBe('0 4px 16px rgba(0, 0, 0, 0.15)');
  });

  it('should reference theme values correctly', () => {
    expect(glassmorphism.background).toBe(premiumTheme.colors.background.glass);
    expect(glassmorphism.border).toContain(premiumTheme.colors.background.glassBorder);
    expect(glassmorphism.boxShadow).toBe(premiumTheme.shadows.md);
  });
});

describe('Gradient Text', () => {
  it('should generate correct gradient text styles', () => {
    const gradient = 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)';
    const result = gradientText(gradient);
    
    expect(result).toEqual({
      background: gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    });
  });

  it('should work with theme gradients', () => {
    const result = gradientText(premiumTheme.colors.gradients.primary);
    
    expect(result.background).toBe(premiumTheme.colors.gradients.primary);
    expect(result.WebkitBackgroundClip).toBe('text');
    expect(result.WebkitTextFillColor).toBe('transparent');
    expect(result.backgroundClip).toBe('text');
  });

  it('should work with custom gradients', () => {
    const customGradient = 'linear-gradient(90deg, #FF0000 0%, #00FF00 100%)';
    const result = gradientText(customGradient);
    
    expect(result.background).toBe(customGradient);
  });
});

describe('Theme Completeness', () => {
  it('should have all required color properties', () => {
    expect(premiumTheme.colors).toHaveProperty('background');
    expect(premiumTheme.colors).toHaveProperty('text');
    expect(premiumTheme.colors).toHaveProperty('brand');
    expect(premiumTheme.colors).toHaveProperty('gradients');
    expect(premiumTheme.colors).toHaveProperty('status');
  });

  it('should have all required style properties', () => {
    expect(premiumTheme).toHaveProperty('borderRadius');
    expect(premiumTheme).toHaveProperty('shadows');
    expect(premiumTheme).toHaveProperty('transitions');
    expect(premiumTheme).toHaveProperty('typography');
    expect(premiumTheme).toHaveProperty('animations');
  });

  it('should have consistent color format', () => {
    // Check hex colors
    expect(premiumTheme.colors.background.primary).toMatch(/^#[0-9A-F]{6}$/i);
    expect(premiumTheme.colors.brand.purple).toMatch(/^#[0-9A-F]{6}$/i);
    
    // Check rgba colors
    expect(premiumTheme.colors.background.glass).toMatch(/^rgba\(/);
    expect(premiumTheme.colors.status.successBg).toMatch(/^rgba\(/);
    
    // Check gradients
    expect(premiumTheme.colors.gradients.primary).toMatch(/^linear-gradient\(/);
  });
});