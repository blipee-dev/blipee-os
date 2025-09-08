/**
 * Security Scanning API
 * POST /api/security/scan - Run comprehensive security scan
 * GET /api/security/scan - Get latest security scan results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { securityManager } from '@/lib/security/security-manager';
import { withEnhancedAuth } from '@/middleware/security';
import { withAPIVersioning } from '@/middleware/api-versioning';

async function runSecurityScan(req: NextRequest, context: any) {
  try {
    const { scanType = 'full', targets = [] } = await req.json();
    const { user } = context;

    // Only account owners can run security scans
    if (user.role !== 'account_owner') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only account owners can run security scans' },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // Check if there's already a scan running
    const { data: runningScan } = await supabase
      .from('security_scans')
      .select('*')
      .eq('organization_id', user.organizationId)
      .eq('status', 'running')
      .maybeSingle();

    if (runningScan) {
      return NextResponse.json(
        { 
          error: 'SCAN_ALREADY_RUNNING', 
          message: 'A security scan is already in progress',
          scanId: runningScan.id
        },
        { status: 409 }
      );
    }

    // Create new security scan record
    const { data: scan, error: scanError } = await supabase
      .from('security_scans')
      .insert({
        organization_id: user.organizationId,
        initiated_by: user.id,
        scan_type: scanType,
        targets: JSON.stringify(targets),
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (scanError) {
      throw scanError;
    }

    // Start the security scan in background
    const scanResults = await performSecurityScan(user.organizationId, scanType, targets);

    // Update scan results
    await supabase
      .from('security_scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: JSON.stringify(scanResults),
        risk_score: scanResults.riskScore,
        issues_found: scanResults.issues.length,
        critical_issues: scanResults.issues.filter((i: any) => i.severity === 'critical').length
      })
      .eq('id', scan.id);

    // Log security scan event
    await securityManager.logSecurityEvent({
      type: 'api_usage',
      severity: 'info',
      userId: user.id,
      organizationId: user.organizationId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      endpoint: '/api/security/scan',
      action: 'security_scan_completed',
      result: 'success',
      metadata: {
        scanId: scan.id,
        scanType,
        issuesFound: scanResults.issues.length,
        riskScore: scanResults.riskScore
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      scan: {
        id: scan.id,
        status: 'completed',
        results: scanResults
      }
    });
  } catch (error) {
    console.error('Security scan error:', error);
    return NextResponse.json(
      {
        error: 'SCAN_ERROR',
        message: 'Failed to complete security scan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getSecurityScanResults(req: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('scanId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const { user } = context;

    const supabase = createClient();

    if (scanId) {
      // Get specific scan results
      const { data: scan, error } = await supabase
        .from('security_scans')
        .select('*')
        .eq('id', scanId)
        .eq('organization_id', user.organizationId)
        .single();

      if (error || !scan) {
        return NextResponse.json(
          { error: 'SCAN_NOT_FOUND', message: 'Security scan not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        scan: {
          ...scan,
          results: scan.results ? JSON.parse(scan.results) : null,
          targets: scan.targets ? JSON.parse(scan.targets) : []
        }
      });
    } else {
      // Get recent scans
      const { data: scans, error } = await supabase
        .from('security_scans')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        scans: scans?.map(scan => ({
          ...scan,
          results: scan.results ? JSON.parse(scan.results) : null,
          targets: scan.targets ? JSON.parse(scan.targets) : []
        })) || []
      });
    }
  } catch (error) {
    console.error('Security scan results error:', error);
    return NextResponse.json(
      {
        error: 'SCAN_RESULTS_ERROR',
        message: 'Failed to retrieve security scan results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function performSecurityScan(
  organizationId: string,
  scanType: string,
  targets: string[]
): Promise<{
  riskScore: number;
  issues: any[];
  recommendations: string[];
  scanDetails: any;
}> {
  const issues: any[] = [];
  const recommendations: string[] = [];
  const scanDetails: any = {
    timestamp: new Date().toISOString(),
    scanType,
    targets
  };

  const supabase = createClient();

  try {
    // 1. Check authentication security
    const authIssues = await scanAuthenticationSecurity(organizationId);
    issues.push(...authIssues);

    // 2. Check API security
    const apiIssues = await scanAPISecurityIssues(organizationId);
    issues.push(...apiIssues);

    // 3. Check data access patterns
    const dataIssues = await scanDataAccessPatterns(organizationId);
    issues.push(...dataIssues);

    // 4. Check integration security
    const integrationIssues = await scanIntegrationSecurity(organizationId);
    issues.push(...integrationIssues);

    // 5. Check user access patterns
    const userIssues = await scanUserAccessPatterns(organizationId);
    issues.push(...userIssues);

    // 6. Check system configuration
    const configIssues = await scanSystemConfiguration(organizationId);
    issues.push(...configIssues);

    // Generate recommendations based on issues found
    recommendations.push(...generateSecurityRecommendations(issues));

    // Calculate risk score
    const riskScore = calculateRiskScore(issues);

    scanDetails.checksPerformed = [
      'Authentication Security',
      'API Security',
      'Data Access Patterns',
      'Integration Security',
      'User Access Patterns',
      'System Configuration'
    ];

    return {
      riskScore,
      issues,
      recommendations,
      scanDetails
    };
  } catch (error) {
    console.error('Security scan execution error:', error);
    throw new Error(`Security scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function scanAuthenticationSecurity(organizationId: string): Promise<any[]> {
  const issues: any[] = [];
  const supabase = createClient();

  try {
    // Check for users without MFA
    const { data: usersWithoutMFA } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('organization_id', organizationId)
      .eq('mfa_enabled', false);

    if (usersWithoutMFA && usersWithoutMFA.length > 0) {
      const criticalRoles = usersWithoutMFA.filter(u => 
        ['account_owner', 'sustainability_manager'].includes(u.role)
      );

      if (criticalRoles.length > 0) {
        issues.push({
          id: 'auth-mfa-missing-critical',
          type: 'authentication',
          severity: 'critical',
          title: 'Critical users without MFA',
          description: `${criticalRoles.length} users in critical roles do not have multi-factor authentication enabled`,
          affected: criticalRoles.map(u => ({ email: u.email, role: u.role })),
          recommendation: 'Enable MFA for all users in critical roles immediately'
        });
      }

      if (usersWithoutMFA.length > criticalRoles.length) {
        issues.push({
          id: 'auth-mfa-missing',
          type: 'authentication',
          severity: 'medium',
          title: 'Users without MFA',
          description: `${usersWithoutMFA.length - criticalRoles.length} regular users do not have multi-factor authentication enabled`,
          affected: usersWithoutMFA.filter(u => !criticalRoles.includes(u)),
          recommendation: 'Encourage all users to enable MFA for enhanced security'
        });
      }
    }

    // Check for recent authentication failures
    const { data: recentFailures } = await supabase
      .from('security_events')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('type', 'authentication')
      .eq('result', 'failure')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentFailures && recentFailures.length > 50) {
      issues.push({
        id: 'auth-high-failure-rate',
        type: 'authentication',
        severity: 'high',
        title: 'High authentication failure rate',
        description: `${recentFailures.length} authentication failures in the last 24 hours`,
        recommendation: 'Investigate potential brute force attacks and consider implementing additional security measures'
      });
    }

    return issues;
  } catch (error) {
    console.error('Authentication security scan error:', error);
    return [];
  }
}

async function scanAPISecurityIssues(organizationId: string): Promise<any[]> {
  const issues: any[] = [];
  const supabase = createClient();

  try {
    // Check for high API usage patterns
    const { data: apiEvents } = await supabase
      .from('security_events')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('type', 'api_usage')
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    if (apiEvents && apiEvents.length > 1000) {
      issues.push({
        id: 'api-high-usage',
        type: 'api_security',
        severity: 'medium',
        title: 'High API usage detected',
        description: `${apiEvents.length} API calls in the last hour`,
        recommendation: 'Review API usage patterns and consider implementing stricter rate limiting'
      });
    }

    // Check for blocked requests
    const blockedRequests = apiEvents?.filter(e => e.result === 'blocked').length || 0;
    if (blockedRequests > 10) {
      issues.push({
        id: 'api-blocked-requests',
        type: 'api_security',
        severity: 'high',
        title: 'Multiple blocked API requests',
        description: `${blockedRequests} API requests were blocked in the last hour`,
        recommendation: 'Investigate the source of blocked requests for potential security threats'
      });
    }

    return issues;
  } catch (error) {
    console.error('API security scan error:', error);
    return [];
  }
}

async function scanDataAccessPatterns(organizationId: string): Promise<any[]> {
  const issues: any[] = [];
  const supabase = createClient();

  try {
    // Check for unusual data access patterns
    const { data: dataEvents } = await supabase
      .from('security_events')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('type', 'data_access')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (dataEvents) {
      // Group by user to identify unusual patterns
      const userAccess = dataEvents.reduce((acc, event) => {
        const userId = event.user_id;
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(event);
        return acc;
      }, {} as Record<string, any[]>);

      Object.entries(userAccess).forEach(([userId, events]) => {
        if (events.length > 500) {
          issues.push({
            id: `data-high-access-${userId}`,
            type: 'data_access',
            severity: 'medium',
            title: 'High data access volume',
            description: `User ${userId} accessed data ${events.length} times in 24 hours`,
            recommendation: 'Review data access patterns for potential data exfiltration'
          });
        }
      });
    }

    return issues;
  } catch (error) {
    console.error('Data access pattern scan error:', error);
    return [];
  }
}

async function scanIntegrationSecurity(organizationId: string): Promise<any[]> {
  const issues: any[] = [];
  const supabase = createClient();

  try {
    // Check integration configurations
    const { data: integrations } = await supabase
      .from('integration_installations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (integrations) {
      integrations.forEach(integration => {
        const config = integration.configuration || {};
        
        // Check for missing OAuth refresh tokens
        if (config.oauth && !config.oauth.refresh_token) {
          issues.push({
            id: `integration-oauth-${integration.id}`,
            type: 'integration_security',
            severity: 'medium',
            title: 'Integration missing refresh token',
            description: `Integration ${integration.integration_id} lacks a refresh token`,
            recommendation: 'Reconnect the integration to ensure proper OAuth token refresh'
          });
        }

        // Check for expired tokens
        if (config.oauth && config.oauth.expires_at) {
          const expiryTime = new Date(config.oauth.expires_at);
          const now = new Date();
          if (expiryTime < now) {
            issues.push({
              id: `integration-expired-${integration.id}`,
              type: 'integration_security',
              severity: 'high',
              title: 'Integration token expired',
              description: `Integration ${integration.integration_id} has expired authentication tokens`,
              recommendation: 'Refresh or reconnect the integration to maintain security'
            });
          }
        }
      });
    }

    return issues;
  } catch (error) {
    console.error('Integration security scan error:', error);
    return [];
  }
}

async function scanUserAccessPatterns(organizationId: string): Promise<any[]> {
  const issues: any[] = [];
  const supabase = createClient();

  try {
    // Check for dormant users with active sessions
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, last_seen_at, role')
      .eq('organization_id', organizationId);

    if (users) {
      const dormantUsers = users.filter(user => {
        if (!user.last_seen_at) return true;
        const lastSeen = new Date(user.last_seen_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastSeen < thirtyDaysAgo;
      });

      if (dormantUsers.length > 0) {
        issues.push({
          id: 'users-dormant',
          type: 'user_access',
          severity: 'medium',
          title: 'Dormant user accounts',
          description: `${dormantUsers.length} users have not accessed the system in 30+ days`,
          affected: dormantUsers.map(u => ({ email: u.email, role: u.role })),
          recommendation: 'Review and deactivate dormant user accounts to reduce security risk'
        });
      }
    }

    return issues;
  } catch (error) {
    console.error('User access pattern scan error:', error);
    return [];
  }
}

async function scanSystemConfiguration(organizationId: string): Promise<any[]> {
  const issues: any[] = [];

  try {
    // Check environment configuration
    const criticalEnvVars = [
      'JWT_SECRET',
      'ENCRYPTION_SECRET',
      'SUPABASE_SERVICE_KEY'
    ];

    criticalEnvVars.forEach(envVar => {
      if (!process.env[envVar] || process.env[envVar] === 'change-in-production') {
        issues.push({
          id: `config-env-${envVar}`,
          type: 'system_configuration',
          severity: 'critical',
          title: `Missing or default ${envVar}`,
          description: `Critical environment variable ${envVar} is missing or using default value`,
          recommendation: `Set a secure, unique value for ${envVar} in production`
        });
      }
    });

    // Check HTTPS enforcement
    if (process.env.NODE_ENV === 'production' && !process.env.FORCE_HTTPS) {
      issues.push({
        id: 'config-https',
        type: 'system_configuration',
        severity: 'high',
        title: 'HTTPS not enforced',
        description: 'HTTPS enforcement is not configured in production',
        recommendation: 'Enable HTTPS enforcement to secure all communications'
      });
    }

    return issues;
  } catch (error) {
    console.error('System configuration scan error:', error);
    return [];
  }
}

function generateSecurityRecommendations(issues: any[]): string[] {
  const recommendations = new Set<string>();

  issues.forEach(issue => {
    if (issue.recommendation) {
      recommendations.add(issue.recommendation);
    }

    // Add general recommendations based on issue types
    switch (issue.type) {
      case 'authentication':
        recommendations.add('Implement organization-wide MFA policy');
        recommendations.add('Regular security awareness training');
        break;
      case 'api_security':
        recommendations.add('Review and update API rate limiting policies');
        recommendations.add('Implement API request monitoring and alerting');
        break;
      case 'integration_security':
        recommendations.add('Regular integration security audits');
        recommendations.add('Implement OAuth token rotation policies');
        break;
    }
  });

  return Array.from(recommendations);
}

function calculateRiskScore(issues: any[]): number {
  let score = 0;

  issues.forEach(issue => {
    switch (issue.severity) {
      case 'critical':
        score += 25;
        break;
      case 'high':
        score += 15;
        break;
      case 'medium':
        score += 8;
        break;
      case 'low':
        score += 3;
        break;
    }
  });

  return Math.min(100, score);
}

const POST = withAPIVersioning(
  withEnhancedAuth(runSecurityScan, {
    requireRole: ['account_owner'],
    enableThreatDetection: true
  })
);

const GET = withAPIVersioning(
  withEnhancedAuth(getSecurityScanResults, {
    requireRole: ['account_owner', 'sustainability_manager'],
    enableThreatDetection: false
  })
);

export { POST, GET };