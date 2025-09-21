import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/ai/service";
import { chatMessageSchema } from "@/lib/validation/schemas";
import { withMiddleware, middlewareConfigs } from "@/lib/middleware";
import { agentOrchestrator } from "@/lib/ai/autonomous-agents";
import { PredictiveIntelligence } from "@/lib/ai/predictive-intelligence";
import { MLPipeline } from "@/lib/ai/ml-models/ml-pipeline-client";

export const dynamic = 'force-dynamic';

// Internal POST handler
async function handleChatMessage(request: NextRequest): Promise<NextResponse> {
  try {
    // Use parsed body from middleware if available, otherwise parse JSON
    const body = (request as any).parsedBody || await request.json();

    // Debug: Log the incoming request body
    console.log('AI Chat API - Incoming request body:', JSON.stringify(body, null, 2));

    // Body is already validated by middleware, so we can safely destructure
    const { message, conversationId, buildingContext, attachments } = body;

    // Initialize ML and predictive systems
    const mlPipeline = new MLPipeline();
    const predictiveIntel = new PredictiveIntelligence();

    // Check if message requires autonomous agent assistance
    const agentContext = {
      message,
      buildingContext,
      conversationId,
      attachments
    };

    let agentResponse = null;
    let predictions = null;
    let mlInsights = null;

    // Analyze message intent for agent routing
    const messageIntent = analyzeMessageIntent(message);

    // Route to appropriate autonomous agent if needed
    if (messageIntent.requiresAgent) {
      try {
        const agent = await agentOrchestrator.selectAgent(messageIntent.type);
        if (agent) {
          agentResponse = await agent.executeTask({
            type: messageIntent.type,
            description: message,
            context: agentContext,
            priority: messageIntent.priority || 'medium'
          });
        }
      } catch (error) {
        console.error('Agent execution error:', error);
      }
    }

    // Get ML predictions if relevant
    if (messageIntent.requiresPrediction && buildingContext) {
      try {
        predictions = await predictiveIntel.generateInsights({
          buildingId: buildingContext.id,
          query: message,
          context: buildingContext.metadata
        });

        // Run ML models for specific predictions
        if (messageIntent.type === 'energy') {
          mlInsights = await mlPipeline.predict('energy-consumption', {
            buildingId: buildingContext.id,
            features: buildingContext.metadata
          });
        } else if (messageIntent.type === 'emissions') {
          mlInsights = await mlPipeline.predict('emissions-forecast', {
            buildingId: buildingContext.id,
            features: buildingContext.metadata
          });
        }
      } catch (error) {
        console.error('ML prediction error:', error);
      }
    }

    // Build enhanced context for AI
    const systemPrompt = `You are Blipee AI, an intelligent sustainability and building management assistant with access to autonomous agents and ML predictions.

You help users with:
- Real-time monitoring of energy, climate, and building operations
- ESG reporting and carbon emissions tracking
- Sustainability analytics and optimization
- Cost analysis and savings opportunities
- Compliance and regulatory reporting
- Predictive analytics and forecasting
- Autonomous optimization and decision-making

Be conversational, helpful, and proactive. When appropriate, suggest visualizations or actions the user might want to take.

${buildingContext ? `Building Context: ${JSON.stringify(buildingContext)}` : ''}
${attachments?.length ? `User has attached ${attachments.length} file(s)` : ''}
${agentResponse ? `\n\nAutonomous Agent Analysis:\n${JSON.stringify(agentResponse.result)}` : ''}
${predictions ? `\n\nPredictive Insights:\n${JSON.stringify(predictions)}` : ''}
${mlInsights ? `\n\nML Model Predictions:\n${JSON.stringify(mlInsights)}` : ''}`;

    // Get AI response with error handling
    let aiResponse: string;
    try {
      aiResponse = await aiService.complete(message, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1000,
      });
    } catch (aiError) {
      console.error('AI service error:', aiError);
      aiResponse = "I'm experiencing some technical difficulties. Please try rephrasing your question or try again in a moment.";
    }

    // Parse response for suggestions
    const suggestions = extractSuggestions(aiResponse);

    // Check if response contains code or structured content
    const aiResponseText = typeof aiResponse === 'string' ? aiResponse : String(aiResponse || '');
    const hasCode = aiResponseText.includes("```");
    const artifact = hasCode ? extractCodeFromResponse(aiResponseText) : null;

    // Generate dynamic UI components based on context
    const components = [];

    // Add ML prediction components if available
    if (mlInsights) {
      components.push({
        type: 'optimization-dashboard',
        props: {
          title: 'AI-Powered Optimization Opportunities',
          opportunities: mlInsights.opportunities || [],
          totalSavings: mlInsights.totalSavings || '$0',
          roiTimeline: mlInsights.roiTimeline || 'N/A',
          confidence: mlInsights.confidence || 0.85
        }
      });
    }

    // Add predictive analytics visualization
    if (predictions) {
      components.push({
        type: 'insights-panel',
        props: {
          title: 'Predictive Analytics Insights',
          insights: predictions.insights || [],
          confidence: predictions.confidence || 0.9
        }
      });
    }

    // Add agent action panel if agent responded
    if (agentResponse && agentResponse.result) {
      components.push({
        type: 'action-panel',
        props: {
          title: agentResponse.agent || 'AI Agent Recommendation',
          priority: agentResponse.priority || 'medium',
          steps: agentResponse.result.steps || [],
          automatable: agentResponse.result.automatable || false
        }
      });
    }

    // Add energy dashboard for energy queries
    if (messageIntent.type === 'energy' && buildingContext) {
      components.push({
        type: 'energy-dashboard',
        props: {
          buildingId: buildingContext.id,
          realTimeData: true,
          showPredictions: true
        }
      });
    }

    // Format response
    const response = {
      content: artifact ? cleanResponseContent(aiResponseText) : aiResponseText,
      ...(artifact && {
        artifact: artifact.code,
        artifactType: artifact.type,
        artifactTitle: artifact.title || "Generated Content",
        artifactLanguage: artifact.language || "typescript"
      }),
      suggestions,
      components: components.length > 0 ? components : undefined,
      timestamp: new Date().toISOString(),
      cached: false,
      // Add metadata for tracking
      metadata: {
        agentUsed: agentResponse?.agent,
        mlModelsUsed: mlInsights ? ['energy-consumption', 'emissions-forecast'] : [],
        predictionsGenerated: !!predictions
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API error:', error);

    // Provide more specific error messages based on error type
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
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
        }
      },
      { status: 500 }
    );
  }
}

// Helper function to extract suggestions from AI response
function extractSuggestions(response: string | any): string[] {
  const suggestions: string[] = [];

  // Ensure response is a string
  const responseText = typeof response === 'string' ? response : String(response || '');

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

// Helper function to extract code from response
function extractCodeFromResponse(response: string | any): { code: string; type: string; language?: string; title?: string } | null {
  // Ensure response is a string
  const responseText = typeof response === 'string' ? response : String(response || '');

  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/;
  const match = responseText.match(codeBlockRegex);

  if (match) {
    const language = match[1] || 'typescript';
    const code = match[2].trim();

    // Determine artifact type based on language
    let type = 'code';
    if (language === 'html' || language === 'xml') type = 'document';
    if (language === 'json') type = 'data';
    if (language === 'sql') type = 'query';

    return { code, type, language };
  }

  return null;
}

// Helper function to clean response content when artifact is extracted
function cleanResponseContent(response: string | any): string {
  // Ensure response is a string
  const responseText = typeof response === 'string' ? response : String(response || '');

  // Remove code blocks from the response
  return responseText.replace(/```[\w]*\n[\s\S]*?```/g, '').trim();
}

// Analyze message intent for routing
function analyzeMessageIntent(message: string): {
  requiresAgent: boolean;
  requiresPrediction: boolean;
  type: string;
  priority?: string;
} {
  const lowerMessage = message.toLowerCase();

  // Check for agent-requiring keywords
  const agentKeywords = {
    compliance: ['compliance', 'regulation', 'audit', 'standard', 'gri', 'tcfd', 'iso'],
    carbon: ['carbon', 'emissions', 'scope 1', 'scope 2', 'scope 3', 'ghg', 'co2'],
    supply: ['supply chain', 'supplier', 'vendor', 'procurement', 'sourcing'],
    strategy: ['strategy', 'plan', 'roadmap', 'target', 'goal', 'objective']
  };

  // Check for prediction-requiring keywords
  const predictionKeywords = ['predict', 'forecast', 'will', 'future', 'trend', 'projection', 'estimate'];

  let requiresAgent = false;
  let requiresPrediction = false;
  let type = 'general';
  let priority = 'medium';

  // Check agent keywords
  for (const [agentType, keywords] of Object.entries(agentKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      requiresAgent = true;
      type = agentType;
      break;
    }
  }

  // Check prediction keywords
  requiresPrediction = predictionKeywords.some(keyword => lowerMessage.includes(keyword));

  // Check for urgency indicators
  if (lowerMessage.includes('urgent') || lowerMessage.includes('critical') || lowerMessage.includes('immediately')) {
    priority = 'high';
  }

  // Energy and emissions always benefit from ML
  if (lowerMessage.includes('energy') || lowerMessage.includes('consumption')) {
    requiresPrediction = true;
    type = type === 'general' ? 'energy' : type;
  }

  if (lowerMessage.includes('emission') || lowerMessage.includes('carbon')) {
    requiresPrediction = true;
    type = type === 'general' ? 'emissions' : type;
  }

  return { requiresAgent, requiresPrediction, type, priority };
}

// Export POST handler with AI middleware (stricter rate limiting)
export const POST = withMiddleware(handleChatMessage, {
  ...middlewareConfigs.ai,
  validation: {
    body: chatMessageSchema,
  },
});