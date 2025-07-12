import { describe, it, expect } from '@jest/globals';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/monitoring/health', () => {
  it('should return health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/monitoring/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.uptime).toBeDefined();
    expect(data.version).toBeDefined();
  });

  it('should include service checks', async () => {
    const request = new NextRequest('http://localhost:3000/api/monitoring/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.services).toBeDefined();
    expect(data.services.database).toBeDefined();
    expect(data.services.redis).toBeDefined();
    expect(data.services.ai).toBeDefined();
  });

  it('should return degraded status if services fail', async () => {
    // Mock service failure
    const request = new NextRequest('http://localhost:3000/api/monitoring/health', {
      headers: { 'X-Force-Failure': 'database' }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('degraded');
    expect(data.services.database.status).toBe('unhealthy');
  });
});