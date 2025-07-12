import { parseAIResponse, extractStreamContent } from '../response-parser';
import { ChatResponse, UIComponent, Action } from '@/types/conversation';

describe('response-parser', () => {
  describe('parseAIResponse', () => {
    it('should parse valid JSON response with all fields', () => {
      const jsonResponse = JSON.stringify({
        message: 'The current temperature is 22.5°C.',
        components: [
          {
            type: 'chart',
            props: { data: [1, 2, 3], title: 'Temperature Trend' },
            layout: { width: '100%' },
          },
          {
            type: 'metric',
            props: { value: 22.5, unit: '°C' },
          },
        ],
        actions: [
          {
            type: 'adjust_temperature',
            description: 'Adjust HVAC settings',
            data: { target: 23 },
          },
        ],
        suggestions: ['View hourly trend', 'Compare with yesterday'],
      });

      const result = parseAIResponse(jsonResponse);

      expect(result.message).toBe('The current temperature is 22.5°C.');
      expect(result.components).toHaveLength(2);
      expect(result.components![0].type).toBe('chart');
      expect(result.components![0].props.title).toBe('Temperature Trend');
      expect(result.components![1].type).toBe('metric');
      expect(result.actions).toHaveLength(1);
      expect(result.actions![0].type).toBe('adjust_temperature');
      expect(result.suggestions).toEqual(['View hourly trend', 'Compare with yesterday']);
    });

    it('should handle plain text response', () => {
      const plainText = 'The building is operating normally with energy usage at 4.5kW.';
      const result = parseAIResponse(plainText);

      expect(result.message).toBe(plainText);
      expect(result.components).toBeUndefined();
      expect(result.actions).toBeUndefined();
      expect(result.suggestions).toBeUndefined();
    });

    it('should handle JSON with missing fields', () => {
      const partialJson = JSON.stringify({
        message: 'Partial response',
      });

      const result = parseAIResponse(partialJson);

      expect(result.message).toBe('Partial response');
      expect(result.components).toBeUndefined();
      expect(result.actions).toBeUndefined();
      expect(result.suggestions).toBeUndefined();
    });

    it('should handle JSON with only components', () => {
      const componentOnlyJson = JSON.stringify({
        components: [
          { type: 'alert', props: { severity: 'warning', message: 'High energy usage' } },
        ],
      });

      const result = parseAIResponse(componentOnlyJson);

      expect(result.message).toBe(componentOnlyJson);
      expect(result.components).toHaveLength(1);
      expect(result.components![0].type).toBe('alert');
    });

    it('should validate and filter invalid components', () => {
      const jsonWithInvalidComponents = JSON.stringify({
        message: 'Testing invalid components',
        components: [
          { type: 'valid', props: {} },
          null,
          { props: {} }, // Missing type
          'invalid', // Not an object
          { type: 'another_valid' },
        ],
      });

      const result = parseAIResponse(jsonWithInvalidComponents);

      expect(result.components).toHaveLength(2);
      expect(result.components![0].type).toBe('valid');
      expect(result.components![1].type).toBe('another_valid');
    });

    it('should validate and filter invalid actions', () => {
      const jsonWithInvalidActions = JSON.stringify({
        message: 'Testing invalid actions',
        actions: [
          { type: 'valid_action', description: 'Do something' },
          null,
          { description: 'Missing type' },
          'invalid',
          { type: 'another_valid', data: { param: 'value' } },
        ],
      });

      const result = parseAIResponse(jsonWithInvalidActions);

      expect(result.actions).toHaveLength(2);
      expect(result.actions![0].type).toBe('valid_action');
      expect(result.actions![1].type).toBe('another_valid');
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{ "message": "Unclosed JSON';
      const result = parseAIResponse(malformedJson);

      expect(result.message).toBe(malformedJson);
      expect(result.components).toBeUndefined();
      expect(result.actions).toBeUndefined();
    });

    it('should handle non-array suggestions', () => {
      const jsonWithInvalidSuggestions = JSON.stringify({
        message: 'Test',
        suggestions: 'Not an array',
      });

      const result = parseAIResponse(jsonWithInvalidSuggestions);

      expect(result.suggestions).toBeUndefined();
    });

    it('should preserve component layout information', () => {
      const jsonWithLayout = JSON.stringify({
        message: 'Layout test',
        components: [
          {
            type: 'grid',
            props: { columns: 2 },
            layout: { span: 2, order: 1 },
          },
        ],
      });

      const result = parseAIResponse(jsonWithLayout);

      expect(result.components![0].layout).toEqual({ span: 2, order: 1 });
    });

    it('should handle empty string response', () => {
      const result = parseAIResponse('');

      expect(result.message).toBe('');
      expect(result.components).toBeUndefined();
      expect(result.actions).toBeUndefined();
    });

    it('should default missing action description to empty string', () => {
      const jsonWithNoDescription = JSON.stringify({
        message: 'Test',
        actions: [{ type: 'test_action' }],
      });

      const result = parseAIResponse(jsonWithNoDescription);

      expect(result.actions![0].description).toBe('');
    });

    it('should handle complex nested props', () => {
      const complexJson = JSON.stringify({
        message: 'Complex props test',
        components: [
          {
            type: 'dashboard',
            props: {
              widgets: [
                { id: 1, type: 'gauge', value: 75 },
                { id: 2, type: 'trend', data: [1, 2, 3, 4, 5] },
              ],
              config: {
                theme: 'dark',
                refreshRate: 5000,
                filters: { building: 'main', floor: [1, 2, 3] },
              },
            },
          },
        ],
      });

      const result = parseAIResponse(complexJson);

      expect(result.components![0].props.widgets).toHaveLength(2);
      expect(result.components![0].props.config.theme).toBe('dark');
      expect(result.components![0].props.config.filters.floor).toEqual([1, 2, 3]);
    });
  });

  describe('validateComponents', () => {
    it('should handle undefined components', () => {
      const result = parseAIResponse(JSON.stringify({ message: 'No components' }));
      expect(result.components).toBeUndefined();
    });

    it('should handle null components', () => {
      const result = parseAIResponse(JSON.stringify({ message: 'Test', components: null }));
      expect(result.components).toBeUndefined();
    });

    it('should handle non-array components', () => {
      const result = parseAIResponse(
        JSON.stringify({ message: 'Test', components: 'not an array' })
      );
      expect(result.components).toBeUndefined();
    });
  });

  describe('validateActions', () => {
    it('should handle undefined actions', () => {
      const result = parseAIResponse(JSON.stringify({ message: 'No actions' }));
      expect(result.actions).toBeUndefined();
    });

    it('should handle null actions', () => {
      const result = parseAIResponse(JSON.stringify({ message: 'Test', actions: null }));
      expect(result.actions).toBeUndefined();
    });

    it('should handle non-array actions', () => {
      const result = parseAIResponse(JSON.stringify({ message: 'Test', actions: {} }));
      expect(result.actions).toBeUndefined();
    });
  });

  describe('extractStreamContent', () => {
    it('should join chunks into a single string', () => {
      const chunks = ['Hello', ' ', 'world', '!'];
      const result = extractStreamContent(chunks);

      expect(result).toBe('Hello world!');
    });

    it('should handle empty chunks array', () => {
      const result = extractStreamContent([]);
      expect(result).toBe('');
    });

    it('should handle single chunk', () => {
      const result = extractStreamContent(['Single chunk']);
      expect(result).toBe('Single chunk');
    });

    it('should handle chunks with special characters', () => {
      const chunks = ['Temperature: ', '22.5', '°C', '\n', 'Humidity: ', '45', '%'];
      const result = extractStreamContent(chunks);

      expect(result).toBe('Temperature: 22.5°C\nHumidity: 45%');
    });

    it('should handle chunks with JSON fragments', () => {
      const chunks = ['{"message":', ' "Hello",', ' "components":', ' []}'];
      const result = extractStreamContent(chunks);

      expect(result).toBe('{"message": "Hello", "components": []}');
    });

    it('should handle chunks with empty strings', () => {
      const chunks = ['Start', '', '', 'End'];
      const result = extractStreamContent(chunks);

      expect(result).toBe('StartEnd');
    });
  });

  describe('real-world scenarios', () => {
    it('should parse sustainability report response', () => {
      const sustainabilityResponse = JSON.stringify({
        message: 'Your building generated 1,234kg CO₂ today, 15% lower than yesterday.',
        components: [
          {
            type: 'emissions_chart',
            props: {
              scope1: 234,
              scope2: 890,
              scope3: 110,
              trend: 'decreasing',
            },
          },
          {
            type: 'recommendation',
            props: {
              title: 'Reduce HVAC runtime',
              impact: '50kg CO₂/day',
              difficulty: 'easy',
            },
          },
        ],
        suggestions: [
          'View detailed breakdown',
          'Compare with similar buildings',
          'Set reduction targets',
        ],
      });

      const result = parseAIResponse(sustainabilityResponse);

      expect(result.message).toContain('1,234kg CO₂');
      expect(result.components![0].type).toBe('emissions_chart');
      expect(result.components![0].props.scope2).toBe(890);
      expect(result.components![1].type).toBe('recommendation');
      expect(result.suggestions).toHaveLength(3);
    });

    it('should parse building control response', () => {
      const controlResponse = JSON.stringify({
        message: "I've adjusted the temperature to 23°C as requested.",
        actions: [
          {
            type: 'hvac_control',
            description: 'Set temperature to 23°C',
            data: {
              zones: ['floor_1', 'floor_2'],
              setpoint: 23,
              mode: 'cooling',
            },
          },
          {
            type: 'notification',
            description: 'Notify facility manager',
            data: {
              message: 'Temperature adjusted per user request',
              priority: 'low',
            },
          },
        ],
      });

      const result = parseAIResponse(controlResponse);

      expect(result.actions).toHaveLength(2);
      expect(result.actions![0].data.setpoint).toBe(23);
      expect(result.actions![1].type).toBe('notification');
    });

    it('should handle mixed content response', () => {
      const mixedResponse = JSON.stringify({
        message: 'Here\'s your energy analysis for the past week.',
        components: [
          {
            type: 'energy_trend',
            props: {
              data: [120, 115, 118, 110, 105, 108, 112],
              unit: 'kWh',
            },
          },
        ],
        actions: [
          {
            type: 'generate_report',
            description: 'Create detailed PDF report',
          },
        ],
        suggestions: ['Analyze weekend patterns', 'Set up alerts'],
      });

      const result = parseAIResponse(mixedResponse);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('actions');
      expect(result).toHaveProperty('suggestions');
      expect(result.components![0].props.data).toHaveLength(7);
    });
  });
});
