import { describe, it, expect, jest } from '@jest/globals';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Health Check API', () => {
  it('should return health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
  });

  it('should include environment info', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty('environment');
    expect(data.environment).toBe(process.env['NODE_ENV'] || 'development');
  });
});