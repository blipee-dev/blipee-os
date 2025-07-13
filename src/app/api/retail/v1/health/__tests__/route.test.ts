import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Retail Health API', () => {
  it('should return healthy status', async () => {
    const _request = new NextRequest('http://localhost:3000/api/retail/v1/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.module).toBe('retail-intelligence');
    expect(data.checks.api).toBe(true);
    expect(data.checks.database).toBe(true);
    expect(data.version).toBe('1.0.0');
  });

  it('should include timestamp', async () => {
    const _request = new NextRequest('http://localhost:3000/api/retail/v1/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
  });
});