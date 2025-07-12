import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ContextEngine } from '../context-engine';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/data/weather-service');
jest.mock('@/lib/data/carbon-service');

describe('AI Context Engine - Complete Tests', () => {
  let contextEngine: ContextEngine;
  let mockSupabase: any;

  beforeEach(() => {
    contextEngine = new ContextEngine();
    mockSupabase = createClient();
  });

  describe('Context Building', () => {
    it('should build comprehensive context from multiple sources', async () => {
      // Mock building data
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'building123',
                name: 'Main Office',
                size: 50000,
                type: 'office',
                location: { lat: 37.7749, lng: -122.4194 }
              }
            }))
          }))
        }))
      }));

      // Mock weather data
      const { WeatherService } = require('@/lib/data/weather-service');
      WeatherService.prototype.getCurrentWeather = jest.fn().mockResolvedValue({
        temp: 72,
        humidity: 65,
        conditions: 'sunny'
      });

      // Mock carbon data
      const { CarbonService } = require('@/lib/data/carbon-service');
      CarbonService.prototype.getGridEmissions = jest.fn().mockResolvedValue({
        carbonIntensity: 150,
        energyMix: { renewable: 45, fossil: 55 }
      });

      const context = await contextEngine.buildContext({
        userId: 'user123',
        buildingId: 'building123',
        includeWeather: true,
        includeCarbon: true,
        includeHistory: true
      });

      expect(context).toHaveProperty('building');
      expect(context).toHaveProperty('weather');
      expect(context).toHaveProperty('carbon');
      expect(context).toHaveProperty('userPreferences');
      expect(context.building.name).toBe('Main Office');
      expect(context.weather.temp).toBe(72);
      expect(context.carbon.carbonIntensity).toBe(150);
    });

    it('should handle missing data gracefully', async () => {
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Not found' }
            }))
          }))
        }))
      }));

      const context = await contextEngine.buildContext({
        userId: 'user123',
        buildingId: 'invalid'
      });

      expect(context).toHaveProperty('error');
      expect(context.fallbackContext).toBeDefined();
    });

    it('should cache context for performance', async () => {
      const spy = jest.spyOn(mockSupabase, 'from');

      // First call
      await contextEngine.buildContext({
        userId: 'user123',
        buildingId: 'building123'
      });

      // Second call should use cache
      await contextEngine.buildContext({
        userId: 'user123',
        buildingId: 'building123'
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context Enhancement', () => {
    it('should enhance context with historical patterns', async () => {
      const baseContext = {
        building: { id: 'building123' },
        timeRange: '30d'
      };

      const enhanced = await contextEngine.enhanceWithHistory(baseContext);

      expect(enhanced).toHaveProperty('patterns');
      expect(enhanced).toHaveProperty('anomalies');
      expect(enhanced).toHaveProperty('predictions');
    });

    it('should add regulatory context', async () => {
      const context = await contextEngine.addRegulatoryContext({
        building: { location: { country: 'US', state: 'CA' } }
      });

      expect(context.regulations).toContain('Title 24');
      expect(context.regulations).toContain('AB 32');
      expect(context.incentives).toBeDefined();
    });
  });

  describe('Real-time Context Updates', () => {
    it('should update context on real-time events', async () => {
      const callback = jest.fn();
      
      contextEngine.subscribeToUpdates('building123', callback);

      // Simulate real-time event
      await contextEngine.handleRealtimeEvent({
        type: 'building.updated',
        buildingId: 'building123',
        changes: { energyUsage: 1500 }
      });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          updated: true,
          changes: expect.any(Object)
        })
      );
    });
  });
});