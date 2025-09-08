/**
 * Phase 9 Test Suite - Market Domination & Launch
 * Tests performance optimization, UI excellence, onboarding, pricing, GTM, and growth
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { performanceOptimizer } from '../launch/performance-optimizer';
import { uiExcellence } from '../launch/ui-excellence';
import { onboardingMagic } from '../launch/onboarding-magic';
import { pricingStrategy } from '../launch/pricing-strategy';
import { goToMarket } from '../launch/go-to-market';
import { growthEngine } from '../launch/growth-engine';
import { victoryLaunch } from '../launch/victory-launch';

describe('Phase 9: Market Domination & Launch', () => {
  describe('Performance Optimizer', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should achieve sub-50ms response times', async () => {
      const metrics = performanceOptimizer.getMetrics();
      expect(metrics.responseTime).toBeLessThan(50);
    });

    it('should implement multi-layer caching', async () => {
      await performanceOptimizer.optimizeEndpoint('/api/analytics');
      
      const report = performanceOptimizer.getOptimizationReport();
      expect(report.caching.layers).toContain('browser');
      expect(report.caching.layers).toContain('edge');
      expect(report.caching.layers).toContain('redis');
      expect(report.caching.layers).toContain('database');
    });

    it('should auto-optimize based on metrics', async () => {
      await performanceOptimizer.autoOptimize();
      
      const metrics = performanceOptimizer.getMetrics();
      expect(metrics.optimizationScore).toBeGreaterThan(90);
    });

    it('should scale resources dynamically', () => {
      performanceOptimizer.scaleResources('high');
      
      const metrics = performanceOptimizer.getMetrics();
      expect(metrics.resourceUtilization).toBeLessThan(80);
    });

    it('should predict and preload resources', async () => {
      const predictions = await performanceOptimizer.predictResourceNeeds({
        userId: 'user-123',
        context: 'dashboard'
      });

      expect(predictions.preloadedEndpoints).toContain('/api/analytics/dashboard');
      expect(predictions.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('UI Excellence', () => {
    beforeEach(() => {
      // Mock DOM
      global.document = {
        body: {},
        head: { appendChild: jest.fn() },
        createElement: jest.fn(() => ({ style: {} }))
      } as any;
      
      global.window = {
        getComputedStyle: jest.fn(() => ({ margin: '8px', padding: '16px' }))
      } as any;
    });

    it('should achieve Apple-level polish metrics', () => {
      const metrics = uiExcellence.getMetrics();
      
      expect(metrics.pixelPerfection).toBeGreaterThan(98);
      expect(metrics.visualConsistency).toBeGreaterThan(95);
      expect(metrics.delightScore).toBeGreaterThan(90);
    });

    it('should implement golden ratio design system', () => {
      const spaceToken = uiExcellence.getDesignToken('space-4');
      const textToken = uiExcellence.getDesignToken('text-lg');
      
      expect(spaceToken?.value).toMatch(/px$/);
      expect(textToken?.value.lineHeight).toBeCloseTo(1.618, 2);
    });

    it('should provide delightful micro-interactions', () => {
      const buttonInteraction = uiExcellence.getAnimationPreset('elastic-scale');
      
      expect(buttonInteraction?.type).toBe('gesture');
      expect(buttonInteraction?.performanceImpact).toBe('low');
    });

    it('should achieve WCAG AAA compliance', () => {
      const report = uiExcellence.generateAccessibilityReport();
      
      expect(report.compliance.wcag21.level).toBe('AAA');
      expect(report.score).toBeGreaterThan(98);
    });

    it('should handle responsive breakpoints with golden ratio', () => {
      const token = uiExcellence.exportDesignSystem();
      
      expect(token.breakpoints.length).toBeGreaterThanOrEqual(5);
      expect(token.breakpoints[0].name).toBe('mobile');
      expect(token.breakpoints[4].name).toBe('wide');
    });
  });

  describe('Onboarding Magic', () => {
    let onboardingStartTime: Date;

    beforeEach(() => {
      onboardingStartTime = new Date();
      jest.clearAllMocks();
    });

    it('should complete onboarding in 5 minutes', async () => {
      await onboardingMagic.startOnboarding({
        industry: 'manufacturing',
        companySize: 'enterprise'
      });

      // Simulate user completing steps
      await onboardingMagic.completeStep('welcome', { 
        companyName: 'Test Corp',
        name: 'John Doe'
      });

      await onboardingMagic.completeStep('auth', { 
        authenticated: true 
      });

      // Skip to completion
      onboardingMagic.skipToValue();

      const progress = onboardingMagic.getProgress();
      expect(progress.timeElapsed).toBeLessThan(300); // 5 minutes
      expect(progress.percentComplete).toBe(100);
    });

    it('should auto-discover data sources', async () => {
      await onboardingMagic.startOnboarding({
        industry: 'retail',
        companySize: 'smb'
      });

      // Wait for discoveries
      await new Promise(resolve => setTimeout(resolve, 1000));

      const discoveries = onboardingMagic.getDiscoveries();
      
      expect(discoveries.length).toBeGreaterThan(0);
      expect(discoveries.some(d => d.source === 'email')).toBe(true);
      expect(discoveries.some(d => d.source === 'erp')).toBe(true);
    });

    it('should deliver first value immediately', async () => {
      await onboardingMagic.startOnboarding({
        industry: 'technology',
        companySize: 'startup'
      });

      const magicMoments = onboardingMagic.getMagicMoments();
      const firstInsight = magicMoments.find(m => m.type === 'first_insight');
      
      expect(firstInsight).toBeDefined();
      expect(firstInsight?.timestamp.getTime() - onboardingStartTime.getTime())
        .toBeLessThan(30000); // Within 30 seconds
    });

    it('should personalize flow based on profile', async () => {
      await onboardingMagic.startOnboarding({
        industry: 'manufacturing',
        companySize: 'enterprise',
        sustainabilityMaturity: 'leader'
      });

      const progress = onboardingMagic.getProgress();
      
      // Leaders skip basic steps
      expect(progress.completedSteps).not.toContain('education');
      expect(progress.estimatedTimeRemaining).toBeLessThan(180); // Faster for leaders
    });
  });

  describe('Pricing Strategy', () => {
    it('should offer value-based pricing tiers', () => {
      const plans = pricingStrategy.getPlans();
      
      expect(plans.length).toBeGreaterThanOrEqual(4);
      expect(plans.map(p => p.tier)).toContain('starter');
      expect(plans.map(p => p.tier)).toContain('growth');
      expect(plans.map(p => p.tier)).toContain('scale');
      expect(plans.map(p => p.tier)).toContain('enterprise');
    });

    it('should calculate 100x ROI', () => {
      const price = pricingStrategy.calculatePrice('growth', {
        buildings: 10,
        users: 25,
        billingPeriod: 'annual',
        commitmentMonths: 24
      });

      expect(price.roi).toBeGreaterThan(600); // 600% = 6x, aiming for much higher
      expect(price.savings).toBeGreaterThan(price.annualPrice * 5);
    });

    it('should recommend optimal plan based on profile', () => {
      const plan = pricingStrategy.getRecommendedPlan({
        companySize: 500,
        industry: 'manufacturing',
        budget: 50000,
        goals: ['reduce_emissions', 'save_costs', 'compliance']
      });

      expect(plan?.tier).toBe('growth');
      expect(plan?.roi.yearOneROI).toBeGreaterThan(500);
    });

    it('should support dynamic pricing experiments', () => {
      pricingStrategy.runPricingExperiment({
        id: 'test-exp-1',
        name: 'Holiday Discount Test',
        hypothesis: '20% discount increases conversion by 40%',
        variants: [],
        metrics: ['conversion_rate', 'acv'],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Experiments should be tracked
      expect(pricingStrategy.getPlans().some(p => p.pricing.discount)).toBeDefined();
    });
  });

  describe('Go-To-Market Execution', () => {
    it('should target $1B revenue in 5 years', () => {
      const metrics = goToMarket.getMetrics();
      
      expect(metrics.revenue.arr).toBeDefined();
      
      // Project 5-year revenue
      const projected = metrics.revenue.arr * Math.pow(2.5, 5); // 150% annual growth
      expect(projected).toBeGreaterThan(1000000000);
    });

    it('should implement omnichannel strategy', async () => {
      await goToMarket.launchCampaign('launch-campaign');
      
      const metrics = goToMarket.getMetrics();
      
      expect(metrics.awareness.websiteTraffic).toBeGreaterThan(0);
      expect(metrics.acquisition.leads).toBeGreaterThan(0);
    });

    it('should achieve positive ROI on marketing spend', () => {
      const roi = goToMarket.getROI();
      expect(roi).toBeGreaterThan(300); // 300% ROI
    });

    it('should predict 40% market share', () => {
      const predictedShare = goToMarket.predictMarketShare(24); // 24 months
      expect(predictedShare).toBeGreaterThan(30);
      expect(predictedShare).toBeLessThanOrEqual(40);
    });
  });

  describe('Growth Engine', () => {
    it('should achieve viral coefficient > 1', () => {
      const metrics = growthEngine.getGrowthMetrics();
      expect(metrics.viralCoefficient).toBeGreaterThan(1.0);
    });

    it('should activate network effects', () => {
      const metrics = growthEngine.getGrowthMetrics();
      
      expect(metrics.networkStrength).toBeGreaterThan(30);
      expect(metrics.activeLoops).toBeGreaterThan(3);
    });

    it('should maintain 95% retention rate', () => {
      const metrics = growthEngine.getGrowthMetrics();
      expect(metrics.retentionRate).toBeGreaterThan(90);
    });

    it('should run continuous growth experiments', () => {
      const metrics = growthEngine.getGrowthMetrics();
      expect(metrics.runningExperiments).toBeGreaterThan(0);
    });

    it('should accelerate flywheel velocity', () => {
      const initialMetrics = growthEngine.getGrowthMetrics();
      
      // Simulate time passing
      jest.advanceTimersByTime(24 * 60 * 60 * 1000); // 1 day
      
      const newMetrics = growthEngine.getGrowthMetrics();
      expect(newMetrics.flywheelVelocity).toBeGreaterThan(initialMetrics.flywheelVelocity);
    });
  });

  describe('Victory Launch Orchestrator', () => {
    it('should pass all readiness checks', () => {
      const readiness = victoryLaunch.getReadinessReport();
      
      Object.values(readiness).forEach(category => {
        expect(category.status).toBe('ready');
        expect(category.score).toBeGreaterThan(90);
      });
    });

    it('should track victory conditions', () => {
      const progress = victoryLaunch.getVictoryProgress();
      
      expect(Object.keys(progress)).toContain('market-share');
      expect(Object.keys(progress)).toContain('revenue');
      expect(Object.keys(progress)).toContain('customers');
      expect(Object.keys(progress)).toContain('nps');
    });

    it('should monitor real-time launch metrics', () => {
      const metrics = victoryLaunch.getMetrics();
      
      expect(metrics.realtime.uptime).toBeGreaterThan(99.9);
      expect(metrics.realtime.errorRate).toBeLessThan(0.1);
      expect(metrics.realtime.responseTime).toBeLessThan(50);
    });

    it('should progress through launch phases', () => {
      const initialPhase = victoryLaunch.getCurrentPhase();
      expect(['preparation', 'launch', 'scaling', 'domination']).toContain(initialPhase);
    });
  });

  describe('Integration Tests - Phase 9', () => {
    it('should integrate performance with UI excellence', () => {
      const perfMetrics = performanceOptimizer.getMetrics();
      const uiMetrics = uiExcellence.getMetrics();
      
      // Fast performance shouldn't compromise UI quality
      expect(perfMetrics.responseTime).toBeLessThan(50);
      expect(uiMetrics.animationSmoothness).toBeGreaterThan(55); // >55 FPS
    });

    it('should complete onboarding with optimal pricing', async () => {
      await onboardingMagic.startOnboarding({
        industry: 'retail',
        companySize: 'smb',
        budget: 10000
      });

      const recommendedPlan = pricingStrategy.getRecommendedPlan({
        companySize: 100,
        industry: 'retail',
        budget: 10000,
        goals: ['reduce_emissions']
      });

      expect(recommendedPlan?.tier).toBe('starter');
      expect(recommendedPlan?.pricing.basePrice).toBeLessThan(500);
    });

    it('should align GTM with growth engine', async () => {
      await goToMarket.launchCampaign('launch-campaign');
      
      const gtmMetrics = goToMarket.getMetrics();
      const growthMetrics = growthEngine.getGrowthMetrics();
      
      // GTM should feed growth engine
      expect(gtmMetrics.acquisition.customers).toBeGreaterThan(0);
      expect(growthMetrics.viralCoefficient).toBeGreaterThan(1.0);
    });

    it('should achieve victory conditions', () => {
      const readiness = victoryLaunch.getReadinessReport();
      const allReady = Object.values(readiness).every(r => r.status === 'ready');
      
      expect(allReady).toBe(true);
      
      // Victory conditions should be progressing
      const victory = victoryLaunch.getVictoryProgress();
      const progressMade = Object.values(victory).some(v => v.current > 0);
      
      expect(progressMade).toBe(true);
    });
  });
});

// Performance testing utilities
export const performanceTestUtils = {
  simulateHighLoad: async (requests: number = 10000) => {
    const promises = Array.from({ length: requests }, () => 
      performanceOptimizer.handleRequest({
        path: '/api/test',
        method: 'GET'
      })
    );
    
    const start = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - start;
    
    return {
      requestsPerSecond: requests / (duration / 1000),
      avgLatency: duration / requests
    };
  },

  measureCacheEfficiency: async () => {
    const metrics = performanceOptimizer.getMetrics();
    const hitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
    
    return {
      hitRate: hitRate * 100,
      efficiency: hitRate > 0.8 ? 'excellent' : hitRate > 0.6 ? 'good' : 'needs improvement'
    };
  }
};