/**
 * Power BI API Endpoint - Emissions Data
 *
 * Este endpoint fornece dados de emissões formatados para consumo no Power BI
 *
 * Autenticação: API Key via header 'x-api-key'
 * Formato: JSON (Power BI compatível)
 *
 * Exemplo de uso no Power BI:
 * 1. Ir para "Get Data" > "Web"
 * 2. URL: https://seu-dominio.com/api/powerbi/emissions?organizationId=xxx&startDate=2025-01-01&endDate=2025-12-31
 * 3. Advanced > Headers > x-api-key: sua-api-key
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Hash API key using SHA-256 (matches PostgreSQL hash_api_key function)
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Validar API Key
async function validateApiKey(apiKey: string | null): Promise<{ valid: boolean; organizationId?: string }> {
  if (!apiKey) {
    return { valid: false };
  }

  const supabase = createAdminClient();

  // Hash the provided key
  const keyHash = hashApiKey(apiKey);

  // Buscar API key na tabela api_keys usando hash
  const { data, error } = await supabase
    .from('api_keys')
    .select('organization_id, expires_at')
    .eq('key_hash', keyHash)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return { valid: false };
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false };
  }

  return { valid: true, organizationId: data.organization_id };
}

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação via API Key
    const apiKey = request.headers.get('x-api-key');
    const auth = await validateApiKey(apiKey);

    if (!auth.valid) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // 2. Obter parâmetros da query
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || auth.organizationId;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const siteId = searchParams.get('siteId'); // Opcional: filtrar por site específico

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // 3. Buscar dados de emissões do banco
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
      .not('co2e_emissions', 'is', null)
      .order('period_start', { ascending: true });

    // Filtros opcionais
    if (startDate) {
      query = query.gte('period_start', startDate);
    }
    if (endDate) {
      query = query.lte('period_end', endDate);
    }
    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: metricsData, error } = await query;

    if (error) {
      console.error('[PowerBI API] Error fetching data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch emissions data' },
        { status: 500 }
      );
    }

    // 4. Transformar dados para formato Power BI friendly
    // Power BI prefere dados "flat" (não nested)
    const powerBiData = metricsData?.map(metric => ({
      // IDs
      metric_id: metric.id,
      organization_id: organizationId,
      site_id: metric.site_id,

      // Datas (Power BI vai reconhecer automaticamente como Date)
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
      co2e_emissions: metric.co2e_emissions / 1000, // Converter kg para toneladas
      co2e_unit: 'tCO2e',

      // Site info (flat structure)
      site_name: metric.sites?.name,
      site_location: metric.sites?.location,
      site_employees: metric.sites?.total_employees,
      site_area_sqm: metric.sites?.total_area_sqm,

      // Métricas calculadas (Power BI friendly)
      emissions_per_employee: metric.sites?.total_employees
        ? (metric.co2e_emissions / 1000) / metric.sites.total_employees
        : null,
      emissions_per_sqm: metric.sites?.total_area_sqm
        ? (metric.co2e_emissions / 1000) / metric.sites.total_area_sqm
        : null,

      // Qualidade
      data_quality: metric.data_quality,

      // Metadata
      last_updated: new Date().toISOString()
    })) || [];

    // 5. Calcular totais agregados (útil para KPIs no Power BI)
    const totals = {
      total_emissions_tco2e: powerBiData.reduce((sum, item) => sum + item.co2e_emissions, 0),
      total_records: powerBiData.length,
      date_range: {
        start: startDate || powerBiData[0]?.period_start,
        end: endDate || powerBiData[powerBiData.length - 1]?.period_end
      },
      sites_count: new Set(powerBiData.map(item => item.site_id)).size,
      categories: Array.from(new Set(powerBiData.map(item => item.metric_category)))
    };

    // 6. Retornar resposta formatada para Power BI
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
    console.error('[PowerBI API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS para CORS (se Power BI estiver em domínio diferente)
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
