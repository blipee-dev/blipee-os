import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const aiResponseTime = new Rate('ai_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 200 },   // Spike to 200 users
    { duration: '2m', target: 100 },   // Back to 100 users
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Test data
const testQueries = [
  'What is our current energy usage?',
  'Show me emissions data for last month',
  'How can we reduce our carbon footprint?',
  'Generate sustainability report',
  'What are the temperature settings?',
  'Show me cost savings opportunities',
  'Analyze building performance',
  'What equipment needs maintenance?',
];

const testOrganizations = ['org-1', 'org-2', 'org-3'];
const testBuildings = ['building-1', 'building-2', 'building-3'];

// Setup function
export function setup() {
  // Warm up cache
  console.log('Warming up cache...');
  const warmupRequests = 5;
  
  for (let i = 0; i < warmupRequests; i++) {
    http.get(`${BASE_URL}/api/monitoring/health`);
  }
  
  return {
    startTime: new Date().toISOString(),
  };
}

// Main test scenario
export default function (data) {
  // Test 1: Health check endpoint
  const healthRes = http.get(`${BASE_URL}/api/monitoring/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test 2: Performance metrics endpoint
  const metricsRes = http.get(`${BASE_URL}/api/monitoring/metrics?range=1h`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });
  check(metricsRes, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.system && body.application;
      } catch {
        return false;
      }
    },
  });

  sleep(2);

  // Test 3: AI Chat endpoint (main load test)
  const query = randomItem(testQueries);
  const orgId = randomItem(testOrganizations);
  const buildingId = randomItem(testBuildings);

  const chatPayload = JSON.stringify({
    message: query,
    organizationId: orgId,
    buildingId: buildingId,
  });

  const chatParams = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  };

  const startTime = new Date().getTime();
  const chatRes = http.post(`${BASE_URL}/api/ai/chat`, chatPayload, chatParams);
  const responseTime = new Date().getTime() - startTime;

  // Check AI response
  const chatChecks = check(chatRes, {
    'AI chat status is 200': (r) => r.status === 200,
    'AI chat has message': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.message && body.message.length > 0;
      } catch {
        return false;
      }
    },
    'AI response time < 5s': (r) => r.timings.duration < 5000,
    'AI response is cached': (r) => {
      const body = JSON.parse(r.body);
      return body.cached === true;
    },
  });

  // Record custom metrics
  errorRate.add(!chatChecks);
  aiResponseTime.add(responseTime < 5000);

  sleep(randomIntBetween(3, 7));

  // Test 4: Static asset loading
  const staticRes = http.get(`${BASE_URL}/_next/static/chunks/main.js`);
  check(staticRes, {
    'static asset status is 200': (r) => r.status === 200,
    'static asset cached': (r) => r.headers['Cache-Control'] && r.headers['Cache-Control'].includes('max-age=31536000'),
  });

  sleep(1);
}

// Utility function
function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Teardown function
export function teardown(data) {
  console.log(`Load test completed. Started at: ${data.startTime}`);
  
  // Send summary to monitoring
  const summary = {
    startTime: data.startTime,
    endTime: new Date().toISOString(),
    testType: 'load',
  };
  
  http.post(`${BASE_URL}/api/monitoring/test-complete`, JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  });
}