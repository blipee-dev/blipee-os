/**
 * Power BI Integration - Test Endpoint
 *
 * Simple endpoint to validate API credentials before setting up Power BI.
 * Returns basic organization info and connection status.
 *
 * Usage:
 * GET /api/powerbi/test?organizationId=<org-id>
 * Header: x-api-key: <api-key>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hash API key using SHA-256 (matches PostgreSQL hash_api_key function)
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Validate API key
async function validateApiKey(apiKey: string | null) {
  if (!apiKey) {
    return { valid: false, error: 'API key missing' };
  }

  // Hash the provided key
  const keyHash = hashApiKey(apiKey);

  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('id, organization_id, name, status, expires_at')
    .eq('key_hash', keyHash)
    .eq('status', 'active')
    .single();

  if (error || !keyData) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check expiration
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return { valid: false, error: 'API key expired' };
  }

  return { valid: true, organizationId: keyData.organization_id, keyName: keyData.name, keyId: keyData.id };
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Validate API key
    const auth = await validateApiKey(apiKey);
    if (!auth.valid) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
          message: 'Authentication failed. Please check your API key.'
        },
        { status: 401 }
      );
    }

    // Validate organization ID
    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing organizationId parameter',
          message: 'Please provide organizationId in query string'
        },
        { status: 400 }
      );
    }

    // Check if API key matches organization
    if (auth.organizationId !== organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization mismatch',
          message: 'API key does not belong to this organization'
        },
        { status: 403 }
      );
    }

    // Get organization details
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization not found',
          message: 'Could not find organization with this ID'
        },
        { status: 404 }
      );
    }

    // Get basic statistics
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name, location, status')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    const { count: metricsCount } = await supabase
      .from('metrics_data')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Update last_used_at for the API key
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', auth.keyId);

    return NextResponse.json({
      success: true,
      message: '🎉 Connection successful! Your API credentials are working correctly.',
      data: {
        organization: {
          id: orgData.id,
          name: orgData.name
        },
        api_key_info: {
          name: auth.keyName,
          status: 'active'
        },
        statistics: {
          total_sites: sites?.length || 0,
          sites: sites?.map(s => ({ name: s.name, location: s.location })) || [],
          total_metrics: metricsCount || 0
        },
        available_endpoints: [
          {
            endpoint: '/api/powerbi/emissions',
            description: 'Get emissions data with CO2e calculations',
            required_params: ['organizationId', 'startDate', 'endDate'],
            optional_params: ['siteId']
          },
          {
            endpoint: '/api/powerbi/sites',
            description: 'Get sites/locations information',
            required_params: ['organizationId'],
            optional_params: []
          }
        ],
        next_steps: [
          'Open Power BI Desktop',
          'Follow the Quick Start Guide to connect to /api/powerbi/emissions',
          'Create your first dashboard with the data'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Power BI test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please contact support.'
      },
      { status: 500 }
    );
  }
}
