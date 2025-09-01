/**
 * Branding Manager Test Suite
 * Tests for white-label branding and customization features
 */

import { jest } from '@jest/globals';
import { BrandingManager } from '../branding-manager';
import { 
  BrandConfig, 
  ThemeConfig, 
  ComponentOverride,
  BrandAsset,
  BrandPreset
} from '../branding-manager';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

describe('BrandingManager', () => {
  let brandingManager: BrandingManager;

  beforeEach(() => {
    jest.clearAllMocks();
    brandingManager = new BrandingManager();
  });

  describe('Brand Configuration', () => {
    it('should create complete brand configuration', async () => {
      const brandConfig: BrandConfig = {
        id: 'brand-001',
        name: 'Acme Corporation',
        domain: 'acme.blipee.com',
        theme: {
          colors: {
            primary: '#1E40AF',
            secondary: '#7C3AED',
            accent: '#F59E0B',
            background: '#0F172A',
            surface: '#1E293B',
            text: {
              primary: '#F8FAFC',
              secondary: '#CBD5E1',
              muted: '#64748B'
            },
            status: {
              success: '#10B981',
              warning: '#F59E0B',
              error: '#EF4444',
              info: '#3B82F6'
            }
          },
          typography: {
            fontFamily: {
              sans: 'Inter, sans-serif',
              mono: 'JetBrains Mono, monospace'
            },
            fontSizes: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem',
              '4xl': '2.25rem'
            },
            fontWeights: {
              light: 300,
              regular: 400,
              medium: 500,
              semibold: 600,
              bold: 700
            }
          },
          spacing: {
            unit: 4,
            scale: [0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64]
          },
          borderRadius: {
            none: '0',
            sm: '0.125rem',
            base: '0.25rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            full: '9999px'
          },
          shadows: {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }
        },
        assets: {
          logo: {
            light: '/brands/acme/logo-light.svg',
            dark: '/brands/acme/logo-dark.svg',
            favicon: '/brands/acme/favicon.ico'
          },
          images: {
            hero: '/brands/acme/hero.jpg',
            background: '/brands/acme/bg-pattern.svg'
          }
        },
        metadata: {
          title: 'Acme Sustainability Platform',
          description: 'Leading the way in sustainable business',
          keywords: ['sustainability', 'ESG', 'carbon', 'acme'],
          ogImage: '/brands/acme/og-image.jpg'
        }
      };

      const created = await brandingManager.createBrand(brandConfig);
      
      expect(created).toHaveProperty('id');
      expect(created).toHaveProperty('status', 'active');
      expect(created).toHaveProperty('createdAt');
      expect(created).toHaveProperty('cssVariables');
      expect(created.cssVariables).toContain('--color-primary: #1E40AF');
    });

    it('should validate brand configuration', async () => {
      const validation = await brandingManager.validateBrandConfig({
        colors: {
          primary: '#GGGGGG', // Invalid hex
          secondary: 'rgb(256, 256, 256)' // Out of range
        },
        domain: 'invalid domain', // Invalid format
        logo: {
          light: 'not-a-url' // Invalid URL
        }
      });

      expect(validation).toHaveProperty('valid', false);
      expect(validation).toHaveProperty('errors');
      expect(validation.errors).toContain('Invalid color format for primary');
      expect(validation.errors).toContain('Invalid domain format');
      expect(validation.errors).toContain('Invalid URL for logo.light');
    });

    it('should support brand presets', async () => {
      const presets = await brandingManager.getPresets();
      
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
      
      const modernTech = presets.find(p => p.name === 'Modern Tech');
      expect(modernTech).toBeDefined();
      expect(modernTech).toHaveProperty('theme');
      expect(modernTech).toHaveProperty('preview');
      expect(modernTech).toHaveProperty('recommended', ['technology', 'startup']);
    });

    it('should apply brand preset with customizations', async () => {
      const customized = await brandingManager.applyPreset('modern-tech', {
        overrides: {
          colors: {
            primary: '#0891B2' // Override primary color
          },
          metadata: {
            title: 'Custom Tech Platform'
          }
        }
      });

      expect(customized.theme.colors.primary).toBe('#0891B2');
      expect(customized.theme.colors.secondary).toBe('#7C3AED'); // From preset
      expect(customized.metadata.title).toBe('Custom Tech Platform');
    });
  });

  describe('Theme Management', () => {
    it('should generate CSS variables from theme', async () => {
      const theme: ThemeConfig = {
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          background: '#FFFFFF',
          text: {
            primary: '#111827',
            secondary: '#6B7280'
          }
        }
      };

      const css = await brandingManager.generateCSSVariables(theme);
      
      expect(css).toContain(':root {');
      expect(css).toContain('--color-primary: #3B82F6;');
      expect(css).toContain('--color-text-primary: #111827;');
      expect(css).toContain('--color-primary-rgb: 59, 130, 246;'); // For opacity
    });

    it('should support dark mode theming', async () => {
      const darkTheme = await brandingManager.generateDarkTheme({
        basedOn: 'brand-001',
        adjustments: {
          backgroundLightness: -80,
          textLightness: 90,
          preserveAccents: true
        }
      });

      expect(darkTheme).toHaveProperty('colors');
      expect(darkTheme.colors.background).toMatch(/^#[0-9A-F]{6}$/i);
      expect(darkTheme.colors.text.primary).toMatch(/^#[0-9A-F]{6}$/i);
      
      // Verify contrast ratios
      const contrast = await brandingManager.checkContrast(
        darkTheme.colors.text.primary,
        darkTheme.colors.background
      );
      expect(contrast.ratio).toBeGreaterThan(4.5); // WCAG AA
    });

    it('should validate accessibility compliance', async () => {
      const accessibility = await brandingManager.checkAccessibility('brand-001');
      
      expect(accessibility).toHaveProperty('colorContrast');
      expect(accessibility.colorContrast).toHaveProperty('passed');
      expect(accessibility.colorContrast).toHaveProperty('issues');
      
      expect(accessibility).toHaveProperty('readability');
      expect(accessibility).toHaveProperty('wcagCompliance');
      expect(accessibility.wcagCompliance).toHaveProperty('level'); // 'A', 'AA', 'AAA'
    });

    it('should generate theme variations', async () => {
      const variations = await brandingManager.generateThemeVariations('brand-001', {
        types: ['monochromatic', 'complementary', 'triadic', 'analogous']
      });

      expect(variations).toHaveProperty('monochromatic');
      expect(variations.monochromatic).toHaveLength(5); // 5 shades
      
      expect(variations).toHaveProperty('complementary');
      expect(variations.complementary).toHaveProperty('primary');
      expect(variations.complementary).toHaveProperty('complement');
    });
  });

  describe('Component Customization', () => {
    it('should override component styles', async () => {
      const overrides: ComponentOverride[] = [
        {
          component: 'Button',
          variant: 'primary',
          styles: {
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 24px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            ':hover': {
              backgroundColor: 'var(--color-primary-dark)',
              transform: 'translateY(-1px)'
            }
          }
        },
        {
          component: 'Card',
          styles: {
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-border)'
          }
        }
      ];

      const applied = await brandingManager.applyComponentOverrides('brand-001', overrides);
      
      expect(applied).toHaveProperty('stylesheet');
      expect(applied.stylesheet).toContain('.btn-primary');
      expect(applied.stylesheet).toContain('background-color: var(--color-primary)');
      expect(applied).toHaveProperty('components', 2);
    });

    it('should support component variants', async () => {
      const variants = await brandingManager.createComponentVariants('Button', {
        baseStyles: {
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 500
        },
        variants: {
          primary: {
            backgroundColor: 'var(--color-primary)',
            color: 'white'
          },
          secondary: {
            backgroundColor: 'transparent',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-primary)'
          },
          ghost: {
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)'
          }
        },
        sizes: {
          sm: { padding: '4px 8px', fontSize: '14px' },
          md: { padding: '8px 16px', fontSize: '16px' },
          lg: { padding: '12px 24px', fontSize: '18px' }
        }
      });

      expect(variants).toHaveProperty('css');
      expect(variants.css).toContain('.btn-primary');
      expect(variants.css).toContain('.btn-sm');
      expect(variants).toHaveProperty('classNames');
    });

    it('should generate responsive styles', async () => {
      const responsive = await brandingManager.generateResponsiveStyles({
        component: 'Container',
        breakpoints: {
          sm: { maxWidth: '640px' },
          md: { maxWidth: '768px' },
          lg: { maxWidth: '1024px' },
          xl: { maxWidth: '1280px' },
          '2xl': { maxWidth: '1536px' }
        },
        styles: {
          width: '100%',
          marginX: 'auto',
          paddingX: {
            base: '16px',
            md: '24px',
            lg: '32px'
          }
        }
      });

      expect(responsive).toContain('@media (min-width: 768px)');
      expect(responsive).toContain('padding-left: 24px');
      expect(responsive).toContain('padding-right: 24px');
    });
  });

  describe('Asset Management', () => {
    it('should upload and process brand assets', async () => {
      const assets: BrandAsset[] = [
        {
          type: 'logo',
          file: new File([''], 'logo.svg', { type: 'image/svg+xml' }),
          variants: ['light', 'dark']
        },
        {
          type: 'favicon',
          file: new File([''], 'favicon.png', { type: 'image/png' })
        }
      ];

      const uploaded = await brandingManager.uploadAssets('brand-001', assets);
      
      expect(uploaded).toHaveLength(2);
      uploaded.forEach(asset => {
        expect(asset).toHaveProperty('id');
        expect(asset).toHaveProperty('url');
        expect(asset).toHaveProperty('type');
        expect(asset).toHaveProperty('optimized', true);
      });
    });

    it('should optimize images for web', async () => {
      const optimization = await brandingManager.optimizeImage({
        source: '/brands/original/hero.jpg',
        formats: ['webp', 'avif'],
        sizes: [640, 768, 1024, 1280, 1920],
        quality: 85
      });

      expect(optimization).toHaveProperty('formats');
      expect(optimization.formats).toHaveProperty('webp');
      expect(optimization.formats).toHaveProperty('avif');
      
      expect(optimization).toHaveProperty('srcset');
      expect(optimization.srcset).toContain('640w');
      expect(optimization.srcset).toContain('1920w');
      
      expect(optimization).toHaveProperty('savings');
      expect(optimization.savings.percentage).toBeGreaterThan(30);
    });

    it('should generate favicon set', async () => {
      const faviconSet = await brandingManager.generateFavicons({
        source: '/brands/logo.svg',
        sizes: [16, 32, 48, 180, 192, 512],
        formats: ['ico', 'png', 'svg']
      });

      expect(faviconSet).toHaveProperty('icons');
      expect(faviconSet.icons).toHaveLength(6);
      
      expect(faviconSet).toHaveProperty('manifest');
      expect(faviconSet.manifest).toHaveProperty('icons');
      
      expect(faviconSet).toHaveProperty('html');
      expect(faviconSet.html).toContain('<link rel="icon"');
      expect(faviconSet.html).toContain('apple-touch-icon');
    });
  });

  describe('Email Template Customization', () => {
    it('should customize email templates', async () => {
      const emailBranding = await brandingManager.customizeEmailTemplates('brand-001', {
        header: {
          logo: { url: '/brands/acme/logo.png', width: 200 },
          backgroundColor: 'var(--color-primary)'
        },
        footer: {
          text: '© 2024 Acme Corporation. All rights reserved.',
          links: [
            { text: 'Privacy Policy', url: 'https://acme.com/privacy' },
            { text: 'Terms of Service', url: 'https://acme.com/terms' }
          ],
          social: [
            { platform: 'twitter', url: 'https://twitter.com/acme' },
            { platform: 'linkedin', url: 'https://linkedin.com/company/acme' }
          ]
        },
        styles: {
          primaryColor: '#3B82F6',
          fontFamily: 'Arial, sans-serif',
          buttonStyle: {
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '12px 24px'
          }
        }
      });

      expect(emailBranding).toHaveProperty('templates');
      expect(emailBranding.templates).toHaveProperty('welcome');
      expect(emailBranding.templates).toHaveProperty('passwordReset');
      expect(emailBranding.templates).toHaveProperty('notification');
      
      expect(emailBranding).toHaveProperty('preview');
      expect(emailBranding.preview).toContain('Acme Corporation');
    });

    it('should generate email CSS inlining', async () => {
      const inlined = await brandingManager.inlineEmailStyles({
        template: '<div class="header">Welcome</div>',
        styles: '.header { background-color: #3B82F6; color: white; }'
      });

      expect(inlined).toContain('style="background-color: #3B82F6; color: white;"');
      expect(inlined).not.toContain('class="header"'); // Classes removed after inlining
    });
  });

  describe('Multi-tenant Support', () => {
    it('should manage multiple brands', async () => {
      const brands = [
        { id: 'brand-001', name: 'Acme Corp', domain: 'acme.blipee.com' },
        { id: 'brand-002', name: 'TechCo', domain: 'techco.blipee.com' },
        { id: 'brand-003', name: 'EcoInc', domain: 'ecoinc.blipee.com' }
      ];

      for (const brand of brands) {
        await brandingManager.createBrand(brand);
      }

      const allBrands = await brandingManager.getAllBrands();
      expect(allBrands).toHaveLength(3);
      
      const acme = await brandingManager.getBrandByDomain('acme.blipee.com');
      expect(acme).toHaveProperty('id', 'brand-001');
    });

    it('should isolate brand configurations', async () => {
      const isolation = await brandingManager.verifyBrandIsolation([
        'brand-001',
        'brand-002'
      ]);

      expect(isolation).toHaveProperty('isolated', true);
      expect(isolation).toHaveProperty('conflicts', []);
      expect(isolation).toHaveProperty('sharedResources', []);
    });

    it('should support brand inheritance', async () => {
      const childBrand = await brandingManager.createChildBrand({
        parentId: 'brand-001',
        name: 'Acme Subsidiary',
        domain: 'subsidiary.acme.blipee.com',
        overrides: {
          colors: {
            primary: '#10B981' // Different primary color
          }
        }
      });

      expect(childBrand).toHaveProperty('parentId', 'brand-001');
      expect(childBrand.theme.colors.primary).toBe('#10B981');
      expect(childBrand.theme.colors.secondary).toBe('#7C3AED'); // Inherited
    });
  });

  describe('Preview and Testing', () => {
    it('should generate live preview', async () => {
      const preview = await brandingManager.generatePreview('brand-001', {
        components: ['Button', 'Card', 'Form', 'Navigation'],
        scenarios: ['light', 'dark']
      });

      expect(preview).toHaveProperty('url');
      expect(preview).toHaveProperty('iframe');
      expect(preview).toHaveProperty('screenshots');
      expect(preview.screenshots).toHaveProperty('light');
      expect(preview.screenshots).toHaveProperty('dark');
    });

    it('should A/B test brand variations', async () => {
      const abTest = await brandingManager.createABTest({
        brandId: 'brand-001',
        variations: [
          { name: 'control', changes: {} },
          { name: 'variant-a', changes: { colors: { primary: '#10B981' } } },
          { name: 'variant-b', changes: { typography: { fontFamily: { sans: 'Roboto' } } } }
        ],
        metrics: ['engagement', 'conversion', 'satisfaction'],
        duration: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      expect(abTest).toHaveProperty('id');
      expect(abTest).toHaveProperty('status', 'running');
      expect(abTest).toHaveProperty('variations', 3);
      expect(abTest).toHaveProperty('distribution');
    });

    it('should validate brand consistency', async () => {
      const consistency = await brandingManager.checkBrandConsistency('brand-001');
      
      expect(consistency).toHaveProperty('score');
      expect(consistency.score).toBeGreaterThan(0);
      expect(consistency.score).toBeLessThanOrEqual(100);
      
      expect(consistency).toHaveProperty('issues');
      consistency.issues.forEach(issue => {
        expect(issue).toHaveProperty('type');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('suggestion');
      });
    });
  });

  describe('Export and Distribution', () => {
    it('should export brand guidelines', async () => {
      const guidelines = await brandingManager.exportBrandGuidelines('brand-001', {
        format: 'pdf',
        sections: ['colors', 'typography', 'components', 'usage'],
        includeAssets: true
      });

      expect(guidelines).toHaveProperty('format', 'pdf');
      expect(guidelines).toHaveProperty('file');
      expect(guidelines).toHaveProperty('size');
      expect(guidelines).toHaveProperty('pages');
      expect(guidelines).toHaveProperty('includedAssets');
    });

    it('should generate design tokens', async () => {
      const tokens = await brandingManager.exportDesignTokens('brand-001', {
        formats: ['json', 'scss', 'css', 'js'],
        platforms: ['web', 'ios', 'android']
      });

      expect(tokens).toHaveProperty('json');
      expect(tokens.json).toHaveProperty('color');
      expect(tokens.json).toHaveProperty('typography');
      
      expect(tokens).toHaveProperty('scss');
      expect(tokens.scss).toContain('$color-primary');
      
      expect(tokens).toHaveProperty('css');
      expect(tokens.css).toContain(':root');
    });

    it('should create brand package', async () => {
      const package_ = await brandingManager.createBrandPackage('brand-001', {
        includeAssets: true,
        includeTemplates: true,
        includeGuidelines: true,
        format: 'zip'
      });

      expect(package_).toHaveProperty('url');
      expect(package_).toHaveProperty('size');
      expect(package_).toHaveProperty('contents');
      expect(package_.contents).toContain('assets/');
      expect(package_.contents).toContain('templates/');
      expect(package_.contents).toContain('guidelines.pdf');
    });
  });

  describe('Performance and Caching', () => {
    it('should cache compiled styles', async () => {
      const firstCompile = Date.now();
      await brandingManager.compileStyles('brand-001');
      const firstDuration = Date.now() - firstCompile;

      const secondCompile = Date.now();
      await brandingManager.compileStyles('brand-001');
      const secondDuration = Date.now() - secondCompile;

      expect(secondDuration).toBeLessThan(firstDuration / 10); // 10x faster from cache
    });

    it('should optimize asset delivery', async () => {
      const optimization = await brandingManager.optimizeAssetDelivery('brand-001');
      
      expect(optimization).toHaveProperty('cdn');
      expect(optimization.cdn).toHaveProperty('enabled', true);
      expect(optimization.cdn).toHaveProperty('urls');
      
      expect(optimization).toHaveProperty('compression');
      expect(optimization.compression).toHaveProperty('gzip', true);
      expect(optimization.compression).toHaveProperty('brotli', true);
      
      expect(optimization).toHaveProperty('caching');
      expect(optimization.caching).toHaveProperty('maxAge', 31536000); // 1 year
    });

    it('should handle concurrent brand updates', async () => {
      const updates = Array.from({ length: 10 }, (_, i) => ({
        brandId: `brand-${i}`,
        changes: { colors: { primary: `#${i}${i}${i}${i}${i}${i}` } }
      }));

      const results = await Promise.all(
        updates.map(u => brandingManager.updateBrand(u.brandId, u.changes))
      );

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('success', true);
      });
    });
  });
});