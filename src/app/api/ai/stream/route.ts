/**
 * Enhanced AI Streaming API Endpoint with Server-Sent Events
 * 
 * Provides real-time streaming AI responses using SSE protocol
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { streamingService } from '@/lib/ai/streaming-service';
import { ConversationContext } from '@/lib/ai/enhanced-service';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';
import { metrics } from '@/lib/monitoring/metrics';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/ai/stream - Start a new streaming session
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = createClient();
    
    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      conversationId, 
      organizationId, 
      buildingId,
      query,
      messageHistory = [],
      preferences = {}
    } = body;

    if (!conversationId || !organizationId || !query) {
      return NextResponse.json({ 
        _error: 'Missing required fields: conversationId, organizationId, query' 
      }, { status: 400 });
    }

    // Verify user has access to organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!member) {
      await securityAuditLogger.log({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resource: `/api/ai/stream`,
        action: 'stream_request',
        result: 'failure',
        details: { organizationId, conversationId }
      });
      
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build conversation context
    const context: ConversationContext = {
      conversationId,
      organizationId,
      buildingId,
      userId: user.id,
      messageHistory,
      preferences
    };

    // Create streaming session
    const { sessionId } = await streamingService.createStreamingSession(
      conversationId,
      context
    );

    // Start streaming the AI response in background
    streamingService.streamAIResponse(sessionId, query, {
      includeContext: true,
      includeTyping: true,
      maxTokens: 2000
    }).catch(error => {
      console.error('Streaming error:', error);
    });

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Create SSE response  
    const readable = new ReadableStream({
      start(controller) {
        // Add client to session
        streamingService.addClientToSession(sessionId, user.id, controller).catch(error => {
          console.error('Error adding client to session:', error);
          controller.error(error);
        });
      },
      cancel() {
        // Cleanup will be handled by streaming service
      }
    });

    // Record metrics
    metrics.incrementCounter('ai_stream_requests', 1, {
      organization_id: organizationId,
      user_id: user.id
    });

    metrics.recordHistogram('ai_stream_setup_time', Date.now() - startTime, {
      organization_id: organizationId
    });

    // Log successful streaming session creation
    await securityAuditLogger.log({
      eventType: SecurityEventType.AI_STREAM_STARTED,
      userId: user.id,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: `/api/ai/stream`,
      action: 'create_session',
      result: 'success',
      details: { sessionId, organizationId, conversationId }
    });

    return new Response(readable, { headers });

  } catch (error) {
    console.error('Error:', error);
    
    metrics.incrementCounter('ai_stream_errors', 1, {
      error_type: 'setup_failed'
    });

    return NextResponse.json({
      _error: 'Failed to start streaming session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/stream - Get streaming service status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session info
      const sessionInfo = streamingService.getSessionInfo(sessionId);
      
      return NextResponse.json({
        sessionId,
        ...sessionInfo,
        timestamp: new Date().toISOString()
      });
    } else {
      // Get service statistics
      const stats = streamingService.getServiceStats();
      
      return NextResponse.json({
        service: 'AI Streaming Service',
        status: 'active',
        ...stats,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error:', error);
    
    return NextResponse.json({
      _error: 'Failed to get streaming status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/stream - End a streaming session
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, clientId } = body;

    if (!sessionId && !clientId) {
      return NextResponse.json({ 
        _error: 'Either sessionId or clientId is required' 
      }, { status: 400 });
    }

    if (clientId) {
      // Remove specific client
      await streamingService.removeClient(clientId);
      
      return NextResponse.json({
        message: 'Client removed from session',
        clientId,
        timestamp: new Date().toISOString()
      });
    }

    // For session-level cleanup, we'd need additional logic here
    return NextResponse.json({
      message: 'Session cleanup requested',
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    
    return NextResponse.json({
      _error: 'Failed to cleanup streaming session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
