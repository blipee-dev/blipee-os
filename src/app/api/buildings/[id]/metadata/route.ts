import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buildingId = params.id;

    // Get building with metadata
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select('id, name, organization_id, square_footage, year_built, building_type, occupancy_type, metadata')
      .eq('id', buildingId)
      .single();

    if (buildingError || !building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    // Calculate building age category
    const currentYear = new Date().getFullYear();
    const age = building.year_built ? currentYear - building.year_built : null;
    let age_category = 'unknown';
    if (age !== null) {
      if (age <= 10) age_category = 'modern';
      else if (age <= 30) age_category = 'recent';
      else if (age <= 50) age_category = 'established';
      else age_category = 'historic';
    }

    // Parse occupancy types from occupancy_type field or metadata
    const occupancy_types = building.metadata?.occupancy_types ||
      (building.occupancy_type ? [building.occupancy_type] : ['mixed']);

    // Determine systems baseline from metadata or building type
    const systems_baseline = building.metadata?.systems_baseline || {
      type: building.building_type?.toLowerCase().includes('office') ? 'sustainable' : 'conventional'
    };

    // Get floor count from metadata or estimate from square footage
    const floors = building.metadata?.floors ||
      (building.square_footage ? Math.ceil(building.square_footage / 10000) : 1);

    return NextResponse.json({
      id: building.id,
      name: building.name,
      organizationId: building.organization_id,
      metadata: {
        size_sqft: building.square_footage || 0,
        floors,
        occupancy_types,
        age_category,
        systems_baseline,
        // Include any additional metadata from the JSONB field
        ...building.metadata
      }
    });

  } catch (error) {
    console.error('Error fetching building metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch building metadata' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buildingId = params.id;
    const body = await request.json();

    // Update building metadata
    const { data: building, error: updateError } = await supabase
      .from('buildings')
      .update({
        metadata: body.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', buildingId)
      .select()
      .single();

    if (updateError || !building) {
      return NextResponse.json({ error: 'Failed to update building metadata' }, { status: 500 });
    }

    return NextResponse.json({
      id: building.id,
      name: building.name,
      organizationId: building.organization_id,
      metadata: building.metadata
    });

  } catch (error) {
    console.error('Error updating building metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update building metadata' },
      { status: 500 }
    );
  }
}
