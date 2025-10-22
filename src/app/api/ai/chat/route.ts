import { NextRequest, NextResponse } from "next/server";
import { getAPIUser } from '@/lib/auth/server-auth';
import { aiService } from "@/lib/ai/service";
import { chatMessageSchema } from "@/lib/validation/schemas";
import { withMiddleware, middlewareConfigs } from "@/lib/middleware";
import { agentOrchestrator, initializeAutonomousAgents, getAIWorkforceStatus } from "@/lib/ai/autonomous-agents";
import { predictiveIntelligence } from "@/lib/ai/predictive-intelligence";
import { MLPipeline } from "@/lib/ai/ml-models/ml-pipeline-client";
import { DatabaseContextService } from "@/lib/ai/database-context";
import { createDatabaseIntelligence } from "@/lib/ai/database-intelligence";

// Import the new Conversation Intelligence System
import { conversationalIntelligenceOrchestrator } from "@/lib/ai/conversation-intelligence";

export const dynamic = 'force-dynamic';

// Analyze message intent to route to appropriate AI agents
async function analyzeMessageIntent(message: string): Promise<string[]> {
  const intents = [];
  const lowerMessage = message.toLowerCase();

  // Emissions and carbon tracking
  if (lowerMessage.includes('emission') || lowerMessage.includes('carbon') ||
      lowerMessage.includes('co2') || lowerMessage.includes('ghg')) {
    intents.push('emissions');
  }

  // Compliance and regulations
  if (lowerMessage.includes('compliance') || lowerMessage.includes('regulation') ||
      lowerMessage.includes('standard') || lowerMessage.includes('gri') ||
      lowerMessage.includes('tcfd') || lowerMessage.includes('sbti')) {
    intents.push('compliance');
  }

  // Cost and savings
  if (lowerMessage.includes('cost') || lowerMessage.includes('saving') ||
      lowerMessage.includes('expense') || lowerMessage.includes('budget')) {
    intents.push('cost');
  }

  // Supply chain
  if (lowerMessage.includes('supplier') || lowerMessage.includes('scope 3') ||
      lowerMessage.includes('supply chain') || lowerMessage.includes('vendor')) {
    intents.push('supply_chain');
  }

  // Optimization
  if (lowerMessage.includes('optimize') || lowerMessage.includes('improve') ||
      lowerMessage.includes('efficiency') || lowerMessage.includes('performance')) {
    intents.push('optimization');
  }

  // Predictive and maintenance
  if (lowerMessage.includes('predict') || lowerMessage.includes('forecast') ||
      lowerMessage.includes('maintenance') || lowerMessage.includes('failure')) {
    intents.push('predictive');
  }

  return intents;
}

// Internal POST handler with Conversation Intelligence
async function handleChatMessage(request: NextRequest): Promise<NextResponse> {
  try {
    // Use parsed body from middleware if available, otherwise parse JSON
    const body = (request as any).parsedBody || await request.json();

    // Debug: Log the incoming request body

    // Body is already validated by middleware, so we can safely destructure
    const { message, conversationId, buildingContext, attachments } = body;

    // Get authenticated user
    // Get authenticated user using session-based auth
    const user = await getAPIUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', content: 'Please sign in to use the chat feature.' },
        { status: 401 }
      );
    }

    // Get user's organization context for the orchestrator
    const organizationContext = await DatabaseContextService.getUserOrganizationContext(user.id);
    const organizationId = organizationContext?.organization?.id || '';

    // Check if AI agents are initialized
    const workforceStatus = await getAIWorkforceStatus();
    if (!workforceStatus.operational) {
      await initializeAutonomousAgents(organizationId);
    }

    // Get conversation history for context
    const { data: conversationHistory } = await supabase
      .from('conversation_intelligence_results')
      .select('user_message, system_response, timestamp')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(5);

    const previousMessages = conversationHistory?.map(item => item.user_message) || [];

    // ===================================================================
    // ENHANCED: Coordinate with AI Agents for specialized tasks
    // ===================================================================

    // Analyze message intent to determine which agents should be involved
    const messageIntent = await analyzeMessageIntent(message);
    let agentInsights = {};

    // Route to appropriate AI agents based on intent
    if (messageIntent.includes('emissions') || messageIntent.includes('carbon')) {
      const carbonHunterResult = await agentOrchestrator.executeTask({
        id: `chat_${Date.now()}`,
        type: 'emissions_analysis',
        priority: 'high',
        payload: { message, organizationId },
        createdBy: user.id,
        context: { conversationId },
        scheduledFor: new Date()
      });
      agentInsights = { ...agentInsights, carbonHunter: carbonHunterResult };
    }

    if (messageIntent.includes('compliance') || messageIntent.includes('regulation')) {
      const complianceResult = await agentOrchestrator.executeTask({
        id: `chat_${Date.now()}_compliance`,
        type: 'compliance_check',
        priority: 'high',
        payload: { message, organizationId },
        createdBy: user.id,
        context: { conversationId },
        scheduledFor: new Date()
      });
      agentInsights = { ...agentInsights, compliance: complianceResult };
    }

    if (messageIntent.includes('cost') || messageIntent.includes('savings')) {
      const costResult = await agentOrchestrator.executeTask({
        id: `chat_${Date.now()}_cost`,
        type: 'cost_analysis',
        priority: 'medium',
        payload: { message, organizationId },
        createdBy: user.id,
        context: { conversationId },
        scheduledFor: new Date()
      });
      agentInsights = { ...agentInsights, costSavings: costResult };
    }

    // ===================================================================
    // PRIMARY: Use Conversation Intelligence Orchestrator with Agent Insights
    // ===================================================================

    try {
      const intelligenceResult = await conversationalIntelligenceOrchestrator.processConversation(
        conversationId,
        user.id,
        organizationId,
        message,
        {
          previousMessages,
          currentGoals: [], // Would be extracted from dialogue state
          sessionMetadata: {
            buildingContext,
            attachments,
            requestTimestamp: new Date().toISOString()
          }
        }
      );

      // Extract the enhanced response with all intelligence features
      const response = {
        content: intelligenceResult.systemResponse,
        suggestions: intelligenceResult.nextQuestionPredictions.slice(0, 4).map(pred => pred.question),
        components: generateUIComponents(intelligenceResult),
        timestamp: intelligenceResult.timestamp.toISOString(),
        cached: false,
        // Enhanced metadata from conversation intelligence
        metadata: {
          conversationTurn: intelligenceResult.dialogueState.currentTurn,
          qualityScore: intelligenceResult.qualityScores.overall,
          personalizationScore: intelligenceResult.personalizedResponse.personalizationScore,
          userSatisfaction: intelligenceResult.conversationMetrics.userSatisfaction,
          goalProgress: intelligenceResult.conversationMetrics.goalProgress,
          adaptationsApplied: intelligenceResult.adaptationActions.map(a => a.type),
          processingTime: intelligenceResult.processingTime,
          memoryUpdates: intelligenceResult.memoryUpdates.length,
          learningMoments: intelligenceResult.userJourney.learningMoments.length,
          conversationHealth: intelligenceResult.conversationMetrics.conversationHealth.overall
        },
        // Analytics for frontend
        analytics: {
          userEngagement: intelligenceResult.conversationMetrics.engagementLevel,
          conversationEfficiency: intelligenceResult.conversationMetrics.conversationEfficiency,
          knowledgeTransfer: intelligenceResult.conversationMetrics.knowledgeTransfer,
          contextMaintenance: intelligenceResult.conversationMetrics.contextMaintenance
        },
        // Proactive elements
        proactive: {
          healthAlerts: intelligenceResult.conversationMetrics.conversationHealth.alerts,
          suggestions: intelligenceResult.nextQuestionPredictions.slice(0, 3),
          adaptationRecommendations: intelligenceResult.adaptationActions
            .filter(a => a.expectedImpact > 0.5)
            .map(a => ({
              type: a.type,
              description: a.description,
              impact: a.expectedImpact
            }))
        }
      };


      return NextResponse.json(response);

    } catch (intelligenceError) {
      console.error('❌ Conversation Intelligence Error:', intelligenceError);

      // Fallback to legacy processing with enhanced error handling

      return await handleLegacyProcessing(
        user,
        message,
        conversationId,
        buildingContext,
        attachments,
        organizationContext,
        supabase
      );
    }

  } catch (error) {
    console.error('❌ Chat API Error:', error);

    // Comprehensive error handling with user-friendly messages
    let errorMessage = "I'm having trouble processing your request. Please try again.";
    let suggestions = ["Try rephrasing your question", "Check your internet connection", "Contact support if the issue persists"];

    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = "I'm having network connectivity issues. Please check your internet connection and try again.";
        suggestions = ["Check your internet connection", "Try again in a moment", "Refresh the page"];
      } else if (error.message.includes('validation')) {
        errorMessage = "Your message couldn't be processed due to formatting issues. Please try rephrasing.";
        suggestions = ["Try simpler language", "Break down complex questions", "Check for special characters"];
      } else if (error.message.includes('rate') || error.message.includes('limit')) {
        errorMessage = "You're sending messages too quickly. Please wait a moment before trying again.";
        suggestions = ["Wait 30 seconds", "Try again later", "Consider shorter messages"];
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to process chat request',
        content: errorMessage,
        suggestions,
        timestamp: new Date().toISOString(),
        metadata: {
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
          conversationIntelligence: false,
          fallbackUsed: 'error_handler'
        }
      },
      { status: 500 }
    );
  }
}

// ===================================================================
// HELPER FUNCTIONS FOR CONVERSATION INTELLIGENCE INTEGRATION
// ===================================================================

/**
 * Generate UI components based on conversation intelligence results
 */
function generateUIComponents(intelligenceResult: any): any[] {
  const components = [];

  // Add conversation health dashboard if there are alerts
  if (intelligenceResult.conversationMetrics.conversationHealth.alerts.length > 0) {
    components.push({
      type: 'conversation-health',
      props: {
        title: 'Conversation Health',
        overallScore: intelligenceResult.conversationMetrics.conversationHealth.overall,
        alerts: intelligenceResult.conversationMetrics.conversationHealth.alerts,
        components: intelligenceResult.conversationMetrics.conversationHealth.components
      }
    });
  }

  // Add user journey visualization
  if (intelligenceResult.userJourney.learningMoments.length > 0) {
    components.push({
      type: 'learning-progress',
      props: {
        title: 'Learning Progress',
        learningMoments: intelligenceResult.userJourney.learningMoments,
        stepType: intelligenceResult.userJourney.stepType,
        outcomes: intelligenceResult.userJourney.outcomes
      }
    });
  }

  // Add personalization insights
  if (intelligenceResult.personalizedResponse.personalizationScore > 0.7) {
    components.push({
      type: 'personalization-insights',
      props: {
        title: 'Personalized for You',
        score: intelligenceResult.personalizedResponse.personalizationScore,
        adaptations: intelligenceResult.personalizedResponse.adaptations,
        confidence: intelligenceResult.personalizedResponse.confidence
      }
    });
  }

  // Add next question predictions as suggestion cards
  if (intelligenceResult.nextQuestionPredictions.length > 0) {
    components.push({
      type: 'smart-suggestions',
      props: {
        title: 'You might want to ask',
        predictions: intelligenceResult.nextQuestionPredictions.slice(0, 3).map(pred => ({
          question: pred.question,
          probability: pred.probability,
          context: pred.context,
          urgency: pred.urgency
        }))
      }
    });
  }

  // Add memory utilization if significant
  if (intelligenceResult.memoryUpdates.length > 0) {
    components.push({
      type: 'memory-insights',
      props: {
        title: 'Memory & Learning',
        updates: intelligenceResult.memoryUpdates,
        conversationContext: intelligenceResult.dialogueState.contextStack.length,
        memoryConsolidation: intelligenceResult.memoryUpdates.filter(u => u.type === 'consolidate').length
      }
    });
  }

  return components;
}

/**
 * Legacy processing fallback with enhanced error handling
 */
async function handleLegacyProcessing(
  user: any,
  message: string,
  conversationId: string,
  buildingContext: any,
  attachments: any,
  organizationContext: any,
  supabase: any
): Promise<NextResponse> {
  try {
    // Initialize Database Intelligence Service for legacy support
    const dbIntel = createDatabaseIntelligence(supabase);

    // Simplified legacy processing - basic AI response without full intelligence

    // Get basic organization context
    let emissionsSummary = null;
    let complianceStatus = null;

    if (organizationContext?.organization?.id) {
      try {
        [emissionsSummary, complianceStatus] = await Promise.all([
          DatabaseContextService.getEmissionsSummary(organizationContext.organization.id),
          DatabaseContextService.getComplianceStatus(organizationContext.organization.id)
        ]);
      } catch (contextError) {
        console.warn('Could not fetch organization context:', contextError);
      }
    }

    // Build basic system prompt
    const systemPrompt = `You are Blipee AI, an intelligent sustainability and building management assistant.

You help users with:
- Real-time monitoring of energy, climate, and building operations
- ESG reporting and carbon emissions tracking
- Sustainability analytics and optimization
- Compliance and regulatory reporting

Be conversational, helpful, and focus on sustainability topics.

${organizationContext ? `
ORGANIZATION DATA:
- Organization: ${organizationContext.organization?.name || 'Unknown'}
- Industry: ${organizationContext.organization?.industry_primary || 'Not specified'}

${emissionsSummary ? `
EMISSIONS SUMMARY:
- Current Month: ${emissionsSummary.currentMonth?.total?.toFixed(2) || 0} tCO2e
- Year to Date: ${emissionsSummary.yearToDate?.total?.toFixed(2) || 0} tCO2e
` : ''}
` : ''}

${buildingContext ? `Building Context: ${JSON.stringify(buildingContext)}` : ''}
${attachments?.length ? `User has attached ${attachments.length} file(s)` : ''}`;

    // Get AI response with basic error handling
    let aiResponse: string;
    try {
      aiResponse = await aiService.complete(message, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 500,
      });
    } catch (aiError) {
      console.error('AI service error in legacy processing:', aiError);
      aiResponse = "I'm experiencing some technical difficulties with my AI processing. Please try rephrasing your question or try again in a moment.";
    }

    // Parse response for suggestions
    const suggestions = extractSuggestions(aiResponse);

    // Basic response format
    const response = {
      content: aiResponse,
      suggestions,
      timestamp: new Date().toISOString(),
      cached: false,
      metadata: {
        conversationIntelligence: false,
        fallbackUsed: 'legacy_processing',
        processingMode: 'simplified',
        organizationContext: !!organizationContext,
        emissionsData: !!emissionsSummary
      },
      components: [], // No advanced components in legacy mode
      analytics: {
        userEngagement: 0.5,
        conversationEfficiency: 0.5,
        knowledgeTransfer: 0,
        contextMaintenance: 0.5
      }
    };

    return NextResponse.json(response);

  } catch (legacyError) {
    console.error('❌ Legacy processing also failed:', legacyError);

    // Ultimate fallback - static response
    return NextResponse.json({
      error: 'Processing temporarily unavailable',
      content: "I'm temporarily experiencing technical difficulties. Please try again in a few moments, or contact support if the issue persists.",
      suggestions: [
        "Try again in a few minutes",
        "Refresh the page",
        "Contact support",
        "Check system status"
      ],
      timestamp: new Date().toISOString(),
      metadata: {
        conversationIntelligence: false,
        fallbackUsed: 'ultimate_fallback',
        errorType: 'system_failure'
      }
    }, { status: 503 });
  }
}

// ===================================================================
// EXISTING HELPER FUNCTIONS (PRESERVED FOR COMPATIBILITY)
// ===================================================================

// Helper function to extract suggestions from AI response
function extractSuggestions(response: string | any): string[] {
  const suggestions: string[] = [];

  // Ensure response is a string - handle different response types
  let responseText = '';
  if (typeof response === 'string') {
    responseText = response;
  } else if (response && typeof response === 'object') {
    // If it's an object, try to get the text content
    responseText = response.content || response.text || response.message || JSON.stringify(response);
  } else {
    responseText = String(response || '');
  }

  // Look for bullet points or numbered lists that might be suggestions
  const bulletPoints = responseText.match(/^[•\-\*]\s+(.+)$/gm);
  if (bulletPoints && bulletPoints.length <= 4) {
    return bulletPoints.slice(0, 4).map(s => s.replace(/^[•\-\*]\s+/, ''));
  }

  // Default suggestions based on content
  if (responseText.toLowerCase().includes('energy')) {
    suggestions.push("Show energy trends", "Optimize consumption", "Generate energy report");
  } else if (responseText.toLowerCase().includes('carbon') || responseText.toLowerCase().includes('emissions')) {
    suggestions.push("Track emissions", "Set reduction targets", "View carbon dashboard");
  } else if (responseText.toLowerCase().includes('report')) {
    suggestions.push("Generate PDF report", "Schedule reports", "Export data");
  } else {
    suggestions.push("Tell me more", "Show examples", "What else can you do?");
  }

  return suggestions.slice(0, 4);
}

// Export POST handler with AI middleware (stricter rate limiting)
export const POST = withMiddleware(handleChatMessage, {
  ...middlewareConfigs.ai,
  validation: {
    body: chatMessageSchema,
  },
});
