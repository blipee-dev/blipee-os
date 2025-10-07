import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);
    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = orgInfo.organizationId;

    // Get filter parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const siteId = searchParams.get('site_id');

    // Get waste metrics from metrics_catalog
    const { data: wasteMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .eq('category', 'Waste');

    if (metricsError) {
      console.error('Error fetching waste metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch waste metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    if (!wasteMetrics || wasteMetrics.length === 0) {
      return NextResponse.json({
        streams: [],
        total_generated: 0,
        total_diverted: 0,
        total_landfill: 0,
        diversion_rate: 0,
        recycling_rate: 0
      });
    }

    // Get waste data from metrics_data
    const metricIds = wasteMetrics.map(m => m.id);
    let query = supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('period_start', startDate);
    }
    if (endDate) {
      query = query.lte('period_start', endDate);
    }

    // Apply site filter if provided
    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: wasteData, error: dataError } = await query.order('period_start', { ascending: false });

    if (dataError) {
      console.error('Error fetching waste data:', dataError);
      return NextResponse.json(
        { error: 'Failed to fetch waste data', details: dataError.message },
        { status: 500 }
      );
    }

    if (!wasteData || wasteData.length === 0) {
      return NextResponse.json({
        streams: [],
        total_generated: 0,
        total_diverted: 0,
        total_landfill: 0,
        diversion_rate: 0,
        recycling_rate: 0
      });
    }

    // Group by waste type and disposal method
    const streamsByType = (wasteData || []).reduce((acc: any, record: any) => {
      const metric = wasteMetrics.find(m => m.id === record.metric_id);
      const metricCode = metric?.code || '';
      const subcategory = metric?.subcategory || '';

      // Determine disposal method from subcategory or metric code
      const disposalMethodMapping: { [key: string]: string } = {
        'Recycling': 'recycling',
        'Composting': 'composting',
        'Incineration': 'incineration',
        'Landfill': 'landfill',
        'Hazardous': 'hazardous_treatment',
      };

      const disposalMethod = disposalMethodMapping[subcategory] || 'other';
      const key = `${metric?.name || 'Unknown'}-${disposalMethod}`;

      // Determine if diverted from landfill
      const isDiverted = ['recycling', 'composting'].includes(disposalMethod);

      if (!acc[key]) {
        acc[key] = {
          type: metric?.name || 'Unknown',
          disposal_method: disposalMethod,
          quantity: 0,
          unit: metric?.unit || 'tons',
          diverted: isDiverted,
          recycling_rate: 0,
          emissions: 0
        };
      }

      // Add quantity
      const value = parseFloat(record.value) || 0;
      acc[key].quantity += value;

      // Add emissions (convert from kgCO2e to tCO2e)
      acc[key].emissions += (parseFloat(record.co2e_emissions) || 0) / 1000;

      return acc;
    }, {});

    const streams = Object.values(streamsByType);

    // Calculate totals
    const totalGenerated = streams.reduce((sum: number, s: any) => sum + s.quantity, 0);
    const totalDiverted = streams
      .filter((s: any) => s.diverted)
      .reduce((sum: number, s: any) => sum + s.quantity, 0);
    const totalLandfill = totalGenerated - totalDiverted;

    const diversionRate = totalGenerated > 0
      ? (totalDiverted / totalGenerated * 100)
      : 0;

    // Calculate recycling rate (percentage of waste recycled)
    const totalRecycled = streams
      .filter((s: any) => s.disposal_method === 'recycling')
      .reduce((sum: number, s: any) => sum + s.quantity, 0);

    const recyclingRate = totalGenerated > 0
      ? (totalRecycled / totalGenerated * 100)
      : 0;

    return NextResponse.json({
      streams,
      total_generated: Math.round(totalGenerated * 100) / 100,
      total_diverted: Math.round(totalDiverted * 100) / 100,
      total_landfill: Math.round(totalLandfill * 100) / 100,
      diversion_rate: Math.round(diversionRate * 10) / 10,
      recycling_rate: Math.round(recyclingRate * 10) / 10
    });

  } catch (error) {
    console.error('Error fetching waste streams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waste streams' },
      { status: 500 }
    );
  }
}
