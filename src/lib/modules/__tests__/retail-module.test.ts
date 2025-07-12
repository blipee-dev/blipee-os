import { retailModule, retailModuleRegistration } from '../retail-module';
import { Module } from '../types';

describe('Retail Module', () => {
  describe('Module Definition', () => {
    it('should have correct module properties', () => {
      expect(retailModule.id).toBe('retail-intelligence');
      expect(retailModule.name).toBe('Retail Intelligence');
      expect(retailModule.icon).toBe('ShoppingBag');
      expect(retailModule.version).toBe('1.0.0');
      expect(retailModule.status).toBe('active');
      expect(retailModule.path).toBe('/retail');
      expect(retailModule.category).toBe('retail');
    });

    it('should have required permissions', () => {
      expect(retailModule.requiredPermissions).toContain('retail:read');
      expect(retailModule.requiredPermissions).toContain('retail:analytics');
    });

    it('should have correct configuration', () => {
      const config = retailModule.config;
      expect(config).toBeDefined();
      
      expect(config.features).toContain('real-time-traffic');
      expect(config.features).toContain('sales-analytics');
      expect(config.features).toContain('conversion-tracking');
      expect(config.features).toContain('ai-insights');
      expect(config.features).toContain('store-management');
    });

    it('should have API endpoints configured', () => {
      const endpoints = retailModule.config.apiEndpoints;
      expect(endpoints).toContain('/api/retail/v1/health');
      expect(endpoints).toContain('/api/retail/v1/stores');
      expect(endpoints).toContain('/api/retail/v1/analytics');
      expect(endpoints).toContain('/api/retail/v1/traffic/realtime');
    });

    it('should have integrations listed', () => {
      const integrations = retailModule.config.integrations;
      expect(integrations).toContain('viewsonic-sensors');
      expect(integrations).toContain('sales-api');
      expect(integrations).toContain('telegram-bot');
    });
  });

  describe('Module Registration', () => {
    it('should have initialization function', () => {
      expect(retailModuleRegistration.initializeServices).toBeDefined();
      expect(typeof retailModuleRegistration.initializeServices).toBe('function');
    });

    it('should have cleanup function', () => {
      expect(retailModuleRegistration.cleanup).toBeDefined();
      expect(typeof retailModuleRegistration.cleanup).toBe('function');
    });

    it('should include the module definition', () => {
      expect(retailModuleRegistration.module).toBe(retailModule);
    });
  });
});