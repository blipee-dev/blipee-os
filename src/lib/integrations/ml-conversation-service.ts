/**
 * ML-Powered Conversation Service
 *
 * Integrates ML models (Prophet forecasts, quality predictions) with conversations.
 * Part of FASE 3 - Integration & Production Readiness
 *
 * Features:
 * - Smart reply suggestions based on conversation context
 * - Conversation quality prediction
 * - Prophet forecast integration for data-driven responses
 * - Context-aware recommendations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

interface SmartReply {
  text: string;
  confidence: number;
  category: 'answer' | 'clarification' | 'followup' | 'data_insight';
  reasoning: string;
}

interface ConversationQualityPrediction {
  predictedQuality: number; // 0-100
  confidence: number; // 0-1
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }>;
  recommendations: string[];
}

interface ForecastInsight {
  metricType: string;
  currentValue: number;
  predictedValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  timeframe: string;
  recommendation: string;
}

export class MLConversationService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Generate smart reply suggestions for a conversation
   */
  async generateSmartReplies(
    conversationId: string,
    context?: string
  ): Promise<SmartReply[]> {
    try {
      // Get conversation history
      const { data: messages } = await this.supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (!messages || messages.length === 0) {
        return [];
      }

      // Get conversation context
      const { data: conversationContext } = await this.supabase
        .from('conversation_contexts')
        .select('context_data')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      const contextData = conversationContext?.context_data || {};

      // Prepare conversation history for AI
      const conversationHistory = messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      // Get relevant forecast data if available
      const forecastInsights = await this.getForecastInsights(conversationId);
      const forecastContext = forecastInsights.length > 0
        ? `\n\nRelevant forecast insights:\n${forecastInsights.map(f =>
            `- ${f.metricType}: ${f.trend} (${f.recommendation})`
          ).join('\n')}`
        : '';

      const prompt = `Analyze this conversation and generate 3 smart reply suggestions.

Conversation history:
${conversationHistory}

Current context: ${JSON.stringify(contextData)}
${forecastContext}
${context ? `\nAdditional context: ${context}` : ''}

Generate 3 different reply suggestions as JSON array:
[
  {
    "text": "Reply text here",
    "confidence": 0.85,
    "category": "answer|clarification|followup|data_insight",
    "reasoning": "Brief explanation of why this reply is suggested"
  },
  ...
]

Make replies:
1. Contextually relevant to the conversation
2. Use forecast insights when appropriate
3. Be helpful and actionable
4. Vary in style (direct answer, clarifying question, data-driven insight)`;

      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt,
        temperature: 0.7,
        maxTokens: 800,
      });

      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const replies = JSON.parse(cleanedText);

      return replies as SmartReply[];
    } catch (error) {
      console.error('Error generating smart replies:', error);
      return [];
    }
  }

  /**
   * Predict conversation quality based on current state
   */
  async predictConversationQuality(
    conversationId: string
  ): Promise<ConversationQualityPrediction | null> {
    try {
      // Get conversation data
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (!conversation) {
        return null;
      }

      // Get message count and recent messages
      const { data: messages } = await this.supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) {
        return null;
      }

      // Calculate response times
      const responseTimes: number[] = [];
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
          const userTime = new Date(messages[i].created_at).getTime();
          const assistantTime = new Date(messages[i + 1].created_at).getTime();
          responseTimes.push(assistantTime - userTime);
        }
      }

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

      // Get feedback if available
      const { data: feedbacks } = await this.supabase
        .from('conversation_feedback')
        .select('feedback_type')
        .eq('conversation_id', conversationId);

      const feedbackScore = feedbacks && feedbacks.length > 0
        ? feedbacks.filter(f => f.feedback_type === 'thumbs_up').length / feedbacks.length
        : 0.5;

      // Calculate quality factors
      const factors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral'; weight: number }> = [];

      // Factor 1: Message count
      if (messages.length < 3) {
        factors.push({ factor: 'Too few messages for quality assessment', impact: 'neutral', weight: 0 });
      } else if (messages.length >= 5 && messages.length <= 15) {
        factors.push({ factor: 'Good conversation length', impact: 'positive', weight: 0.2 });
      } else if (messages.length > 20) {
        factors.push({ factor: 'Conversation may be too long', impact: 'negative', weight: -0.1 });
      }

      // Factor 2: Response time
      if (avgResponseTime < 2000) {
        factors.push({ factor: 'Fast response times', impact: 'positive', weight: 0.15 });
      } else if (avgResponseTime > 5000) {
        factors.push({ factor: 'Slow response times', impact: 'negative', weight: -0.15 });
      }

      // Factor 3: Feedback
      if (feedbackScore > 0.7) {
        factors.push({ factor: 'Positive user feedback', impact: 'positive', weight: 0.3 });
      } else if (feedbackScore < 0.3) {
        factors.push({ factor: 'Negative user feedback', impact: 'negative', weight: -0.3 });
      }

      // Factor 4: Message length variation (indicates engagement)
      const messageLengths = messages.map(m => m.content.length);
      const avgLength = messageLengths.reduce((sum, l) => sum + l, 0) / messageLengths.length;
      const lengthVariance = messageLengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / messageLengths.length;

      if (lengthVariance > 1000) {
        factors.push({ factor: 'Good engagement variety', impact: 'positive', weight: 0.1 });
      }

      // Calculate predicted quality
      const baseQuality = 60; // Start at 60%
      const totalImpact = factors.reduce((sum, f) => sum + (f.weight * 100), 0);
      const predictedQuality = Math.max(0, Math.min(100, baseQuality + totalImpact));

      // Calculate confidence based on data availability
      const confidence = Math.min(1.0,
        (messages.length / 10) * 0.4 +
        (feedbacks?.length || 0 > 0 ? 0.3 : 0) +
        (responseTimes.length > 0 ? 0.3 : 0)
      );

      // Generate recommendations
      const recommendations: string[] = [];

      if (avgResponseTime > 3000) {
        recommendations.push('Optimize response generation for faster replies');
      }

      if (messages.length > 15) {
        recommendations.push('Consider summarizing the conversation or breaking into subtopics');
      }

      if (feedbackScore < 0.5) {
        recommendations.push('Review response quality and relevance');
      }

      if (recommendations.length === 0) {
        recommendations.push('Conversation quality is on track. Continue current approach.');
      }

      return {
        predictedQuality,
        confidence,
        factors,
        recommendations,
      };
    } catch (error) {
      console.error('Error predicting conversation quality:', error);
      return null;
    }
  }

  /**
   * Get relevant forecast insights for conversation context
   */
  async getForecastInsights(conversationId: string): Promise<ForecastInsight[]> {
    try {
      // Get conversation context
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('organization_id, metadata, building_id')
        .eq('id', conversationId)
        .single();

      if (!conversation) {
        return [];
      }

      // Get recent Prophet forecasts for the organization
      const { data: predictions } = await this.supabase
        .from('ml_predictions')
        .select('*')
        .eq('organization_id', conversation.organization_id)
        .eq('model_id', 'prophet_v1')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!predictions || predictions.length === 0) {
        return [];
      }

      const insights: ForecastInsight[] = [];

      for (const pred of predictions) {
        const category = pred.metadata?.category;
        const predictedValue = pred.prediction_value;
        const trend = pred.metadata?.trend || 'stable';

        let recommendation = '';
        switch (category) {
          case 'carbon':
            recommendation = trend === 'increasing'
              ? 'Carbon emissions are rising. Consider energy efficiency measures.'
              : 'Carbon emissions trending down. Good progress on sustainability goals.';
            break;
          case 'energy':
            recommendation = trend === 'increasing'
              ? 'Energy consumption increasing. Review usage patterns.'
              : 'Energy efficiency improving. Maintain current practices.';
            break;
          case 'water':
            recommendation = trend === 'increasing'
              ? 'Water usage trending up. Check for leaks or inefficiencies.'
              : 'Water conservation efforts showing results.';
            break;
          case 'waste':
            recommendation = trend === 'increasing'
              ? 'Waste generation rising. Enhance recycling programs.'
              : 'Waste reduction initiatives effective.';
            break;
          default:
            recommendation = `${category} metrics show ${trend} trend.`;
        }

        insights.push({
          metricType: category || 'unknown',
          currentValue: pred.metadata?.current_value || 0,
          predictedValue,
          trend: trend as 'increasing' | 'decreasing' | 'stable',
          confidence: pred.confidence_score || 0.7,
          timeframe: pred.metadata?.forecast_days ? `${pred.metadata.forecast_days} days` : '30 days',
          recommendation,
        });
      }

      return insights;
    } catch (error) {
      console.error('Error getting forecast insights:', error);
      return [];
    }
  }

  /**
   * Enhance conversation with ML insights
   */
  async enhanceConversation(conversationId: string): Promise<{
    smartReplies: SmartReply[];
    qualityPrediction: ConversationQualityPrediction | null;
    forecastInsights: ForecastInsight[];
  }> {
    try {
      const [smartReplies, qualityPrediction, forecastInsights] = await Promise.all([
        this.generateSmartReplies(conversationId),
        this.predictConversationQuality(conversationId),
        this.getForecastInsights(conversationId),
      ]);

      return {
        smartReplies,
        qualityPrediction,
        forecastInsights,
      };
    } catch (error) {
      console.error('Error enhancing conversation:', error);
      return {
        smartReplies: [],
        qualityPrediction: null,
        forecastInsights: [],
      };
    }
  }
}
