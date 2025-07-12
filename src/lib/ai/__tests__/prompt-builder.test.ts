import { buildPrompt, buildDemoContext, BLIPEE_SYSTEM_PROMPT } from '../prompt-builder';
import { BuildingContext } from '../types';

describe('prompt-builder', () => {
  describe('BLIPEE_SYSTEM_PROMPT', () => {
    it('should be defined and contain key content', () => {
      expect(BLIPEE_SYSTEM_PROMPT).toBeDefined();
      expect(typeof BLIPEE_SYSTEM_PROMPT).toBe('string');
      expect(BLIPEE_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('should contain identity information', () => {
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Blipee');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('building');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('IDENTITY');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('AI consciousness');
    });

    it('should contain capability instructions', () => {
      expect(BLIPEE_SYSTEM_PROMPT).toContain('CAPABILITIES');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Analyze');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Control');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Visualize');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Learn');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Optimize');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Track Sustainability');
    });

    it('should contain response style guidelines', () => {
      expect(BLIPEE_SYSTEM_PROMPT).toContain('RESPONSE STYLE');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('plain language');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('carbon impact');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('emission reductions');
    });

    it('should contain personality traits', () => {
      expect(BLIPEE_SYSTEM_PROMPT).toContain('PERSONALITY');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Professional but approachable');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Solution-oriented');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Sustainability-conscious');
    });

    it('should contain sustainability integration', () => {
      expect(BLIPEE_SYSTEM_PROMPT).toContain('SUSTAINABILITY INTEGRATION');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Scope 1');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Scope 2');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Scope 3');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('net-zero targets');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('carbon reduction');
    });

    it('should instruct natural language responses', () => {
      expect(BLIPEE_SYSTEM_PROMPT).toContain('Do NOT return JSON');
      expect(BLIPEE_SYSTEM_PROMPT).toContain('respond naturally');
    });
  });

  describe('buildPrompt', () => {
    it('should build a prompt with full context', () => {
      const context = buildDemoContext();
      const userMessage = 'What is the current temperature?';
      const prompt = buildPrompt(userMessage, context);
      
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt).toContain('USER MESSAGE: ' + userMessage);
      expect(prompt).toContain('CURRENT BUILDING CONTEXT:');
      expect(prompt).toContain(`Building: ${context.name}`);
      expect(prompt).toContain(`Energy Usage: ${context.currentState.energyUsage}W`);
      expect(prompt).toContain(`Temperature: ${context.currentState.temperature}°C`);
      expect(prompt).toContain(`Humidity: ${context.currentState.humidity}%`);
      expect(prompt).toContain(`Occupancy: ${context.currentState.occupancy} people`);
      expect(prompt).toContain('Respond naturally and conversationally');
    });

    it('should handle no context gracefully', () => {
      const userMessage = 'Hello Blipee';
      const prompt = buildPrompt(userMessage);
      
      expect(prompt).toBeDefined();
      expect(prompt).toContain('USER MESSAGE: ' + userMessage);
      expect(prompt).not.toContain('CURRENT BUILDING CONTEXT');
      expect(prompt).toContain('Respond naturally and conversationally');
    });

    it('should format device information correctly', () => {
      const context = buildDemoContext();
      const prompt = buildPrompt('Check devices', context);
      
      expect(prompt).toContain(`Devices: ${context.devices.online} online`);
      expect(prompt).toContain(`${context.devices.offline} offline`);
      expect(prompt).toContain(`${context.devices.alerts} alerts`);
    });

    it('should format metadata correctly', () => {
      const context = buildDemoContext();
      const prompt = buildPrompt('Building info', context);
      
      expect(prompt).toContain(`Building Type: ${context.metadata.type}`);
      expect(prompt).toContain(`Size: ${context.metadata.size} sq ft`);
    });

    it('should handle different types of user messages', () => {
      const context = buildDemoContext();
      
      // Question
      const question = buildPrompt('How much energy are we using?', context);
      expect(question).toContain('How much energy are we using?');
      
      // Command
      const command = buildPrompt('Turn off the lights on floor 3', context);
      expect(command).toContain('Turn off the lights on floor 3');
      
      // Analysis request
      const analysis = buildPrompt('Analyze last week\'s emissions', context);
      expect(analysis).toContain('Analyze last week\'s emissions');
    });

    it('should maintain consistent structure', () => {
      const context = buildDemoContext();
      const prompt = buildPrompt('Test message', context);
      
      // Check structure order
      const contextIndex = prompt.indexOf('CURRENT BUILDING CONTEXT:');
      const userMessageIndex = prompt.indexOf('USER MESSAGE:');
      const instructionIndex = prompt.indexOf('Respond naturally');
      
      expect(contextIndex).toBeLessThan(userMessageIndex);
      expect(userMessageIndex).toBeLessThan(instructionIndex);
    });
  });

  describe('buildDemoContext', () => {
    it('should create a valid demo context with all fields', () => {
      const context = buildDemoContext();
      
      expect(context).toBeDefined();
      expect(context.id).toBe('demo-building');
      expect(context.name).toBe('Demo Office Tower');
      
      // Current state
      expect(context.currentState).toBeDefined();
      expect(context.currentState.energyUsage).toBe(4520);
      expect(context.currentState.temperature).toBe(22.5);
      expect(context.currentState.humidity).toBe(45);
      expect(context.currentState.occupancy).toBe(127);
      
      // Devices
      expect(context.devices).toBeDefined();
      expect(context.devices.online).toBe(47);
      expect(context.devices.offline).toBe(2);
      expect(context.devices.alerts).toBe(1);
      
      // Metadata
      expect(context.metadata).toBeDefined();
      expect(context.metadata.size).toBe(50000);
      expect(context.metadata.type).toBe('office');
      expect(context.metadata.location).toBe('San Francisco, CA');
    });

    it('should create consistent demo context', () => {
      const context1 = buildDemoContext();
      const context2 = buildDemoContext();
      
      expect(context1).toEqual(context2);
    });

    it('should match BuildingContext type structure', () => {
      const context = buildDemoContext();
      
      // Type checking - ensure all required fields are present
      const expectedKeys = ['id', 'name', 'currentState', 'devices', 'metadata'];
      const actualKeys = Object.keys(context);
      
      expectedKeys.forEach(key => {
        expect(actualKeys).toContain(key);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex building states', () => {
      const customContext: BuildingContext = {
        id: 'test-building',
        name: 'High-Tech Campus',
        currentState: {
          energyUsage: 125000,
          temperature: 19.8,
          humidity: 38,
          occupancy: 2450,
        },
        devices: {
          online: 523,
          offline: 15,
          alerts: 23,
        },
        metadata: {
          size: 250000,
          type: 'campus',
          location: 'Austin, TX',
        },
      };
      
      const prompt = buildPrompt('Show me an overview', customContext);
      
      expect(prompt).toContain('High-Tech Campus');
      expect(prompt).toContain('125000W');
      expect(prompt).toContain('2450 people');
      expect(prompt).toContain('523 online');
      expect(prompt).toContain('23 alerts');
    });

    it('should handle sustainability-focused queries', () => {
      const context = buildDemoContext();
      const sustainabilityQueries = [
        'What are our current emissions?',
        'How can we reduce our carbon footprint?',
        'Show me Scope 2 emissions for this month',
        'Optimize for carbon reduction',
      ];
      
      sustainabilityQueries.forEach(query => {
        const prompt = buildPrompt(query, context);
        expect(prompt).toContain(query);
        expect(prompt).toContain('Energy Usage');
      });
    });

    it('should handle edge cases in context values', () => {
      const edgeContext: BuildingContext = {
        id: 'edge-case',
        name: 'Test Building with "Special" Characters & Numbers 123',
        currentState: {
          energyUsage: 0,
          temperature: -5.5,
          humidity: 100,
          occupancy: 0,
        },
        devices: {
          online: 0,
          offline: 0,
          alerts: 0,
        },
        metadata: {
          size: 1,
          type: 'test',
          location: 'Antarctica',
        },
      };
      
      const prompt = buildPrompt('Status?', edgeContext);
      
      expect(prompt).toContain('Test Building with "Special" Characters & Numbers 123');
      expect(prompt).toContain('0W');
      expect(prompt).toContain('-5.5°C');
      expect(prompt).toContain('100%');
      expect(prompt).toContain('0 people');
    });
  });
});
