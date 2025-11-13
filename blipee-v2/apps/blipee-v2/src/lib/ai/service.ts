/**
 * AI Service Wrapper
 *
 * Compatibility layer for autonomous agents to use V2's LLM infrastructure
 */

import { createChatCompletion } from '@/lib/llm/anthropic';

export interface AIServiceOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
}

export interface AIServiceResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

class AIService {
  /**
   * Complete a prompt using Claude
   */
  async complete(prompt: string, options: AIServiceOptions = {}): Promise<string> {
    try {
      const response = await createChatCompletion({
        messages: [{ role: 'user', content: prompt }],
        config: {
          temperature: options.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? 4000,
        }
      });

      return response.content;
    } catch (error) {
      console.error('[AI Service] Error completing prompt:', error);
      throw error;
    }
  }

  /**
   * Complete with full response details
   */
  async completeWithDetails(prompt: string, options: AIServiceOptions = {}): Promise<AIServiceResponse> {
    try {
      const response = await createChatCompletion({
        messages: [{ role: 'user', content: prompt }],
        config: {
          temperature: options.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? 4000,
        }
      });

      return {
        content: response.content,
        usage: response.usage ? {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          totalTokens: response.usage.totalTokens
        } : undefined
      };
    } catch (error) {
      console.error('[AI Service] Error completing prompt:', error);
      throw error;
    }
  }

  /**
   * Generate structured JSON output
   */
  async generateJSON<T = any>(prompt: string, options: AIServiceOptions = {}): Promise<T> {
    try {
      const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no explanation, just JSON.`;

      const response = await this.complete(jsonPrompt, {
        ...options,
        temperature: options.temperature ?? 0.3, // Lower temp for structured output
      });

      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(jsonStr) as T;
    } catch (error) {
      console.error('[AI Service] Error generating JSON:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for custom instances
export { AIService };
