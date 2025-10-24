import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { DeepSeekProvider } from "./providers/deepseek";
import { AIProvider, CompletionOptions, StreamOptions } from "./types";
import { aiCache } from "@/lib/cache";
import { parseAIJSON } from "./utils/json-parser";

export class AIService {
  private providers: AIProvider[] = [];
  private currentProviderIndex = 0;

  constructor() {
    // Initialize providers based on available API keys
    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.push(new DeepSeekProvider(process.env.DEEPSEEK_API_KEY));
    }
    if (process.env['OPENAI_API_KEY']) {
      this.providers.push(new OpenAIProvider(process.env['OPENAI_API_KEY']));
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.push(new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
    }

    if (this.providers.length === 0) {
      console.warn("No AI providers configured. Please set API keys.");
    }
  }

  async processTargetSettingQuery(query: string, organizationId: string) {
    const prompt = `
You are an expert sustainability advisor helping organizations set science-based targets. 
Analyze the user's request and provide guidance on target setting.

User Request: "${query}"
Organization ID: ${organizationId}

Please respond with a helpful message about target setting and if appropriate, provide structured target data.

Return as JSON format:
{
  "message": "Your helpful response to the user",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "targetData": {
    "target_name": "Name of the target",
    "target_type": "absolute|intensity|net_zero|renewable",
    "baseline_year": 2023,
    "baseline_value": 0,
    "target_year": 2030,
    "target_value": 0,
    "unit": "tCO2e|%|kWh",
    "scope_coverage": ["scope_1", "scope_2", "scope_3"],
    "is_science_based": true|false,
    "description": "Description of the target"
  }
}

Only include targetData if the user is clearly ready to create a specific target.
`;

    try {
      const response = await this.complete(prompt, {
        temperature: 0.7,
        jsonMode: true
      });

      if (typeof response === 'string') {
        const parseResult = parseAIJSON(response);
        if (!parseResult.success) {
          console.error('Error parsing target setting response:', parseResult.error);
          throw new Error('Failed to parse target setting response');
        }
        return parseResult.data;
      }
      return response;
    } catch (error) {
      console.error('Error in target setting query:', error);
      return {
        message: "I apologize, but I encountered an error processing your request. Please try again or be more specific about the target you'd like to set.",
        suggestions: [
          "Set a net zero target",
          "Create a renewable energy target",
          "Set up a waste reduction target"
        ]
      };
    }
  }

  async complete(prompt: string, options?: CompletionOptions) {
    if (this.providers.length === 0) {
      throw new Error("No AI providers available");
    }

    // Try to get cached response first
    const providerName = this.providers[this.currentProviderIndex]?.name;
    const cachedResponse = await aiCache.getCachedResponse(prompt, providerName, options);
    
    if (cachedResponse) {
      return cachedResponse.content || cachedResponse.error?.message || '';
    }

    let lastError: Error | null = null;

    // Try each provider with fallback
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex =
        (this.currentProviderIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];

      try {
        const response = await provider.complete(prompt, options);

        // Extract content from response
        const content = typeof response === 'string' ? response : response.content || '';

        // Cache the successful response
        await aiCache.cacheResponse(
          prompt,
          {
            content: content,
            provider: provider.name,
            model: options?.model,
            timestamp: new Date().toISOString(),
          },
          provider.name,
          options
        );

        // Rotate to next provider for load balancing
        this.currentProviderIndex = (providerIndex + 1) % this.providers.length;

        return content;
      } catch (error) {
        console.error(`${provider.name} failed:`, error);
        lastError = error as Error;
      }
    }

    throw lastError || new Error("All AI providers failed");
  }

  async *stream(prompt: string, options?: StreamOptions) {
    if (this.providers.length === 0) {
      throw new Error("No AI providers available");
    }

    let lastError: Error | null = null;

    // Try each provider with fallback
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex =
        (this.currentProviderIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];

      try {

        // Rotate to next provider for load balancing
        this.currentProviderIndex = (providerIndex + 1) % this.providers.length;

        yield* provider.stream(prompt, options);
        return;
      } catch (error) {
        console.error(`${provider.name} streaming failed:`, error);
        lastError = error as Error;
      }
    }

    throw lastError || new Error("All AI providers failed");
  }

  getAvailableProviders(): string[] {
    return this.providers.map((p) => p.name);
  }
}

// Singleton instance
export const aiService = new AIService();
