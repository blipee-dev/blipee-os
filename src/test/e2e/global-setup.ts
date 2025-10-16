/**
 * Global E2E Test Setup
 * Phase 5, Task 5.1: Test environment preparation
 */

import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalSetup(config: FullConfig) {

  try {
    // 1. Environment validation
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'TEST_DATABASE_URL'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }


    // 2. Database setup
    
    try {
      // Run database migrations for test environment
      execSync('npm run db:migrate:test', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️ Database migration failed, continuing...', error);
    }

    // 3. Create test data
    
    await createTestUsers();
    await createTestOrganizations();
    await seedTestData();
    

    // 4. Start test services
    
    // Start mock services if needed
    if (process.env.USE_MOCK_SERVICES === 'true') {
      await startMockServices();
    }

    // 5. Verify application is running
    
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
    const maxRetries = 30;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(`${baseURL}/health`);
        if (response.ok) {
          break;
        }
        throw new Error(`Health check failed: ${response.status}`);
      } catch (error) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (retries === maxRetries) {
          throw new Error(`Application not ready after ${maxRetries} attempts`);
        }
      }
    }


  } catch (error) {
    console.error('\n❌ E2E Test Setup Failed:', error);
    throw error;
  }
}

async function createTestUsers() {
  const testUsers = [
    {
      email: 'test.user@blipee-test.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'sustainability_manager'
    },
    {
      email: 'sustainability.manager@blipee-test.com',
      password: 'TestPassword123!',
      firstName: 'Sarah',
      lastName: 'Manager',
      role: 'sustainability_manager'
    },
    {
      email: 'ai.user@blipee-test.com',
      password: 'TestPassword123!',
      firstName: 'Alex',
      lastName: 'AIUser',
      role: 'sustainability_manager'
    },
    {
      email: 'analyst@blipee-test.com',
      password: 'TestPassword123!',
      firstName: 'Anna',
      lastName: 'Analyst',
      role: 'analyst'
    }
  ];

  for (const user of testUsers) {
    try {
      const response = await fetch(`${process.env.TEST_BASE_URL || 'http://localhost:3000'}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        })
      });

      if (response.ok) {
      } else {
      }
    } catch (error) {
      console.warn(`⚠️ Failed to create user ${user.email}:`, error);
    }
  }
}

async function createTestOrganizations() {
  const testOrganizations = [
    {
      id: 'test-org-123',
      name: 'Test Organization',
      type: 'corporation'
    },
    {
      id: 'test-org-sustainability',
      name: 'Green Corp Test',
      type: 'corporation'
    },
    {
      id: 'test-org-ai',
      name: 'AI Test Corp',
      type: 'corporation'
    }
  ];

  for (const org of testOrganizations) {
    try {
      const response = await fetch(`${process.env.TEST_BASE_URL || 'http://localhost:3000'}/api/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(org)
      });

      if (response.ok) {
      } else {
      }
    } catch (error) {
      console.warn(`⚠️ Failed to create organization ${org.name}:`, error);
    }
  }
}

async function seedTestData() {
  // Seed basic emissions data for testing
  const sampleEmissions = [
    {
      organizationId: 'test-org-sustainability',
      buildingId: 'building-hq',
      scope: 'scope1',
      category: 'Natural Gas',
      amount: 1000,
      unit: 'cubic_meters',
      date: '2024-01-01',
      co2Equivalent: 1.9
    },
    {
      organizationId: 'test-org-sustainability',
      buildingId: 'building-hq',
      scope: 'scope2',
      category: 'Electricity',
      amount: 15000,
      unit: 'kwh',
      date: '2024-01-01',
      co2Equivalent: 7.5
    }
  ];

  for (const emission of sampleEmissions) {
    try {
      const response = await fetch(`${process.env.TEST_BASE_URL || 'http://localhost:3000'}/api/emissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emission)
      });

      if (response.ok) {
      }
    } catch (error) {
      console.warn(`⚠️ Failed to create emission data:`, error);
    }
  }
}

async function startMockServices() {
  // Start mock external services if needed
}

export default globalSetup;