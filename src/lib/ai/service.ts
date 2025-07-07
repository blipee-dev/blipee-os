import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { DeepSeekProvider } from "./providers/deepseek";
import { AIProvider, CompletionOptions, StreamOptions } from "./types";

export class AIService {
  private providers: AIProvider[] = [];
  private currentProviderIndex = 0;

  constructor() {
    // Initialize providers based on available API keys
    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.push(new DeepSeekProvider(process.env.DEEPSEEK_API_KEY));
    }
    if (process.env.OPENAI_API_KEY) {
      this.providers.push(new OpenAIProvider(process.env.OPENAI_API_KEY));
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.push(new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
    }

    if (this.providers.length === 0) {
      console.warn("No AI providers configured. Please set API keys.");
    }
  }

  async complete(prompt: string, options?: CompletionOptions) {
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
        console.log(`Trying ${provider.name}...`);
        const response = await provider.complete(prompt, options);

        // Rotate to next provider for load balancing
        this.currentProviderIndex = (providerIndex + 1) % this.providers.length;

        return response;
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
        console.log(`Streaming with ${provider.name}...`);

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
