/**
 * Power BI API Endpoint - Waste Data
 *
 * Fornece dados de resíduos (recycling, composting, disposal, etc.) formatados para Power BI
 *
 * Autenticação: API Key via header 'x-api-key'
 * Categoria incluída: Waste (todas subcategorias)
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

    // 3. Buscar dados de resíduos
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
      .eq('metrics_catalog.category', 'Waste')
      .order('period_start', { ascending: true });

    if (startDate) query = query.gte('period_start', startDate);
    if (endDate) query = query.lte('period_end', endDate);
    if (siteId) query = query.eq('site_id', siteId);

    const { data: metricsData, error } = await query;

    if (error) {
      console.error('[PowerBI API Waste] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch waste data' }, { status: 500 });
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
      waste_per_employee: metric.sites?.total_employees
        ? parseFloat(metric.value) / metric.sites.total_employees
        : null,
      waste_per_sqm: metric.sites?.total_area_sqm
        ? parseFloat(metric.value) / metric.sites.total_area_sqm
        : null,
      emissions_per_employee: (metric.co2e_emissions && metric.sites?.total_employees)
        ? (metric.co2e_emissions / 1000) / metric.sites.total_employees
        : null,

      // Qualidade
      data_quality: metric.data_quality,

      // Metadata
      last_updated: new Date().toISOString()
    })) || [];

    // 5. Totais
    const totals = {
      total_waste_kg: powerBiData.reduce((sum, item) =>
        item.unit?.toLowerCase().includes('kg') ? sum + item.value : sum, 0),
      total_waste_tonnes: powerBiData.reduce((sum, item) =>
        item.unit?.toLowerCase().includes('kg') ? sum + (item.value / 1000) : sum, 0),
      total_emissions_tco2e: powerBiData.reduce((sum, item) =>
        sum + (item.co2e_emissions || 0), 0),
      total_records: powerBiData.length,
      date_range: {
        start: startDate || powerBiData[0]?.period_start,
        end: endDate || powerBiData[powerBiData.length - 1]?.period_end
      },
      sites_count: new Set(powerBiData.map(item => item.site_id)).size,
      waste_streams: Array.from(new Set(powerBiData.map(item => item.metric_subcategory))),
      // Breakdown por tipo de resíduo
      by_stream: Array.from(new Set(powerBiData.map(item => item.metric_subcategory))).map(stream => ({
        stream,
        total_kg: powerBiData
          .filter(item => item.metric_subcategory === stream && item.unit?.toLowerCase().includes('kg'))
          .reduce((sum, item) => sum + item.value, 0)
      }))
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
    console.error('[PowerBI API Waste] Unexpected error:', error);
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
