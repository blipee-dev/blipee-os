import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ssoService } from '@/lib/auth/sso/service';
import { getAuditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const auditService = getAuditService();
    
    // Get the SSO session from cookies
    const ssoSessionId = req.cookies.get('sso_session')?.value;
    
    if (!ssoSessionId) {
      // No SSO session, just perform regular logout
      await supabase.auth.signOut();
      const response = NextResponse.redirect(new URL('/signin', req.url));
      response.cookies.delete('sso_session');
      return response;
    }

    // Get SSO session details
    const { data: ssoSession } = await supabase
      .from('sso_sessions')
      .select(`
        *,
        sso_configuration:sso_configurations!sso_configuration_id(*)
      `)
      .eq('id', ssoSessionId)
      .single();

    if (!ssoSession || !ssoSession.sso_configuration) {
      // Invalid session, just perform regular logout
      await supabase.auth.signOut();
      const response = NextResponse.redirect(new URL('/signin', req.url));
      response.cookies.delete('sso_session');
      return response;
    }

    const config = ssoSession.sso_configuration;

    // Initiate SSO logout based on provider type
    if (config.provider === 'saml' && config.saml_sso_url) {
      // SAML Single Logout
      const logoutRequest = await ssoService.generateSAMLLogoutRequest(
        config,
        ssoSession.external_id
      );
      
      await auditService.log({
        type: AuditEventType.AUTH_LOGOUT,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: ssoSession.user_id,
        },
        target: {
          type: 'sso_configuration',
          id: config.id,
        },
        context: {
          organizationId: config.organization_id,
        },
        metadata: { provider: 'saml', method: 'slo' },
        result: 'success',
      });

      // Clear session
      await supabase.auth.signOut();
      await supabase
        .from('sso_sessions')
        .delete()
        .eq('id', ssoSessionId);

      const response = NextResponse.redirect(logoutRequest.url);
      response.cookies.delete('sso_session');
      return response;
    } else if (config.provider === 'oidc' && config.oidc_issuer_url) {
      // OIDC End Session
      const logoutUrl = new URL('/v2/logout', config.oidc_issuer_url);
      
      // Add post_logout_redirect_uri if configured
      const postLogoutRedirectUri = new URL('/signin', req.url).toString();
      logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
      
      // Add id_token_hint if available
      if (ssoSession.oidc_id_token) {
        logoutUrl.searchParams.set('id_token_hint', ssoSession.oidc_id_token);
      }

      await auditService.log({
        type: AuditEventType.AUTH_LOGOUT,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: ssoSession.user_id,
        },
        target: {
          type: 'sso_configuration',
          id: config.id,
        },
        context: {
          organizationId: config.organization_id,
        },
        metadata: { provider: 'oidc', method: 'end_session' },
        result: 'success',
      });

      // Clear session
      await supabase.auth.signOut();
      await supabase
        .from('sso_sessions')
        .delete()
        .eq('id', ssoSessionId);

      const response = NextResponse.redirect(logoutUrl.toString());
      response.cookies.delete('sso_session');
      return response;
    }

    // No SLO endpoint configured, perform regular logout
    await supabase.auth.signOut();
    await supabase
      .from('sso_sessions')
      .delete()
      .eq('id', ssoSessionId);

    await auditService.log({
      type: AuditEventType.AUTH_LOGOUT,
      severity: AuditEventSeverity.INFO,
      actor: {
        type: 'user',
        id: ssoSession.user_id,
      },
      target: {
        type: 'sso_configuration',
        id: config.id,
      },
      context: {
        organizationId: config.organization_id,
      },
      metadata: { reason: 'no_slo_endpoint', method: 'local' },
      result: 'success',
    });

    const response = NextResponse.redirect(new URL('/signin', req.url));
    response.cookies.delete('sso_session');
    return response;
  } catch (error) {
    console.error('SSO logout error:', error);
    
    // Fallback to regular logout on error
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    
    const response = NextResponse.redirect(new URL('/signin', req.url));
    response.cookies.delete('sso_session');
    return response;
  }
}

export async function GET(req: NextRequest) {
  // Some implementations might use GET
  return POST(req);
}