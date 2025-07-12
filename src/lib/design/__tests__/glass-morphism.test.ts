import {
  glassBase,
  glassSoft,
  glassStrong,
  glassGradient,
  glassClasses,
  glassAnimations,
  gradientTextClasses,
  glowEffects,
} from '../glass-morphism';
import { premiumTheme } from '../theme';

describe('glass-morphism styles', () => {
  describe('glassBase', () => {
    it('should have correct base styles', () => {
      expect(glassBase.backdropFilter).toBe('blur(20px)');
      expect(glassBase.WebkitBackdropFilter).toBe('blur(20px)');
      expect(glassBase.backgroundColor).toBe(premiumTheme.colors.background.glass);
      expect(glassBase.border).toBe(`1px solid ${premiumTheme.colors.background.glassBorder}`);
    });
  });

  describe('glassSoft', () => {
    it('should include all base styles', () => {
      expect(glassSoft.backdropFilter).toBe(glassBase.backdropFilter);
      expect(glassSoft.WebkitBackdropFilter).toBe(glassBase.WebkitBackdropFilter);
      expect(glassSoft.backgroundColor).toBe(glassBase.backgroundColor);
      expect(glassSoft.border).toBe(glassBase.border);
    });

    it('should have soft shadow', () => {
      expect(glassSoft.boxShadow).toBe('0 8px 32px rgba(0, 0, 0, 0.12)');
    });
  });

  describe('glassStrong', () => {
    it('should include base backdrop filters', () => {
      expect(glassStrong.backdropFilter).toBe(glassBase.backdropFilter);
      expect(glassStrong.WebkitBackdropFilter).toBe(glassBase.WebkitBackdropFilter);
    });

    it('should have stronger background and border', () => {
      expect(glassStrong.backgroundColor).toBe('rgba(255, 255, 255, 0.04)');
      expect(glassStrong.border).toBe('1px solid rgba(255, 255, 255, 0.08)');
    });

    it('should have stronger shadow', () => {
      expect(glassStrong.boxShadow).toBe('0 8px 40px rgba(0, 0, 0, 0.2)');
    });
  });

  describe('glassGradient', () => {
    it('should generate correct styles for primary gradient', () => {
      const result = glassGradient('primary');
      expect(result.backdropFilter).toBe(glassBase.backdropFilter);
      expect(result.background).toBe('linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.04) 100%)');
      expect(result.position).toBe('relative');
      expect(result.overflow).toBe('hidden');
      expect(result['&::before'].background).toBe(premiumTheme.colors.gradients.primary);
      expect(result['&::before'].opacity).toBe(0.1);
    });

    it('should generate correct styles for blue gradient', () => {
      const result = glassGradient('blue');
      expect(result['&::before'].background).toBe(premiumTheme.colors.gradients.blue);
    });

    it('should generate correct styles for success gradient', () => {
      const result = glassGradient('success');
      expect(result['&::before'].background).toBe(premiumTheme.colors.gradients.success);
    });

    it('should generate correct styles for coral gradient', () => {
      const result = glassGradient('coral');
      expect(result['&::before'].background).toBe(premiumTheme.colors.gradients.coral);
    });

    it('should generate correct styles for brand gradient', () => {
      const result = glassGradient('brand');
      expect(result['&::before'].background).toBe(premiumTheme.colors.gradients.brand);
    });

    it('should generate correct styles for dark gradient', () => {
      const result = glassGradient('dark');
      expect(result['&::before'].background).toBe(premiumTheme.colors.gradients.dark);
    });

    it('should have correct pseudo-element styles', () => {
      const result = glassGradient('primary');
      expect(result['&::before'].content).toBe('""');
      expect(result['&::before'].position).toBe('absolute');
      expect(result['&::before'].inset).toBe(0);
      expect(result['&::before'].zIndex).toBe(-1);
    });
  });

  describe('glassClasses', () => {
    it('should have correct base classes', () => {
      expect(glassClasses.base).toBe('backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]');
    });

    it('should have correct soft classes', () => {
      expect(glassClasses.soft).toBe('backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.12)]');
    });

    it('should have correct strong classes', () => {
      expect(glassClasses.strong).toBe('backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.2)]');
    });

    it('should have correct hover classes', () => {
      expect(glassClasses.hover).toBe('hover:bg-white/[0.04] hover:border-white/[0.1] hover:shadow-[0_8px_40px_rgba(0,0,0,0.2)]');
    });

    it('should have correct focus classes', () => {
      expect(glassClasses.focus).toBe('focus:border-white/[0.15] focus:shadow-[0_8px_40px_rgba(139,92,246,0.15)]');
    });
  });

  describe('glassAnimations', () => {
    describe('fadeIn animation', () => {
      it('should have correct initial state', () => {
        expect(glassAnimations.fadeIn.initial.opacity).toBe(0);
        expect(glassAnimations.fadeIn.initial.backdropFilter).toBe('blur(0px)');
      });

      it('should have correct animate state', () => {
        expect(glassAnimations.fadeIn.animate.opacity).toBe(1);
        expect(glassAnimations.fadeIn.animate.backdropFilter).toBe('blur(20px)');
      });

      it('should have correct transition', () => {
        expect(glassAnimations.fadeIn.transition.duration).toBe(0.5);
        expect(glassAnimations.fadeIn.transition.ease).toBe('easeOut');
      });
    });

    describe('slideUp animation', () => {
      it('should have correct initial state', () => {
        expect(glassAnimations.slideUp.initial.opacity).toBe(0);
        expect(glassAnimations.slideUp.initial.y).toBe(20);
        expect(glassAnimations.slideUp.initial.backdropFilter).toBe('blur(0px)');
      });

      it('should have correct animate state', () => {
        expect(glassAnimations.slideUp.animate.opacity).toBe(1);
        expect(glassAnimations.slideUp.animate.y).toBe(0);
        expect(glassAnimations.slideUp.animate.backdropFilter).toBe('blur(20px)');
      });

      it('should have correct transition', () => {
        expect(glassAnimations.slideUp.transition.duration).toBe(0.3);
        expect(glassAnimations.slideUp.transition.ease).toBe('easeOut');
      });
    });

    describe('scale animation', () => {
      it('should have correct initial state', () => {
        expect(glassAnimations.scale.initial.opacity).toBe(0);
        expect(glassAnimations.scale.initial.scale).toBe(0.95);
        expect(glassAnimations.scale.initial.backdropFilter).toBe('blur(0px)');
      });

      it('should have correct animate state', () => {
        expect(glassAnimations.scale.animate.opacity).toBe(1);
        expect(glassAnimations.scale.animate.scale).toBe(1);
        expect(glassAnimations.scale.animate.backdropFilter).toBe('blur(20px)');
      });

      it('should have correct transition', () => {
        expect(glassAnimations.scale.transition.duration).toBe(0.3);
        expect(glassAnimations.scale.transition.ease).toBe('easeOut');
      });
    });
  });

  describe('gradientTextClasses', () => {
    it('should have correct primary gradient text classes', () => {
      expect(gradientTextClasses.primary).toBe('bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent');
    });

    it('should have correct blue gradient text classes', () => {
      expect(gradientTextClasses.blue).toBe('bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent');
    });

    it('should have correct success gradient text classes', () => {
      expect(gradientTextClasses.success).toBe('bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent');
    });

    it('should have correct brand gradient text classes', () => {
      expect(gradientTextClasses.brand).toBe('bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent');
    });
  });

  describe('glowEffects', () => {
    it('should have correct purple glow', () => {
      expect(glowEffects.purple).toBe('shadow-[0_0_20px_rgba(139,92,246,0.3)]');
    });

    it('should have correct blue glow', () => {
      expect(glowEffects.blue).toBe('shadow-[0_0_20px_rgba(14,165,233,0.3)]');
    });

    it('should have correct pink glow', () => {
      expect(glowEffects.pink).toBe('shadow-[0_0_20px_rgba(236,72,153,0.3)]');
    });

    it('should have correct brand glow', () => {
      expect(glowEffects.brand).toBe('shadow-[0_0_32px_rgba(139,92,246,0.25)]');
    });
  });

  describe('type checking', () => {
    it('should accept valid gradient types', () => {
      const validTypes: Array<keyof typeof premiumTheme.colors.gradients> = ['primary', 'blue', 'success', 'coral', 'brand', 'dark'];
      validTypes.forEach(type => {
        expect(() => glassGradient(type)).not.toThrow();
      });
    });
  });
});