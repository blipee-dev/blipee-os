/**
 * Test Setup and Configuration
 *
 * Global test setup, mocks, and utilities for the compliance system test suite.
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Global test configuration
beforeAll(() => {
  // Set up global test environment
  process.env.NODE_ENV = 'test';

  // Mock external services
  setupGlobalMocks();

  // Set up test database/storage
  setupTestStorage();
});

afterAll(() => {
  // Clean up global resources
  cleanupTestStorage();

  // Restore original implementations
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();

  // Set consistent test time
  vi.setSystemTime(new Date('2024-03-15T10:00:00Z'));
});

afterEach(() => {
  // Reset system time
  vi.useRealTimers();

  // Clean up test data
  cleanupTestData();
});

/**
 * Set up global mocks for external services
 */
function setupGlobalMocks() {
  // Mock fetch for external API calls
  global.fetch = vi.fn().mockImplementation((url: string) => {
    // Mock regulatory data sources
    if (url.includes('sec.gov')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          updates: [
            {
              id: 'sec-update-1',
              title: 'Climate Disclosure Rule Update',
              date: '2024-03-01',
              impact: 'medium',
              summary: 'Updates to climate disclosure requirements'
            }
          ]
        })
      });
    }

    if (url.includes('europa.eu')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          updates: [
            {
              id: 'eu-update-1',
              title: 'CSRD Implementation Guidelines',
              date: '2024-03-01',
              impact: 'high',
              summary: 'New implementation guidelines for CSRD'
            }
          ]
        })
      });
    }

    // Default mock response
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] })
    });
  });

  // Mock console methods to reduce test noise
  global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };

  // Mock crypto for ID generation
  global.crypto = {
    ...global.crypto,
    randomUUID: vi.fn(() => 'test-uuid-123'),
    getRandomValues: vi.fn((arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  };
}

/**
 * Set up test storage/database
 */
function setupTestStorage() {
  // In a real implementation, this would set up test database connections
  // For now, we'll use in-memory storage mocks

  global.testStorage = {
    frameworks: new Map(),
    assessments: new Map(),
    reports: new Map(),
    alerts: new Map(),
    templates: new Map(),
    schedules: new Map(),
    workflows: new Map()
  };
}

/**
 * Clean up test storage
 */
function cleanupTestStorage() {
  if (global.testStorage) {
    Object.values(global.testStorage).forEach((storage: any) => {
      if (storage instanceof Map) {
        storage.clear();
      }
    });
  }
}

/**
 * Clean up test data between tests
 */
function cleanupTestData() {
  if (global.testStorage) {
    // Clear all test data
    Object.values(global.testStorage).forEach((storage: any) => {
      if (storage instanceof Map) {
        storage.clear();
      }
    });
  }
}

/**
 * Test utilities
 */
export const TestUtils = {
  /**
   * Create mock compliance data
   */
  createMockComplianceData: (overrides = {}) => ({
    organizationProfile: {
      name: 'Test Organization',
      industry: 'Technology',
      size: 'Large',
      location: 'US'
    },
    emissions: {
      scope1: 1000,
      scope2: 2000,
      scope3: 5000
    },
    governance: {
      boardOversight: true,
      climateExpertise: true,
      executiveCompensation: true
    },
    strategy: {
      climateRisks: ['physical', 'transition'],
      opportunities: ['resource_efficiency'],
      scenarioAnalysis: true
    },
    riskManagement: {
      processes: true,
      integration: true,
      assessment: true
    },
    metrics: {
      ghgEmissions: { scope1: 1000, scope2: 2000, scope3: 5000 },
      targets: true,
      financialImpact: 1000000
    },
    ...overrides
  }),

  /**
   * Create mock framework requirements
   */
  createMockRequirements: (frameworkCode: string, count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${frameworkCode.toLowerCase()}-req-${i + 1}`,
      title: `${frameworkCode} Requirement ${i + 1}`,
      description: `Test requirement ${i + 1} for ${frameworkCode}`,
      category: ['governance', 'strategy', 'risk_management', 'metrics'][i % 4],
      subcategory: 'test_subcategory',
      type: 'disclosure',
      priority: ['high', 'medium', 'low'][i % 3],
      mandatory: i < 3, // First 3 are mandatory
      frequency: 'annual',
      deadline: '2024-12-31',
      dataRequirements: [
        {
          type: `test_data_${i}`,
          category: 'environmental',
          source: 'internal',
          frequency: 'monthly',
          priority: 'medium',
          validationRules: ['non_negative'],
          estimatedCost: 1000
        }
      ],
      validationRules: ['completeness'],
      penalties: {
        type: 'financial',
        amount: 10000,
        description: 'Test penalty'
      }
    }));
  },

  /**
   * Create mock monitoring rule
   */
  createMockMonitoringRule: (overrides = {}) => ({
    id: 'test-rule-1',
    name: 'Test Monitoring Rule',
    frameworkCode: 'SEC_CLIMATE',
    type: 'score_threshold' as const,
    conditions: { scoreThreshold: 80 },
    severity: 'medium' as const,
    alertChannels: ['email'],
    enabled: true,
    ...overrides
  }),

  /**
   * Create mock report template
   */
  createMockReportTemplate: (frameworkCode: string, overrides = {}) => ({
    id: `${frameworkCode.toLowerCase()}-template`,
    frameworkCode,
    name: `${frameworkCode} Report Template`,
    description: `Test template for ${frameworkCode}`,
    version: '1.0',
    sections: [
      {
        id: 'section-1',
        title: 'Test Section',
        order: 1,
        required: true,
        subsections: [
          {
            id: 'subsection-1',
            title: 'Test Subsection',
            order: 1,
            dataRequirements: ['test_data'],
            template: 'Test template content'
          }
        ]
      }
    ],
    outputFormats: ['PDF', 'Word'],
    complianceRequirements: {
      deadlines: ['annual'],
      mandatoryFields: ['section-1'],
      validationRules: ['completeness']
    },
    metadata: {
      createdBy: 'test',
      createdAt: new Date(),
      lastModified: new Date(),
      tags: ['test']
    },
    ...overrides
  }),

  /**
   * Wait for async operations to complete
   */
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate test organization ID
   */
  generateOrgId: () => `test-org-${Date.now()}`,

  /**
   * Mock external API responses
   */
  mockApiResponse: (endpoint: string, response: any) => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes(endpoint)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response)
        });
      }
      // Fall back to original implementation for other URLs
      return originalFetch(url);
    });
  },

  /**
   * Restore original fetch implementation
   */
  restoreFetch: () => {
    vi.restoreAllMocks();
  }
};

/**
 * Custom matchers for compliance testing
 */
export const ComplianceMatchers = {
  /**
   * Check if compliance score is valid
   */
  toBeValidComplianceScore: (received: number) => {
    const pass = received >= 0 && received <= 100;
    return {
      message: () => `expected ${received} to be a valid compliance score (0-100)`,
      pass
    };
  },

  /**
   * Check if framework code is valid
   */
  toBeValidFrameworkCode: (received: string) => {
    const validCodes = ['SEC_CLIMATE', 'EU_CSRD', 'TCFD', 'GRI', 'CDP', 'SBTi', 'ISO_14001'];
    const pass = validCodes.includes(received);
    return {
      message: () => `expected ${received} to be a valid framework code`,
      pass
    };
  },

  /**
   * Check if alert has required properties
   */
  toBeValidAlert: (received: any) => {
    const requiredProps = ['id', 'organizationId', 'type', 'severity', 'createdAt'];
    const hasAllProps = requiredProps.every(prop => prop in received);
    const pass = hasAllProps &&
                ['low', 'medium', 'high', 'critical'].includes(received.severity);
    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid alert`,
      pass
    };
  }
};

// Extend expect with custom matchers
expect.extend(ComplianceMatchers);

// Global types for TypeScript
declare global {
  var testStorage: {
    frameworks: Map<string, any>;
    assessments: Map<string, any>;
    reports: Map<string, any>;
    alerts: Map<string, any>;
    templates: Map<string, any>;
    schedules: Map<string, any>;
    workflows: Map<string, any>;
  };

  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeValidComplianceScore(): any;
      toBeValidFrameworkCode(): any;
      toBeValidAlert(): any;
    }
  }
}