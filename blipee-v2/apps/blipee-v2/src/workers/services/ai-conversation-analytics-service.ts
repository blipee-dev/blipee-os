/**
 * AI Conversation Analytics Service
 *
 * Uses AI to analyze individual conversations and extract deep insights.
 * Part of FASE 2 - Conversation Intelligence
 *
 * Features:
 * - AI-powered conversation analysis
 * - Topic and intent extraction
 * - Pattern detection
 * - Quality scoring
 * - Actionable insights generation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

interface ConversationAnalysis {
  conversationId: string;
  organizationId: string;
  messageCount: number;
  avgResponseTimeMs: number;
  userSatisfactionScore?: number;
  topicsDiscussed: string[];
  commonIntents: string[];
  conversationMetadata: {
    summary: string;
    qualityScore: number; // 0-100
    keyInsights: string[];
    actionableItems?: string[];
    conversationOutcome?: 'resolved' | 'escalated' | 'ongoing' | 'abandoned';
    userSentiment?: 'positive' | 'neutral' | 'negative';
    aiPerformance?: {
      helpfulness: number; // 0-10
      accuracy: number; // 0-10
      clarity: number; // 0-10
    };
  };
}

export class AIConversationAnalyticsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Run AI analysis on eligible conversations
   * Should be called by cron job daily
   */
  async run(): Promise<void> {
    console.log('🤖 Starting AI conversation analysis...');

    try {
      // Get conversations from the last 24 hours that haven't been analyzed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: conversations } = await this.supabase
        .from('conversations')
        .select('id, organization_id, created_at')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: true });

      if (!conversations || conversations.length === 0) {
        console.log('No new conversations to analyze');
        return;
      }

      // Filter out already analyzed conversations
      const { data: existingAnalyses } = await this.supabase
        .from('ai_conversation_analytics')
        .select('conversation_id')
        .in('conversation_id', conversations.map(c => c.id));

      const analyzedIds = new Set(existingAnalyses?.map(a => a.conversation_id) || []);
      const toAnalyze = conversations.filter(c => !analyzedIds.has(c.id));

      console.log(`Found ${toAnalyze.length} conversations to analyze`);

      let analyzedCount = 0;
      let errorCount = 0;

      for (const conversation of toAnalyze) {
        try {
          const analysis = await this.analyzeConversation(conversation.id, conversation.organization_id);
          if (analysis) {
            await this.saveAnalysis(analysis);
            analyzedCount++;
          }
        } catch (error) {
          console.error(`Error analyzing conversation ${conversation.id}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Analyzed ${analyzedCount} conversations (${errorCount} errors)`);
    } catch (error) {
      console.error('❌ Error in AI conversation analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze a single conversation using AI
   */
  async analyzeConversation(
    conversationId: string,
    organizationId: string
  ): Promise<ConversationAnalysis | null> {
    try {
      // Get conversation messages
      const { data: messages } = await this.supabase
        .from('messages')
        .select('role, content, created_at, model')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!messages || messages.length < 2) {
        return null; // Need at least 2 messages (user + assistant)
      }

      const messageCount = messages.length;

      // Calculate average response time
      const responseTimes: number[] = [];
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
          const userTime = new Date(messages[i].created_at).getTime();
          const assistantTime = new Date(messages[i + 1].created_at).getTime();
          responseTimes.push(assistantTime - userTime);
        }
      }
      const avgResponseTimeMs = responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

      // Get user satisfaction from feedback
      const { data: feedbacks } = await this.supabase
        .from('conversation_feedback')
        .select('feedback_type, feedback_value')
        .eq('conversation_id', conversationId);

      const userSatisfactionScore = this.calculateSatisfactionScore(feedbacks || []);

      // Prepare conversation text for AI analysis
      const conversationText = messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      // Use AI to analyze the conversation
      const aiInsights = await this.analyzeWithAI(conversationText);

      return {
        conversationId,
        organizationId,
        messageCount,
        avgResponseTimeMs: Math.round(avgResponseTimeMs),
        userSatisfactionScore,
        topicsDiscussed: aiInsights.topics,
        commonIntents: aiInsights.intents,
        conversationMetadata: {
          summary: aiInsights.summary,
          qualityScore: aiInsights.qualityScore,
          keyInsights: aiInsights.insights,
          actionableItems: aiInsights.actionableItems,
          conversationOutcome: aiInsights.outcome,
          userSentiment: aiInsights.sentiment,
          aiPerformance: aiInsights.aiPerformance,
        },
      };
    } catch (error) {
      console.error(`Error analyzing conversation ${conversationId}:`, error);
      return null;
    }
  }

  /**
   * Use AI to extract insights from conversation
   */
  private async analyzeWithAI(conversationText: string): Promise<{
    topics: string[];
    intents: string[];
    summary: string;
    qualityScore: number;
    insights: string[];
    actionableItems: string[];
    outcome: 'resolved' | 'escalated' | 'ongoing' | 'abandoned';
    sentiment: 'positive' | 'neutral' | 'negative';
    aiPerformance: {
      helpfulness: number;
      accuracy: number;
      clarity: number;
    };
  }> {
    try {
      const prompt = `Analyze this conversation and extract structured insights:

${conversationText}

Provide a JSON response with:
{
  "topics": ["topic1", "topic2", ...], // 3-5 main topics discussed
  "intents": ["intent1", "intent2", ...], // User's intents/goals (e.g., "seeking help", "requesting information")
  "summary": "Brief 2-3 sentence summary of the conversation",
  "qualityScore": 85, // Overall conversation quality (0-100)
  "insights": ["insight1", "insight2", ...], // 2-4 key insights about the conversation
  "actionableItems": ["action1", "action2", ...], // Any follow-up actions needed
  "outcome": "resolved", // One of: resolved, escalated, ongoing, abandoned
  "sentiment": "positive", // User's overall sentiment: positive, neutral, negative
  "aiPerformance": {
    "helpfulness": 8, // How helpful was the AI (0-10)
    "accuracy": 9, // How accurate were the AI's responses (0-10)
    "clarity": 8 // How clear were the AI's explanations (0-10)
  }
}`;

      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt,
        temperature: 0.3,
        maxTokens: 1000,
      });

      // Parse AI response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanedText);

      return {
        topics: analysis.topics || [],
        intents: analysis.intents || [],
        summary: analysis.summary || 'No summary available',
        qualityScore: analysis.qualityScore || 50,
        insights: analysis.insights || [],
        actionableItems: analysis.actionableItems || [],
        outcome: analysis.outcome || 'ongoing',
        sentiment: analysis.sentiment || 'neutral',
        aiPerformance: analysis.aiPerformance || { helpfulness: 5, accuracy: 5, clarity: 5 },
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      // Return default values if AI analysis fails
      return {
        topics: [],
        intents: [],
        summary: 'Analysis failed',
        qualityScore: 0,
        insights: [],
        actionableItems: [],
        outcome: 'ongoing',
        sentiment: 'neutral',
        aiPerformance: { helpfulness: 0, accuracy: 0, clarity: 0 },
      };
    }
  }

  /**
   * Calculate satisfaction score from feedback
   */
  private calculateSatisfactionScore(feedbacks: any[]): number | undefined {
    if (feedbacks.length === 0) return undefined;

    let totalScore = 0;
    for (const feedback of feedbacks) {
      if (feedback.feedback_type === 'thumbs_up') {
        totalScore += 1;
      } else if (feedback.feedback_type === 'thumbs_down') {
        totalScore += 0;
      } else if (feedback.feedback_type === 'rating' && feedback.feedback_value?.rating) {
        totalScore += feedback.feedback_value.rating / 5;
      }
    }

    return totalScore / feedbacks.length;
  }

  /**
   * Save analysis to database
   */
  private async saveAnalysis(analysis: ConversationAnalysis): Promise<void> {
    try {
      await this.supabase
        .from('ai_conversation_analytics')
        .insert({
          conversation_id: analysis.conversationId,
          organization_id: analysis.organizationId,
          message_count: analysis.messageCount,
          avg_response_time_ms: analysis.avgResponseTimeMs,
          user_satisfaction_score: analysis.userSatisfactionScore,
          topics_discussed: analysis.topicsDiscussed,
          common_intents: analysis.commonIntents,
          conversation_metadata: analysis.conversationMetadata,
          analyzed_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }

  /**
   * Get analysis for a specific conversation
   */
  async getConversationAnalysis(conversationId: string): Promise<ConversationAnalysis | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_conversation_analytics')
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        conversationId: data.conversation_id,
        organizationId: data.organization_id,
        messageCount: data.message_count,
        avgResponseTimeMs: data.avg_response_time_ms,
        userSatisfactionScore: data.user_satisfaction_score,
        topicsDiscussed: data.topics_discussed,
        commonIntents: data.common_intents,
        conversationMetadata: data.conversation_metadata,
      };
    } catch (error) {
      console.error('Error fetching conversation analysis:', error);
      return null;
    }
  }

  /**
   * Get all analyses for an organization
   */
  async getOrganizationAnalyses(organizationId: string, limit: number = 50): Promise<ConversationAnalysis[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_conversation_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .order('analyzed_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data.map(row => ({
        conversationId: row.conversation_id,
        organizationId: row.organization_id,
        messageCount: row.message_count,
        avgResponseTimeMs: row.avg_response_time_ms,
        userSatisfactionScore: row.user_satisfaction_score,
        topicsDiscussed: row.topics_discussed,
        commonIntents: row.common_intents,
        conversationMetadata: row.conversation_metadata,
      }));
    } catch (error) {
      console.error('Error fetching organization analyses:', error);
      return [];
    }
  }

  /**
   * Get aggregate insights for an organization
   */
  async getOrganizationInsights(organizationId: string): Promise<{
    totalAnalyzed: number;
    avgQualityScore: number;
    topTopics: Array<{ topic: string; count: number }>;
    topIntents: Array<{ intent: string; count: number }>;
    outcomeDistribution: Record<string, number>;
    avgAIPerformance: { helpfulness: number; accuracy: number; clarity: number };
  }> {
    try {
      const analyses = await this.getOrganizationAnalyses(organizationId, 1000);

      if (analyses.length === 0) {
        return {
          totalAnalyzed: 0,
          avgQualityScore: 0,
          topTopics: [],
          topIntents: [],
          outcomeDistribution: {},
          avgAIPerformance: { helpfulness: 0, accuracy: 0, clarity: 0 },
        };
      }

      // Calculate aggregate metrics
      const totalQualityScore = analyses.reduce((sum, a) => sum + a.conversationMetadata.qualityScore, 0);
      const avgQualityScore = totalQualityScore / analyses.length;

      // Count topics
      const topicCounts = new Map<string, number>();
      analyses.forEach(a => {
        a.topicsDiscussed.forEach(topic => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        });
      });
      const topTopics = Array.from(topicCounts.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Count intents
      const intentCounts = new Map<string, number>();
      analyses.forEach(a => {
        a.commonIntents.forEach(intent => {
          intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
        });
      });
      const topIntents = Array.from(intentCounts.entries())
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Outcome distribution
      const outcomeDistribution: Record<string, number> = {};
      analyses.forEach(a => {
        const outcome = a.conversationMetadata.conversationOutcome || 'unknown';
        outcomeDistribution[outcome] = (outcomeDistribution[outcome] || 0) + 1;
      });

      // Average AI performance
      const totalPerf = analyses.reduce(
        (sum, a) => ({
          helpfulness: sum.helpfulness + (a.conversationMetadata.aiPerformance?.helpfulness || 0),
          accuracy: sum.accuracy + (a.conversationMetadata.aiPerformance?.accuracy || 0),
          clarity: sum.clarity + (a.conversationMetadata.aiPerformance?.clarity || 0),
        }),
        { helpfulness: 0, accuracy: 0, clarity: 0 }
      );
      const avgAIPerformance = {
        helpfulness: totalPerf.helpfulness / analyses.length,
        accuracy: totalPerf.accuracy / analyses.length,
        clarity: totalPerf.clarity / analyses.length,
      };

      return {
        totalAnalyzed: analyses.length,
        avgQualityScore,
        topTopics,
        topIntents,
        outcomeDistribution,
        avgAIPerformance,
      };
    } catch (error) {
      console.error('Error getting organization insights:', error);
      return {
        totalAnalyzed: 0,
        avgQualityScore: 0,
        topTopics: [],
        topIntents: [],
        outcomeDistribution: {},
        avgAIPerformance: { helpfulness: 0, accuracy: 0, clarity: 0 },
      };
    }
  }
}
