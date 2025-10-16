/**
 * Multi-Tenant Manager
 * Complete tenant isolation and management for white-label deployments
 */

import { BrandingConfig } from './branding-manager';

export interface Tenant {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  type: 'trial' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled' | 'pending';
  config: TenantConfig;
  billing: TenantBilling;
  usage: TenantUsage;
  team: TenantTeam;
  security: TenantSecurity;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    activatedAt?: Date;
    suspendedAt?: Date;
    cancelledAt?: Date;
  };
}

export interface TenantConfig {
  brandingId?: string; // Reference to BrandingConfig
  features: {
    maxUsers: number;
    maxBuildings: number;
    maxDataRetention: number; // days
    aiCredits: number; // monthly
    customIntegrations: boolean;
    apiAccess: boolean;
    ssoEnabled: boolean;
    auditLogs: boolean;
    customReports: boolean;
    whiteLabel: boolean;
    multiRegion: boolean;
    dedicatedSupport: boolean;
  };
  limits: {
    apiRateLimit: number; // requests per minute
    storageLimit: number; // GB
    bandwidthLimit: number; // GB per month
    exportLimit: number; // exports per month
  };
  modules: {
    sustainability: boolean;
    analytics: boolean;
    automation: boolean;
    compliance: boolean;
    retail?: boolean;
    manufacturing?: boolean;
    realEstate?: boolean;
  };
  customizations: {
    customFields?: Record<string, CustomField>;
    customMetrics?: Record<string, CustomMetric>;
    customWorkflows?: Record<string, CustomWorkflow>;
  };
}

export interface TenantBilling {
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'monthly' | 'yearly';
  };
  subscription: {
    status: 'active' | 'past_due' | 'cancelled' | 'trialing';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
  };
  paymentMethod?: {
    type: 'card' | 'invoice' | 'bank_transfer';
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  invoices: Invoice[];
  creditBalance: number;
  autoRenew: boolean;
}

export interface TenantUsage {
  current: {
    users: number;
    buildings: number;
    dataPoints: number;
    aiRequests: number;
    apiCalls: number;
    storage: number; // GB
    bandwidth: number; // GB
  };
  history: UsageHistory[];
  trends: {
    userGrowth: number; // percentage
    dataGrowth: number; // percentage
    costTrend: number; // percentage
  };
}

export interface TenantTeam {
  owner: {
    userId: string;
    email: string;
    name: string;
  };
  admins: TeamMember[];
  members: TeamMember[];
  invitations: TeamInvitation[];
  groups: TeamGroup[];
}

export interface TenantSecurity {
  sso?: {
    enabled: boolean;
    provider: 'saml' | 'oidc' | 'oauth2';
    configuration: Record<string, any>;
  };
  mfa: {
    required: boolean;
    methods: ('totp' | 'sms' | 'email')[];
  };
  ipWhitelist?: string[];
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
    preventReuse: number;
  };
  dataEncryption: {
    atRest: boolean;
    inTransit: boolean;
    keyRotation: boolean;
  };
  compliance: {
    gdpr: boolean;
    soc2: boolean;
    iso27001: boolean;
    hipaa: boolean;
  };
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  validation?: string; // regex
  defaultValue?: any;
}

export interface CustomMetric {
  id: string;
  name: string;
  unit: string;
  calculation: string; // formula
  category: string;
  target?: number;
}

export interface CustomWorkflow {
  id: string;
  name: string;
  trigger: string;
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface WorkflowAction {
  type: 'email' | 'webhook' | 'integration' | 'internal';
  config: Record<string, any>;
}

export interface Invoice {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  items: InvoiceItem[];
  paidAt?: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface UsageHistory {
  date: Date;
  metrics: Record<string, number>;
  cost: number;
}

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  permissions: string[];
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

export interface TeamGroup {
  id: string;
  name: string;
  description?: string;
  members: string[]; // user IDs
  permissions: string[];
  createdAt: Date;
}

export interface TenantDatabase {
  type: 'shared' | 'dedicated';
  connectionString?: string; // For dedicated databases
  schema?: string; // For shared databases with schema isolation
  region: string;
  backupSchedule: 'hourly' | 'daily' | 'weekly';
  retentionDays: number;
}

/**
 * Multi-Tenant Manager
 */
export class TenantManager {
  private tenants: Map<string, Tenant> = new Map();
  private tenantsBySlug: Map<string, string> = new Map(); // slug -> tenantId
  private databases: Map<string, TenantDatabase> = new Map();

  constructor() {
    this.initializeDefaultTenants();
  }

  /**
   * Initialize default tenants for testing
   */
  private initializeDefaultTenants(): void {
    const defaultTenants: Tenant[] = [
      {
        id: 'tenant_blipee',
        name: 'Blipee AI',
        slug: 'blipee',
        type: 'enterprise',
        status: 'active',
        config: {
          features: {
            maxUsers: -1, // unlimited
            maxBuildings: -1,
            maxDataRetention: 2555, // 7 years
            aiCredits: -1, // unlimited
            customIntegrations: true,
            apiAccess: true,
            ssoEnabled: true,
            auditLogs: true,
            customReports: true,
            whiteLabel: true,
            multiRegion: true,
            dedicatedSupport: true
          },
          limits: {
            apiRateLimit: 10000,
            storageLimit: 10000, // 10TB
            bandwidthLimit: 50000, // 50TB
            exportLimit: -1 // unlimited
          },
          modules: {
            sustainability: true,
            analytics: true,
            automation: true,
            compliance: true,
            retail: true,
            manufacturing: true,
            realEstate: true
          },
          customizations: {}
        },
        billing: {
          plan: {
            id: 'enterprise-unlimited',
            name: 'Enterprise Unlimited',
            price: 0,
            currency: 'USD',
            interval: 'yearly'
          },
          subscription: {
            status: 'active',
            currentPeriodStart: new Date('2024-01-01'),
            currentPeriodEnd: new Date('2025-01-01')
          },
          invoices: [],
          creditBalance: 0,
          autoRenew: true
        },
        usage: {
          current: {
            users: 150,
            buildings: 45,
            dataPoints: 15000000,
            aiRequests: 250000,
            apiCalls: 1500000,
            storage: 125.5,
            bandwidth: 450.3
          },
          history: [],
          trends: {
            userGrowth: 15.5,
            dataGrowth: 25.3,
            costTrend: -12.4 // Cost optimization!
          }
        },
        team: {
          owner: {
            userId: 'user_admin',
            email: 'admin@blipee.ai',
            name: 'System Admin'
          },
          admins: [],
          members: [],
          invitations: [],
          groups: []
        },
        security: {
          mfa: {
            required: true,
            methods: ['totp', 'sms']
          },
          passwordPolicy: {
            minLength: 12,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            expirationDays: 90,
            preventReuse: 5
          },
          dataEncryption: {
            atRest: true,
            inTransit: true,
            keyRotation: true
          },
          compliance: {
            gdpr: true,
            soc2: true,
            iso27001: true,
            hipaa: false
          }
        },
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          activatedAt: new Date('2024-01-01')
        }
      }
    ];

    defaultTenants.forEach(tenant => {
      this.tenants.set(tenant.id, tenant);
      this.tenantsBySlug.set(tenant.slug, tenant.id);
      
      // Create database configuration
      this.databases.set(tenant.id, {
        type: 'dedicated',
        region: 'us-east-1',
        backupSchedule: 'hourly',
        retentionDays: 30
      });
    });

  }

  /**
   * Create a new tenant
   */
  createTenant(
    name: string,
    slug: string,
    type: Tenant['type'],
    ownerId: string,
    ownerEmail: string,
    ownerName: string
  ): Tenant {
    // Check if slug is already taken
    if (this.tenantsBySlug.has(slug)) {
      throw new Error(`Tenant slug '${slug}' is already taken`);
    }

    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Define features based on tenant type
    const features = this.getFeaturesByType(type);
    const limits = this.getLimitsByType(type);
    const modules = this.getModulesByType(type);

    const tenant: Tenant = {
      id: tenantId,
      name,
      slug,
      type,
      status: type === 'trial' ? 'pending' : 'active',
      config: {
        features,
        limits,
        modules,
        customizations: {}
      },
      billing: {
        plan: this.getPlanByType(type),
        subscription: {
          status: type === 'trial' ? 'trialing' : 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          trialEnd: type === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : undefined
        },
        invoices: [],
        creditBalance: type === 'trial' ? 100 : 0, // $100 trial credits
        autoRenew: true
      },
      usage: {
        current: {
          users: 1,
          buildings: 0,
          dataPoints: 0,
          aiRequests: 0,
          apiCalls: 0,
          storage: 0,
          bandwidth: 0
        },
        history: [],
        trends: {
          userGrowth: 0,
          dataGrowth: 0,
          costTrend: 0
        }
      },
      team: {
        owner: {
          userId: ownerId,
          email: ownerEmail,
          name: ownerName
        },
        admins: [],
        members: [],
        invitations: [],
        groups: []
      },
      security: {
        mfa: {
          required: type === 'enterprise',
          methods: ['totp']
        },
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: type !== 'trial',
          expirationDays: type === 'enterprise' ? 90 : 180,
          preventReuse: 3
        },
        dataEncryption: {
          atRest: true,
          inTransit: true,
          keyRotation: type === 'enterprise'
        },
        compliance: {
          gdpr: true,
          soc2: type === 'enterprise' || type === 'professional',
          iso27001: type === 'enterprise',
          hipaa: false
        }
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        activatedAt: type !== 'trial' ? new Date() : undefined
      }
    };

    this.tenants.set(tenantId, tenant);
    this.tenantsBySlug.set(slug, tenantId);

    // Create database configuration
    this.databases.set(tenantId, {
      type: type === 'enterprise' ? 'dedicated' : 'shared',
      schema: type !== 'enterprise' ? `tenant_${slug}` : undefined,
      region: 'us-east-1',
      backupSchedule: type === 'enterprise' ? 'hourly' : 'daily',
      retentionDays: type === 'enterprise' ? 30 : 7
    });


    return tenant;
  }

  /**
   * Get features by tenant type
   */
  private getFeaturesByType(type: Tenant['type']): TenantConfig['features'] {
    const features: Record<Tenant['type'], TenantConfig['features']> = {
      trial: {
        maxUsers: 3,
        maxBuildings: 2,
        maxDataRetention: 30,
        aiCredits: 1000,
        customIntegrations: false,
        apiAccess: false,
        ssoEnabled: false,
        auditLogs: false,
        customReports: false,
        whiteLabel: false,
        multiRegion: false,
        dedicatedSupport: false
      },
      starter: {
        maxUsers: 10,
        maxBuildings: 5,
        maxDataRetention: 90,
        aiCredits: 5000,
        customIntegrations: false,
        apiAccess: true,
        ssoEnabled: false,
        auditLogs: true,
        customReports: false,
        whiteLabel: false,
        multiRegion: false,
        dedicatedSupport: false
      },
      professional: {
        maxUsers: 50,
        maxBuildings: 20,
        maxDataRetention: 365,
        aiCredits: 25000,
        customIntegrations: true,
        apiAccess: true,
        ssoEnabled: true,
        auditLogs: true,
        customReports: true,
        whiteLabel: false,
        multiRegion: false,
        dedicatedSupport: false
      },
      enterprise: {
        maxUsers: -1,
        maxBuildings: -1,
        maxDataRetention: 2555,
        aiCredits: -1,
        customIntegrations: true,
        apiAccess: true,
        ssoEnabled: true,
        auditLogs: true,
        customReports: true,
        whiteLabel: true,
        multiRegion: true,
        dedicatedSupport: true
      }
    };

    return features[type];
  }

  /**
   * Get limits by tenant type
   */
  private getLimitsByType(type: Tenant['type']): TenantConfig['limits'] {
    const limits: Record<Tenant['type'], TenantConfig['limits']> = {
      trial: {
        apiRateLimit: 10,
        storageLimit: 1,
        bandwidthLimit: 5,
        exportLimit: 10
      },
      starter: {
        apiRateLimit: 60,
        storageLimit: 10,
        bandwidthLimit: 50,
        exportLimit: 100
      },
      professional: {
        apiRateLimit: 300,
        storageLimit: 100,
        bandwidthLimit: 500,
        exportLimit: 1000
      },
      enterprise: {
        apiRateLimit: 10000,
        storageLimit: 10000,
        bandwidthLimit: 50000,
        exportLimit: -1
      }
    };

    return limits[type];
  }

  /**
   * Get modules by tenant type
   */
  private getModulesByType(type: Tenant['type']): TenantConfig['modules'] {
    const modules: Record<Tenant['type'], TenantConfig['modules']> = {
      trial: {
        sustainability: true,
        analytics: true,
        automation: false,
        compliance: false
      },
      starter: {
        sustainability: true,
        analytics: true,
        automation: true,
        compliance: false
      },
      professional: {
        sustainability: true,
        analytics: true,
        automation: true,
        compliance: true
      },
      enterprise: {
        sustainability: true,
        analytics: true,
        automation: true,
        compliance: true,
        retail: true,
        manufacturing: true,
        realEstate: true
      }
    };

    return modules[type];
  }

  /**
   * Get plan by tenant type
   */
  private getPlanByType(type: Tenant['type']): TenantBilling['plan'] {
    const plans: Record<Tenant['type'], TenantBilling['plan']> = {
      trial: {
        id: 'trial',
        name: 'Trial',
        price: 0,
        currency: 'USD',
        interval: 'monthly'
      },
      starter: {
        id: 'starter-monthly',
        name: 'Starter',
        price: 299,
        currency: 'USD',
        interval: 'monthly'
      },
      professional: {
        id: 'professional-monthly',
        name: 'Professional',
        price: 999,
        currency: 'USD',
        interval: 'monthly'
      },
      enterprise: {
        id: 'enterprise-custom',
        name: 'Enterprise',
        price: 0, // Custom pricing
        currency: 'USD',
        interval: 'yearly'
      }
    };

    return plans[type];
  }

  /**
   * Update tenant usage
   */
  updateTenantUsage(
    tenantId: string,
    usage: Partial<TenantUsage['current']>
  ): void {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Update current usage
    tenant.usage.current = {
      ...tenant.usage.current,
      ...usage
    };

    // Add to history
    tenant.usage.history.push({
      date: new Date(),
      metrics: { ...tenant.usage.current },
      cost: this.calculateUsageCost(tenant)
    });

    // Update trends
    if (tenant.usage.history.length > 1) {
      const prevMonth = tenant.usage.history[tenant.usage.history.length - 2];
      tenant.usage.trends.userGrowth = ((tenant.usage.current.users - prevMonth.metrics.users) / prevMonth.metrics.users) * 100;
      tenant.usage.trends.dataGrowth = ((tenant.usage.current.dataPoints - prevMonth.metrics.dataPoints) / prevMonth.metrics.dataPoints) * 100;
    }

    tenant.metadata.updatedAt = new Date();
    this.tenants.set(tenantId, tenant);
  }

  /**
   * Calculate usage cost
   */
  private calculateUsageCost(tenant: Tenant): number {
    // Simplified cost calculation
    const baseCost = tenant.billing.plan.price;
    const overageCosts = {
      users: Math.max(0, tenant.usage.current.users - tenant.config.features.maxUsers) * 10,
      aiRequests: Math.max(0, tenant.usage.current.aiRequests - tenant.config.features.aiCredits) * 0.01,
      storage: Math.max(0, tenant.usage.current.storage - tenant.config.limits.storageLimit) * 0.1,
      bandwidth: Math.max(0, tenant.usage.current.bandwidth - tenant.config.limits.bandwidthLimit) * 0.05
    };

    return baseCost + Object.values(overageCosts).reduce((sum, cost) => sum + cost, 0);
  }

  /**
   * Check tenant access permissions
   */
  checkTenantAccess(
    tenantId: string,
    userId: string,
    permission: string
  ): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant || tenant.status !== 'active') {
      return false;
    }

    // Check if user is owner
    if (tenant.team.owner.userId === userId) {
      return true;
    }

    // Check if user is admin
    const isAdmin = tenant.team.admins.some(admin => admin.userId === userId);
    if (isAdmin) {
      return true;
    }

    // Check specific permissions for members
    const member = tenant.team.members.find(m => m.userId === userId);
    if (member) {
      return member.permissions.includes(permission) || member.permissions.includes('*');
    }

    return false;
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  /**
   * Get tenant by slug
   */
  getTenantBySlug(slug: string): Tenant | undefined {
    const tenantId = this.tenantsBySlug.get(slug);
    return tenantId ? this.tenants.get(tenantId) : undefined;
  }

  /**
   * Get all tenants
   */
  getAllTenants(): Map<string, Tenant> {
    return new Map(this.tenants);
  }

  /**
   * Get tenant database configuration
   */
  getTenantDatabase(tenantId: string): TenantDatabase | undefined {
    return this.databases.get(tenantId);
  }

  /**
   * Update tenant status
   */
  updateTenantStatus(
    tenantId: string,
    status: Tenant['status'],
    reason?: string
  ): void {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    tenant.status = status;
    tenant.metadata.updatedAt = new Date();

    if (status === 'suspended') {
      tenant.metadata.suspendedAt = new Date();
    } else if (status === 'cancelled') {
      tenant.metadata.cancelledAt = new Date();
    } else if (status === 'active' && !tenant.metadata.activatedAt) {
      tenant.metadata.activatedAt = new Date();
    }

    this.tenants.set(tenantId, tenant);

  }
}

/**
 * Global tenant manager instance
 */
export const tenantManager = new TenantManager();