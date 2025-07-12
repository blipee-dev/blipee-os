import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/sso/service', () => ({
  SSOService: jest.fn(() => ({
    initiateSAML: jest.fn(),
    initiateOIDC: jest.fn(),
    getProviderConfig: jest.fn()
  }))
}));

describe('SSO Initiate API', () => {
  let mockSSOService: any;

  beforeEach(() => {
    mockSSOService = new (require('@/lib/auth/sso/service').SSOService)();
  });

  describe('POST /api/auth/sso/initiate', () => {
    it('should initiate SAML SSO', async () => {
      mockSSOService.initiateSAML.mockResolvedValue({
        redirectUrl: 'https://idp.example.com/saml/auth',
        requestId: 'req123'
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sso/initiate', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'saml',
          domain: 'example.com'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.redirectUrl).toContain('idp.example.com');
    });

    it('should initiate OIDC SSO', async () => {
      mockSSOService.initiateOIDC.mockResolvedValue({
        authorizationUrl: 'https://auth.example.com/authorize',
        state: 'state123'
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sso/initiate', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'oidc',
          domain: 'example.com'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/auth/sso/initiate', () => {
    it('should return SSO options', async () => {
      mockSSOService.getProviderConfig.mockResolvedValue({
        providers: ['saml', 'oidc'],
        domains: ['example.com', 'test.com']
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sso/initiate');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.providers).toContain('saml');
    });
  });
});