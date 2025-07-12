import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Retail Stores API', () => {
  it('should return list of stores', async () => {
    const request = new NextRequest('http://localhost:3000/api/retail/v1/stores');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.stores)).toBe(true);
    expect(data.stores.length).toBe(3);
    expect(data.total).toBe(3);
  });

  it('should return stores with correct structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/retail/v1/stores');
    const response = await GET(request);
    const data = await response.json();

    const store = data.stores[0];
    expect(store).toHaveProperty('id');
    expect(store).toHaveProperty('name');
    expect(store).toHaveProperty('code');
    expect(store).toHaveProperty('is_active');
    expect(store).toHaveProperty('location');
  });

  it('should include specific store codes', async () => {
    const request = new NextRequest('http://localhost:3000/api/retail/v1/stores');
    const response = await GET(request);
    const data = await response.json();

    const storeCodes = data.stores.map(s => s.code);
    expect(storeCodes).toContain('OML01');
    expect(storeCodes).toContain('OML02');
    expect(storeCodes).toContain('ONL01');
  });
});