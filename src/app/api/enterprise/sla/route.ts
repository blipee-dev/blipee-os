/**
 * SLA Management API
 * REST endpoints for service level agreement monitoring and reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { slaManager } from '@/lib/enterprise/sla/sla-manager';

export interface SLARequest {
  action: 'get_dashboard' | 'get_sla_details' | 'generate_report' | 'get_breaches' | 'add_maintenance' | 'update_breach' | 'get_metrics';
  slaId?: string;
  reportPeriod?: 'daily' | 'weekly' | 'monthly' | 'custom';
  customPeriod?: {
    startDate: string;
    endDate: string;
  };
  maintenanceWindow?: {
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    affectedServices: string[];
    approvedBy: string;
    type: 'planned' | 'emergency';
  };
  breachUpdate?: {
    breachId: string;
    status?: 'open' | 'investigating' | 'resolved' | 'credited';
    rootCause?: string;
    resolution?: string;
    creditAmount?: number;
  };
}

export interface SLAResponse {
  success: boolean;
  timestamp: string;
  action: string;
  data?: any;
  error?: string;
  metadata?: {
    processingTime?: number;
    recordsReturned?: number;
    healthScore?: number;
  };
}

/**
 * GET endpoint for SLA data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'dashboard';
    const slaId = searchParams.get('slaId');
    
    switch (view) {
      case 'dashboard':
        return await handleDashboard(startTime);
      
      case 'definitions':
        return await handleDefinitions(startTime);
      
      case 'breaches':
        return await handleGetBreaches(slaId, startTime);
      
      case 'reports':
        return await handleGetReports(slaId, startTime);
      
      case 'metrics':
        return await handleGetMetrics(slaId, startTime);
      
      case 'maintenance':
        return await handleGetMaintenance(startTime);
      
      default:
        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            action: 'get',
            error: 'Invalid view parameter'
          } as SLAResponse,
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('SLA GET error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'get',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime
        }
      } as SLAResponse,
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for SLA operations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: SLARequest = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'generate_report':
        return await handleGenerateReport(body, startTime);
      
      case 'add_maintenance':
        return await handleAddMaintenance(body, startTime);
      
      case 'update_breach':
        return await handleUpdateBreach(body, startTime);
      
      default:
        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            action: action || 'unknown',
            error: 'Invalid action'
          } as SLAResponse,
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('SLA POST error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime
        }
      } as SLAResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle dashboard request
 */
async function handleDashboard(startTime: number): Promise<NextResponse> {
  const dashboard = slaManager.getSLADashboard();
  const definitions = Array.from(slaManager.getSLADefinitions().values());
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'dashboard',
    data: {
      summary: {
        activeSLAs: dashboard.activeSLAs,
        overallHealthScore: dashboard.overallHealthScore,
        activeBreaches: dashboard.activeBreaches,
        upcomingMaintenances: dashboard.upcomingMaintenances
      },
      slaOverview: definitions.filter(sla => sla.isActive).map(sla => {
        const recentReport = dashboard.recentReports.find(r => r.slaId === sla.id);
        return {
          id: sla.id,
          name: sla.name,
          tier: sla.tier,
          achievement: recentReport?.overallAchievement || 100,
          metricsCount: sla.metrics.length,
          regionsCount: sla.scope.regions.length
        };
      }),
      criticalMetrics: dashboard.criticalMetrics,
      recentReports: dashboard.recentReports.map(report => ({
        id: report.id,
        slaId: report.slaId,
        period: report.period,
        overallAchievement: report.overallAchievement,
        breachCount: report.breaches.length,
        creditPercentage: report.credits.creditPercentage,
        generatedAt: report.generatedAt
      })),
      trends: {
        dailyAchievement: generateTrendData(7, 95, 100),
        monthlyBreaches: generateTrendData(30, 0, 3)
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      healthScore: dashboard.overallHealthScore
    }
  } as SLAResponse);
}

/**
 * Handle definitions request
 */
async function handleDefinitions(startTime: number): Promise<NextResponse> {
  const definitions = Array.from(slaManager.getSLADefinitions().values());
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'definitions',
    data: {
      definitions: definitions.map(sla => ({
        id: sla.id,
        name: sla.name,
        description: sla.description,
        tier: sla.tier,
        isActive: sla.isActive,
        metrics: sla.metrics.map(m => ({
          id: m.id,
          name: m.name,
          type: m.type,
          target: m.target,
          weight: m.weight,
          criticalityLevel: m.criticalityLevel
        })),
        scope: sla.scope,
        penalties: {
          breachThresholds: sla.penalties.breachThresholds,
          maxCreditPerMonth: sla.penalties.maxCreditPerMonth
        },
        reporting: sla.reporting,
        validFrom: sla.validFrom,
        validUntil: sla.validUntil
      })),
      summary: {
        total: definitions.length,
        active: definitions.filter(s => s.isActive).length,
        byTier: {
          enterprise: definitions.filter(s => s.tier === 'enterprise').length,
          professional: definitions.filter(s => s.tier === 'professional').length,
          standard: definitions.filter(s => s.tier === 'standard').length,
          basic: definitions.filter(s => s.tier === 'basic').length
        }
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      recordsReturned: definitions.length
    }
  } as SLAResponse);
}

/**
 * Handle get breaches request
 */
async function handleGetBreaches(slaId: string | null, startTime: number): Promise<NextResponse> {
  const allBreaches = Array.from(slaManager.getBreaches().values());
  const breaches = slaId 
    ? allBreaches.filter(b => b.slaId === slaId)
    : allBreaches;
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'breaches',
    data: {
      breaches: breaches.map(breach => {
        const sla = slaManager.getSLADefinitions().get(breach.slaId);
        const metric = sla?.metrics.find(m => m.id === breach.metricId);
        
        return {
          id: breach.id,
          slaName: sla?.name || 'Unknown',
          metricName: metric?.name || 'Unknown',
          detectedAt: breach.detectedAt,
          resolvedAt: breach.resolvedAt,
          severity: breach.severity,
          status: breach.status,
          impact: breach.impact,
          rootCause: breach.rootCause,
          resolution: breach.resolution,
          creditApplied: breach.creditApplied,
          duration: breach.resolvedAt 
            ? Math.round((breach.resolvedAt.getTime() - breach.detectedAt.getTime()) / (60 * 1000))
            : Math.round((Date.now() - breach.detectedAt.getTime()) / (60 * 1000))
        };
      }),
      summary: {
        total: breaches.length,
        open: breaches.filter(b => b.status === 'open').length,
        investigating: breaches.filter(b => b.status === 'investigating').length,
        resolved: breaches.filter(b => b.status === 'resolved').length,
        credited: breaches.filter(b => b.status === 'credited').length,
        bySeverity: {
          critical: breaches.filter(b => b.severity === 'critical').length,
          major: breaches.filter(b => b.severity === 'major').length,
          minor: breaches.filter(b => b.severity === 'minor').length
        },
        totalCostImpact: breaches.reduce((sum, b) => sum + b.impact.estimatedCostImpact, 0),
        totalCreditsApplied: breaches
          .filter(b => b.creditApplied)
          .reduce((sum, b) => sum + (b.creditApplied?.amount || 0), 0)
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      recordsReturned: breaches.length
    }
  } as SLAResponse);
}

/**
 * Handle get reports request
 */
async function handleGetReports(slaId: string | null, startTime: number): Promise<NextResponse> {
  const allReports = Array.from(slaManager.getReports().values());
  const reports = slaId 
    ? allReports.filter(r => r.slaId === slaId)
    : allReports;
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'reports',
    data: {
      reports: reports
        .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
        .slice(0, 20)
        .map(report => {
          const sla = slaManager.getSLADefinitions().get(report.slaId);
          
          return {
            id: report.id,
            slaName: sla?.name || 'Unknown',
            period: report.period,
            overallAchievement: report.overallAchievement,
            metricResults: report.metricResults,
            breachCount: report.breaches.length,
            uptime: report.uptime,
            performance: report.performance,
            credits: report.credits,
            generatedAt: report.generatedAt
          };
        }),
      summary: {
        totalReports: reports.length,
        averageAchievement: reports.length > 0 
          ? Math.round(reports.reduce((sum, r) => sum + r.overallAchievement, 0) / reports.length * 100) / 100
          : 0,
        totalBreaches: reports.reduce((sum, r) => sum + r.breaches.length, 0),
        totalCreditsIssued: reports.reduce((sum, r) => sum + r.credits.totalCredits, 0)
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      recordsReturned: Math.min(reports.length, 20)
    }
  } as SLAResponse);
}

/**
 * Handle get metrics request
 */
async function handleGetMetrics(slaId: string | null, startTime: number): Promise<NextResponse> {
  const measurements = Array.from(slaManager.getMeasurements().values())
    .filter(m => !slaId || m.slaId === slaId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 100);
  
  // Group metrics by SLA and metric ID
  const metricGroups: Record<string, Record<string, any>> = {};
  
  measurements.forEach(measurement => {
    const key = `${measurement.slaId}_${measurement.metricId}`;
    if (!metricGroups[key]) {
      const sla = slaManager.getSLADefinitions().get(measurement.slaId);
      const metric = sla?.metrics.find(m => m.id === measurement.metricId);
      
      metricGroups[key] = {
        slaId: measurement.slaId,
        slaName: sla?.name || 'Unknown',
        metricId: measurement.metricId,
        metricName: metric?.name || 'Unknown',
        metricType: metric?.type || 'unknown',
        target: measurement.targetValue,
        unit: metric?.target.unit || '',
        measurements: []
      };
    }
    
    metricGroups[key].measurements.push({
      timestamp: measurement.timestamp,
      value: measurement.actualValue,
      achieved: measurement.achieved,
      deviation: measurement.deviationPercentage
    });
  });
  
  const metrics = Object.values(metricGroups).map(group => ({
    ...group,
    currentValue: group.measurements[0]?.value || 0,
    averageValue: group.measurements.reduce((sum: number, m: any) => sum + m.value, 0) / group.measurements.length,
    achievementRate: (group.measurements.filter((m: any) => m.achieved).length / group.measurements.length) * 100,
    trend: calculateTrend(group.measurements.map((m: any) => m.value))
  }));
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'metrics',
    data: {
      metrics,
      summary: {
        totalMeasurements: measurements.length,
        uniqueMetrics: metrics.length,
        overallAchievementRate: measurements.length > 0
          ? Math.round((measurements.filter(m => m.achieved).length / measurements.length) * 100)
          : 0,
        criticalMetrics: metrics.filter(m => m.achievementRate < 90).length
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      recordsReturned: measurements.length
    }
  } as SLAResponse);
}

/**
 * Handle get maintenance request
 */
async function handleGetMaintenance(startTime: number): Promise<NextResponse> {
  const maintenanceWindows = Array.from(slaManager.getMaintenanceWindows().values());
  const now = new Date();
  
  const upcoming = maintenanceWindows.filter(m => m.startTime > now);
  const ongoing = maintenanceWindows.filter(m => m.startTime <= now && m.endTime > now);
  const past = maintenanceWindows.filter(m => m.endTime <= now);
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'maintenance',
    data: {
      upcoming: upcoming.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        startTime: m.startTime,
        endTime: m.endTime,
        duration: Math.round((m.endTime.getTime() - m.startTime.getTime()) / (60 * 1000)),
        type: m.type,
        affectedServices: m.affectedServices,
        approvedBy: m.approvedBy,
        notificationSent: m.notificationSent
      })),
      ongoing: ongoing.map(m => ({
        id: m.id,
        name: m.name,
        remainingMinutes: Math.round((m.endTime.getTime() - now.getTime()) / (60 * 1000)),
        affectedServices: m.affectedServices
      })),
      summary: {
        totalScheduled: maintenanceWindows.length,
        upcoming: upcoming.length,
        ongoing: ongoing.length,
        completed: past.length,
        nextMaintenance: upcoming.length > 0 
          ? upcoming.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0]
          : null
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      recordsReturned: maintenanceWindows.length
    }
  } as SLAResponse);
}

/**
 * Handle generate report request
 */
async function handleGenerateReport(body: SLARequest, startTime: number): Promise<NextResponse> {
  const { slaId, reportPeriod = 'daily', customPeriod } = body;
  
  if (!slaId) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'generate_report',
        error: 'slaId is required'
      } as SLAResponse,
      { status: 400 }
    );
  }
  
  try {
    const report = await slaManager.generateSLAReport(
      slaId,
      reportPeriod,
      customPeriod ? {
        startDate: new Date(customPeriod.startDate),
        endDate: new Date(customPeriod.endDate)
      } : undefined
    );
    
    const sla = slaManager.getSLADefinitions().get(slaId);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'generate_report',
      data: {
        report: {
          id: report.id,
          slaName: sla?.name || 'Unknown',
          period: report.period,
          overallAchievement: report.overallAchievement,
          metricResults: report.metricResults,
          breaches: report.breaches.length,
          uptime: report.uptime,
          performance: report.performance,
          credits: report.credits,
          generatedAt: report.generatedAt
        },
        downloadUrl: `/api/enterprise/sla/reports/${report.id}/download` // Would implement download endpoint
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as SLAResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'generate_report',
        error: error instanceof Error ? error.message : 'Report generation failed'
      } as SLAResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle add maintenance request
 */
async function handleAddMaintenance(body: SLARequest, startTime: number): Promise<NextResponse> {
  const { maintenanceWindow } = body;
  
  if (!maintenanceWindow) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'add_maintenance',
        error: 'maintenanceWindow data is required'
      } as SLAResponse,
      { status: 400 }
    );
  }
  
  try {
    const windowId = slaManager.addMaintenanceWindow(
      maintenanceWindow.name,
      maintenanceWindow.description,
      new Date(maintenanceWindow.startTime),
      new Date(maintenanceWindow.endTime),
      maintenanceWindow.affectedServices,
      maintenanceWindow.approvedBy,
      maintenanceWindow.type
    );
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'add_maintenance',
      data: {
        windowId,
        name: maintenanceWindow.name,
        startTime: maintenanceWindow.startTime,
        endTime: maintenanceWindow.endTime,
        affectedServices: maintenanceWindow.affectedServices
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as SLAResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'add_maintenance',
        error: error instanceof Error ? error.message : 'Failed to add maintenance window'
      } as SLAResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle update breach request
 */
async function handleUpdateBreach(body: SLARequest, startTime: number): Promise<NextResponse> {
  const { breachUpdate } = body;
  
  if (!breachUpdate?.breachId) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'update_breach',
        error: 'breachUpdate.breachId is required'
      } as SLAResponse,
      { status: 400 }
    );
  }
  
  const breach = slaManager.getBreaches().get(breachUpdate.breachId);
  if (!breach) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'update_breach',
        error: 'Breach not found'
      } as SLAResponse,
      { status: 404 }
    );
  }
  
  // Update breach
  if (breachUpdate.status) {
    breach.status = breachUpdate.status;
    if (breachUpdate.status === 'resolved') {
      breach.resolvedAt = new Date();
    }
  }
  
  if (breachUpdate.rootCause) {
    breach.rootCause = breachUpdate.rootCause;
  }
  
  if (breachUpdate.resolution) {
    breach.resolution = breachUpdate.resolution;
  }
  
  if (breachUpdate.creditAmount !== undefined) {
    breach.creditApplied = {
      amount: breachUpdate.creditAmount,
      percentage: breachUpdate.creditAmount,
      appliedAt: new Date(),
      reason: `SLA breach credit for ${breach.severity} severity incident`
    };
    breach.status = 'credited';
  }
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'update_breach',
    data: {
      breachId: breach.id,
      status: breach.status,
      rootCause: breach.rootCause,
      resolution: breach.resolution,
      creditApplied: breach.creditApplied
    },
    metadata: {
      processingTime: Date.now() - startTime
    }
  } as SLAResponse);
}

/**
 * Helper function to generate trend data
 */
function generateTrendData(points: number, min: number, max: number): Array<{ date: string; value: number }> {
  const data: Array<{ date: string; value: number }> = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const value = min + Math.random() * (max - min);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100
    });
  }
  
  return data;
}

/**
 * Helper function to calculate trend
 */
function calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 5) return 'improving';
  if (change < -5) return 'degrading';
  return 'stable';
}