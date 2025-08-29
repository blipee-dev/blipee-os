import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET((_request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { _error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    // Check if SSO is configured and enabled for this domain
    const { data: config, error } = await supabaseAdmin
      .from('sso_configurations')
      .select('id, enabled')
      .eq('domain', domain.toLowerCase())
      .eq('enabled', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking SSO configuration:', error);
      return NextResponse.json(
        { _error: 'Failed to check SSO configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ssoRequired: !!config,
      domain,
    });
  } catch (error) {
    console.error('SSO check _error:', error);
    return NextResponse.json(
      { _error: 'Internal server error' },
      { status: 500 }
    );
  }
}