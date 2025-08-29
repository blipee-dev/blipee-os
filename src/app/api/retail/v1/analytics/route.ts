import { NextRequest, NextResponse } from 'next/server';
import { withRetailPermission } from '@/lib/auth/retail-middleware';
import { RETAIL_PERMISSIONS } from '@/lib/auth/retail-permissions';

// Mock analytics data that matches the Telegram bot format
const generateMockAnalytics = (loja: string, startDate: string, endDate: string) => {
  const currentDate = new Date();
  
  return {
    loja,
    periodo: {
      inicio: startDate + 'T00:00:00',
      fim: endDate + 'T23:59:59',
    },
    vendas: {
      total_com_iva: Math.floor(Math.random() * 100000) + 50000,
      total_sem_iva: Math.floor(Math.random() * 80000) + 40000,
      transacoes: Math.floor(Math.random() * 500) + 200,
      ticket_medio: Math.floor(Math.random() * 100) + 50,
    },
    trafego: {
      visitantes: Math.floor(Math.random() * 2000) + 1000,
      total_passagens: Math.floor(Math.random() * 4000) + 2000,
      entry_rate: Math.floor(Math.random() * 40) + 30,
    },
    conversao: {
      taxa_conversao: Math.floor(Math.random() * 20) + 10,
      tempo_medio_permanencia: Math.floor(Math.random() * 30) + 15,
      unidades_por_transacao: Math.floor(Math.random() * 3) + 1,
    },
    top_performers: {
      vendedores: [
        { codigo: 'V001', nome: 'Maria Silva', vendas: 15000 },
        { codigo: 'V002', nome: 'João Santos', vendas: 12000 },
      ],
      produtos: [
        { item: 'P001', descricao: 'Produto A', quantidade: 250 },
        { item: 'P002', descricao: 'Produto B', quantidade: 180 },
      ],
    },
    regioes: {
      ocupacao: { region1: 45, region2: 30, region3: 15, region4: 10 },
      top_2: ['region1', 'region2'],
      bottom_2: ['region3', 'region4'],
    },
    ultima_atualizacao: currentDate.toISOString(),
  };
};

// Protected GET handler
async function handleGetAnalytics(_request: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(request.url);
    const loja = searchParams.get('loja');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const _metricType = searchParams.get('metric_type') || 'all';

    if (!loja || !startDate || !endDate) {
      return NextResponse.json(
        { _error: 'Missing required parameters: loja, start_date, end_date' },
        { status: 400 }
      );
    }

    // Add audit log for analytics access
    console.log(`Analytics accessed by ${context.user.email} for store ${loja}`);

    // Generate mock analytics data
    const analyticsData = generateMockAnalytics(loja, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      permissions: context.permissions,
      user: context.user.email,
    });
  } catch (error) {
    return NextResponse.json(
      { _error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export const GET = withRetailPermission(RETAIL_PERMISSIONS.ANALYTICS, handleGetAnalytics);

// Protected POST handler
async function handlePostAnalytics(_request: NextRequest, context: any) {
  try {
    const body = await request.json();
    const { loja, start_date, end_date, metric_type = 'all' } = body;

    if (!loja || !start_date || !end_date) {
      return NextResponse.json(
        { _error: 'Missing required parameters: loja, start_date, end_date' },
        { status: 400 }
      );
    }

    // Add audit log for analytics access
    console.log(`Analytics POST accessed by ${context.user.email} for store ${loja}`);

    // Generate mock analytics data
    const analyticsData = generateMockAnalytics(loja, start_date, end_date);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      permissions: context.permissions,
      user: context.user.email,
    });
  } catch (error) {
    return NextResponse.json(
      { _error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export const POST = withRetailPermission(RETAIL_PERMISSIONS.ANALYTICS, handlePostAnalytics);