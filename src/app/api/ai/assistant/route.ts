/**
 * Blipee Assistant API Endpoint
 * Handles intelligent conversations with context-aware responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlipeeAssistant } from '@/lib/ai/blipee-assistant';
import { getServerSession } from '@/lib/auth/session';
import { z } from 'zod';

// Request validation schema
const assistantRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
  pathname: z.string().optional().default('/blipee-ai'),
  action: z.enum(['chat', 'feedback', 'export', 'clear', 'health']).optional().default('chat'),
  satisfaction: z.number().min(1).max(5).optional(),
  feedback: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validated = assistantRequestSchema.parse(body);

    // Initialize Blipee Assistant
    const assistant = new BlipeeAssistant(session);

    // Handle different actions
    switch (validated.action) {
      case 'chat': {
        // Initialize conversation if needed
        if (validated.conversationId) {
          await assistant.initializeConversation(validated.conversationId);
        } else {
          await assistant.initializeConversation();
        }

        // Process message and get response
        const response = await assistant.processMessage(
          validated.message,
          validated.pathname
        );

        // Log interaction for analytics
        logInteraction(session.user.id, validated.message, response);

        return NextResponse.json({
          success: true,
          data: response
        });
      }

      case 'feedback': {
        // Record user feedback
        if (!validated.satisfaction) {
          return NextResponse.json(
            { error: 'Satisfaction rating required' },
            { status: 400 }
          );
        }

        await assistant.initializeConversation(validated.conversationId);
        await assistant.recordFeedback(validated.satisfaction, validated.feedback);

        return NextResponse.json({
          success: true,
          message: 'Feedback recorded successfully'
        });
      }

      case 'export': {
        // Export conversation
        await assistant.initializeConversation(validated.conversationId);
        const exportData = await assistant.exportConversation();

        return NextResponse.json({
          success: true,
          data: exportData
        });
      }

      case 'clear': {
        // Clear conversation
        await assistant.initializeConversation(validated.conversationId);
        await assistant.clearConversation();

        return NextResponse.json({
          success: true,
          message: 'Conversation cleared successfully'
        });
      }

      case 'health': {
        // Get system health status
        const health = await BlipeeAssistant.getSystemHealth();

        return NextResponse.json({
          success: true,
          data: health
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Blipee Assistant API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get system health status
    const health = await BlipeeAssistant.getSystemHealth();

    return NextResponse.json({
      success: true,
      data: {
        ...health,
        version: '1.0.0',
        capabilities: [
          'multi-agent-orchestration',
          'context-aware-responses',
          'role-based-adaptation',
          'proactive-suggestions',
          'ml-predictions',
          'conversation-persistence'
        ]
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}

/**
 * Log interaction for analytics
 */
function logInteraction(userId: string, message: string, response: any) {
  // In production, send to analytics service
  console.log('Interaction logged:', {
    userId,
    messageLength: message.length,
    intent: response.metadata?.intent?.primary,
    agentsUsed: response.metadata?.agentsUsed,
    confidence: response.metadata?.confidence,
    responseTime: response.metadata?.responseTime
  });
}