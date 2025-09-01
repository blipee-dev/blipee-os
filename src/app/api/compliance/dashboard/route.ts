/**
 * Unified Compliance Dashboard API
 * Provides comprehensive compliance status across SOC 2 and GDPR frameworks
 */

import { NextRequest, NextResponse } from 'next/server';
import { soc2ComplianceManager } from '@/lib/compliance/soc2/soc2-controls';
import { gdprComplianceManager } from '@/lib/compliance/gdpr/gdpr-compliance';

export interface ComplianceDashboardResponse {
  timestamp: string;
  overallStatus: 'Compliant' | 'Non-Compliant' | 'Partially-Compliant';
  frameworks: {
    soc2: {
      status: 'Compliant' | 'Non-Compliant' | 'Partially-Compliant';
      readinessScore: number;
      readyForAudit: boolean;
      summary: {
        totalControls: number;
        compliantControls: number;
        nonCompliantControls: number;
        exceptionsCount: number;
        overdueTesting: number;
      };
      categories: Record<string, {
        controlCount: number;
        compliantCount: number;
        readinessPercentage: number;
      }>;
    };
    gdpr: {
      status: 'Compliant' | 'Non-Compliant' | 'Partially-Compliant';
      summary: {
        compliantPrinciples: number;
        nonCompliantPrinciples: number;
        totalPrinciples: number;
        overdueAssessments: number;
        openDataBreaches: number;
        overdueDataSubjectRequests: number;
        dataInventoryItems: number;
      };
    };
  };
  criticalIssues: Array<{
    framework: 'SOC2' | 'GDPR';
    issue: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate?: string;
  }>;
  recommendations: Array<{
    framework: 'SOC2' | 'GDPR';
    recommendation: string;
    priority: 'Low' | 'Medium' | 'High';
  }>;
  metrics: {
    complianceScore: number; // Overall 0-100 score
    trendsLastMonth: {
      soc2Score: number[];
      gdprScore: number[];
      dates: string[];
    };
    upcomingDeadlines: Array<{
      framework: 'SOC2' | 'GDPR';
      item: string;
      dueDate: string;
      daysRemaining: number;
    }>;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get SOC 2 compliance data
    const soc2Assessment = await soc2ComplianceManager.performComplianceAssessment();
    const soc2Readiness = soc2ComplianceManager.generateReadinessReport();
    
    // Get GDPR compliance data
    const gdprAssessment = await gdprComplianceManager.performComplianceAssessment();
    
    // Calculate overall compliance score
    const soc2Score = soc2Readiness.readinessScore;
    const gdprScore = Math.round(
      (gdprAssessment.summary.compliantPrinciples / gdprAssessment.summary.totalPrinciples) * 100
    );
    const overallScore = Math.round((soc2Score + gdprScore) / 2);
    
    // Determine overall status
    let overallStatus: 'Compliant' | 'Non-Compliant' | 'Partially-Compliant';
    if (soc2Assessment.overallStatus === 'Compliant' && gdprAssessment.overallStatus === 'Compliant') {
      overallStatus = 'Compliant';
    } else if (soc2Assessment.overallStatus === 'Non-Compliant' || gdprAssessment.overallStatus === 'Non-Compliant') {
      overallStatus = 'Non-Compliant';
    } else {
      overallStatus = 'Partially-Compliant';
    }
    
    // Combine critical issues
    const criticalIssues = [
      ...soc2Readiness.criticalIssues.map(issue => ({
        framework: 'SOC2' as const,
        issue,
        severity: 'Critical' as const
      })),
      ...gdprAssessment.criticalIssues.map(issue => ({
        framework: 'GDPR' as const,
        issue,
        severity: 'High' as const
      }))
    ];
    
    // Combine recommendations
    const recommendations = [
      ...soc2Readiness.recommendations.map(rec => ({
        framework: 'SOC2' as const,
        recommendation: rec,
        priority: 'Medium' as const
      })),
      ...gdprAssessment.recommendations.map(rec => ({
        framework: 'GDPR' as const,
        recommendation: rec,
        priority: 'Medium' as const
      }))
    ];
    
    // Generate upcoming deadlines (mock data for demo)
    const upcomingDeadlines = [
      {
        framework: 'SOC2' as const,
        item: 'Quarterly Risk Assessment',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 15
      },
      {
        framework: 'GDPR' as const,
        item: 'Data Subject Request Response',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 7
      }
    ];
    
    // Generate trend data (mock for demo)
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });
    
    const soc2Trend = Array.from({ length: 30 }, () => 
      Math.max(70, soc2Score + (Math.random() - 0.5) * 10)
    );
    
    const gdprTrend = Array.from({ length: 30 }, () => 
      Math.max(70, gdprScore + (Math.random() - 0.5) * 10)
    );
    
    const dashboardResponse: ComplianceDashboardResponse = {
      timestamp: new Date().toISOString(),
      overallStatus,
      frameworks: {
        soc2: {
          status: soc2Assessment.overallStatus,
          readinessScore: soc2Readiness.readinessScore,
          readyForAudit: soc2Readiness.readyForAudit,
          summary: soc2Assessment.summary,
          categories: soc2Readiness.categories
        },
        gdpr: {
          status: gdprAssessment.overallStatus,
          summary: gdprAssessment.summary
        }
      },
      criticalIssues,
      recommendations,
      metrics: {
        complianceScore: overallScore,
        trendsLastMonth: {
          soc2Score: soc2Trend,
          gdprScore: gdprTrend,
          dates
        },
        upcomingDeadlines
      }
    };
    
    const response = NextResponse.json(dashboardResponse);
    response.headers.set('Cache-Control', 'no-cache, max-age=300'); // Cache for 5 minutes
    
    return response;
    
  } catch (error) {
    console.error('Compliance dashboard error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate compliance dashboard',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for triggering compliance assessments
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, framework } = body;
    
    if (action === 'refresh_assessment') {
      if (framework === 'soc2' || !framework) {
        await soc2ComplianceManager.performComplianceAssessment();
      }
      
      if (framework === 'gdpr' || !framework) {
        await gdprComplianceManager.performComplianceAssessment();
      }
      
      return NextResponse.json({
        success: true,
        message: 'Compliance assessments refreshed',
        timestamp: new Date().toISOString(),
        framework: framework || 'all'
      });
    }
    
    if (action === 'generate_report') {
      // In a real implementation, this would generate a comprehensive PDF report
      const reportId = `compliance_report_${Date.now()}`;
      
      return NextResponse.json({
        success: true,
        reportId,
        message: 'Compliance report generation initiated',
        estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Compliance dashboard POST error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process compliance request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}