/**
 * Enhanced AI Service with Intelligent Orchestration
 * 
 * This service provides a high-level interface for AI operations with:
 * - Intelligent provider routing based on task type and performance
 * - Automatic context management and conversation threading
 * - Advanced caching and optimization
 * - Built-in sustainability domain expertise
 */

import { aiOrchestrator, TaskType } from './orchestrator';
import { CompletionOptions, StreamOptions } from './types';
import { contextEngineEnhanced as contextEngine } from './context-engine-enhanced';
import { blipeeIntelligence } from './sustainability-intelligence';
import { conversationMemoryManager as conversationMemory } from './conversation-memory';
import { aiResponseCache } from './response-cache';
import { metrics } from '@/lib/monitoring/metrics';
import crypto from 'crypto';

export interface ConversationContext {
  conversationId: string;
  organizationId: string;
  buildingId?: string;
  userId: string;
  messageHistory: ConversationMessage[];
  contextualData?: Record<string, any>;
  preferences?: UserPreferences;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'technical';
  responseLength: 'brief' | 'detailed' | 'comprehensive';
  domainFocus: string[];
  language: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  taskType: TaskType;
  confidence: number;
  processingTime: number;
  metadata: {
    tokenCount?: number;
    cost?: number;
    cached: boolean;
    routing?: {
      reason: string;
      alternatives: string[];
    };
    sustainability?: {
      insights: string[];
      recommendations: string[];
      dataPoints: Record<string, any>;
    };
  };
}

export class EnhancedAIService {
  /**
   * Analyze sustainability query with context
   */
  async processSustainabilityQuery(
    query: string,
    context: ConversationContext,
    options?: CompletionOptions
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Determine task type based on query content
    const taskType = this.classifyQuery(query);
    
    // Retrieve conversation memory and preferences
    const memory = await conversationMemory.retrieveMemory(context.conversationId);
    const userPreferences = memory?.preferences || context.preferences;
    
    // Build rich context
    const enrichedContext = await contextEngine.buildContext({
      conversationId: context.conversationId,
      organizationId: context.organizationId,
      buildingId: context.buildingId,
      messageHistory: context.messageHistory,
      currentQuery: query
    });
    
    // Get sustainability intelligence
    const sustainabilityContext = await blipeeIntelligence.analyzeQuery(
      query,
      context.organizationId,
      context.buildingId
    );
    
    // Generate context hash for cache key
    const contextHash = this.generateContextHash({
      enrichedContext,
      sustainabilityContext,
      preferences: userPreferences
    });
    
    // Check cache first
    const cacheKey = {
      organizationId: context.organizationId,
      query,
      taskType,
      contextHash
    };
    
    const cachedResponse = await aiResponseCache.getCachedResponse(cacheKey, {
      includeSimilar: options?.allowSimilarCache ?? true
    });
    
    if (cachedResponse) {
      metrics.incrementCounter('ai_service_cached_responses', 1, {
        task_type: taskType,
        organization_id: context.organizationId
      });
      
      return {
        content: cachedResponse.response,
        provider: cachedResponse.provider,
        taskType,
        confidence: cachedResponse.metadata.confidence || 0.9,
        processingTime: 0, // Instant from cache
        metadata: {
          ...cachedResponse.metadata,
          cached: true,
          cacheHit: cachedResponse.metadata.similarityScore ? 'similar' : 'exact',
          sustainability: {
            insights: ['Response served from cache'],
            recommendations: [],
            dataPoints: { cacheAge: new Date().getTime() - new Date(cachedResponse.timestamp).getTime() }
          }
        }
      };
    }
    
    // Construct enhanced prompt
    const enhancedPrompt = this.buildSustainabilityPrompt(
      query,
      enrichedContext,
      sustainabilityContext,
      userPreferences
    );
    
    try {
      const response = await aiOrchestrator.complete(enhancedPrompt, taskType, {
        ...options,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2000
      });
      
      const processingTime = Date.now() - startTime;
      
      // Extract sustainability insights
      const insights = await this.extractSustainabilityInsights(response, sustainabilityContext);
      
      // Cache the response
      await aiResponseCache.cacheResponse(
        cacheKey,
        response,
        {
          confidence: 0.9,
          tokenCount: response.length / 4, // Approximate token count
          contextHash
        },
        {
          provider: 'orchestrated',
          ttl: this.getCacheTTL(taskType, insights)
        }
      );
      
      // Store the conversation in memory
      await conversationMemory.storeConversation(context, [
        ...context.messageHistory,
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: query,
          timestamp: new Date()
        },
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          metadata: insights
        }
      ]);
      
      // Record metrics
      metrics.incrementCounter('ai_service_sustainability_queries', 1, {
        task_type: taskType,
        organization_id: context.organizationId
      });
      
      return {
        content: response,
        provider: 'orchestrated',
        taskType,
        confidence: 0.9,
        processingTime,
        metadata: {
          cached: false,
          sustainability: insights,
          routing: {
            reason: 'Sustainability-optimized routing',
            alternatives: []
          }
        }
      };
      
    } catch (error) {
      console.error('Enhanced AI Service error:', error);
      throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream sustainability responses with real-time processing
   */
  async *streamSustainabilityQuery(
    query: string,
    context: ConversationContext,
    options?: StreamOptions
  ): AsyncGenerator<{ content: string; metadata?: any }, void, unknown> {
    const taskType = this.classifyQuery(query);
    
    // Retrieve conversation memory and preferences
    const memory = await conversationMemory.retrieveMemory(context.conversationId);
    const userPreferences = memory?.preferences || context.preferences;
    
    // Build context (same as non-streaming)
    const enrichedContext = await contextEngine.buildContext({
      conversationId: context.conversationId,
      organizationId: context.organizationId,
      buildingId: context.buildingId,
      messageHistory: context.messageHistory,
      currentQuery: query
    });
    
    const sustainabilityContext = await blipeeIntelligence.analyzeQuery(
      query,
      context.organizationId,
      context.buildingId
    );
    
    const enhancedPrompt = this.buildSustainabilityPrompt(
      query,
      enrichedContext,
      sustainabilityContext,
      userPreferences
    );
    
    let completeResponse = '';
    let tokenCount = 0;
    
    try {
      for await (const token of aiOrchestrator.stream(enhancedPrompt, taskType, options)) {
        completeResponse += token;
        tokenCount++;
        
        yield {
          content: token,
          metadata: {
            tokenCount,
            taskType,
            streaming: true
          }
        };
      }
      
      // Process complete response for insights
      const insights = await this.extractSustainabilityInsights(completeResponse, sustainabilityContext);
      
      // Store the conversation in memory
      await conversationMemory.storeConversation(context, [
        ...context.messageHistory,
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: query,
          timestamp: new Date()
        },
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: completeResponse,
          timestamp: new Date(),
          metadata: insights
        }
      ]);
      
      // Send final metadata
      yield {
        content: '',
        metadata: {
          complete: true,
          totalTokens: tokenCount,
          sustainability: insights,
          taskType
        }
      };
      
    } catch (error) {
      yield {
        content: '',
        metadata: {
          error: error instanceof Error ? error.message : 'Stream processing failed',
          complete: true
        }
      };
    }
  }

  /**
   * Process target setting queries with structured output
   */
  async processTargetSettingQuery(
    query: string,
    organizationId: string,
    options?: CompletionOptions
  ): Promise<{
    message: string;
    suggestions: string[];
    targetData?: any;
    metadata: Record<string, any>;
  }> {
    const prompt = `
You are an expert sustainability advisor helping organizations set science-based targets.
Analyze the user's request and provide guidance on target setting.

User Request: "${query}"
Organization ID: ${organizationId}

Please respond with a helpful message about target setting and if appropriate, provide structured target data.

Response format (JSON):
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
    "methodology": "SBTi|CDP|GRI|custom",
    "confidence": 0.8
  }
}`;

    try {
      const response = await aiOrchestrator.complete(prompt, TaskType.STRUCTURED_OUTPUT, {
        ...options,
        jsonMode: true,
        structuredOutput: true
      });
      
      const parsed = JSON.parse(response);
      
      return {
        ...parsed,
        metadata: {
          provider: 'orchestrated',
          taskType: TaskType.STRUCTURED_OUTPUT,
          processingTime: Date.now(),
          cached: false
        }
      };
      
    } catch (error) {
      console.error('Target setting query error:', error);
      
      // Fallback response
      return {
        message: "I'd be happy to help you set science-based targets. Could you provide more details about your organization's current emissions and target timeline?",
        suggestions: [
          "Review your current emissions inventory",
          "Consider SBTi guidelines for your sector",
          "Set interim milestones for your target year"
        ],
        metadata: {
          error: true,
          fallback: true,
          taskType: TaskType.STRUCTURED_OUTPUT
        }
      };
    }
  }

  /**
   * Process document analysis queries
   */
  async processDocumentAnalysis(
    documentContent: string,
    query: string,
    context: ConversationContext,
    options?: CompletionOptions
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    const prompt = `
You are a sustainability document analysis expert. Analyze the provided document content and answer the user's query.

Document Content:
${documentContent}

User Query: "${query}"

Please provide a comprehensive analysis focusing on:
1. Key sustainability metrics and data points
2. Compliance with standards (GRI, CDP, TCFD, etc.)
3. Areas for improvement
4. Recommendations for action

Response should be clear, actionable, and data-driven.`;

    try {
      const response = await aiOrchestrator.complete(prompt, TaskType.DOCUMENT_PROCESSING, {
        ...options,
        temperature: 0.3, // Lower temperature for factual analysis
        maxTokens: 3000
      });
      
      const processingTime = Date.now() - startTime;
      
      return {
        content: response,
        provider: 'orchestrated',
        taskType: TaskType.DOCUMENT_PROCESSING,
        confidence: 0.95,
        processingTime,
        metadata: {
          cached: false,
          documentLength: documentContent.length,
          analysisType: 'sustainability_document'
        }
      };
      
    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Classify query to determine optimal task type
   */
  private classifyQuery(query: string): TaskType {
    const lowercaseQuery = query.toLowerCase();
    
    // Document processing indicators
    if (lowercaseQuery.includes('analyze') && 
        (lowercaseQuery.includes('document') || lowercaseQuery.includes('report') || lowercaseQuery.includes('file'))) {
      return TaskType.DOCUMENT_PROCESSING;
    }
    
    // Data analysis indicators
    if (lowercaseQuery.includes('calculate') || lowercaseQuery.includes('metrics') || 
        lowercaseQuery.includes('data') || lowercaseQuery.includes('emissions')) {
      return TaskType.DATA_ANALYSIS;
    }
    
    // Sustainability analysis indicators
    if (lowercaseQuery.includes('sustainability') || lowercaseQuery.includes('carbon') ||
        lowercaseQuery.includes('target') || lowercaseQuery.includes('scope')) {
      return TaskType.SUSTAINABILITY_ANALYSIS;
    }
    
    // Structured output indicators
    if (lowercaseQuery.includes('create') || lowercaseQuery.includes('generate') ||
        lowercaseQuery.includes('structure') || lowercaseQuery.includes('format')) {
      return TaskType.STRUCTURED_OUTPUT;
    }
    
    // Long context indicators
    if (query.length > 2000 || lowercaseQuery.includes('comprehensive') ||
        lowercaseQuery.includes('detailed analysis')) {
      return TaskType.LONG_CONTEXT;
    }
    
    // Default to general chat
    return TaskType.GENERAL_CHAT;
  }

  /**
   * Build enhanced sustainability prompt with context
   */
  private buildSustainabilityPrompt(
    query: string,
    context: any,
    sustainabilityContext: any,
    preferences?: UserPreferences
  ): string {
    const style = preferences?.communicationStyle || 'professional';
    const length = preferences?.responseLength || 'detailed';
    
    return `
You are a world-class sustainability advisor and AI assistant specializing in ESG management, carbon accounting, and environmental intelligence.

CONTEXT:
${JSON.stringify(context, null, 2)}

SUSTAINABILITY INTELLIGENCE:
${JSON.stringify(sustainabilityContext, null, 2)}

USER PREFERENCES:
- Communication Style: ${style}
- Response Length: ${length}
- Domain Focus: ${preferences?.domainFocus?.join(', ') || 'General sustainability'}

USER QUERY: "${query}"

Please provide a comprehensive, actionable response that:
1. Directly addresses the user's question
2. Leverages the provided context and data
3. Offers specific, measurable recommendations
4. References relevant standards and best practices
5. Maintains the requested communication style and length

Focus on being helpful, accurate, and actionable. Use data-driven insights where available.`;
  }

  /**
   * Extract sustainability insights from AI response
   */
  private async extractSustainabilityInsights(
    response: string,
    sustainabilityContext: any
  ): Promise<{
    insights: string[];
    recommendations: string[];
    dataPoints: Record<string, any>;
  }> {
    // This would be enhanced with NLP processing to extract structured insights
    // For now, return basic structure
    return {
      insights: [
        "AI-generated sustainability analysis provided",
        "Contextual data integrated into response"
      ],
      recommendations: [
        "Continue monitoring sustainability metrics",
        "Implement suggested improvements"
      ],
      dataPoints: {
        responseLength: response.length,
        contextUsed: !!sustainabilityContext,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get service health and statistics
   */
  getServiceHealth() {
    return {
      orchestrator: aiOrchestrator.getStats(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Generate hash for context to use in cache key
   */
  private generateContextHash(context: {
    enrichedContext: any;
    sustainabilityContext: any;
    preferences?: UserPreferences;
  }): string {
    const contextData = {
      buildingCount: context.enrichedContext.buildingContext?.length || 0,
      hasWeather: !!context.enrichedContext.externalData?.weather,
      hasEnergy: !!context.enrichedContext.externalData?.energy,
      sustainabilityAreas: context.sustainabilityContext.focusAreas || [],
      preferences: context.preferences?.communicationStyle || 'default'
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(contextData))
      .digest('hex')
      .substring(0, 8);
  }
  
  /**
   * Determine cache TTL based on task type and insights
   */
  private getCacheTTL(taskType: TaskType, insights: any): number {
    // Base TTL by task type
    let ttl = 3600; // 1 hour default
    
    switch (taskType) {
      case TaskType.DATA_ANALYSIS:
        ttl = 10800; // 3 hours
        break;
      case TaskType.DOCUMENT_PROCESSING:
        ttl = 86400; // 24 hours
        break;
      case TaskType.SUSTAINABILITY_ANALYSIS:
        ttl = 7200; // 2 hours
        break;
      case TaskType.COMPLIANCE_CHECK:
        ttl = 21600; // 6 hours
        break;
    }
    
    // Adjust based on insights
    if (insights.dataPoints?.isTimeSensitive) {
      ttl = Math.min(ttl, 1800); // Max 30 minutes for time-sensitive data
    }
    
    return ttl;
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService();