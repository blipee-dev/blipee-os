import { describe, it, expect } from '@jest/globals';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const _request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
      version: expect.any(String),
      environment: expect.any(String)
    });
  });

  it('should include uptime', async () => {
    const _request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.uptime).toBeGreaterThan(0);
  });
});