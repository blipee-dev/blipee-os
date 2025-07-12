import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

describe('Retail Analytics API', () => {
  describe('GET endpoint', () => {
    it('should return error when missing required parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/v1/analytics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return analytics data with valid parameters', async () => {
      const url = 'http://localhost:3000/api/retail/v1/analytics?loja=OML01&start_date=2025-07-12&end_date=2025-07-12';
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.loja).toBe('OML01');
      expect(data.permissions).toContain('retail:analytics');
      expect(data.user).toBe('demo@blipee.ai');
    });

    it('should return correct analytics structure', async () => {
      const url = 'http://localhost:3000/api/retail/v1/analytics?loja=OML01&start_date=2025-07-12&end_date=2025-07-12';
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      const analytics = data.data;
      expect(analytics).toHaveProperty('vendas');
      expect(analytics).toHaveProperty('trafego');
      expect(analytics).toHaveProperty('conversao');
      expect(analytics).toHaveProperty('top_performers');
      expect(analytics).toHaveProperty('regioes');
      expect(analytics).toHaveProperty('ultima_atualizacao');
    });

    it('should include user permissions in response', async () => {
      const url = 'http://localhost:3000/api/retail/v1/analytics?loja=OML01&start_date=2025-07-12&end_date=2025-07-12';
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(data.permissions).toContain('retail:read');
      expect(data.permissions).toContain('retail:write');
      expect(data.permissions).toContain('retail:analytics');
      expect(data.permissions).toContain('retail:store_management');
    });
  });

  describe('POST endpoint', () => {
    it('should handle POST requests with body', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/v1/analytics', {
        method: 'POST',
        body: JSON.stringify({
          loja: 'OML01',
          start_date: '2025-07-12',
          end_date: '2025-07-12'
        })
      });

      // Mock the json() method
      request.json = async () => ({
        loja: 'OML01',
        start_date: '2025-07-12',
        end_date: '2025-07-12'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.loja).toBe('OML01');
    });

    it('should return error for missing POST parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/v1/analytics', {
        method: 'POST'
      });

      // Mock the json() method
      request.json = async () => ({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });
  });
});