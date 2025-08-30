/**
 * AI Cost Optimization API
 * Phase 3, Task 3.3: Cost tracking, budgeting, and optimization endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCostOptimizer } from '@/lib/ai/cost/cost-optimizer';
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';

const costOptimizer = createCostOptimizer();

/**
 * GET /api/ai/cost - Get cost metrics and analytics
 * Query parameters:
 * - action: 'metrics' | 'alerts' | 'recommendations' | 'budgets' | 'provider-recommendation'
 * - period: 'hourly' | 'daily' | 'weekly' | 'monthly'
 * - limit: number of periods to return
 * - organizationId: required for all actions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'organizationId parameter is required' 
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
        resource: '/api/ai/cost',
        action: action,
        result: 'failure',
        details: { organizationId }
      });
      
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let result;

    switch (action) {
      case 'metrics':
        const period = searchParams.get('period') as 'hourly' | 'daily' | 'weekly' | 'monthly' || 'daily';
        const limit = parseInt(searchParams.get('limit') || '30');
        
        result = await costOptimizer.getCostMetrics(organizationId, period, limit);
        break;

      case 'alerts':
        const acknowledged = searchParams.get('acknowledged') === 'true';
        result = await costOptimizer.getAlerts(organizationId, acknowledged);
        break;

      case 'recommendations':
        const status = searchParams.get('status') as 'pending' | 'implemented' | 'dismissed' || 'pending';
        result = await costOptimizer.getRecommendations(organizationId, status);
        break;

      case 'provider-recommendation':
        const requestType = searchParams.get('requestType') as 'simple' | 'complex' | 'creative' || 'simple';
        const priority = searchParams.get('priority') as 'low' | 'normal' | 'high' | 'critical' || 'normal';
        
        result = await costOptimizer.getOptimalProvider(organizationId, requestType, priority);
        break;

      case 'summary':
        // Get comprehensive cost summary
        const [dailyMetrics, alerts, recommendations] = await Promise.all([
          costOptimizer.getCostMetrics(organizationId, 'daily', 7),
          costOptimizer.getAlerts(organizationId, false),
          costOptimizer.getRecommendations(organizationId, 'pending')
        ]);
        
        const totalCost = dailyMetrics.reduce((sum, m) => sum + m.totalCost, 0);
        const totalSavings = dailyMetrics.reduce((sum, m) => sum + m.costSavingsFromCache, 0);
        const avgCacheHitRate = dailyMetrics.length > 0 
          ? dailyMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / dailyMetrics.length 
          : 0;
        
        result = {
          period: '7 days',
          totalCost: totalCost.toFixed(4),
          totalSavings: totalSavings.toFixed(4),
          savingsPercentage: totalCost > 0 ? ((totalSavings / (totalCost + totalSavings)) * 100).toFixed(1) : '0',
          avgCacheHitRate: avgCacheHitRate.toFixed(1),
          activeAlerts: alerts.length,
          pendingRecommendations: recommendations.length,
          estimatedMonthlySavings: recommendations.reduce((sum, r) => sum + r.estimatedSavings.monthly, 0).toFixed(2)
        };
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action. Available actions: metrics, alerts, recommendations, provider-recommendation, summary'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      organizationId,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cost optimization API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/ai/cost - Create budgets or track costs
 * Body:
 * - action: 'set-budget' | 'track-request'
 * - Additional fields based on action
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
    const { action, organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'organizationId is required' 
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

    let result;

    switch (action) {
      case 'set-budget':
        // Only allow account owners and sustainability managers to set budgets
        if (!['account_owner', 'sustainability_manager'].includes(member.role)) {
          return NextResponse.json({ 
            error: 'Budget management requires account owner or sustainability manager role' 
          }, { status: 403 });
        }
        
        const { period, limit, warningThreshold, alertThreshold, rolloverUnused } = body;
        
        if (!period || !limit) {
          return NextResponse.json({
            error: 'period and limit are required for budget creation'
          }, { status: 400 });
        }
        
        const budgetKey = await costOptimizer.setBudget(organizationId, {
          period,
          limit: parseFloat(limit),
          warningThreshold: warningThreshold || 80,
          alertThreshold: alertThreshold || 90,
          rolloverUnused: rolloverUnused || false
        });
        
        // Log budget creation
        await securityAuditLogger.log({
          eventType: SecurityEventType.SETTINGS_CHANGED,
          userId: user.id,
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: '/api/ai/cost',
          action: 'set_budget',
          result: 'success',
          details: { organizationId, period, limit, budgetKey }
        });
        
        result = {
          budgetKey,
          message: `Budget set successfully: $${limit}/${period}`,
          organizationId,
          period,
          limit
        };
        break;

      case 'track-request':
        // This is typically called internally by the AI system
        const { provider, model, usage, metadata } = body;
        
        if (!provider || !model || !usage) {
          return NextResponse.json({
            error: 'provider, model, and usage are required for request tracking'
          }, { status: 400 });
        }
        
        await costOptimizer.trackRequest(
          organizationId,
          provider,
          model,
          usage,
          { ...metadata, userId: user.id }
        );
        
        result = {
          message: 'Request tracked successfully',
          organizationId,
          provider,
          model,
          cost: 'calculated automatically'
        };
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action. Available actions: set-budget, track-request'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cost optimization POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process cost optimization request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/ai/cost - Update alerts, recommendations, or budgets
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, organizationId, id } = body;

    if (!organizationId || !id) {
      return NextResponse.json({ 
        error: 'organizationId and id are required' 
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

    let result;

    switch (action) {
      case 'acknowledge-alert':
        // TODO: Implement alert acknowledgment
        result = {
          message: 'Alert acknowledgment feature coming soon',
          alertId: id
        };
        break;

      case 'update-recommendation':
        const { status } = body;
        if (!['implemented', 'dismissed'].includes(status)) {
          return NextResponse.json({
            error: 'status must be "implemented" or "dismissed"'
          }, { status: 400 });
        }
        
        // TODO: Implement recommendation status update
        result = {
          message: 'Recommendation status update feature coming soon',
          recommendationId: id,
          newStatus: status
        };
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action. Available actions: acknowledge-alert, update-recommendation'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cost optimization PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update cost optimization data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/cost - Clean up old cost data
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const action = searchParams.get('action') || 'cleanup';

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'organizationId parameter is required' 
      }, { status: 400 });
    }

    // Only allow account owners to clean up cost data
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!member || member.role !== 'account_owner') {
      return NextResponse.json({ 
        error: 'Account owner permissions required for data cleanup' 
      }, { status: 403 });
    }

    switch (action) {
      case 'cleanup':
        await costOptimizer.cleanup();
        
        // Log cleanup activity
        await securityAuditLogger.log({
          eventType: SecurityEventType.DATA_DELETION,
          userId: user.id,
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: '/api/ai/cost',
          action: 'cleanup',
          result: 'success',
          details: { organizationId }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Cost data cleanup completed successfully',
          organizationId,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Available actions: cleanup'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Cost optimization DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup cost data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}