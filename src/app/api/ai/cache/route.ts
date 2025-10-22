/**
 * AI Semantic Cache Management API Endpoint
 * Phase 3, Task 3.2: Enhanced with semantic cache capabilities
 * 
 * Provides access to AI response cache statistics and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { aiResponseCache } from '@/lib/ai/response-cache';
import { createSemanticCache } from '@/lib/ai/cache/semantic-cache';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

const semanticCache = createSemanticCache();

/**
 * GET /api/ai/cache - Get cache statistics
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
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
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
        resource: '/api/ai/cache',
        action: 'get_stats',
        result: 'failure',
        details: { organizationId }
      });
      
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const action = searchParams.get('action') || 'stats';

    let result;

    switch (action) {
      case 'stats':
        // Get both legacy and semantic cache stats
        const legacyStats = await aiResponseCache.getCacheStats(organizationId);
        const semanticStats = await semanticCache.getStats();
        
        result = {
          legacy: legacyStats,
          semantic: semanticStats,
          combined: {
            totalCached: (legacyStats.totalCached || 0) + (semanticStats.totalCached || 0),
            cacheSize: (legacyStats.cacheSize || 0) + (semanticStats.cacheSize || 0),
            hitRate: ((legacyStats.hitRate || 0) + (semanticStats.hitRate || 0)) / 2,
            avgResponseTime: ((legacyStats.avgResponseTime || 0) + (semanticStats.avgResponseTime || 0)) / 2,
            topQueries: [...(legacyStats.topQueries || []), ...(semanticStats.topQueries || [])],
            totalEntries: (legacyStats.totalEntries || 0) + (semanticStats.totalEntries || 0),
            totalCostSavings: semanticStats.costSavings?.estimatedDollarsSaved || 0
          }
        };
        break;

      case 'semantic-stats':
        // Get detailed semantic cache statistics
        result = await semanticCache.getStats();
        break;

      case 'warm':
        if (!['account_owner', 'sustainability_manager'].includes(member.role)) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        
        // Warm semantic cache with ESG-specific queries
        const commonQueries = [
          {
            messages: [{ role: 'user' as const, content: `What is ${organizationId}'s current carbon footprint?` }],
            provider: 'deepseek' as const,
            model: 'deepseek-chat',
            tags: ['carbon', 'footprint', 'esg', organizationId]
          },
          {
            messages: [{ role: 'user' as const, content: `Show Scope 1 emissions data for ${organizationId}` }],
            provider: 'deepseek' as const,
            model: 'deepseek-chat',
            tags: ['scope1', 'emissions', 'data', organizationId]
          },
          {
            messages: [{ role: 'user' as const, content: `Generate sustainability report summary for ${organizationId}` }],
            provider: 'deepseek' as const,
            model: 'deepseek-chat',
            tags: ['sustainability', 'report', 'summary', organizationId]
          }
        ];

        await semanticCache.warmCache(commonQueries);
        
        result = {
          message: `Cache warmed with ${commonQueries.length} ESG queries for organization ${organizationId}`,
          queriesWarmed: commonQueries.length
        };
        
        await securityAuditLogger.log({
          eventType: SecurityEventType.SETTINGS_CHANGED,
          userId: user.id,
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: '/api/ai/cache',
          action: 'warm',
          result: 'success',
          details: result
        });
        break;

      case 'cleanup':
        if (!['account_owner', 'sustainability_manager'].includes(member.role)) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        
        // Clean up expired semantic cache entries
        await semanticCache.cleanup();
        
        result = {
          message: 'Semantic cache cleanup completed'
        };
        
        await securityAuditLogger.log({
          eventType: SecurityEventType.MAINTENANCE,
          userId: user.id,
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: '/api/ai/cache',
          action: 'cleanup',
          result: 'success',
          details: result
        });
        break;

      case 'optimize':
        if (!['account_owner', 'sustainability_manager'].includes(member.role)) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        
        // Legacy cache optimization
        result = await aiResponseCache.optimizeCache(organizationId);
        
        await securityAuditLogger.log({
          eventType: SecurityEventType.SETTINGS_CHANGED,
          userId: user.id,
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: '/api/ai/cache',
          action: 'optimize',
          result: 'success',
          details: result
        });
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Available actions: stats, semantic-stats, warm, cleanup, optimize' 
        }, { status: 400 });
    }

    return NextResponse.json({
      action,
      organizationId,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache error:', error);
    
    return NextResponse.json({
      _error: 'Failed to get cache statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/cache - Clear AI response cache
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { organizationId, cacheType = 'all' } = requestBody;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Verify user has admin access to organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!member || member.role !== 'account_owner') {
      return NextResponse.json({ error: 'Account owner access required' }, { status: 403 });
    }

    let result: any = {};

    switch (cacheType) {
      case 'all':
        // Clear both legacy and semantic caches
        await aiResponseCache.invalidateOrganizationCache(organizationId);
        const semanticCleared = await semanticCache.clear({ organizationId });
        result = {
          message: 'All AI caches cleared successfully',
          legacy: 'cleared',
          semantic: { entriesCleared: semanticCleared }
        };
        break;

      case 'legacy':
        // Clear only legacy cache
        await aiResponseCache.invalidateOrganizationCache(organizationId);
        result = { message: 'Legacy AI response cache cleared successfully' };
        break;

      case 'semantic':
        // Clear only semantic cache
        const cleared = await semanticCache.clear({ organizationId });
        result = { 
          message: 'Semantic cache cleared successfully',
          entriesCleared: cleared 
        };
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid cacheType. Use: all, legacy, semantic' 
        }, { status: 400 });
    }

    // Log the action
    await securityAuditLogger.log({
      eventType: SecurityEventType.DATA_DELETION,
      userId: user.id,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: '/api/ai/cache',
      action: 'clear_cache',
      result: 'success',
      details: { organizationId, cacheType, ...result }
    });

    return NextResponse.json({
      ...result,
      organizationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache error:', error);
    
    return NextResponse.json({
      _error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/ai/cache - Check semantic cache for request
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, provider, model, organizationId, conversationId } = body;

    // Validate request
    if (!messages || !Array.isArray(messages) || !provider || !model || !organizationId) {
      return NextResponse.json({
        error: 'Missing required fields: messages, provider, model, organizationId'
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check semantic cache
    const cacheMatch = await semanticCache.get(messages, provider, model, {
      organizationId,
      userId: user.id,
      contextualMatch: true
    });

    if (cacheMatch) {
      // Cache hit - return cached response
      return NextResponse.json({
        success: true,
        cached: true,
        response: cacheMatch.entry.response,
        metadata: {
          similarity: cacheMatch.similarity,
          source: cacheMatch.source,
          cachedAt: cacheMatch.entry.metadata.createdAt,
          accessCount: cacheMatch.entry.metadata.accessCount
        }
      });
    }

    // Cache miss
    return NextResponse.json({
      success: true,
      cached: false,
      suggestion: 'No semantic match found - consider processing with AI queue'
    });

  } catch (error) {
    console.error('❌ Semantic cache check error:', error);
    return NextResponse.json({
      error: 'Failed to check semantic cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/ai/cache - Store response in semantic cache
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      messages, 
      response, 
      organizationId, 
      conversationId,
      ttl,
      tags 
    } = body;

    // Validate request
    if (!messages || !response || !response.provider || !response.model || !organizationId) {
      return NextResponse.json({
        error: 'Missing required fields: messages, response (with provider/model), organizationId'
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Store in semantic cache
    const cacheId = await semanticCache.set(messages, response, {
      organizationId,
      userId: user.id,
      conversationId,
      ttl,
      tags: [...(tags || []), 'api_stored', organizationId]
    });

    return NextResponse.json({
      success: true,
      cacheId,
      message: 'Response stored in semantic cache',
      organizationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Semantic cache store error:', error);
    return NextResponse.json({
      error: 'Failed to store in semantic cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}