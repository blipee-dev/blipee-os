/**
 * Integration Installation API
 * POST /api/integrations/install - Install an integration
 * DELETE /api/integrations/install - Uninstall an integration
 * PUT /api/integrations/install - Update integration configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { marketplaceManager } from '@/lib/integrations/marketplace-manager';
import { withAPIVersioning } from '@/middleware/api-versioning';
import { withRateLimit } from '@/middleware/rate-limit';
import { withAuth } from '@/middleware/auth';

async function installIntegration(req: NextRequest, context: any) {
  try {
    const { integrationId, configuration, testConnection } = await req.json();

    if (!integrationId) {
      return NextResponse.json(
        { error: 'MISSING_INTEGRATION_ID', message: 'Integration ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        organization_id,
        role,
        organizations (
          name,
          settings
        )
      `)
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'NO_ORGANIZATION', message: 'User not associated with organization' },
        { status: 400 }
      );
    }

    // Check permissions - only account_owner and sustainability_manager can install integrations
    if (!['account_owner', 'sustainability_manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_PERMISSIONS', message: 'Only account owners and sustainability managers can install integrations' },
        { status: 403 }
      );
    }

    // Check if integration is already installed
    const existingInstallations = await marketplaceManager.getInstalledIntegrations(
      profile.organization_id,
      { integrationId }
    );

    if (existingInstallations.length > 0) {
      return NextResponse.json(
        { error: 'ALREADY_INSTALLED', message: 'Integration is already installed' },
        { status: 409 }
      );
    }

    // Test connection if requested
    if (testConnection) {
      try {
        const testResult = await marketplaceManager.testIntegrationConnection(
          integrationId,
          configuration
        );

        if (!testResult.success) {
          return NextResponse.json(
            {
              error: 'CONNECTION_TEST_FAILED',
              message: 'Integration connection test failed',
              details: testResult.error
            },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: 'CONNECTION_TEST_ERROR',
            message: 'Failed to test integration connection',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    // Install the integration
    const installation = await marketplaceManager.installIntegration(
      integrationId,
      profile.organization_id,
      user.id,
      configuration
    );

    // Log installation event
    await supabase
      .from('audit_logs')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        action: 'integration_installed',
        resource_type: 'integration',
        resource_id: integration.id,
        metadata: {
          integration_name: installation.integration.name,
          integration_version: installation.integration.version
        }
      });

    return NextResponse.json({
      success: true,
      installation,
      message: `${installation.integration.name} has been successfully installed`
    });
  } catch (error) {
    console.error('Integration installation error:', error);
    return NextResponse.json(
      {
        error: 'INSTALLATION_ERROR',
        message: 'Failed to install integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function uninstallIntegration(req: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(req.url);
    const installationId = searchParams.get('installationId');

    if (!installationId) {
      return NextResponse.json(
        { error: 'MISSING_INSTALLATION_ID', message: 'Installation ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'NO_ORGANIZATION', message: 'User not associated with organization' },
        { status: 400 }
      );
    }

    // Check permissions
    if (!['account_owner', 'sustainability_manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_PERMISSIONS', message: 'Only account owners and sustainability managers can uninstall integrations' },
        { status: 403 }
      );
    }

    const result = await marketplaceManager.uninstallIntegration(
      installationId,
      profile.organization_id,
      user.id
    );

    // Log uninstallation event
    await supabase
      .from('audit_logs')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        action: 'integration_uninstalled',
        resource_type: 'integration',
        resource_id: installationId,
        metadata: {
          integration_name: result.integrationName
        }
      });

    return NextResponse.json({
      success: true,
      message: `Integration ${result.integrationName} has been successfully uninstalled`
    });
  } catch (error) {
    console.error('Integration uninstallation error:', error);
    return NextResponse.json(
      {
        error: 'UNINSTALLATION_ERROR',
        message: 'Failed to uninstall integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function updateIntegrationConfig(req: NextRequest, context: any) {
  try {
    const { installationId, configuration, testConnection } = await req.json();

    if (!installationId || !configuration) {
      return NextResponse.json(
        { error: 'MISSING_PARAMETERS', message: 'Installation ID and configuration are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'NO_ORGANIZATION', message: 'User not associated with organization' },
        { status: 400 }
      );
    }

    // Check permissions
    if (!['account_owner', 'sustainability_manager', 'facility_manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions to update integration configuration' },
        { status: 403 }
      );
    }

    // Test connection if requested
    if (testConnection) {
      const installation = await marketplaceManager.getInstalledIntegrations(
        profile.organization_id,
        { installationId }
      );

      if (installation.length === 0) {
        return NextResponse.json(
          { error: 'INTEGRATION_NOT_FOUND', message: 'Integration installation not found' },
          { status: 404 }
        );
      }

      try {
        const testResult = await marketplaceManager.testIntegrationConnection(
          installation[0].integration.id,
          configuration
        );

        if (!testResult.success) {
          return NextResponse.json(
            {
              error: 'CONNECTION_TEST_FAILED',
              message: 'Integration connection test failed',
              details: testResult.error
            },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: 'CONNECTION_TEST_ERROR',
            message: 'Failed to test integration connection',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    const updatedInstallation = await marketplaceManager.updateIntegrationConfiguration(
      installationId,
      profile.organization_id,
      configuration
    );

    // Log configuration update event
    await supabase
      .from('audit_logs')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        action: 'integration_config_updated',
        resource_type: 'integration',
        resource_id: installationId,
        metadata: {
          integration_name: updatedInstallation.integration.name
        }
      });

    return NextResponse.json({
      success: true,
      installation: updatedInstallation,
      message: 'Integration configuration updated successfully'
    });
  } catch (error) {
    console.error('Integration configuration update error:', error);
    return NextResponse.json(
      {
        error: 'CONFIG_UPDATE_ERROR',
        message: 'Failed to update integration configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

const POST = withAPIVersioning(
  withRateLimit({ requests: 10, window: '1h' })(
    withAuth(installIntegration)
  )
);

const DELETE = withAPIVersioning(
  withRateLimit({ requests: 5, window: '1h' })(
    withAuth(uninstallIntegration)
  )
);

const PUT = withAPIVersioning(
  withRateLimit({ requests: 20, window: '1h' })(
    withAuth(updateIntegrationConfig)
  )
);

export { POST, DELETE, PUT };