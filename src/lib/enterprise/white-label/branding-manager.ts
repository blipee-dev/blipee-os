/**
 * White-Label Branding Manager
 * Complete customization system for enterprise white-label deployments
 */

export interface BrandingConfig {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  theme: BrandTheme;
  assets: BrandAssets;
  content: BrandContent;
  features: BrandFeatures;
  domain: CustomDomain;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    version: number;
    isActive: boolean;
  };
}

export interface BrandTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: {
      primary: string;
      secondary: string;
      card: string;
    };
    text: {
      primary: string;
      secondary: string;
      inverse: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    gradients: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  typography: {
    fontFamily: {
      heading: string;
      body: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    unit: number;
    scale: number[];
  };
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      default: string;
      in: string;
      out: string;
      inOut: string;
    };
  };
}

export interface BrandAssets {
  logos: {
    primary: {
      light: string; // URL or base64
      dark: string;
      vector?: string; // SVG
    };
    secondary?: {
      light: string;
      dark: string;
      vector?: string;
    };
    favicon: string;
    appleTouchIcon: string;
  };
  images: {
    loginBackground?: string;
    dashboardHeader?: string;
    emailHeader?: string;
    errorPage?: string;
    emptyState?: string;
  };
  icons: {
    custom?: Record<string, string>; // Custom icon set
    library: 'heroicons' | 'feather' | 'material' | 'custom';
  };
}

export interface BrandContent {
  companyInfo: {
    name: string;
    tagline?: string;
    description?: string;
    website?: string;
    supportEmail: string;
    supportPhone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  emailTemplates: {
    header: string;
    footer: string;
    signature: string;
    customTemplates?: Record<string, string>;
  };
  legalPages: {
    termsOfService?: string;
    privacyPolicy?: string;
    dataProcessingAgreement?: string;
    cookiePolicy?: string;
  };
  customPages: Record<string, {
    title: string;
    content: string;
    slug: string;
    isPublic: boolean;
  }>;
  localization: {
    defaultLanguage: string;
    supportedLanguages: string[];
    translations?: Record<string, Record<string, string>>;
  };
}

export interface BrandFeatures {
  navigation: {
    primaryMenu: NavMenuItem[];
    secondaryMenu?: NavMenuItem[];
    footerMenu?: NavMenuItem[];
    customMenus?: Record<string, NavMenuItem[]>;
  };
  modules: {
    dashboard: {
      enabled: boolean;
      customWidgets?: string[];
      layout?: 'default' | 'compact' | 'custom';
    };
    analytics: {
      enabled: boolean;
      customMetrics?: string[];
    };
    ai: {
      enabled: boolean;
      customPrompts?: Record<string, string>;
      modelPreferences?: {
        default: string;
        allowed: string[];
      };
    };
    integrations: {
      enabled: boolean;
      allowedIntegrations?: string[];
      customIntegrations?: Record<string, any>;
    };
  };
  customFeatures: Record<string, {
    enabled: boolean;
    config: any;
  }>;
}

export interface NavMenuItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  action?: string;
  children?: NavMenuItem[];
  requiredPermission?: string;
  isExternal?: boolean;
}

export interface CustomDomain {
  enabled: boolean;
  primary?: {
    domain: string;
    subdomain?: string;
    ssl: {
      enabled: boolean;
      certificate?: string;
      provider: 'letsencrypt' | 'custom';
    };
    verified: boolean;
    verificationToken?: string;
  };
  aliases?: string[];
  emailDomain?: {
    domain: string;
    verified: boolean;
    dkimRecords?: Record<string, string>;
    spfRecord?: string;
  };
}

export interface BrandingPreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'modern' | 'classic' | 'minimal' | 'bold' | 'custom';
  theme: Partial<BrandTheme>;
  isPremium: boolean;
}

/**
 * White-Label Branding Manager
 */
export class BrandingManager {
  private brandingConfigs: Map<string, BrandingConfig> = new Map();
  private presets: Map<string, BrandingPreset> = new Map();
  private activeConfig: BrandingConfig | null = null;

  constructor() {
    this.initializePresets();
    this.loadDefaultBranding();
  }

  /**
   * Initialize branding presets
   */
  private initializePresets(): void {
    const presets: BrandingPreset[] = [
      {
        id: 'modern-tech',
        name: 'Modern Tech',
        description: 'Clean, modern design with tech-forward aesthetics',
        thumbnail: '/presets/modern-tech.png',
        category: 'modern',
        theme: {
          colors: {
            primary: '#0066FF',
            secondary: '#00D4FF',
            accent: '#FF006E',
            background: {
              primary: '#0A0E27',
              secondary: '#151B3B',
              card: '#1E2749'
            },
            text: {
              primary: '#FFFFFF',
              secondary: '#A0A9C9',
              inverse: '#0A0E27'
            },
            status: {
              success: '#00D97E',
              warning: '#F5803E',
              error: '#E63757',
              info: '#00B2FF'
            },
            gradients: {
              primary: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
              secondary: 'linear-gradient(135deg, #FF006E 0%, #FF4B2B 100%)',
              accent: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
            }
          },
          borderRadius: {
            none: '0',
            sm: '0.25rem',
            base: '0.5rem',
            md: '0.75rem',
            lg: '1rem',
            xl: '1.5rem',
            full: '9999px'
          }
        },
        isPremium: false
      },
      {
        id: 'enterprise-classic',
        name: 'Enterprise Classic',
        description: 'Professional, trustworthy design for enterprise clients',
        thumbnail: '/presets/enterprise-classic.png',
        category: 'classic',
        theme: {
          colors: {
            primary: '#1E40AF',
            secondary: '#3B82F6',
            accent: '#10B981',
            background: {
              primary: '#FFFFFF',
              secondary: '#F9FAFB',
              card: '#FFFFFF'
            },
            text: {
              primary: '#111827',
              secondary: '#6B7280',
              inverse: '#FFFFFF'
            },
            status: {
              success: '#059669',
              warning: '#D97706',
              error: '#DC2626',
              info: '#2563EB'
            },
            gradients: {
              primary: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
              secondary: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
              accent: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
            }
          },
          typography: {
            fontFamily: {
              heading: 'Inter, system-ui, sans-serif',
              body: 'Inter, system-ui, sans-serif',
              mono: 'JetBrains Mono, monospace'
            },
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem',
              '4xl': '2.25rem'
            },
            fontWeight: {
              light: 300,
              normal: 400,
              medium: 500,
              semibold: 600,
              bold: 700
            }
          }
        },
        isPremium: false
      },
      {
        id: 'eco-minimal',
        name: 'Eco Minimal',
        description: 'Sustainable, minimalist design for eco-conscious brands',
        thumbnail: '/presets/eco-minimal.png',
        category: 'minimal',
        theme: {
          colors: {
            primary: '#059669',
            secondary: '#10B981',
            accent: '#34D399',
            background: {
              primary: '#FAFDF7',
              secondary: '#F0F9E8',
              card: '#FFFFFF'
            },
            text: {
              primary: '#064E3B',
              secondary: '#047857',
              inverse: '#FFFFFF'
            },
            status: {
              success: '#16A34A',
              warning: '#FB923C',
              error: '#DC2626',
              info: '#0EA5E9'
            },
            gradients: {
              primary: 'linear-gradient(135deg, #059669 0%, #34D399 100%)',
              secondary: 'linear-gradient(135deg, #84CC16 0%, #BEF264 100%)',
              accent: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)'
            }
          },
          borderRadius: {
            none: '0',
            sm: '0.125rem',
            base: '0.25rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            full: '9999px'
          }
        },
        isPremium: true
      }
    ];

    presets.forEach(preset => {
      this.presets.set(preset.id, preset);
    });

  }

  /**
   * Load default branding configuration
   */
  private loadDefaultBranding(): void {
    const defaultConfig: BrandingConfig = {
      id: 'default',
      organizationId: 'blipee',
      name: 'Blipee OS Default',
      description: 'Default branding configuration for Blipee OS',
      theme: {
        colors: {
          primary: '#8B5CF6',
          secondary: '#3B82F6',
          accent: '#10B981',
          background: {
            primary: '#0A0E27',
            secondary: '#151B3B',
            card: 'rgba(255, 255, 255, 0.03)'
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#A0A9C9',
            inverse: '#0A0E27'
          },
          status: {
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6'
          },
          gradients: {
            primary: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
            secondary: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            accent: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
          }
        },
        typography: {
          fontFamily: {
            heading: 'Inter, system-ui, -apple-system, sans-serif',
            body: 'Inter, system-ui, -apple-system, sans-serif',
            mono: 'JetBrains Mono, Consolas, monospace'
          },
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem'
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
          }
        },
        spacing: {
          unit: 4,
          scale: [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64]
        },
        borderRadius: {
          none: '0',
          sm: '0.25rem',
          base: '0.5rem',
          md: '0.75rem',
          lg: '1rem',
          xl: '1.5rem',
          full: '9999px'
        },
        shadows: {
          none: 'none',
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        },
        animations: {
          duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms'
          },
          easing: {
            default: 'cubic-bezier(0.4, 0, 0.2, 1)',
            in: 'cubic-bezier(0.4, 0, 1, 1)',
            out: 'cubic-bezier(0, 0, 0.2, 1)',
            inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }
        }
      },
      assets: {
        logos: {
          primary: {
            light: '/logos/blipee-light.svg',
            dark: '/logos/blipee-dark.svg',
            vector: '/logos/blipee-vector.svg'
          },
          favicon: '/favicon.ico',
          appleTouchIcon: '/apple-touch-icon.png'
        },
        images: {
          loginBackground: '/images/login-bg.jpg',
          dashboardHeader: '/images/dashboard-header.jpg'
        },
        icons: {
          library: 'heroicons'
        }
      },
      content: {
        companyInfo: {
          name: 'Blipee AI',
          tagline: 'Autonomous Sustainability Intelligence',
          description: 'The world\'s first AI-powered sustainability platform',
          website: 'https://blipee.ai',
          supportEmail: 'support@blipee.ai'
        },
        emailTemplates: {
          header: '<div style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); padding: 20px; text-align: center;"><img src="{{logo}}" alt="{{company_name}}" style="height: 40px;"></div>',
          footer: '<div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;"><p>&copy; {{year}} {{company_name}}. All rights reserved.</p></div>',
          signature: '<p>Best regards,<br>The {{company_name}} Team</p>'
        },
        legalPages: {},
        customPages: {},
        localization: {
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja']
        }
      },
      features: {
        navigation: {
          primaryMenu: [
            { id: 'dashboard', label: 'Dashboard', icon: 'home', href: '/dashboard' },
            { id: 'analytics', label: 'Analytics', icon: 'chart', href: '/analytics' },
            { id: 'sustainability', label: 'Sustainability', icon: 'leaf', href: '/sustainability' },
            { id: 'reports', label: 'Reports', icon: 'document', href: '/reports' }
          ]
        },
        modules: {
          dashboard: {
            enabled: true,
            layout: 'default'
          },
          analytics: {
            enabled: true
          },
          ai: {
            enabled: true,
            modelPreferences: {
              default: 'deepseek',
              allowed: ['deepseek', 'openai', 'anthropic']
            }
          },
          integrations: {
            enabled: true
          }
        },
        customFeatures: {}
      },
      domain: {
        enabled: false
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        version: 1,
        isActive: true
      }
    };

    this.brandingConfigs.set(defaultConfig.id, defaultConfig);
    this.activeConfig = defaultConfig;
  }

  /**
   * Create a new branding configuration
   */
  createBrandingConfig(
    organizationId: string,
    name: string,
    presetId?: string
  ): BrandingConfig {
    const configId = `branding_${organizationId}_${Date.now()}`;
    
    // Start with default config
    let baseConfig = this.brandingConfigs.get('default')!;
    
    // Apply preset if specified
    if (presetId) {
      const preset = this.presets.get(presetId);
      if (preset) {
        baseConfig = {
          ...baseConfig,
          theme: {
            ...baseConfig.theme,
            ...preset.theme
          }
        };
      }
    }
    
    const newConfig: BrandingConfig = {
      ...baseConfig,
      id: configId,
      organizationId,
      name,
      description: `Custom branding for ${name}`,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: organizationId,
        version: 1,
        isActive: false
      }
    };
    
    this.brandingConfigs.set(configId, newConfig);
    
    
    return newConfig;
  }

  /**
   * Update branding configuration
   */
  updateBrandingConfig(
    configId: string,
    updates: Partial<BrandingConfig>
  ): BrandingConfig {
    const config = this.brandingConfigs.get(configId);
    if (!config) {
      throw new Error(`Branding configuration ${configId} not found`);
    }
    
    const updatedConfig: BrandingConfig = {
      ...config,
      ...updates,
      metadata: {
        ...config.metadata,
        updatedAt: new Date(),
        version: config.metadata.version + 1
      }
    };
    
    this.brandingConfigs.set(configId, updatedConfig);
    
    // Update active config if this is the active one
    if (this.activeConfig?.id === configId) {
      this.activeConfig = updatedConfig;
    }
    
    
    return updatedConfig;
  }

  /**
   * Activate a branding configuration
   */
  activateBrandingConfig(configId: string): void {
    const config = this.brandingConfigs.get(configId);
    if (!config) {
      throw new Error(`Branding configuration ${configId} not found`);
    }
    
    // Deactivate current active config
    if (this.activeConfig) {
      this.activeConfig.metadata.isActive = false;
      this.brandingConfigs.set(this.activeConfig.id, this.activeConfig);
    }
    
    // Activate new config
    config.metadata.isActive = true;
    config.metadata.updatedAt = new Date();
    this.brandingConfigs.set(configId, config);
    this.activeConfig = config;
    
  }

  /**
   * Generate CSS variables from theme
   */
  generateCSSVariables(theme: BrandTheme): string {
    const cssVars: string[] = [];
    
    // Colors
    cssVars.push('/* Colors */');
    cssVars.push(`--color-primary: ${theme.colors.primary};`);
    cssVars.push(`--color-secondary: ${theme.colors.secondary};`);
    cssVars.push(`--color-accent: ${theme.colors.accent};`);
    
    // Background colors
    cssVars.push('/* Background Colors */');
    cssVars.push(`--color-bg-primary: ${theme.colors.background.primary};`);
    cssVars.push(`--color-bg-secondary: ${theme.colors.background.secondary};`);
    cssVars.push(`--color-bg-card: ${theme.colors.background.card};`);
    
    // Text colors
    cssVars.push('/* Text Colors */');
    cssVars.push(`--color-text-primary: ${theme.colors.text.primary};`);
    cssVars.push(`--color-text-secondary: ${theme.colors.text.secondary};`);
    cssVars.push(`--color-text-inverse: ${theme.colors.text.inverse};`);
    
    // Status colors
    cssVars.push('/* Status Colors */');
    cssVars.push(`--color-success: ${theme.colors.status.success};`);
    cssVars.push(`--color-warning: ${theme.colors.status.warning};`);
    cssVars.push(`--color-error: ${theme.colors.status.error};`);
    cssVars.push(`--color-info: ${theme.colors.status.info};`);
    
    // Gradients
    cssVars.push('/* Gradients */');
    cssVars.push(`--gradient-primary: ${theme.colors.gradients.primary};`);
    cssVars.push(`--gradient-secondary: ${theme.colors.gradients.secondary};`);
    cssVars.push(`--gradient-accent: ${theme.colors.gradients.accent};`);
    
    // Typography
    cssVars.push('/* Typography */');
    cssVars.push(`--font-heading: ${theme.typography.fontFamily.heading};`);
    cssVars.push(`--font-body: ${theme.typography.fontFamily.body};`);
    cssVars.push(`--font-mono: ${theme.typography.fontFamily.mono};`);
    
    // Font sizes
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      cssVars.push(`--text-${key}: ${value};`);
    });
    
    // Border radius
    cssVars.push('/* Border Radius */');
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      cssVars.push(`--radius-${key}: ${value};`);
    });
    
    // Shadows
    cssVars.push('/* Shadows */');
    Object.entries(theme.shadows).forEach(([key, value]) => {
      cssVars.push(`--shadow-${key}: ${value};`);
    });
    
    // Animations
    cssVars.push('/* Animations */');
    Object.entries(theme.animations.duration).forEach(([key, value]) => {
      cssVars.push(`--duration-${key}: ${value};`);
    });
    
    Object.entries(theme.animations.easing).forEach(([key, value]) => {
      cssVars.push(`--easing-${key}: ${value};`);
    });
    
    return `:root {\n  ${cssVars.join('\n  ')}\n}`;
  }

  /**
   * Export branding configuration
   */
  exportBrandingConfig(configId: string): string {
    const config = this.brandingConfigs.get(configId);
    if (!config) {
      throw new Error(`Branding configuration ${configId} not found`);
    }
    
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import branding configuration
   */
  importBrandingConfig(configData: string): BrandingConfig {
    try {
      const config = JSON.parse(configData) as BrandingConfig;
      
      // Generate new ID to avoid conflicts
      config.id = `imported_${Date.now()}`;
      config.metadata.isActive = false;
      config.metadata.createdAt = new Date();
      config.metadata.updatedAt = new Date();
      config.metadata.version = 1;
      
      this.brandingConfigs.set(config.id, config);
      
      
      return config;
    } catch (error) {
      throw new Error(`Failed to import branding configuration: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
  }

  /**
   * Preview branding changes
   */
  previewBranding(configId: string): {
    cssVariables: string;
    previewUrl: string;
    assets: BrandAssets;
  } {
    const config = this.brandingConfigs.get(configId);
    if (!config) {
      throw new Error(`Branding configuration ${configId} not found`);
    }
    
    return {
      cssVariables: this.generateCSSVariables(config.theme),
      previewUrl: `/preview/branding/${configId}`,
      assets: config.assets
    };
  }

  /**
   * Get all branding configurations
   */
  getBrandingConfigs(): Map<string, BrandingConfig> {
    return new Map(this.brandingConfigs);
  }

  /**
   * Get active branding configuration
   */
  getActiveBranding(): BrandingConfig | null {
    return this.activeConfig;
  }

  /**
   * Get branding presets
   */
  getPresets(): Map<string, BrandingPreset> {
    return new Map(this.presets);
  }

  /**
   * Get branding configuration by organization
   */
  getBrandingByOrganization(organizationId: string): BrandingConfig[] {
    return Array.from(this.brandingConfigs.values())
      .filter(config => config.organizationId === organizationId);
  }
}

/**
 * Global branding manager instance
 */
export const brandingManager = new BrandingManager();