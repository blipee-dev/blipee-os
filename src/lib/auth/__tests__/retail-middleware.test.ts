import { NextRequest, NextResponse } from 'next/server';
import { withRetailAuth, getRetailContext, withRetailPermission } from '../retail-middleware';
import { RETAIL_PERMISSIONS } from '../retail-permissions';

describe('Retail Middleware', () => {
  describe('withRetailAuth', () => {
    it('should allow access with valid permissions', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/test');
      const result = await withRetailAuth(request, RETAIL_PERMISSIONS.READ);

      expect(result).toBeNull(); // Null means continue
      expect((request as any).retailContext).toBeDefined();
    });

    it('should include user context in request', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/test');
      await withRetailAuth(request, RETAIL_PERMISSIONS.READ);

      const context = getRetailContext(request);
      expect(context.user.email).toBe('demo@blipee.ai');
      expect(context.user.roles).toContain('retail_manager');
      expect(context.organization.type).toBe('retail');
    });

    it('should check for specific permission', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/test');
      
      // Mock user has retail_manager role, which includes analytics permission
      const result = await withRetailAuth(request, RETAIL_PERMISSIONS.ANALYTICS);
      expect(result).toBeNull();
    });
  });

  describe('getRetailContext', () => {
    it('should retrieve context from request', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/test');
      await withRetailAuth(request);

      const context = getRetailContext(request);
      expect(context).toBeDefined();
      expect(context.user).toBeDefined();
      expect(context.organization).toBeDefined();
      expect(context.permissions).toBeInstanceOf(Array);
    });
  });

  describe('withRetailPermission', () => {
    it('should wrap handler with permission check', async () => {
      const mockHandler = jest.fn(async (req, context) => {
        return NextResponse.json({ success: true, user: context.user.email });
      });

      const protectedHandler = withRetailPermission(RETAIL_PERMISSIONS.READ, mockHandler);
      const request = new NextRequest('http://localhost:3000/api/retail/test');

      const response = await protectedHandler(request);
      const data = await response.json();

      expect(mockHandler).toHaveBeenCalled();
      expect(data.success).toBe(true);
      expect(data.user).toBe('demo@blipee.ai');
    });

    it('should pass context to handler', async () => {
      let capturedContext: any;
      const mockHandler = jest.fn(async (req, context) => {
        capturedContext = context;
        return NextResponse.json({ success: true });
      });

      const protectedHandler = withRetailPermission(RETAIL_PERMISSIONS.ANALYTICS, mockHandler);
      const request = new NextRequest('http://localhost:3000/api/retail/test');

      await protectedHandler(request);

      expect(capturedContext).toBeDefined();
      expect(capturedContext.user.email).toBe('demo@blipee.ai');
      expect(capturedContext.permissions).toContain('retail:analytics');
    });

    it('should include correct permissions in context', async () => {
      const request = new NextRequest('http://localhost:3000/api/retail/test');
      await withRetailAuth(request);

      const context = getRetailContext(request);
      
      // retail_manager should have these permissions
      expect(context.permissions).toContain('retail:read');
      expect(context.permissions).toContain('retail:write');
      expect(context.permissions).toContain('retail:analytics');
      expect(context.permissions).toContain('retail:store_management');
      
      // sustainability_manager should also contribute
      expect(context.permissions).toContain('retail:read');
    });
  });
});