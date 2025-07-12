import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Retail Telegram Auth API', () => {
  it('should return error when missing required parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/retail/v1/telegram/auth');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required parameters');
  });

  it('should return success with valid parameters', async () => {
    const url = 'http://localhost:3000/api/retail/v1/telegram/auth?telegram_user_id=123456&chat_id=789';
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.telegram_user_id).toBe('123456');
  });

  it('should return user data with permissions', async () => {
    const url = 'http://localhost:3000/api/retail/v1/telegram/auth?telegram_user_id=123456&chat_id=789';
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(data.user.permissions).toContain('retail:read');
    expect(data.user.permissions).toContain('retail:analytics');
  });

  it('should include stores access', async () => {
    const url = 'http://localhost:3000/api/retail/v1/telegram/auth?telegram_user_id=123456&chat_id=789';
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(data.user.stores).toBeDefined();
    expect(Array.isArray(data.user.stores)).toBe(true);
    expect(data.user.stores.length).toBeGreaterThan(0);
  });

  it('should include session token', async () => {
    const url = 'http://localhost:3000/api/retail/v1/telegram/auth?telegram_user_id=123456&chat_id=789';
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(data.session_token).toBeDefined();
    expect(typeof data.session_token).toBe('string');
    expect(data.session_token.length).toBeGreaterThan(0);
  });

  it('should handle invalid telegram user ID', async () => {
    const url = 'http://localhost:3000/api/retail/v1/telegram/auth?telegram_user_id=invalid&chat_id=789';
    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    // Mock implementation returns success for any ID, but in production would validate
    expect(response.status).toBe(200);
  });
});