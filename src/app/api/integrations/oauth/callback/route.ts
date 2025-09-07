/**
 * OAuth Callback API for Third-Party Integrations
 * GET /api/integrations/oauth/callback - Handle OAuth callback from third-party services
 * This handles the OAuth flow for integrations like Salesforce, Microsoft Teams, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { marketplaceManager } from '@/lib/integrations/marketplace-manager';
import { withAPIVersioning } from '@/middleware/api-versioning';

async function handleOAuthCallback(req: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', { error, errorDescription });
      
      const errorPage = new URL('/integrations/oauth-error', req.url);
      errorPage.searchParams.set('error', error);
      if (errorDescription) {
        errorPage.searchParams.set('description', errorDescription);
      }
      
      return NextResponse.redirect(errorPage.toString());
    }

    if (!code || !state) {
      console.error('Missing OAuth parameters:', { code: !!code, state: !!state });
      
      const errorPage = new URL('/integrations/oauth-error', req.url);
      errorPage.searchParams.set('error', 'invalid_request');
      errorPage.searchParams.set('description', 'Missing authorization code or state parameter');
      
      return NextResponse.redirect(errorPage.toString());
    }

    // Decode and validate state parameter
    let stateData;
    try {
      const decodedState = Buffer.from(state, 'base64').toString('utf-8');
      stateData = JSON.parse(decodedState);
    } catch (parseError) {
      console.error('Invalid state parameter:', parseError);
      
      const errorPage = new URL('/integrations/oauth-error', req.url);
      errorPage.searchParams.set('error', 'invalid_state');
      errorPage.searchParams.set('description', 'Invalid state parameter');
      
      return NextResponse.redirect(errorPage.toString());
    }

    const { 
      integrationId, 
      organizationId, 
      userId, 
      installationId,
      nonce,
      timestamp 
    } = stateData;

    // Validate state freshness (should be within 10 minutes)
    const stateAge = Date.now() - timestamp;
    if (stateAge > 10 * 60 * 1000) {
      console.error('State parameter too old:', { stateAge });
      
      const errorPage = new URL('/integrations/oauth-error', req.url);
      errorPage.searchParams.set('error', 'state_expired');
      errorPage.searchParams.set('description', 'OAuth state has expired. Please try again.');
      
      return NextResponse.redirect(errorPage.toString());
    }

    const supabase = createClient();

    // Verify user and organization
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        organization_id,
        role,
        organizations (
          id,
          name
        )
      `)
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (!profile) {
      console.error('User or organization not found:', { userId, organizationId });
      
      const errorPage = new URL('/integrations/oauth-error', req.url);
      errorPage.searchParams.set('error', 'user_not_found');
      errorPage.searchParams.set('description', 'User or organization not found');
      
      return NextResponse.redirect(errorPage.toString());
    }

    // Check permissions
    if (!['account_owner', 'sustainability_manager'].includes(profile.role)) {
      console.error('Insufficient permissions for OAuth:', { userId, role: profile.role });
      
      const errorPage = new URL('/integrations/oauth-error', req.url);
      errorPage.searchParams.set('error', 'insufficient_permissions');
      errorPage.searchParams.set('description', 'Insufficient permissions to complete integration');
      
      return NextResponse.redirect(errorPage.toString());
    }

    // Exchange authorization code for access token
    try {
      const tokenResponse = await marketplaceManager.exchangeOAuthCode(
        integrationId,
        code,
        stateData
      );

      if (!tokenResponse.success) {
        throw new Error(tokenResponse.error || 'Token exchange failed');
      }

      // Update or create integration installation with OAuth tokens
      const installationData = {
        integration_id: integrationId,
        organization_id: organizationId,
        installed_by: userId,
        status: 'active',
        configuration: {
          ...tokenResponse.configuration,
          oauth: {
            access_token: tokenResponse.tokens.access_token,
            refresh_token: tokenResponse.tokens.refresh_token,
            token_type: tokenResponse.tokens.token_type,
            expires_at: tokenResponse.tokens.expires_at,
            scope: tokenResponse.tokens.scope
          }
        },
        updated_at: new Date().toISOString()
      };

      let installation;
      if (installationId) {
        // Update existing installation
        const { data, error } = await supabase
          .from('integration_installations')
          .update(installationData)
          .eq('id', installationId)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) throw error;
        installation = data;
      } else {
        // Create new installation
        const { data, error } = await supabase
          .from('integration_installations')
          .insert({
            ...installationData,
            installed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        installation = data;
      }

      // Test the connection with the new tokens
      const connectionTest = await marketplaceManager.testIntegrationConnection(
        integrationId,
        installation.configuration
      );

      if (!connectionTest.success) {
        console.warn('Integration connection test failed after OAuth:', connectionTest.error);
        // Don't fail the OAuth flow, but mark the installation as needs attention
        await supabase
          .from('integration_installations')
          .update({ 
            status: 'needs_attention',
            error_message: connectionTest.error 
          })
          .eq('id', installation.id);
      }

      // Log successful OAuth completion
      await supabase
        .from('audit_logs')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          action: 'integration_oauth_completed',
          resource_type: 'integration',
          resource_id: installation.id,
          metadata: {
            integration_id: integrationId,
            connection_test_passed: connectionTest.success
          }
        });

      // Redirect to success page
      const successPage = new URL('/integrations/oauth-success', req.url);
      successPage.searchParams.set('integration', integrationId);
      successPage.searchParams.set('installation', installation.id);
      
      return NextResponse.redirect(successPage.toString());
    } catch (tokenError) {
      console.error('OAuth token exchange failed:', tokenError);
      
      // Log failed OAuth attempt
      await supabase
        .from('audit_logs')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          action: 'integration_oauth_failed',
          resource_type: 'integration',
          resource_id: integrationId,
          metadata: {
            error: tokenError instanceof Error ? tokenError.message : 'Unknown error'
          }
        });

      const errorPage = new URL('/integrations/oauth-error', req.url);
      errorPage.searchParams.set('error', 'token_exchange_failed');
      errorPage.searchParams.set('description', 'Failed to complete OAuth authorization');
      
      return NextResponse.redirect(errorPage.toString());
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    const errorPage = new URL('/integrations/oauth-error', req.url);
    errorPage.searchParams.set('error', 'internal_error');
    errorPage.searchParams.set('description', 'An internal error occurred during OAuth');
    
    return NextResponse.redirect(errorPage.toString());
  }
}

const GET = withAPIVersioning(handleOAuthCallback);

export { GET };