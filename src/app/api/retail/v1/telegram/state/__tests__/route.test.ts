import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

describe('Retail Telegram State API', () => {
  describe('GET endpoint', () => {
    it('should return error when missing telegram_user_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/v1/telegram/state');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameter: telegram_user_id');
    });

    it('should return user state with valid ID', async () => {
      const url = 'http://localhost:3000/api/retail/v1/telegram/state?telegram_user_id=123456';
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.state).toBeDefined();
    });

    it('should return correct state structure', async () => {
      const url = 'http://localhost:3000/api/retail/v1/telegram/state?telegram_user_id=123456';
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(data.state).toHaveProperty('telegram_user_id');
      expect(data.state).toHaveProperty('current_store');
      expect(data.state).toHaveProperty('last_command');
      expect(data.state).toHaveProperty('preferences');
      expect(data.state).toHaveProperty('last_active');
    });

    it('should return default preferences', async () => {
      const url = 'http://localhost:3000/api/retail/v1/telegram/state?telegram_user_id=123456';
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(data.state.preferences.language).toBe('en');
      expect(data.state.preferences.notifications).toBe(true);
      expect(data.state.preferences.report_frequency).toBe('daily');
    });
  });

  describe('POST endpoint', () => {
    it('should update user state', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/v1/telegram/state', {
        method: 'POST',
        body: JSON.stringify({
          telegram_user_id: '123456',
          current_store: 'OML02',
          preferences: {
            language: 'pt',
          },
        }),
      });

      // Mock the json() method
      request.json = async () => ({
        telegram_user_id: '123456',
        current_store: 'OML02',
        preferences: {
          language: 'pt',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('State updated');
    });

    it('should return error when missing telegram_user_id in POST', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/v1/telegram/state', {
        method: 'POST',
      });

      // Mock the json() method
      request.json = async () => ({
        current_store: 'OML02',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameter: telegram_user_id');
    });

    it('should merge preferences on update', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/v1/telegram/state', {
        method: 'POST',
        body: JSON.stringify({
          telegram_user_id: '123456',
          preferences: {
            report_frequency: 'weekly',
          },
        }),
      });

      // Mock the json() method
      request.json = async () => ({
        telegram_user_id: '123456',
        preferences: {
          report_frequency: 'weekly',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.updated_state.preferences.report_frequency).toBe('weekly');
      // Other preferences should remain unchanged
      expect(data.updated_state.preferences.language).toBe('en');
      expect(data.updated_state.preferences.notifications).toBe(true);
    });

    it('should update last_active timestamp', async () => {
      const before = new Date().toISOString();
      
      const request = new NextRequest('http://localhost:3000/api/retail/v1/telegram/state', {
        method: 'POST',
        body: JSON.stringify({
          telegram_user_id: '123456',
          last_command: 'sales',
        }),
      });

      // Mock the json() method
      request.json = async () => ({
        telegram_user_id: '123456',
        last_command: 'sales',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(new Date(data.updated_state.last_active).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
    });
  });
});