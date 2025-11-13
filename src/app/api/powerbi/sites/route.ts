/**
 * Power BI API Endpoint - Sites/Locations Data
 *
 * Fornece informação sobre sites/localizações para usar como dimensão no Power BI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Hash API key using SHA-256 (matches PostgreSQL hash_api_key function)
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function validateApiKey(apiKey: string | null): Promise<{ valid: boolean; organizationId?: string }> {
  if (!apiKey) return { valid: false };

  const supabase = createAdminClient();
  const keyHash = hashApiKey(apiKey);

  const { data, error } = await supabase
    .from('api_keys')
    .select('organization_id, expires_at')
    .eq('key_hash', keyHash)
    .eq('status', 'active')
    .single();

  if (error || !data) return { valid: false };

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false };
  }

  return { valid: true, organizationId: data.organization_id };
}

export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const apiKey = request.headers.get('x-api-key');
    const auth = await validateApiKey(apiKey);

    if (!auth.valid) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    // Parâmetros
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || auth.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    // Buscar sites
    const supabase = createAdminClient();
    const { data: sites, error } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('[PowerBI API Sites] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
    }

    // Formatar para Power BI (flat structure)
    const powerBiData = sites?.map(site => ({
      site_id: site.id,
      organization_id: organizationId,
      site_name: site.name,
      site_location: site.location,
      site_type: site.type,
      total_employees: site.total_employees,
      total_area_sqm: site.total_area_sqm,
      status: site.status,
      created_at: site.created_at,
      last_updated: new Date().toISOString()
    })) || [];

    return NextResponse.json({
      success: true,
      metadata: {
        organization_id: organizationId,
        generated_at: new Date().toISOString(),
        total_sites: powerBiData.length
      },
      data: powerBiData
    });

  } catch (error) {
    console.error('[PowerBI API Sites] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key, Content-Type',
    },
  });
}
