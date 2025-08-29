/**
 * AI Cache Management API Endpoint
 * 
 * Provides access to AI response cache statistics and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiResponseCache } from '@/lib/ai/response-cache';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

/**
 * GET /api/ai/cache - Get cache statistics
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ _error: 'Organization ID required' }, { status: 400 });
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
        _userId: user.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resource: '/api/ai/cache',
        action: 'get_stats',
        result: 'failure',
        details: { organizationId }
      });
      
      return NextResponse.json({ _error: 'Access denied' }, { status: 403 });
    }

    const action = searchParams.get('action') || 'stats';

    let result;

    switch (action) {
      case 'stats':
        result = await aiResponseCache.getCacheStats(organizationId);
        break;

      case 'optimize':
        if (!['account_owner', 'sustainability_manager'].includes(member.role)) {
          return NextResponse.json({ _error: 'Admin access required' }, { status: 403 });
        }
        
        result = await aiResponseCache.optimizeCache(organizationId);
        
        await securityAuditLogger.log({
          eventType: SecurityEventType.SETTINGS_CHANGED,
          _userId: user.id,
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: '/api/ai/cache',
          action: 'optimize',
          result: 'success',
          details: result
        });
        break;

      default:
        return NextResponse.json({ _error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      action,
      organizationId,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI cache _error:', error);
    
    return NextResponse.json({
      _error: 'Failed to get cache statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/cache - Clear AI response cache
 */
export async function DELETE(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ _error: 'Organization ID required' }, { status: 400 });
    }

    // Verify user has admin access to organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!member || member.role !== 'account_owner') {
      return NextResponse.json({ _error: 'Account owner access required' }, { status: 403 });
    }

    // Clear the cache
    await aiResponseCache.invalidateOrganizationCache(organizationId);

    // Log the action
    await securityAuditLogger.log({
      eventType: SecurityEventType.DATA_DELETION,
      _userId: user.id,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: '/api/ai/cache',
      action: 'clear_cache',
      result: 'success',
      details: { organizationId }
    });

    return NextResponse.json({
      message: 'AI response cache cleared successfully',
      organizationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Clear cache _error:', error);
    
    return NextResponse.json({
      _error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}