import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Retail Real-time Traffic API', () => {
  it('should return error when missing loja parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/retail/v1/traffic/realtime');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required parameter: loja');
  });

  it('should return real-time traffic data', async () => {
    const request = new NextRequest('http://localhost:3000/api/retail/v1/traffic/realtime?loja=OML01');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.loja).toBe('OML01');
  });

  it('should return correct traffic data structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/retail/v1/traffic/realtime?loja=OML01');
    const response = await GET(request);
    const data = await response.json();

    const traffic = data.data;
    expect(traffic).toHaveProperty('current_occupancy');
    expect(traffic).toHaveProperty('last_update');
    expect(traffic).toHaveProperty('last_hour');
    expect(traffic).toHaveProperty('trend');
    expect(traffic).toHaveProperty('regions');
    
    expect(typeof traffic.current_occupancy).toBe('number');
    expect(traffic.current_occupancy).toBeGreaterThanOrEqual(0);
    expect(traffic.current_occupancy).toBeLessThanOrEqual(500);
  });

  it('should return valid trend values', async () => {
    const request = new NextRequest('http://localhost:3000/api/retail/v1/traffic/realtime?loja=OML01');
    const response = await GET(request);
    const data = await response.json();

    const validTrends = ['increasing', 'decreasing', 'stable'];
    expect(validTrends).toContain(data.data.trend);
  });

  it('should return region occupancy data', async () => {
    const request = new NextRequest('http://localhost:3000/api/retail/v1/traffic/realtime?loja=OML01');
    const response = await GET(request);
    const data = await response.json();

    const regions = data.data.regions;
    expect(regions).toHaveProperty('region1');
    expect(regions).toHaveProperty('region2');
    expect(regions).toHaveProperty('region3');
    expect(regions).toHaveProperty('region4');
    
    // Sum of regions should not exceed 100%
    const totalOccupancy = Object.values(regions).reduce((sum: number, val: any) => sum + val, 0);
    expect(totalOccupancy).toBeLessThanOrEqual(100);
  });
});