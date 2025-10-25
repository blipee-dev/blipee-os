/**
 * Developer Portal Manager
 * Manages developer accounts, API keys, documentation, and resources
 */

export interface DeveloperAccount {
  id: string;
  email: string;
  name: string;
  company?: string;
  website?: string;
  avatar?: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending_verification';
  createdAt: Date;
  lastLoginAt?: Date;
  emailVerified: boolean;
  githubConnected: boolean;
  preferences: {
    emailUpdates: boolean;
    releaseNotes: boolean;
    communityUpdates: boolean;
    language: string;
    timezone: string;
  };
}

export interface APIKey {
  id: string;
  developerId: string;
  name: string;
  description?: string;
  key: string;
  prefix: string; // First 8 chars for display
  permissions: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
  usage: {
    totalRequests: number;
    thisMonth: number;
    lastUsed?: Date;
  };
  status: 'active' | 'inactive' | 'revoked';
  environment: 'development' | 'staging' | 'production';
  createdAt: Date;
  expiresAt?: Date;
  lastRotatedAt?: Date;
  ipWhitelist?: string[];
  webhookUrl?: string;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  deprecated: boolean;
  authentication: 'none' | 'api_key' | 'oauth' | 'jwt';
  rateLimited: boolean;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    example: any;
    validation?: string;
  }[];
  requestBody?: {
    contentType: string;
    schema: any;
    example: any;
  };
  responses: {
    [statusCode: string]: {
      description: string;
      schema: any;
      example: any;
    };
  };
  examples: CodeExample[];
  changelog: {
    version: string;
    date: Date;
    changes: string[];
  }[];
}

export interface CodeExample {
  language: string;
  title: string;
  code: string;
  description?: string;
  runnable: boolean;
}

export interface SDK {
  id: string;
  name: string;
  language: string;
  version: string;
  description: string;
  downloadUrl: string;
  documentationUrl: string;
  repositoryUrl: string;
  size: number;
  downloads: number;
  lastUpdated: Date;
  compatibility: string[];
  examples: CodeExample[];
  installation: {
    package?: string;
    command: string;
    requirements: string[];
  };
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  category: string;
  tags: string[];
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  content: TutorialStep[];
  prerequisites: string[];
  completionRate: number;
  rating: number;
  views: number;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  code?: CodeExample[];
  resources?: {
    title: string;
    url: string;
    type: 'documentation' | 'video' | 'example' | 'tool';
  }[];
}

/**
 * Developer Portal Manager
 * Central management for developer experience and resources
 */
export class DeveloperPortalManager {
  private developers: Map<string, DeveloperAccount> = new Map();
  private apiKeys: Map<string, APIKey> = new Map();
  private endpoints: Map<string, APIEndpoint> = new Map();
  private sdks: Map<string, SDK> = new Map();
  private tutorials: Map<string, Tutorial> = new Map();
  private usageAnalytics: Map<string, any> = new Map();

  constructor() {
    this.initializeEndpoints();
    this.initializeSDKs();
    this.initializeTutorials();
  }

  /**
   * Initialize API endpoints documentation
   */
  private initializeEndpoints(): void {
    const endpoints: APIEndpoint[] = [
      {
        id: 'sustainability-intelligence',
        path: '/api/sustainability/intelligence',
        method: 'POST',
        title: 'Generate Sustainability Intelligence',
        description: 'Run the sustainability intelligence engine to produce insights, recommendations, and alerts for a specific dashboard.',
        category: 'Sustainability Intelligence',
        tags: ['ai', 'sustainability', 'intelligence', 'insights'],
        version: '2025-01-01',
        deprecated: false,
        authentication: 'api_key',
        rateLimited: true,
        parameters: [
          {
            name: 'dashboardType',
            type: 'string',
            required: true,
            description: 'Dashboard to enrich with intelligence output',
            example: 'energy',
            enum: ['emissions', 'energy', 'compliance', 'targets', 'overview']
          },
          {
            name: 'rawData',
            type: 'object',
            required: false,
            description: 'Optional dashboard dataset to provide additional context (falls back to warehouse data when omitted)',
            example: { metrics: [], filters: { siteId: 'site-123' } }
          },
          {
            name: 'options',
            type: 'object',
            required: false,
            description: 'Advanced tuning options such as forcing agent execution',
            example: { refreshCache: true }
          }
        ],
        requestBody: {
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              dashboardType: { type: 'string', enum: ['emissions', 'energy', 'compliance', 'targets', 'overview'] },
              rawData: { type: 'object' },
              options: { type: 'object' }
            },
            required: ['dashboardType']
          },
          example: {
            dashboardType: 'energy',
            options: {
              refreshCache: false,
              includeBenchmarks: true
            }
          }
        },
        responses: {
          '200': {
            description: 'Intelligence package containing insights, recommendations, and alerts for the requested dashboard',
            schema: {
              type: 'object',
              properties: {
                dashboardType: { type: 'string' },
                organizationId: { type: 'string' },
                insights: { type: 'array' },
                recommendations: { type: 'array' },
                alerts: { type: 'array' },
                metrics: { type: 'object' },
                generatedAt: { type: 'string' },
                cacheHit: { type: 'boolean' }
              }
            },
            example: {
              dashboardType: 'energy',
              organizationId: 'org-456',
              insights: [
                { type: 'trend', message: 'Electricity consumption increased 12% month over month.' }
              ],
              recommendations: [
                {
                  action: 'Enable night setback schedules',
                  potentialImpact: 'Reduce baseline load by 6%',
                  priority: 'high'
                }
              ],
              alerts: [],
              metrics: {
                agentsExecuted: 5,
                executionTimeMs: 842,
                cacheHit: false
              },
              generatedAt: new Date().toISOString(),
              cacheHit: false
            }
          }
        },
        examples: [
          {
            language: 'curl',
            title: 'Generate intelligence for the energy dashboard',
            code: `curl -X POST https://api.blipee.com/api/sustainability/intelligence \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dashboardType": "energy",
    "options": {
      "refreshCache": false,
      "includeBenchmarks": true
    }
  }'`,
            runnable: true
          }
        ],
        changelog: [
          {
            version: '2025-01-01',
            date: new Date('2025-01-01'),
            changes: ['Initial sustainability intelligence endpoint release', 'Supports 5 dashboard types', 'Includes agent execution metrics']
          }
        ]
      },
      {
        id: 'organizations-list',
        path: '/api/organizations',
        method: 'GET',
        title: 'List Organizations',
        description: 'Get a list of organizations the user has access to',
        category: 'Organizations',
        tags: ['organizations', 'list'],
        version: '2024-09-01',
        deprecated: false,
        authentication: 'api_key',
        rateLimited: true,
        parameters: [
          {
            name: 'limit',
            type: 'integer',
            required: false,
            description: 'Maximum number of organizations to return (default: 50)',
            example: 50
          },
          {
            name: 'offset',
            type: 'integer',
            required: false,
            description: 'Number of organizations to skip (default: 0)',
            example: 0
          }
        ],
        responses: {
          '200': {
            description: 'List of organizations',
            schema: {
              type: 'object',
              properties: {
                organizations: { type: 'array' },
                total: { type: 'integer' },
                hasMore: { type: 'boolean' }
              }
            },
            example: {
              organizations: [
                {
                  id: 'org-123',
                  name: 'Acme Corporation',
                  slug: 'acme-corp',
                  subscription: 'enterprise'
                }
              ],
              total: 1,
              hasMore: false
            }
          }
        },
        examples: [
          {
            language: 'javascript',
            title: 'List Organizations',
            code: `const response = await fetch('https://api.blipee.com/api/organizations', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'API-Version': '2024-09-01'
  }
});
const data = await response.json();`,
            runnable: true
          }
        ],
        changelog: []
      }
    ];

    endpoints.forEach(endpoint => {
      this.endpoints.set(endpoint.id, endpoint);
    });
  }

  /**
   * Initialize SDK information
   */
  private initializeSDKs(): void {
    const sdks: SDK[] = [
      {
        id: 'javascript-sdk',
        name: 'Blipee JavaScript SDK',
        language: 'javascript',
        version: '2.1.0',
        description: 'Official JavaScript/TypeScript SDK for Node.js and browsers',
        downloadUrl: 'https://npmjs.com/package/@blipee/sdk',
        documentationUrl: 'https://docs.blipee.com/sdk/javascript',
        repositoryUrl: 'https://github.com/blipee-dev/blipee-sdk-js',
        size: 156000, // bytes
        downloads: 15420,
        lastUpdated: new Date('2024-08-30'),
        compatibility: ['Node.js 16+', 'Chrome 90+', 'Firefox 88+', 'Safari 14+'],
        installation: {
          package: '@blipee/sdk',
          command: 'npm install @blipee/sdk',
          requirements: ['Node.js 16+']
        },
        examples: [
          {
            language: 'javascript',
            title: 'Quick Start',
            code: `import { BlipeeClient } from '@blipee/sdk';

const client = new BlipeeClient({
  apiKey: 'your-api-key',
  apiVersion: '2024-09-01'
});

// Send AI chat message
const response = await client.ai.chat({
  message: 'What is our carbon footprint?'
});`,
            runnable: true
          }
        ]
      },
      {
        id: 'python-sdk',
        name: 'Blipee Python SDK',
        language: 'python',
        version: '1.8.2',
        description: 'Official Python SDK with async support and type hints',
        downloadUrl: 'https://pypi.org/project/blipee-sdk/',
        documentationUrl: 'https://docs.blipee.com/sdk/python',
        repositoryUrl: 'https://github.com/blipee-dev/blipee-sdk-python',
        size: 89000,
        downloads: 8930,
        lastUpdated: new Date('2024-08-28'),
        compatibility: ['Python 3.8+'],
        installation: {
          package: 'blipee-sdk',
          command: 'pip install blipee-sdk',
          requirements: ['Python 3.8+', 'requests>=2.28.0']
        },
        examples: [
          {
            language: 'python',
            title: 'Basic Usage',
            code: `from blipee import BlipeeClient

client = BlipeeClient(
    api_key='your-api-key',
    api_version='2024-09-01'
)

# Get AI response
response = client.ai.chat(
    message='Show me our energy trends',
    context={'building_id': 'building-123'}
)

print(response.content)`,
            runnable: true
          }
        ]
      },
      {
        id: 'go-sdk',
        name: 'Blipee Go SDK',
        language: 'go',
        version: '1.2.1',
        description: 'Lightweight Go SDK with full type safety and context support',
        downloadUrl: 'https://pkg.go.dev/github.com/blipee-dev/blipee-go',
        documentationUrl: 'https://docs.blipee.com/sdk/go',
        repositoryUrl: 'https://github.com/blipee-dev/blipee-go',
        size: 234000,
        downloads: 3450,
        lastUpdated: new Date('2024-08-25'),
        compatibility: ['Go 1.19+'],
        installation: {
          command: 'go get github.com/blipee-dev/blipee-go',
          requirements: ['Go 1.19+']
        },
        examples: [
          {
            language: 'go',
            title: 'Go Client Example',
            code: `package main

import (
    "context"
    "fmt"
    "github.com/blipee-dev/blipee-go"
)

func main() {
    client := blipee.NewClient("your-api-key")
    
    response, err := client.AI.Chat(context.Background(), &blipee.ChatRequest{
        Message: "What are our emissions this month?",
        Context: map[string]interface{}{
            "building_id": "building-123",
        },
    })
    
    if err != nil {
        panic(err)
    }
    
    fmt.Println(response.Content)
}`,
            runnable: false
          }
        ]
      }
    ];

    sdks.forEach(sdk => {
      this.sdks.set(sdk.id, sdk);
    });
  }

  /**
   * Initialize tutorials and guides
   */
  private initializeTutorials(): void {
    const tutorials: Tutorial[] = [
      {
        id: 'quickstart',
        title: 'Getting Started with Blipee API',
        description: 'Learn how to make your first API call and authenticate with Blipee',
        difficulty: 'beginner',
        duration: 15,
        category: 'Getting Started',
        tags: ['quickstart', 'authentication', 'first-steps'],
        author: 'Blipee Team',
        publishedAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-09-01'),
        prerequisites: [],
        completionRate: 92,
        rating: 4.8,
        views: 15420,
        content: [
          {
            id: 'step-1',
            title: 'Create Your Developer Account',
            content: `Welcome to Blipee! Let's get you set up with your first API integration.

First, you'll need to create a developer account and get your API key:

1. Sign up at [https://portal.blipee.com](https://portal.blipee.com)
2. Verify your email address
3. Complete your developer profile
4. Generate your first API key`,
            resources: [
              {
                title: 'Developer Portal',
                url: 'https://portal.blipee.com',
                type: 'tool'
              }
            ]
          },
          {
            id: 'step-2',
            title: 'Make Your First API Call',
            content: `Now let's make your first API call to get organization information:`,
            code: [
              {
                language: 'curl',
                title: 'Test API Connection',
                code: `curl -X GET "https://api.blipee.com/api/organizations" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "API-Version: 2024-09-01"`,
                runnable: true
              },
              {
                language: 'javascript',
                title: 'JavaScript Example',
                code: `const response = await fetch('https://api.blipee.com/api/organizations', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'API-Version': '2024-09-01'
  }
});

const data = await response.json();`,
                runnable: true
              }
            ]
          }
        ]
      },
      {
        id: 'ai-integration',
        title: 'Building AI-Powered Sustainability Apps',
        description: 'Learn how to integrate Blipee\'s AI capabilities into your application',
        difficulty: 'intermediate',
        duration: 45,
        category: 'AI Integration',
        tags: ['ai', 'chat', 'sustainability', 'integration'],
        author: 'Blipee Team',
        publishedAt: new Date('2024-08-15'),
        updatedAt: new Date('2024-09-01'),
        prerequisites: ['Basic API knowledge', 'Getting Started tutorial'],
        completionRate: 76,
        rating: 4.9,
        views: 8930,
        content: [
          {
            id: 'ai-step-1',
            title: 'Understanding Blipee AI',
            content: `Blipee's AI is designed specifically for sustainability intelligence. It can:

- Analyze building performance data
- Generate actionable insights
- Create dynamic visualizations
- Provide regulatory compliance guidance
- Suggest optimization strategies

The AI automatically selects the best model for each query, balancing cost and quality.`
          },
          {
            id: 'ai-step-2',
            title: 'Requesting Sustainability Intelligence',
            content: `Let's build a helper that calls the Sustainability Intelligence endpoint and returns structured insights:`,
            code: [
              {
                language: 'javascript',
                title: 'Intelligence request helper',
                code: `class BlipeeIntelligenceClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.blipee.com';
  }

  async generateIntelligence(dashboardType, options = {}) {
    const response = await fetch(\`\${this.baseUrl}/api/sustainability/intelligence\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dashboardType,
        options
      })
    });

    return await response.json();
  }
}

// Usage example
const intelligence = new BlipeeIntelligenceClient('your-api-key');
const response = await intelligence.generateIntelligence('energy', {
  includeBenchmarks: true,
  refreshCache: false
});`,
                runnable: true
              }
            ]
          }
        ]
      }
    ];

    tutorials.forEach(tutorial => {
      this.tutorials.set(tutorial.id, tutorial);
    });
  }

  /**
   * Create developer account
   */
  async createDeveloperAccount(accountData: Partial<DeveloperAccount>): Promise<DeveloperAccount> {
    const id = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const account: DeveloperAccount = {
      id,
      email: accountData.email!,
      name: accountData.name!,
      company: accountData.company,
      website: accountData.website,
      tier: 'free',
      status: 'pending_verification',
      createdAt: new Date(),
      emailVerified: false,
      githubConnected: false,
      preferences: {
        emailUpdates: true,
        releaseNotes: true,
        communityUpdates: false,
        language: 'en',
        timezone: 'UTC'
      }
    };

    this.developers.set(id, account);
    return account;
  }

  /**
   * Generate API key for developer
   */
  async generateAPIKey(developerId: string, keyData: {
    name: string;
    description?: string;
    environment: 'development' | 'staging' | 'production';
    permissions?: string[];
  }): Promise<APIKey> {
    const developer = this.developers.get(developerId);
    if (!developer) {
      throw new Error('Developer not found');
    }

    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const key = `sk_${keyData.environment.substring(0, 4)}_${Math.random().toString(36).substr(2, 32)}`;
    const prefix = key.substring(0, 8);

    // Set rate limits based on tier
    const rateLimits = this.getRateLimitsForTier(developer.tier);

    const apiKey: APIKey = {
      id: keyId,
      developerId,
      name: keyData.name,
      description: keyData.description,
      key,
      prefix,
      permissions: keyData.permissions || ['read:organizations', 'write:ai:chat'],
      rateLimits,
      usage: {
        totalRequests: 0,
        thisMonth: 0
      },
      status: 'active',
      environment: keyData.environment,
      createdAt: new Date()
    };

    this.apiKeys.set(keyId, apiKey);
    return apiKey;
  }

  /**
   * Get rate limits for developer tier
   */
  private getRateLimitsForTier(tier: string) {
    const limits = {
      free: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        requestsPerMonth: 100000
      },
      pro: {
        requestsPerMinute: 300,
        requestsPerHour: 10000,
        requestsPerDay: 100000,
        requestsPerMonth: 1000000
      },
      enterprise: {
        requestsPerMinute: 1000,
        requestsPerHour: 50000,
        requestsPerDay: 1000000,
        requestsPerMonth: 10000000
      }
    };

    return limits[tier as keyof typeof limits] || limits.free;
  }

  /**
   * Get all API endpoints for documentation
   */
  getEndpoints(category?: string, version?: string): APIEndpoint[] {
    let endpoints = Array.from(this.endpoints.values());
    
    if (category) {
      endpoints = endpoints.filter(e => e.category === category);
    }
    
    if (version) {
      endpoints = endpoints.filter(e => e.version === version);
    }

    return endpoints.sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Get endpoint by ID
   */
  getEndpoint(id: string): APIEndpoint | null {
    return this.endpoints.get(id) || null;
  }

  /**
   * Get all SDKs
   */
  getSDKs(): SDK[] {
    return Array.from(this.sdks.values()).sort((a, b) => b.downloads - a.downloads);
  }

  /**
   * Get SDK by language
   */
  getSDK(language: string): SDK | null {
    return Array.from(this.sdks.values()).find(sdk => sdk.language === language) || null;
  }

  /**
   * Get all tutorials
   */
  getTutorials(category?: string, difficulty?: string): Tutorial[] {
    let tutorials = Array.from(this.tutorials.values());
    
    if (category) {
      tutorials = tutorials.filter(t => t.category === category);
    }
    
    if (difficulty) {
      tutorials = tutorials.filter(t => t.difficulty === difficulty);
    }

    return tutorials.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get tutorial by ID
   */
  getTutorial(id: string): Tutorial | null {
    return this.tutorials.get(id) || null;
  }

  /**
   * Get developer account
   */
  getDeveloper(id: string): DeveloperAccount | null {
    return this.developers.get(id) || null;
  }

  /**
   * Get developer's API keys
   */
  getDeveloperAPIKeys(developerId: string): APIKey[] {
    return Array.from(this.apiKeys.values())
      .filter(key => key.developerId === developerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Track API usage for analytics
   */
  trackUsage(keyId: string, endpoint: string, responseTime: number, statusCode: number): void {
    const key = this.apiKeys.get(keyId);
    if (key) {
      key.usage.totalRequests++;
      key.usage.thisMonth++;
      key.usage.lastUsed = new Date();
      
      // Store detailed analytics
      const analyticsKey = `${keyId}:${new Date().toISOString().substring(0, 10)}`;
      const dailyStats = this.usageAnalytics.get(analyticsKey) || {
        requests: 0,
        avgResponseTime: 0,
        errors: 0,
        endpoints: new Map()
      };
      
      dailyStats.requests++;
      dailyStats.avgResponseTime = (dailyStats.avgResponseTime + responseTime) / 2;
      if (statusCode >= 400) dailyStats.errors++;
      
      const endpointStats = dailyStats.endpoints.get(endpoint) || 0;
      dailyStats.endpoints.set(endpoint, endpointStats + 1);
      
      this.usageAnalytics.set(analyticsKey, dailyStats);
    }
  }

  /**
   * Get usage analytics for developer
   */
  getUsageAnalytics(developerId: string, days: number = 30): any {
    const keys = this.getDeveloperAPIKeys(developerId);
    const analytics = {
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      topEndpoints: new Map(),
      dailyUsage: []
    };

    // Aggregate analytics across all keys
    for (const key of keys) {
      analytics.totalRequests += key.usage.thisMonth;
    }

    return analytics;
  }
}

/**
 * Global developer portal manager instance
 */
export const developerPortalManager = new DeveloperPortalManager();
