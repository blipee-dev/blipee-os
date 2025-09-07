/**
 * Integration Marketplace Manager
 * Manages third-party integrations, webhooks, and partner ecosystem
 */

export interface Integration {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: IntegrationCategory;
  provider: {
    name: string;
    website: string;
    support: string;
    verified: boolean;
  };
  pricing: {
    model: 'free' | 'freemium' | 'paid' | 'enterprise';
    startingPrice?: number;
    currency?: string;
    billingCycle?: 'monthly' | 'annual';
  };
  features: string[];
  capabilities: IntegrationCapability[];
  authentication: {
    type: 'oauth2' | 'api_key' | 'jwt' | 'basic' | 'custom';
    scopes?: string[];
    redirectUrl?: string;
  };
  endpoints: {
    webhooks?: string[];
    api?: string;
    docs?: string;
  };
  assets: {
    icon: string;
    logo: string;
    screenshots: string[];
    video?: string;
  };
  metadata: {
    version: string;
    lastUpdated: Date;
    installCount: number;
    rating: number;
    reviewCount: number;
    status: 'active' | 'deprecated' | 'beta';
    tags: string[];
  };
  configuration: {
    required: ConfigField[];
    optional: ConfigField[];
  };
  permissions: string[];
  dataAccess: string[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'email' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  description?: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface InstalledIntegration {
  id: string;
  integrationId: string;
  organizationId: string;
  userId: string;
  status: 'active' | 'inactive' | 'error' | 'configuring';
  configuration: Record<string, any>;
  credentials: Record<string, any>; // Encrypted
  installedAt: Date;
  lastSync?: Date;
  syncStatus: 'success' | 'pending' | 'failed';
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    lastError?: string;
  };
  webhooks: InstalledWebhook[];
}

export interface InstalledWebhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  lastDelivery?: Date;
  deliveryStats: {
    total: number;
    successful: number;
    failed: number;
    retrying: number;
  };
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  attempt: number;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  responseStatus?: number;
  responseBody?: string;
  deliveredAt?: Date;
  nextRetry?: Date;
  error?: string;
}

export interface MarketplaceAnalytics {
  totalIntegrations: number;
  activeIntegrations: number;
  totalInstalls: number;
  monthlyInstalls: number;
  topCategories: { category: string; count: number }[];
  topIntegrations: { id: string; name: string; installs: number }[];
  revenueShare: {
    totalRevenue: number;
    partnerRevenue: number;
    blipeeRevenue: number;
  };
}

export type IntegrationCategory = 
  | 'crm'
  | 'communication'
  | 'productivity'
  | 'analytics'
  | 'iot'
  | 'energy'
  | 'facilities'
  | 'finance'
  | 'hr'
  | 'marketing'
  | 'security';

export type IntegrationCapability = 
  | 'data_sync'
  | 'webhooks'
  | 'real_time'
  | 'bi_directional'
  | 'batch_import'
  | 'reporting'
  | 'notifications'
  | 'automation';

/**
 * Integration Marketplace Manager
 * Central hub for managing integrations and partnerships
 */
export class IntegrationMarketplaceManager {
  private integrations: Map<string, Integration> = new Map();
  private installedIntegrations: Map<string, InstalledIntegration> = new Map();
  private webhookDeliveries: Map<string, WebhookDelivery[]> = new Map();
  private analytics: MarketplaceAnalytics = {
    totalIntegrations: 0,
    activeIntegrations: 0,
    totalInstalls: 0,
    monthlyInstalls: 0,
    topCategories: [],
    topIntegrations: [],
    revenueShare: {
      totalRevenue: 0,
      partnerRevenue: 0,
      blipeeRevenue: 0
    }
  };

  constructor() {
    this.initializeIntegrations();
    this.startWebhookProcessor();
  }

  /**
   * Initialize marketplace with featured integrations
   */
  private initializeIntegrations(): void {
    const integrations: Integration[] = [
      {
        id: 'salesforce-crm',
        name: 'Salesforce CRM',
        description: 'Sync sustainability data with your Salesforce CRM to track customer ESG initiatives, manage green opportunities, and report on environmental impact metrics directly within your sales workflow.',
        shortDescription: 'Sync sustainability data with Salesforce CRM',
        category: 'crm',
        provider: {
          name: 'Salesforce',
          website: 'https://salesforce.com',
          support: 'https://help.salesforce.com',
          verified: true
        },
        pricing: {
          model: 'freemium',
          startingPrice: 25,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        features: [
          'Automatic ESG data sync',
          'Custom sustainability fields',
          'Carbon footprint tracking',
          'Compliance reporting',
          'Real-time alerts',
          'Dashboard integration'
        ],
        capabilities: ['data_sync', 'webhooks', 'bi_directional', 'real_time'],
        authentication: {
          type: 'oauth2',
          scopes: ['read', 'write', 'api'],
          redirectUrl: '/integrations/salesforce/callback'
        },
        endpoints: {
          api: 'https://api.salesforce.com',
          docs: 'https://developer.salesforce.com/docs',
          webhooks: ['/webhooks/salesforce/opportunities', '/webhooks/salesforce/accounts']
        },
        assets: {
          icon: '/integrations/salesforce/icon.svg',
          logo: '/integrations/salesforce/logo.svg',
          screenshots: [
            '/integrations/salesforce/screenshot1.png',
            '/integrations/salesforce/screenshot2.png'
          ],
          video: '/integrations/salesforce/demo.mp4'
        },
        metadata: {
          version: '2.1.0',
          lastUpdated: new Date('2024-08-30'),
          installCount: 2840,
          rating: 4.8,
          reviewCount: 156,
          status: 'active',
          tags: ['crm', 'sales', 'esg', 'sustainability', 'enterprise']
        },
        configuration: {
          required: [
            {
              key: 'instance_url',
              label: 'Salesforce Instance URL',
              type: 'url',
              required: true,
              placeholder: 'https://yourcompany.salesforce.com',
              description: 'Your Salesforce instance URL'
            }
          ],
          optional: [
            {
              key: 'sync_frequency',
              label: 'Sync Frequency',
              type: 'select',
              required: false,
              options: [
                { label: 'Real-time', value: 'realtime' },
                { label: 'Every 15 minutes', value: '15min' },
                { label: 'Hourly', value: 'hourly' },
                { label: 'Daily', value: 'daily' }
              ],
              description: 'How often to sync data between platforms'
            }
          ]
        },
        permissions: ['read:organizations', 'write:crm_data', 'manage:webhooks'],
        dataAccess: ['organizations', 'buildings', 'emissions', 'compliance']
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        description: 'Get sustainability insights and alerts directly in your Teams channels. Set up automated notifications for ESG milestones, compliance deadlines, and energy efficiency opportunities.',
        shortDescription: 'Sustainability notifications in Microsoft Teams',
        category: 'communication',
        provider: {
          name: 'Microsoft',
          website: 'https://teams.microsoft.com',
          support: 'https://support.microsoft.com/teams',
          verified: true
        },
        pricing: {
          model: 'free'
        },
        features: [
          'Channel notifications',
          'Custom bot commands',
          'Daily/weekly reports',
          'Alert management',
          'Team collaboration',
          'Integration with Power BI'
        ],
        capabilities: ['notifications', 'real_time', 'webhooks'],
        authentication: {
          type: 'oauth2',
          scopes: ['https://graph.microsoft.com/.default']
        },
        endpoints: {
          api: 'https://graph.microsoft.com/v1.0',
          docs: 'https://docs.microsoft.com/en-us/microsoftteams',
          webhooks: ['/webhooks/teams/messages', '/webhooks/teams/mentions']
        },
        assets: {
          icon: '/integrations/teams/icon.svg',
          logo: '/integrations/teams/logo.svg',
          screenshots: [
            '/integrations/teams/screenshot1.png',
            '/integrations/teams/screenshot2.png',
            '/integrations/teams/screenshot3.png'
          ]
        },
        metadata: {
          version: '1.4.2',
          lastUpdated: new Date('2024-09-01'),
          installCount: 5620,
          rating: 4.6,
          reviewCount: 89,
          status: 'active',
          tags: ['communication', 'teams', 'notifications', 'microsoft', 'collaboration']
        },
        configuration: {
          required: [
            {
              key: 'team_id',
              label: 'Team ID',
              type: 'text',
              required: true,
              description: 'The Microsoft Teams team ID where notifications will be sent'
            },
            {
              key: 'channel_id',
              label: 'Channel ID',
              type: 'text',
              required: true,
              description: 'The channel ID for sustainability notifications'
            }
          ],
          optional: [
            {
              key: 'notification_types',
              label: 'Notification Types',
              type: 'select',
              required: false,
              options: [
                { label: 'All notifications', value: 'all' },
                { label: 'Critical alerts only', value: 'critical' },
                { label: 'Daily summaries only', value: 'daily' }
              ]
            }
          ]
        },
        permissions: ['read:organizations', 'read:alerts', 'send:notifications'],
        dataAccess: ['organizations', 'alerts', 'reports']
      },
      {
        id: 'power-bi',
        name: 'Microsoft Power BI',
        description: 'Create powerful sustainability dashboards and reports in Power BI. Connect your ESG data for advanced analytics, custom visualizations, and executive reporting.',
        shortDescription: 'Advanced sustainability analytics in Power BI',
        category: 'analytics',
        provider: {
          name: 'Microsoft',
          website: 'https://powerbi.microsoft.com',
          support: 'https://support.microsoft.com/power-bi',
          verified: true
        },
        pricing: {
          model: 'freemium',
          startingPrice: 10,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        features: [
          'Real-time data connector',
          'Pre-built sustainability templates',
          'Custom ESG visualizations',
          'Automated report refresh',
          'Executive dashboards',
          'Mobile app support'
        ],
        capabilities: ['data_sync', 'real_time', 'reporting', 'bi_directional'],
        authentication: {
          type: 'oauth2',
          scopes: ['https://analysis.windows.net/powerbi/api/.default']
        },
        endpoints: {
          api: 'https://api.powerbi.com/v1.0',
          docs: 'https://docs.microsoft.com/en-us/power-bi',
          webhooks: ['/webhooks/powerbi/datasets', '/webhooks/powerbi/reports']
        },
        assets: {
          icon: '/integrations/powerbi/icon.svg',
          logo: '/integrations/powerbi/logo.svg',
          screenshots: [
            '/integrations/powerbi/dashboard1.png',
            '/integrations/powerbi/dashboard2.png',
            '/integrations/powerbi/dashboard3.png'
          ],
          video: '/integrations/powerbi/demo.mp4'
        },
        metadata: {
          version: '3.2.1',
          lastUpdated: new Date('2024-08-25'),
          installCount: 1890,
          rating: 4.9,
          reviewCount: 67,
          status: 'active',
          tags: ['analytics', 'reporting', 'dashboard', 'microsoft', 'business-intelligence']
        },
        configuration: {
          required: [
            {
              key: 'workspace_id',
              label: 'Power BI Workspace',
              type: 'text',
              required: true,
              description: 'Power BI workspace ID for sustainability reports'
            }
          ],
          optional: [
            {
              key: 'refresh_schedule',
              label: 'Data Refresh Schedule',
              type: 'select',
              required: false,
              options: [
                { label: 'Real-time', value: 'realtime' },
                { label: 'Every hour', value: 'hourly' },
                { label: 'Daily at 6 AM', value: 'daily' },
                { label: 'Weekly on Monday', value: 'weekly' }
              ]
            }
          ]
        },
        permissions: ['read:organizations', 'read:analytics', 'create:reports'],
        dataAccess: ['organizations', 'buildings', 'energy', 'emissions', 'compliance', 'benchmarks']
      }
    ];

    integrations.forEach(integration => {
      this.integrations.set(integration.id, integration);
    });

    // Update analytics
    this.analytics.totalIntegrations = integrations.length;
    this.analytics.activeIntegrations = integrations.filter(i => i.metadata.status === 'active').length;
  }

  /**
   * Start webhook delivery processor
   */
  private startWebhookProcessor(): void {
    // Process webhooks every 30 seconds
    setInterval(() => {
      this.processWebhookDeliveries();
    }, 30000);
  }

  /**
   * Get all integrations
   */
  getIntegrations(category?: IntegrationCategory, featured?: boolean): Integration[] {
    let integrations = Array.from(this.integrations.values());
    
    if (category) {
      integrations = integrations.filter(i => i.category === category);
    }
    
    if (featured) {
      integrations = integrations.filter(i => i.metadata.rating >= 4.5);
    }

    return integrations.sort((a, b) => b.metadata.installCount - a.metadata.installCount);
  }

  /**
   * Get integration by ID
   */
  getIntegration(id: string): Integration | null {
    return this.integrations.get(id) || null;
  }

  /**
   * Search integrations
   */
  searchIntegrations(query: string, category?: IntegrationCategory): Integration[] {
    const searchTerm = query.toLowerCase();
    let integrations = Array.from(this.integrations.values());

    if (category) {
      integrations = integrations.filter(i => i.category === category);
    }

    return integrations.filter(integration => 
      integration.name.toLowerCase().includes(searchTerm) ||
      integration.description.toLowerCase().includes(searchTerm) ||
      integration.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      integration.features.some(feature => feature.toLowerCase().includes(searchTerm))
    ).sort((a, b) => b.metadata.rating - a.metadata.rating);
  }

  /**
   * Install integration
   */
  async installIntegration(
    integrationId: string,
    organizationId: string,
    userId: string,
    configuration: Record<string, any>
  ): Promise<InstalledIntegration> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    // Validate configuration
    this.validateConfiguration(integration, configuration);

    const installedId = `installed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const installed: InstalledIntegration = {
      id: installedId,
      integrationId,
      organizationId,
      userId,
      status: 'configuring',
      configuration,
      credentials: {}, // Would be populated after OAuth flow
      installedAt: new Date(),
      syncStatus: 'pending',
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0
      },
      webhooks: []
    };

    this.installedIntegrations.set(installedId, installed);

    // Initialize webhooks if supported
    if (integration.endpoints.webhooks) {
      for (const webhookUrl of integration.endpoints.webhooks) {
        await this.createWebhook(installedId, webhookUrl, ['*']);
      }
    }

    // Update install count
    integration.metadata.installCount++;

    return installed;
  }

  /**
   * Validate integration configuration
   */
  private validateConfiguration(integration: Integration, configuration: Record<string, any>): void {
    // Check required fields
    for (const field of integration.configuration.required) {
      if (!configuration[field.key]) {
        throw new Error(`Required field missing: ${field.label}`);
      }

      // Validate field type and constraints
      const value = configuration[field.key];
      switch (field.type) {
        case 'url':
          if (!this.isValidUrl(value)) {
            throw new Error(`Invalid URL for field: ${field.label}`);
          }
          break;
        case 'email':
          if (!this.isValidEmail(value)) {
            throw new Error(`Invalid email for field: ${field.label}`);
          }
          break;
      }
    }

    // Validate optional fields if provided
    for (const field of integration.configuration.optional) {
      if (configuration[field.key] !== undefined) {
        // Validate select options
        if (field.type === 'select' && field.options) {
          const validValues = field.options.map(opt => opt.value);
          if (!validValues.includes(configuration[field.key])) {
            throw new Error(`Invalid value for field: ${field.label}`);
          }
        }
      }
    }
  }

  /**
   * Create webhook for installed integration
   */
  async createWebhook(
    installedIntegrationId: string,
    url: string,
    events: string[]
  ): Promise<InstalledWebhook> {
    const installed = this.installedIntegrations.get(installedIntegrationId);
    if (!installed) {
      throw new Error('Installed integration not found');
    }

    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const webhook: InstalledWebhook = {
      id: webhookId,
      url,
      events,
      secret: this.generateWebhookSecret(),
      active: true,
      deliveryStats: {
        total: 0,
        successful: 0,
        failed: 0,
        retrying: 0
      }
    };

    installed.webhooks.push(webhook);
    this.webhookDeliveries.set(webhookId, []);

    return webhook;
  }

  /**
   * Send webhook delivery
   */
  async sendWebhook(
    webhookId: string,
    event: string,
    payload: any
  ): Promise<WebhookDelivery> {
    const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId,
      event,
      payload,
      attempt: 1,
      status: 'pending'
    };

    // Add to delivery queue
    const deliveries = this.webhookDeliveries.get(webhookId) || [];
    deliveries.push(delivery);
    this.webhookDeliveries.set(webhookId, deliveries);

    return delivery;
  }

  /**
   * Process webhook deliveries
   */
  private async processWebhookDeliveries(): Promise<void> {
    for (const [webhookId, deliveries] of Array.from(this.webhookDeliveries.entries())) {
      const pendingDeliveries = deliveries.filter(d => 
        d.status === 'pending' || 
        (d.status === 'retrying' && d.nextRetry && d.nextRetry <= new Date())
      );

      for (const delivery of pendingDeliveries) {
        try {
          await this.deliverWebhook(delivery);
        } catch (error) {
          console.error('Webhook delivery failed:', error);
        }
      }
    }
  }

  /**
   * Deliver individual webhook
   */
  private async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    // Find the webhook configuration
    let webhook: InstalledWebhook | null = null;
    for (const installed of this.installedIntegrations.values()) {
      webhook = installed.webhooks.find(w => w.id === delivery.webhookId) || null;
      if (webhook) break;
    }

    if (!webhook || !webhook.active) {
      delivery.status = 'failed';
      delivery.error = 'Webhook not found or inactive';
      return;
    }

    try {
      // Create webhook signature
      const signature = this.createWebhookSignature(delivery.payload, webhook.secret);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Blipee-Event': delivery.event,
          'X-Blipee-Signature': signature,
          'X-Blipee-Delivery': delivery.id,
          'User-Agent': 'Blipee-Webhooks/1.0'
        },
        body: JSON.stringify(delivery.payload)
      });

      delivery.responseStatus = response.status;
      delivery.responseBody = await response.text();

      if (response.ok) {
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();
        webhook.deliveryStats.successful++;
        webhook.lastDelivery = new Date();
      } else {
        throw new Error(`HTTP ${response.status}: ${delivery.responseBody}`);
      }
    } catch (error) {
      delivery.status = 'failed';
      delivery.error = error instanceof Error ? error.message : 'Unknown error';
      webhook.deliveryStats.failed++;

      // Retry logic
      if (delivery.attempt < 3) {
        delivery.status = 'retrying';
        delivery.attempt++;
        delivery.nextRetry = new Date(Date.now() + Math.pow(2, delivery.attempt) * 60000); // Exponential backoff
        webhook.deliveryStats.retrying++;
      }
    }

    webhook.deliveryStats.total++;
  }

  /**
   * Get installed integrations for organization
   */
  getInstalledIntegrations(organizationId: string): InstalledIntegration[] {
    return Array.from(this.installedIntegrations.values())
      .filter(installed => installed.organizationId === organizationId)
      .sort((a, b) => b.installedAt.getTime() - a.installedAt.getTime());
  }

  /**
   * Get marketplace analytics
   */
  getAnalytics(): MarketplaceAnalytics {
    // Update real-time stats
    this.analytics.totalInstalls = Array.from(this.installedIntegrations.values()).length;
    
    // Calculate monthly installs
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    this.analytics.monthlyInstalls = Array.from(this.installedIntegrations.values())
      .filter(i => i.installedAt >= lastMonth).length;

    // Update top categories
    const categoryCount = new Map<string, number>();
    for (const integration of Array.from(this.integrations.values())) {
      const count = categoryCount.get(integration.category) || 0;
      categoryCount.set(integration.category, count + integration.metadata.installCount);
    }
    
    this.analytics.topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Update top integrations
    this.analytics.topIntegrations = Array.from(this.integrations.values())
      .map(i => ({ id: i.id, name: i.name, installs: i.metadata.installCount }))
      .sort((a, b) => b.installs - a.installs)
      .slice(0, 10);

    return this.analytics;
  }

  /**
   * Helper methods
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private generateWebhookSecret(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  private createWebhookSignature(payload: any, secret: string): string {
    // In real implementation, use HMAC-SHA256
    return `sha256=${Math.random().toString(36).substr(2, 32)}`;
  }
}

/**
 * Global integration marketplace manager instance
 */
export const integrationMarketplace = new IntegrationMarketplaceManager();

/**
 * Alias for backward compatibility
 */
export const marketplaceManager = integrationMarketplace;