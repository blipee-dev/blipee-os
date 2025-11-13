/**
 * Power BI API Endpoint - Water Data
 *
 * Fornece dados de água (withdrawal, discharge, consumption, efficiency) formatados para Power BI
 *
 * Autenticação: API Key via header 'x-api-key'
 * Categorias incluídas: Water Withdrawal, Water Discharge, Water Consumption, Water Efficiency
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Hash API key using SHA-256
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

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false };
  }

  return { valid: true, organizationId: data.organization_id };
}

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const apiKey = request.headers.get('x-api-key');
    const auth = await validateApiKey(apiKey);

    if (!auth.valid) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    // 2. Parâmetros
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || auth.organizationId;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const siteId = searchParams.get('siteId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    // 3. Buscar dados de água
    const supabase = createAdminClient();

    let query = supabase
      .from('metrics_data')
      .select(`
        id,
        value,
        unit,
        co2e_emissions,
        period_start,
        period_end,
        data_quality,
        site_id,
        sites (
          name,
          location,
          total_employees,
          total_area_sqm
        ),
        metrics_catalog (
          code,
          name,
          category,
          subcategory
        )
      `)
      .eq('organization_id', organizationId)
      .in('metrics_catalog.category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption', 'Water Efficiency'])
      .order('period_start', { ascending: true });

    if (startDate) query = query.gte('period_start', startDate);
    if (endDate) query = query.lte('period_end', endDate);
    if (siteId) query = query.eq('site_id', siteId);

    const { data: metricsData, error } = await query;

    if (error) {
      console.error('[PowerBI API Water] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch water data' }, { status: 500 });
    }

    // 4. Transformar para Power BI
    const powerBiData = metricsData?.map(metric => ({
      // IDs
      metric_id: metric.id,
      organization_id: organizationId,
      site_id: metric.site_id,

      // Datas
      period_start: metric.period_start,
      period_end: metric.period_end,
      year: new Date(metric.period_start).getFullYear(),
      month: new Date(metric.period_start).getMonth() + 1,
      quarter: Math.ceil((new Date(metric.period_start).getMonth() + 1) / 3),

      // Métrica
      metric_code: metric.metrics_catalog?.code,
      metric_name: metric.metrics_catalog?.name,
      metric_category: metric.metrics_catalog?.category,
      metric_subcategory: metric.metrics_catalog?.subcategory,

      // Valores
      value: parseFloat(metric.value),
      unit: metric.unit,
      co2e_emissions: metric.co2e_emissions ? metric.co2e_emissions / 1000 : null,
      co2e_unit: metric.co2e_emissions ? 'tCO2e' : null,

      // Site info
      site_name: metric.sites?.name,
      site_location: metric.sites?.location,
      site_employees: metric.sites?.total_employees,
      site_area_sqm: metric.sites?.total_area_sqm,

      // Métricas de intensidade
      water_per_employee: metric.sites?.total_employees
        ? parseFloat(metric.value) / metric.sites.total_employees
        : null,
      water_per_sqm: metric.sites?.total_area_sqm
        ? parseFloat(metric.value) / metric.sites.total_area_sqm
        : null,

      // Qualidade
      data_quality: metric.data_quality,

      // Metadata
      last_updated: new Date().toISOString()
    })) || [];

    // 5. Totais
    const totals = {
      total_water_volume_m3: powerBiData.reduce((sum, item) =>
        item.unit?.toLowerCase().includes('m3') || item.unit?.toLowerCase().includes('m³') ? sum + item.value : sum, 0),
      total_records: powerBiData.length,
      date_range: {
        start: startDate || powerBiData[0]?.period_start,
        end: endDate || powerBiData[powerBiData.length - 1]?.period_end
      },
      sites_count: new Set(powerBiData.map(item => item.site_id)).size,
      categories: Array.from(new Set(powerBiData.map(item => item.metric_category))),
      subcategories: Array.from(new Set(powerBiData.map(item => item.metric_subcategory)))
    };

    // 6. Resposta
    return NextResponse.json({
      success: true,
      metadata: {
        organization_id: organizationId,
        generated_at: new Date().toISOString(),
        api_version: '1.0',
        totals
      },
      data: powerBiData
    });

  } catch (error) {
    console.error('[PowerBI API Water] Unexpected error:', error);
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
