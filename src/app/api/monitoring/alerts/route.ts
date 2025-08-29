import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { monitoringService } from '@/lib/monitoring';
import { AlertSeverity, AlertChannel } from '@/lib/monitoring/types';

export async function GET((_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, _error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') as AlertSeverity | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const resolved = searchParams.get('resolved') === 'true';

    // Get alerts from monitoring service - only include severity if it exists
    const alertQuery: any = {
      limit,
      resolved,
    };
    
    if (severity) {
      alertQuery.severity = severity;
    }
    
    const alerts = await monitoringService.getAlerts(alertQuery);

    // Get alert rules
    const alertRules = await monitoringService.getAlertRules();

    return NextResponse.json({
      alerts,
      alertRules,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
        _error: alerts.filter(a => a.severity === AlertSeverity.ERROR).length,
        warning: alerts.filter(a => a.severity === AlertSeverity.WARNING).length,
        info: alerts.filter(a => a.severity === AlertSeverity.INFO).length,
        resolved: alerts.filter(a => a.resolved).length,
        active: alerts.filter(a => !a.resolved).length,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { _error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST((_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, _error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('invitation_status', 'accepted')
      .single();

    if (!member || !['account_owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { _error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, rule, alert } = body;

    switch (type) {
      case 'create_rule':
        if (!rule) {
          return NextResponse.json(
            { _error: 'Missing alert rule data' },
            { status: 400 }
          );
        }

        const newRule = await monitoringService.setAlertRule({
          id: rule.id || `custom_${Date.now()}`,
          name: rule.name,
          description: rule.description,
          metric: rule.metric,
          condition: rule.condition,
          threshold: rule.threshold,
          duration: rule.duration || 300,
          severity: rule.severity || AlertSeverity.WARNING,
          channels: rule.channels || [AlertChannel.EMAIL],
          enabled: rule.enabled !== false,
          metadata: {
            createdBy: user.id,
            organizationId: member.organization_id,
          },
        });

        return NextResponse.json({
          success: true,
          rule: newRule,
          message: 'Alert rule created successfully',
        });

      case 'trigger_alert':
        if (!alert) {
          return NextResponse.json(
            { _error: 'Missing alert data' },
            { status: 400 }
          );
        }

        const triggeredAlert = await monitoringService.triggerAlert({
          id: `manual_${Date.now()}`,
          name: alert.name,
          severity: alert.severity || AlertSeverity.INFO,
          message: alert.message,
          details: alert.details || {},
          timestamp: new Date(),
        });

        return NextResponse.json({
          success: true,
          alert: triggeredAlert,
          message: 'Alert triggered successfully',
        });

      case 'test_notification':
        // Test notification channels
        const testAlert = {
          id: `test_${Date.now()}`,
          name: 'Test Notification',
          severity: AlertSeverity.INFO,
          message: 'This is a test notification from the monitoring system',
          details: {
            triggeredBy: user.id,
            testTime: new Date().toISOString(),
          },
          timestamp: new Date(),
        };

        await monitoringService.triggerAlert(testAlert);

        return NextResponse.json({
          success: true,
          message: 'Test notification sent successfully',
        });

      default:
        return NextResponse.json(
          { _error: 'Invalid request type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error handling alert (_request:', error);
    return NextResponse.json(
      { _error: 'Failed to process alert request' },
      { status: 500 }
    );
  }
}

// Configure dynamic rendering
export const dynamic = 'force-dynamic';