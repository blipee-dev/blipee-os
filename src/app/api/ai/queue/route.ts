/**
 * AI Request Queue Management API
 * Phase 3, Task 3.1: API endpoints for queue management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAIRequestQueue } from '@/lib/ai/queue/ai-request-queue';
import { createSemanticCache } from '@/lib/ai/cache/semantic-cache';
import { createCostOptimizer } from '@/lib/ai/cost/cost-optimizer';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

const semanticCache = createSemanticCache();
const costOptimizer = createCostOptimizer();

/**
 * GET /api/ai/queue - Get queue statistics and status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has appropriate permissions
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || !['account_owner', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'stats';
    const requestId = searchParams.get('requestId');

    const queue = createAIRequestQueue();

    let result;

    switch (action) {
      case 'stats':
        // Get queue statistics
        result = await queue.getQueueStats();
        break;

      case 'status':
        // Get specific request status
        if (!requestId) {
          return NextResponse.json({ 
            error: 'requestId parameter required for status action' 
          }, { status: 400 });
        }
        result = await queue.getRequestStatus(requestId);
        break;

      case 'cleanup':
        // Clean up old requests
        await queue.cleanup();
        result = { message: 'Cleanup completed successfully' };
        
        // Log cleanup activity
        await securityAuditLogger.log({
          eventType: SecurityEventType.SYSTEM_MAINTENANCE,
          userId: user.id,
          action: 'queue_cleanup',
          resource: 'ai_request_queue',
          result: 'success',
          details: { action: 'cleanup_old_requests' },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Valid actions: stats, status, cleanup' 
        }, { status: 400 });
    }

    await queue.disconnect();

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString(),
      data: result
    });

  } catch (error) {
    console.error('AI queue management error:', error);
    
    return NextResponse.json({
      error: 'Failed to manage AI queue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/ai/queue - Enqueue AI request
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      provider, 
      model, 
      messages, 
      priority = 'normal',
      organizationId,
      conversationId,
      maxRetries,
      timeout
    } = body;

    // Validate required fields
    if (!provider || !model || !messages) {
      return NextResponse.json({
        error: 'Missing required fields: provider, model, messages'
      }, { status: 400 });
    }

    // Validate provider
    if (!['deepseek', 'openai', 'anthropic'].includes(provider)) {
      return NextResponse.json({
        error: 'Invalid provider. Must be one of: deepseek, openai, anthropic'
      }, { status: 400 });
    }

    // Validate priority
    if (!['low', 'normal', 'high', 'critical'].includes(priority)) {
      return NextResponse.json({
        error: 'Invalid priority. Must be one of: low, normal, high, critical'
      }, { status: 400 });
    }

    // First check semantic cache for similar requests
    const cacheMatch = await semanticCache.get(messages, provider, model, {
      organizationId,
      userId: user.id,
      contextualMatch: true
    });

    if (cacheMatch) {
      // Track cost savings from cache hit
      try {
        if (organizationId) {
          await costOptimizer.trackRequest(
            organizationId,
            provider,
            model,
            cacheMatch.entry.response.usage,
            {
              latency: 50, // Cache hits are very fast
              cached: true,
              userId: user.id,
              priority: priority,
              success: true
            }
          );
        }
      } catch (costError) {
        console.error('⚠️ Failed to track cache hit cost:', costError);
        // Don't fail the request if cost tracking fails
      }

      // Cache hit - return cached response immediately
      return NextResponse.json({
        success: true,
        cached: true,
        response: cacheMatch.entry.response,
        metadata: {
          similarity: cacheMatch.similarity,
          source: cacheMatch.source,
          cachedAt: cacheMatch.entry.metadata.createdAt,
          accessCount: cacheMatch.entry.metadata.accessCount,
          costSaved: true
        },
        message: 'Response retrieved from semantic cache',
        timestamp: new Date().toISOString()
      });
    }

    const queue = createAIRequestQueue();

    // No cache hit - enqueue the request for processing
    const requestId = await queue.enqueue(provider, model, messages, {
      priority,
      userId: user.id,
      organizationId,
      conversationId,
      maxRetries,
      timeout
    });

    await queue.disconnect();

    // Log queue activity
    await securityAuditLogger.log({
      eventType: SecurityEventType.AI_PROCESSING,
      userId: user.id,
      action: 'enqueue_ai_request',
      resource: 'ai_request_queue',
      result: 'success',
      details: {
        requestId,
        provider,
        model,
        priority,
        organizationId,
        conversationId,
        messageCount: messages.length
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      requestId,
      cached: false,
      message: 'AI request enqueued successfully - no semantic cache match found',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI request enqueue error:', error);
    
    return NextResponse.json({
      error: 'Failed to enqueue AI request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/ai/queue - Update queue configuration (future feature)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only account owners can update queue configuration
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'account_owner') {
      return NextResponse.json({ error: 'Account owner permissions required' }, { status: 403 });
    }

    return NextResponse.json({
      message: 'Queue configuration updates coming soon',
      availableActions: [
        'GET /api/ai/queue?action=stats - Get queue statistics',
        'GET /api/ai/queue?action=status&requestId=... - Get request status',
        'GET /api/ai/queue?action=cleanup - Clean up old requests',
        'POST /api/ai/queue - Enqueue new AI request'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Configuration update not implemented',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/queue - Cancel pending request
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({
        error: 'Missing requestId parameter'
      }, { status: 400 });
    }

    const queue = createAIRequestQueue();

    // Check request status
    const status = await queue.getRequestStatus(requestId);
    
    if (status.status === 'not_found') {
      await queue.disconnect();
      return NextResponse.json({
        error: 'Request not found'
      }, { status: 404 });
    }

    if (status.status === 'completed' || status.status === 'failed') {
      await queue.disconnect();
      return NextResponse.json({
        error: `Cannot cancel ${status.status} request`
      }, { status: 400 });
    }

    // TODO: Implement request cancellation
    await queue.disconnect();

    // Log cancellation attempt
    await securityAuditLogger.log({
      eventType: SecurityEventType.AI_PROCESSING,
      userId: user.id,
      action: 'cancel_ai_request',
      resource: 'ai_request_queue',
      result: 'attempted',
      details: { requestId, currentStatus: status.status },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Request cancellation not yet implemented',
      requestId,
      currentStatus: status.status,
      timestamp: new Date().toISOString()
    }, { status: 501 });

  } catch (error) {
    console.error('AI request cancellation error:', error);
    
    return NextResponse.json({
      error: 'Failed to cancel AI request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}