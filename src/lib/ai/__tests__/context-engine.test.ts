import { AIContextEngine } from '../context-engine';
import { Message } from '@/types/conversation';

describe('AIContextEngine', () => {
  let contextEngine: AIContextEngine;

  beforeEach(() => {
    contextEngine = new AIContextEngine();
  });

  afterEach(() => {
    // Clean up
  });

  describe('initialization', () => {
    it('should create a new instance correctly', () => {
      expect(contextEngine).toBeDefined();
      expect(contextEngine).toBeInstanceOf(AIContextEngine);
    });

    it('should have singleton export', () => {
      const { aiContextEngine } = require('../context-engine');
      expect(aiContextEngine).toBeDefined();
      expect(aiContextEngine).toBeInstanceOf(AIContextEngine);
    });
  });

  describe('buildEnrichedContext', () => {
    it('should build complete enriched context with all components', async () => {
      const userMessage = 'What is the current energy usage?';
      const userId = 'test-user-123';

      const context = await contextEngine.buildEnrichedContext(userMessage, userId);

      expect(context).toBeDefined();
      expect(context.building).toBeDefined();
      expect(context.realTimeMetrics).toBeDefined();
      expect(context.historicalPatterns).toBeDefined();
      expect(context.environmentalFactors).toBeDefined();
      expect(context.userProfile).toBeDefined();
      expect(context.conversationMemory).toBeDefined();
      expect(context.predictiveInsights).toBeDefined();
      expect(context.deviceCapabilities).toBeDefined();
      expect(context.plannedActivities).toBeDefined();
    });

    it('should handle context building without userId', async () => {
      const userMessage = 'Show me the HVAC status';

      const context = await contextEngine.buildEnrichedContext(userMessage);

      expect(context).toBeDefined();
      expect(context.userProfile).toBeDefined();
      expect(context.userProfile.firstName).toBe('Alex');
      expect(context.userProfile.role).toBe('facility_manager');
    });

    it('should include real-time metrics with correct structure', async () => {
      const context = await contextEngine.buildEnrichedContext('test message');

      expect(context.realTimeMetrics).toMatchObject({
        energy: expect.objectContaining({
          currentUsage: expect.any(Number),
          peakToday: expect.any(Number),
          baseline: expect.any(Number),
          trend: expect.stringMatching(/^(increasing|decreasing|stable)$/),
          efficiency: expect.any(Number),
        }),
        comfort: expect.objectContaining({
          temperature: expect.objectContaining({
            current: expect.any(Number),
            target: expect.any(Number),
            zones: expect.any(Array),
          }),
          humidity: expect.objectContaining({
            current: expect.any(Number),
            target: expect.any(Number),
          }),
          airQuality: expect.objectContaining({
            co2: expect.any(Number),
            pm25: expect.any(Number),
            voc: expect.any(Number),
          }),
        }),
        occupancy: expect.objectContaining({
          current: expect.any(Number),
          capacity: expect.any(Number),
          distribution: expect.any(Array),
          patterns: expect.any(Array),
        }),
        equipment: expect.objectContaining({
          hvac: expect.any(Array),
          lighting: expect.any(Array),
          security: expect.any(Array),
          elevators: expect.any(Array),
        }),
      });
    });

    it('should include historical patterns with recommendations', async () => {
      const context = await contextEngine.buildEnrichedContext('test message');

      expect(context.historicalPatterns).toBeInstanceOf(Array);
      expect(context.historicalPatterns.length).toBeGreaterThan(0);
      
      const pattern = context.historicalPatterns[0];
      expect(pattern).toMatchObject({
        type: expect.stringMatching(/^(energy|occupancy|comfort|weather)$/),
        pattern: expect.any(String),
        confidence: expect.any(Number),
        impact: expect.stringMatching(/^(high|medium|low)$/),
        recommendations: expect.any(Array),
      });
    });

    it('should include environmental factors with weather data', async () => {
      const context = await contextEngine.buildEnrichedContext('test message');

      expect(context.environmentalFactors).toMatchObject({
        weather: expect.objectContaining({
          current: expect.objectContaining({
            temp: expect.any(Number),
            humidity: expect.any(Number),
            pressure: expect.any(Number),
          }),
          forecast: expect.any(Array),
          impact: expect.any(String),
        }),
        timeContext: expect.objectContaining({
          timeOfDay: expect.any(String),
          dayOfWeek: expect.any(String),
          season: expect.any(String),
          isHoliday: expect.any(Boolean),
          specialEvents: expect.any(Array),
        }),
        economicFactors: expect.objectContaining({
          energyPrices: expect.objectContaining({
            current: expect.any(Number),
            peak: expect.any(Number),
            offPeak: expect.any(Number),
          }),
          demandCharges: expect.objectContaining({
            threshold: expect.any(Number),
            rate: expect.any(Number),
          }),
          incentives: expect.any(Array),
        }),
      });
    });

    it('should include predictive insights with urgency levels', async () => {
      const context = await contextEngine.buildEnrichedContext('test message');

      expect(context.predictiveInsights).toBeInstanceOf(Array);
      expect(context.predictiveInsights.length).toBeGreaterThan(0);

      const insight = context.predictiveInsights[0];
      expect(insight).toMatchObject({
        type: expect.stringMatching(/^(opportunity|risk|maintenance|optimization)$/),
        prediction: expect.any(String),
        confidence: expect.any(Number),
        timeframe: expect.any(String),
        impact: expect.objectContaining({
          financial: expect.any(Number),
          operational: expect.any(String),
        }),
        recommendedAction: expect.any(String),
        urgency: expect.stringMatching(/^(low|medium|high|critical)$/),
      });
    });

    it('should include device capabilities', async () => {
      const context = await contextEngine.buildEnrichedContext('test message');

      expect(context.deviceCapabilities).toBeInstanceOf(Array);
      expect(context.deviceCapabilities.length).toBeGreaterThan(0);

      const device = context.deviceCapabilities[0];
      expect(device).toMatchObject({
        name: expect.any(String),
        capabilities: expect.any(Array),
      });
      expect(device.capabilities.length).toBeGreaterThan(0);
    });

    it('should include planned activities', async () => {
      const context = await contextEngine.buildEnrichedContext('test message');

      expect(context.plannedActivities).toBeInstanceOf(Array);
      expect(context.plannedActivities.length).toBeGreaterThan(0);

      const activity = context.plannedActivities[0];
      expect(activity).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        date: expect.any(String),
        time: expect.any(String),
        type: expect.stringMatching(/^(maintenance|meeting|inspection|event|delivery)$/),
        impact: expect.stringMatching(/^(none|low|medium|high)$/),
      });
    });
  });

  describe('generateActionPlan', () => {
    it('should generate action plan with UI specification', async () => {
      const userMessage = 'Optimize energy usage in conference rooms';
      const context = await contextEngine.buildEnrichedContext(userMessage);

      const actionPlan = await contextEngine.generateActionPlan(userMessage, context);

      expect(actionPlan).toBeDefined();
      expect(actionPlan.intent).toBeDefined();
      expect(actionPlan.steps).toBeDefined();
      expect(actionPlan.timeline).toBeDefined();
      expect(actionPlan.estimatedOutcome).toBeDefined();
      expect(actionPlan.uiSpecification).toBeDefined();
    });

    it('should include UI specification with layout', async () => {
      const userMessage = 'Show energy dashboard';
      const context = await contextEngine.buildEnrichedContext(userMessage);

      const actionPlan = await contextEngine.generateActionPlan(userMessage, context);

      expect(actionPlan.uiSpecification).toMatchObject({
        layout: expect.stringMatching(/^(single|split|grid|fullscreen)$/),
        components: expect.any(Array),
        interactions: expect.any(Array),
        animations: expect.any(Array),
      });
    });

    it('should include estimated outcome with confidence', async () => {
      const userMessage = 'Reduce energy costs';
      const context = await contextEngine.buildEnrichedContext(userMessage);

      const actionPlan = await contextEngine.generateActionPlan(userMessage, context);

      expect(actionPlan.estimatedOutcome).toMatchObject({
        financial: expect.any(Number),
        operational: expect.any(String),
        confidence: expect.any(Number),
      });
    });
  });

  describe('buildSuperchargedPrompt', () => {
    it('should build comprehensive prompt with all context', async () => {
      const userMessage = 'How can I save energy?';
      const context = await contextEngine.buildEnrichedContext(userMessage);

      const prompt = await contextEngine.buildSuperchargedPrompt(userMessage, context);

      expect(prompt).toBeDefined();
      expect(prompt).toContain('blipee');
      expect(prompt).toContain(userMessage);
      expect(prompt).toContain('CURRENT SITUATION');
      expect(prompt).toContain('CRITICAL INSIGHTS');
      expect(prompt).toContain('HISTORICAL CONTEXT');
      expect(prompt).toContain('USER PROFILE');
      expect(prompt).toContain('CONVERSATION MEMORY');
      expect(prompt).toContain('AVAILABLE CAPABILITIES');
      expect(prompt).toContain('ECONOMIC CONTEXT');
    });

    it('should include building context in prompt', async () => {
      const userMessage = 'What is the building status?';
      const context = await contextEngine.buildEnrichedContext(userMessage);

      const prompt = await contextEngine.buildSuperchargedPrompt(userMessage, context);

      expect(prompt).toContain(context.building.name);
      expect(prompt).toContain(context.realTimeMetrics.energy.currentUsage.toString());
      expect(prompt).toContain(context.realTimeMetrics.occupancy.current.toString());
    });

    it('should include high priority insights', async () => {
      const userMessage = 'Any urgent issues?';
      const context = await contextEngine.buildEnrichedContext(userMessage);

      const prompt = await contextEngine.buildSuperchargedPrompt(userMessage, context);

      const highPriorityInsights = context.predictiveInsights.filter(
        i => i.urgency === 'high' || i.urgency === 'critical'
      );

      if (highPriorityInsights.length > 0) {
        expect(prompt).toContain(highPriorityInsights[0].prediction);
      }
    });

    it('should include user preferences and goals', async () => {
      const userMessage = 'Help me with energy management';
      const context = await contextEngine.buildEnrichedContext(userMessage);

      const prompt = await contextEngine.buildSuperchargedPrompt(userMessage, context);

      expect(prompt).toContain(context.userProfile.role);
      expect(prompt).toContain(context.userProfile.expertise);
      expect(prompt).toContain(context.userProfile.preferences.communicationStyle);
      expect(prompt).toContain(context.userProfile.goals[0]);
    });

    it('should include economic context', async () => {
      const userMessage = 'What are the current energy rates?';
      const context = await contextEngine.buildEnrichedContext(userMessage);

      const prompt = await contextEngine.buildSuperchargedPrompt(userMessage, context);

      expect(prompt).toContain(
        context.environmentalFactors.economicFactors.energyPrices.current.toString()
      );
      expect(prompt).toContain(
        context.environmentalFactors.economicFactors.demandCharges.threshold.toString()
      );
    });

    it('should include instructions for AI behavior', async () => {
      const userMessage = 'Analyze building performance';
      const context = await contextEngine.buildEnrichedContext(userMessage);

      const prompt = await contextEngine.buildSuperchargedPrompt(userMessage, context);

      expect(prompt).toContain('INSTRUCTIONS:');
      expect(prompt).toContain('Understand the user\'s intent deeply');
      expect(prompt).toContain('Provide intelligent, context-aware responses');
      expect(prompt).toContain('Generate specific, actionable recommendations');
      expect(prompt).toContain('Be proactive');
    });
  });

  describe('real-time metrics generation', () => {
    it('should generate realistic energy metrics', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const energy = context.realTimeMetrics.energy;
      expect(energy.currentUsage).toBeGreaterThan(4000);
      expect(energy.currentUsage).toBeLessThan(5000);
      expect(energy.efficiency).toBeGreaterThanOrEqual(85);
      expect(energy.efficiency).toBeLessThanOrEqual(95);
    });

    it('should generate zone data with realistic values', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const zones = context.realTimeMetrics.comfort.temperature.zones;
      expect(zones).toBeInstanceOf(Array);
      expect(zones.length).toBeGreaterThan(0);

      zones.forEach(zone => {
        expect(zone.temperature).toBeGreaterThan(20);
        expect(zone.temperature).toBeLessThan(25);
        expect(zone.setpoint).toBe(22.5);
        expect(zone.occupancy).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate equipment status', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const hvacStatus = context.realTimeMetrics.equipment.hvac;
      expect(hvacStatus).toBeInstanceOf(Array);
      expect(hvacStatus.length).toBeGreaterThan(0);

      hvacStatus.forEach(equipment => {
        expect(equipment.name).toBeDefined();
        expect(equipment.status).toMatch(/^(online|maintenance)$/);
        expect(equipment.efficiency).toBeGreaterThanOrEqual(85);
        expect(equipment.efficiency).toBeLessThanOrEqual(100);
        expect(equipment.lastMaintenance).toBeDefined();
      });
    });
  });

  describe('historical pattern analysis', () => {
    it('should generate energy usage patterns', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const energyPattern = context.historicalPatterns.find(p => p.type === 'energy');
      expect(energyPattern).toBeDefined();
      expect(energyPattern?.confidence).toBeGreaterThan(0);
      expect(energyPattern?.confidence).toBeLessThanOrEqual(1);
      expect(energyPattern?.recommendations).toBeInstanceOf(Array);
      expect(energyPattern?.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate occupancy patterns', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const occupancyPattern = context.historicalPatterns.find(p => p.type === 'occupancy');
      expect(occupancyPattern).toBeDefined();
      expect(occupancyPattern?.pattern).toContain('room');
    });

    it('should generate weather impact patterns', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const weatherPattern = context.historicalPatterns.find(p => p.type === 'weather');
      expect(weatherPattern).toBeDefined();
      expect(weatherPattern?.pattern).toContain('HVAC');
      expect(weatherPattern?.impact).toBe('high');
    });
  });

  describe('predictive insights generation', () => {
    it('should generate financial opportunity insights', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const opportunity = context.predictiveInsights.find(i => i.type === 'opportunity');
      expect(opportunity).toBeDefined();
      expect(opportunity?.impact.financial).toBeGreaterThan(0);
      expect(opportunity?.confidence).toBeGreaterThan(0);
      expect(opportunity?.confidence).toBeLessThanOrEqual(1);
    });

    it('should generate maintenance predictions', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const maintenance = context.predictiveInsights.find(i => i.type === 'maintenance');
      expect(maintenance).toBeDefined();
      expect(maintenance?.urgency).toMatch(/^(low|medium|high|critical)$/);
      expect(maintenance?.recommendedAction).toBeDefined();
    });

    it('should generate optimization suggestions', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const optimization = context.predictiveInsights.find(i => i.type === 'optimization');
      expect(optimization).toBeDefined();
      expect(optimization?.timeframe).toBeDefined();
      expect(optimization?.impact.operational).toBeDefined();
    });
  });

  describe('environmental factors', () => {
    it('should include weather forecast', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const weather = context.environmentalFactors.weather;
      expect(weather.current.temp).toBeGreaterThan(50);
      expect(weather.current.temp).toBeLessThan(100);
      expect(weather.forecast).toBeInstanceOf(Array);
      expect(weather.forecast.length).toBeGreaterThan(0);
    });

    it('should include time context', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const timeContext = context.environmentalFactors.timeContext;
      expect(timeContext.timeOfDay).toMatch(/^(morning|afternoon|evening)$/);
      expect(timeContext.dayOfWeek).toMatch(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/);
      expect(timeContext.season).toBeDefined();
      expect(timeContext.isHoliday).toBeDefined();
    });

    it('should include economic factors', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const economic = context.environmentalFactors.economicFactors;
      expect(economic.energyPrices.peak).toBeGreaterThan(economic.energyPrices.offPeak);
      expect(economic.demandCharges.threshold).toBeGreaterThan(0);
      expect(economic.incentives).toBeInstanceOf(Array);
    });
  });

  describe('user profile management', () => {
    it('should maintain default user profile', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const profile = context.userProfile;
      expect(profile.firstName).toBe('Alex');
      expect(profile.expertise).toBe('intermediate');
      expect(profile.role).toBe('facility_manager');
      expect(profile.goals).toBeInstanceOf(Array);
      expect(profile.goals.length).toBeGreaterThan(0);
    });

    it('should include user preferences', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const preferences = context.userProfile.preferences;
      expect(preferences.communicationStyle).toMatch(/^(technical|business|simple)$/);
      expect(preferences.visualizationPreference).toMatch(/^(charts|3d|tables|mixed)$/);
      expect(preferences.notificationFrequency).toMatch(/^(immediate|daily|weekly)$/);
    });
  });

  describe('conversation memory', () => {
    it('should track recent topics', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const memory = context.conversationMemory;
      expect(memory.recentTopics).toBeInstanceOf(Array);
      expect(memory.recentTopics).toContain('energy optimization');
    });

    it('should track action items', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const memory = context.conversationMemory;
      expect(memory.actionItems).toBeInstanceOf(Array);
      
      if (memory.actionItems.length > 0) {
        const item = memory.actionItems[0];
        expect(item.id).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.status).toMatch(/^(pending|completed|overdue)$/);
      }
    });

    it('should track unresolved items', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const memory = context.conversationMemory;
      expect(memory.unresolved).toBeInstanceOf(Array);
      expect(memory.unresolved).toContain('Chiller maintenance scheduling');
    });
  });

  describe('device capabilities', () => {
    it('should list HVAC capabilities', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const hvac = context.deviceCapabilities.find(d => d.name === 'HVAC System');
      expect(hvac).toBeDefined();
      expect(hvac?.capabilities).toContain('temperature_control');
      expect(hvac?.capabilities).toContain('predictive_maintenance');
    });

    it('should list lighting capabilities', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const lighting = context.deviceCapabilities.find(d => d.name === 'Lighting System');
      expect(lighting).toBeDefined();
      expect(lighting?.capabilities).toContain('dimming');
      expect(lighting?.capabilities).toContain('daylight_harvesting');
    });

    it('should list energy meter capabilities', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const meters = context.deviceCapabilities.find(d => d.name === 'Energy Meters');
      expect(meters).toBeDefined();
      expect(meters?.capabilities).toContain('real_time_monitoring');
      expect(meters?.capabilities).toContain('demand_forecasting');
    });
  });

  describe('planned activities', () => {
    it('should include scheduled maintenance', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const maintenance = context.plannedActivities.find(a => a.type === 'maintenance');
      expect(maintenance).toBeDefined();
      expect(maintenance?.title).toContain('Maintenance');
      expect(maintenance?.impact).toMatch(/^(none|low|medium|high)$/);
    });

    it('should include meetings and events', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const meeting = context.plannedActivities.find(a => a.type === 'meeting');
      expect(meeting).toBeDefined();
      expect(meeting?.time).toBeDefined();
      expect(meeting?.date).toBeDefined();
    });

    it('should include inspection activities', async () => {
      const context = await contextEngine.buildEnrichedContext('test');

      const inspection = context.plannedActivities.find(a => a.type === 'inspection');
      expect(inspection).toBeDefined();
      
      if (inspection?.notifications) {
        expect(inspection.notifications).toBeInstanceOf(Array);
        expect(inspection.notifications.length).toBeGreaterThan(0);
      }
    });
  });
});