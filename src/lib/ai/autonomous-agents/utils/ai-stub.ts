/**
 * AI Service for Autonomous Agents
 *
 * Real AI interface that connects to OpenAI/DeepSeek/Anthropic
 */

import { aiService } from '../../service';

export enum TaskType {
  GENERAL_CHAT = 'general_chat',
  STRUCTURED_OUTPUT = 'structured_output',
  ANALYSIS = 'analysis',
  DECISION_MAKING = 'decision_making',
  CODE_GENERATION = 'code_generation'
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

class AIStub {
  async complete(
    prompt: string,
    taskType: TaskType = TaskType.GENERAL_CHAT,
    options: CompletionOptions = {}
  ): Promise<string> {
    try {
      // Call the REAL AI service (OpenAI/DeepSeek/Anthropic)
      const response = await aiService.complete(prompt, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2000,
        jsonMode: options.jsonMode || false
      });

      return response;
    } catch (error) {
      console.error('AI service error:', error);

      // Fallback response if AI fails
      if (options.jsonMode) {
        return JSON.stringify({
          error: "AI service unavailable",
          analysis: "Unable to complete analysis at this time",
          recommendations: ["Please try again later"],
          confidence: 0
        });
      }

      return "I apologize, but I'm having trouble processing your request right now. Please try again.";
    }
  }
}

export const aiStub = new AIStub();