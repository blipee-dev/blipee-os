/**
 * Cost Optimization API
 * REST endpoints for enterprise cost management and optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { costOptimizationAnalyzer } from '@/lib/enterprise/cost-optimization/cost-analyzer';
import { resourceScheduler } from '@/lib/enterprise/cost-optimization/resource-scheduler';

export interface CostOptimizationRequest {
  action: 'analyze' | 'get_recommendations' | 'implement_recommendation' | 'get_budgets' | 'check_alerts' | 'forecast' | 'breakdown' | 'schedule_action' | 'get_scheduler_stats';
  recommendationId?: string;
  implementedBy?: string;
  months?: number;
  scheduleAction?: {
    name: string;
    description: string;
    resourceId: string;
    actionType: 'scale-up' | 'scale-down' | 'start' | 'stop' | 'switch-provider' | 'migrate-region';
    schedule: {
      type: 'cron' | 'interval' | 'one-time' | 'event-driven';
      expression: string;
      timezone?: string;
    };
    parameters: Record<string, any>;
    estimatedSavings: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface CostOptimizationResponse {
  success: boolean;
  timestamp: string;
  action: string;
  data?: any;
  error?: string;
  metadata?: {
    processingTime?: number;
    dataFreshness?: string;
    recommendations?: number;
    totalSavings?: number;
  };
}

/**
 * GET endpoint for cost optimization data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'overview';
    
    switch (view) {
      case 'overview':
        return await handleOverview(startTime);
      
      case 'breakdown':
        return await handleBreakdown(startTime);
      
      case 'recommendations':
        return await handleRecommendations(startTime);
      
      case 'budgets':
        return await handleBudgets(startTime);
      
      case 'forecast':
        const months = parseInt(searchParams.get('months') || '12');
        return await handleForecast(months, startTime);
      
      case 'scheduler':
        return await handleScheduler(startTime);
      
      default:
        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            action: 'get',
            error: 'Invalid view parameter'
          } as CostOptimizationResponse,
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Cost optimization GET error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'get',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime
        }
      } as CostOptimizationResponse,
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for cost optimization actions
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: CostOptimizationRequest = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'analyze':
        return await handleAnalyze(body, startTime);
      
      case 'implement_recommendation':
        return await handleImplementRecommendation(body, startTime);
      
      case 'schedule_action':
        return await handleScheduleAction(body, startTime);
      
      case 'check_alerts':
        return await handleCheckAlerts(body, startTime);
      
      default:
        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            action: action || 'unknown',
            error: 'Invalid action'
          } as CostOptimizationResponse,
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Cost optimization POST error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime
        }
      } as CostOptimizationResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle overview request
 */
async function handleOverview(startTime: number): Promise<NextResponse> {
  const analysis = await costOptimizationAnalyzer.analyzeAndOptimize();
  const breakdown = costOptimizationAnalyzer.getCostBreakdown();
  const schedulerStats = resourceScheduler.getSchedulerStatistics();
  const alerts = costOptimizationAnalyzer.checkBudgetAlerts();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'overview',
    data: {
      summary: {
        totalMonthlyCost: analysis.totalMonthlyCost,
        totalPotentialSavings: analysis.totalPotentialSavings,
        savingsPercentage: Math.round((analysis.totalPotentialSavings / analysis.totalMonthlyCost) * 100),
        budgetStatus: analysis.budgetStatus,
        activeAlerts: alerts.length
      },
      costBreakdown: {
        total: breakdown.total,
        byResourceType: breakdown.byResourceType,
        byProvider: breakdown.byProvider,
        byTeam: breakdown.byTeam
      },
      optimization: {
        recommendationsCount: analysis.recommendations.length,
        highPriorityRecommendations: analysis.recommendations.filter(r => r.priority === 'high').length,
        scheduledActionsCount: schedulerStats.activeActions,
        totalAutomatedSavings: schedulerStats.totalCostSavings
      },
      topRecommendations: analysis.recommendations.slice(0, 3),
      topWastefulResources: analysis.topWastefulResources.slice(0, 3),
      alerts: alerts.slice(0, 5)
    },
    metadata: {
      processingTime: Date.now() - startTime,
      dataFreshness: 'real-time',
      recommendations: analysis.recommendations.length,
      totalSavings: analysis.totalPotentialSavings
    }
  } as CostOptimizationResponse);
}

/**
 * Handle breakdown request
 */
async function handleBreakdown(startTime: number): Promise<NextResponse> {
  const breakdown = costOptimizationAnalyzer.getCostBreakdown();
  const resources = Array.from(costOptimizationAnalyzer.getResources().values());
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'breakdown',
    data: {
      breakdown,
      resources: resources.map(r => ({
        resourceId: r.resourceId,
        resourceType: r.resourceType,
        provider: r.provider,
        region: r.region,
        monthlyCost: r.costMetrics.monthly,
        utilizationRate: r.efficiency.utilizationRate,
        wastePercentage: r.efficiency.wastePercentage,
        potentialSavings: r.efficiency.rightsizingOpportunity,
        tags: r.tags
      })),
      summary: {
        totalResources: resources.length,
        averageUtilization: Math.round(resources.reduce((sum, r) => sum + r.efficiency.utilizationRate, 0) / resources.length),
        mostExpensiveResource: resources.reduce((max, r) => r.costMetrics.monthly > max.costMetrics.monthly ? r : max, resources[0]),
        leastEfficientResource: resources.reduce((min, r) => r.efficiency.utilizationRate < min.efficiency.utilizationRate ? r : min, resources[0])
      }
    },
    metadata: {
      processingTime: Date.now() - startTime
    }
  } as CostOptimizationResponse);
}

/**
 * Handle recommendations request
 */
async function handleRecommendations(startTime: number): Promise<NextResponse> {
  const analysis = await costOptimizationAnalyzer.analyzeAndOptimize();
  const recommendations = Array.from(costOptimizationAnalyzer.getRecommendations().values());
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'recommendations',
    data: {
      recommendations: recommendations.map(r => ({
        id: r.id,
        type: r.type,
        priority: r.priority,
        resourceId: r.resourceId,
        title: r.title,
        description: r.description,
        impact: r.impact,
        implementation: {
          estimatedTimeHours: r.implementation.estimatedTimeHours,
          complexity: r.implementation.estimatedTimeHours <= 4 ? 'low' : r.implementation.estimatedTimeHours <= 12 ? 'medium' : 'high',
          requiredSkills: r.implementation.requiredSkills
        },
        status: r.status,
        createdAt: r.createdAt
      })),
      summary: {
        totalRecommendations: recommendations.length,
        totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.impact.costSavings.yearly, 0),
        byPriority: {
          critical: recommendations.filter(r => r.priority === 'critical').length,
          high: recommendations.filter(r => r.priority === 'high').length,
          medium: recommendations.filter(r => r.priority === 'medium').length,
          low: recommendations.filter(r => r.priority === 'low').length
        },
        byType: recommendations.reduce((acc, r) => {
          acc[r.type] = (acc[r.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      recommendations: recommendations.length
    }
  } as CostOptimizationResponse);
}

/**
 * Handle budgets request
 */
async function handleBudgets(startTime: number): Promise<NextResponse> {
  const budgets = Array.from(costOptimizationAnalyzer.getBudgets().values());
  const alerts = costOptimizationAnalyzer.checkBudgetAlerts();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'budgets',
    data: {
      budgets: budgets.map(b => ({
        id: b.id,
        name: b.name,
        scope: b.scope,
        budgetLimits: b.budgetLimits,
        currentSpend: b.currentSpend,
        utilization: {
          monthly: Math.round((b.currentSpend.thisMonth / b.budgetLimits.monthly) * 100),
          quarterly: Math.round((b.currentSpend.thisQuarter / b.budgetLimits.quarterly) * 100),
          yearly: Math.round((b.currentSpend.thisYear / b.budgetLimits.yearly) * 100)
        },
        projected: {
          monthlyOverage: Math.max(0, b.currentSpend.projectedMonth - b.budgetLimits.monthly),
          burnRate: b.currentSpend.projectedMonth / b.budgetLimits.monthly
        },
        isActive: b.isActive
      })),
      alerts,
      summary: {
        totalBudgets: budgets.length,
        activeBudgets: budgets.filter(b => b.isActive).length,
        budgetsOverLimit: alerts.filter(a => a.percentageUsed >= 100).length,
        budgetsNearLimit: alerts.filter(a => a.percentageUsed >= 80 && a.percentageUsed < 100).length
      }
    },
    metadata: {
      processingTime: Date.now() - startTime
    }
  } as CostOptimizationResponse);
}

/**
 * Handle forecast request
 */
async function handleForecast(months: number, startTime: number): Promise<NextResponse> {
  const forecast = costOptimizationAnalyzer.generateCostForecast(months);
  const currentBreakdown = costOptimizationAnalyzer.getCostBreakdown();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'forecast',
    data: {
      forecast,
      currentMonthlyCost: currentBreakdown.total,
      summary: {
        totalProjectedCost: forecast.reduce((sum, f) => sum + f.projectedCost, 0),
        averageMonthlyCost: Math.round(forecast.reduce((sum, f) => sum + f.projectedCost, 0) / forecast.length),
        highestMonth: forecast.reduce((max, f) => f.projectedCost > max.projectedCost ? f : max, forecast[0]),
        lowestMonth: forecast.reduce((min, f) => f.projectedCost < min.projectedCost ? f : min, forecast[0])
      },
      trends: {
        growthRate: months > 1 ? ((forecast[months - 1].projectedCost - forecast[0].projectedCost) / forecast[0].projectedCost) * 100 : 0,
        seasonalVariation: forecast.reduce((max, f, i) => {
          if (i === 0) return 0;
          const change = Math.abs((f.projectedCost - forecast[i - 1].projectedCost) / forecast[i - 1].projectedCost) * 100;
          return change > max ? change : max;
        }, 0)
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      forecastMonths: months
    }
  } as CostOptimizationResponse);
}

/**
 * Handle scheduler request
 */
async function handleScheduler(startTime: number): Promise<NextResponse> {
  const stats = resourceScheduler.getSchedulerStatistics();
  const upcomingActions = resourceScheduler.getUpcomingExecutions(72); // Next 3 days
  const recentLogs = Array.from(resourceScheduler.getExecutionLogs().values())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'scheduler',
    data: {
      statistics: stats,
      upcomingActions: upcomingActions.map(a => ({
        id: a.id,
        name: a.name,
        actionType: a.actionType,
        resourceId: a.resourceId,
        nextExecution: a.nextExecution,
        estimatedSavings: a.costImpact.estimatedSavings,
        riskLevel: a.costImpact.riskLevel
      })),
      recentExecutions: recentLogs.map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        status: l.status,
        duration: l.duration,
        costImpact: l.costImpact,
        resourcesAffected: l.metrics.resourcesAffected
      })),
      summary: {
        nextExecution: stats.nextExecution,
        successRate: stats.totalExecutions > 0 ? Math.round((stats.successfulExecutions / stats.totalExecutions) * 100) : 0,
        avgCostSavingPerExecution: stats.totalExecutions > 0 ? Math.round((stats.totalCostSavings / stats.totalExecutions) * 100) / 100 : 0,
        totalMonthlySavings: stats.totalCostSavings * 30 // Assuming daily tracking
      }
    },
    metadata: {
      processingTime: Date.now() - startTime
    }
  } as CostOptimizationResponse);
}

/**
 * Handle analyze request
 */
async function handleAnalyze(body: CostOptimizationRequest, startTime: number): Promise<NextResponse> {
  const analysis = await costOptimizationAnalyzer.analyzeAndOptimize();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'analyze',
    data: analysis,
    metadata: {
      processingTime: Date.now() - startTime,
      recommendations: analysis.recommendations.length,
      totalSavings: analysis.totalPotentialSavings
    }
  } as CostOptimizationResponse);
}

/**
 * Handle implement recommendation request
 */
async function handleImplementRecommendation(body: CostOptimizationRequest, startTime: number): Promise<NextResponse> {
  const { recommendationId, implementedBy } = body;
  
  if (!recommendationId || !implementedBy) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'implement_recommendation',
        error: 'recommendationId and implementedBy are required'
      } as CostOptimizationResponse,
      { status: 400 }
    );
  }
  
  try {
    costOptimizationAnalyzer.implementRecommendation(recommendationId, implementedBy);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'implement_recommendation',
      data: {
        recommendationId,
        implementedBy,
        status: 'implementing'
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as CostOptimizationResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'implement_recommendation',
        error: error instanceof Error ? error.message : 'Implementation failed'
      } as CostOptimizationResponse,
      { status: 404 }
    );
  }
}

/**
 * Handle schedule action request
 */
async function handleScheduleAction(body: CostOptimizationRequest, startTime: number): Promise<NextResponse> {
  const { scheduleAction } = body;
  
  if (!scheduleAction) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'schedule_action',
        error: 'scheduleAction data is required'
      } as CostOptimizationResponse,
      { status: 400 }
    );
  }
  
  try {
    const actionId = resourceScheduler.addScheduledAction({
      name: scheduleAction.name,
      description: scheduleAction.description,
      resourceId: scheduleAction.resourceId,
      actionType: scheduleAction.actionType,
      schedule: scheduleAction.schedule,
      parameters: scheduleAction.parameters,
      costImpact: {
        estimatedSavings: scheduleAction.estimatedSavings,
        riskLevel: scheduleAction.riskLevel
      },
      status: 'active',
      createdBy: 'api'
    });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'schedule_action',
      data: {
        actionId,
        name: scheduleAction.name,
        estimatedSavings: scheduleAction.estimatedSavings
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as CostOptimizationResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'schedule_action',
        error: error instanceof Error ? error.message : 'Scheduling failed'
      } as CostOptimizationResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle check alerts request
 */
async function handleCheckAlerts(body: CostOptimizationRequest, startTime: number): Promise<NextResponse> {
  const alerts = costOptimizationAnalyzer.checkBudgetAlerts();
  const criticalAlerts = alerts.filter(a => a.alertLevel === 'critical');
  const highAlerts = alerts.filter(a => a.alertLevel === 'high');
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'check_alerts',
    data: {
      alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: criticalAlerts.length,
        highAlerts: highAlerts.length,
        requiresImmediateAttention: criticalAlerts.length > 0
      },
      actions: criticalAlerts.length > 0 ? [
        'Immediate cost reduction required',
        'Consider implementing high-priority recommendations',
        'Review and adjust budget limits if necessary'
      ] : []
    },
    metadata: {
      processingTime: Date.now() - startTime
    }
  } as CostOptimizationResponse);
}