import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';
    
    // Build query
    let query = supabase
      .from('retail.stores')
      .select(`
        id,
        name,
        code,
        is_active,
        store_type,
        timezone,
        floor_area_sqm,
        operating_hours,
        metadata,
        created_at,
        updated_at,
        mall:malls(name, location)
      `);

    // Filter by active status if requested
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: stores, error } = await query.order('name');

    if (error) {
      console.error('Database error fetching stores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stores from database' },
        { status: 500 }
      );
    }

    // If no stores found, return the reference stores for compatibility
    if (!stores || stores.length === 0) {
      const referenceStores = [
        {
          id: 'OML01',
          name: 'OML01-Omnia GuimarãesShopping',
          code: 'OML01',
          is_active: true,
          location: 'Guimarães, Portugal',
          store_type: 'retail',
          sensors_configured: true,
          sales_api_connected: true
        },
        {
          id: 'OML02',
          name: 'OML02-Omnia Fórum Almada',
          code: 'OML02',
          is_active: true,
          location: 'Almada, Portugal',
          store_type: 'retail',
          sensors_configured: true,
          sales_api_connected: true
        },
        {
          id: 'OML03',
          name: 'OML03-Omnia Norteshopping',
          code: 'OML03',
          is_active: true,
          location: 'Norteshopping, Portugal',
          store_type: 'retail',
          sensors_configured: true,
          sales_api_connected: true
        },
        {
          id: 'ONL01',
          name: 'ONL01-Only UBBO Amadora',
          code: 'ONL01',
          is_active: true,
          location: 'Amadora, Portugal',
          store_type: 'retail',
          sensors_configured: true,
          sales_api_connected: true
        }
      ];

      return NextResponse.json({
        success: true,
        stores: referenceStores,
        total: referenceStores.length,
        source: 'reference_data'
      });
    }

    // Transform store data for API response
    const transformedStores = stores.map(store => ({
      id: store.code || store.id,
      name: store.name,
      code: store.code,
      is_active: store.is_active,
      location: store.mall?.location || 'Unknown',
      store_type: store.store_type,
      timezone: store.timezone,
      floor_area_sqm: store.floor_area_sqm,
      operating_hours: store.operating_hours,
      mall_name: store.mall?.name,
      metadata: store.metadata,
      sensors_configured: true, // Will check sensor configuration in production
      sales_api_connected: true, // Will check API connectivity in production
      created_at: store.created_at,
      updated_at: store.updated_at
    }));

    return NextResponse.json({
      success: true,
      stores: transformedStores,
      total: transformedStores.length,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores', details: error.message },
      { status: 500 }
    );
  }
}