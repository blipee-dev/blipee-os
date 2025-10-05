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

    const organizationId = params.id;

    // Get all buildings for the organization
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id, name, square_footage, year_built, building_type, occupancy_type, metadata')
      .eq('organization_id', organizationId);

    if (buildingsError) {
      return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 });
    }

    // If no buildings, return minimal metadata
    if (!buildings || buildings.length === 0) {
      return NextResponse.json({
        size_sqft: 0,
        floors: 0,
        occupancy_types: [],
        age_category: 'unknown',
        systems_baseline: { type: 'conventional' },
        building_count: 0
      });
    }

    // Aggregate metadata from all buildings
    const totalSqft = buildings.reduce((sum, b) => sum + (b.square_footage || 0), 0);

    // Calculate average age category
    const currentYear = new Date().getFullYear();
    const ages = buildings
      .filter(b => b.year_built)
      .map(b => currentYear - b.year_built!);

    const avgAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : null;

    let age_category = 'unknown';
    if (avgAge !== null) {
      if (avgAge <= 10) age_category = 'modern';
      else if (avgAge <= 30) age_category = 'recent';
      else if (avgAge <= 50) age_category = 'established';
      else age_category = 'historic';
    }

    // Collect unique occupancy types
    const occupancyTypesSet = new Set<string>();
    buildings.forEach(b => {
      if (b.metadata?.occupancy_types) {
        b.metadata.occupancy_types.forEach((type: string) => occupancyTypesSet.add(type));
      } else if (b.occupancy_type) {
        occupancyTypesSet.add(b.occupancy_type);
      }
    });
    const occupancy_types = Array.from(occupancyTypesSet);
    if (occupancy_types.length === 0) occupancy_types.push('mixed');

    // Estimate total floors from all buildings
    const totalFloors = buildings.reduce((sum, b) => {
      if (b.metadata?.floors) return sum + b.metadata.floors;
      if (b.square_footage) return sum + Math.ceil(b.square_footage / 10000);
      return sum + 1;
    }, 0);

    // Determine systems baseline based on building types
    const buildingTypes = buildings.map(b => b.building_type?.toLowerCase() || '');
    const hasSustainableBuildings = buildingTypes.some(t =>
      t.includes('office') || t.includes('sustainable') || t.includes('green')
    );

    const systems_baseline = {
      type: hasSustainableBuildings ? 'sustainable' : 'conventional'
    };

    return NextResponse.json({
      size_sqft: totalSqft,
      floors: totalFloors,
      occupancy_types,
      age_category,
      systems_baseline,
      building_count: buildings.length,
      buildings: buildings.map(b => ({
        id: b.id,
        name: b.name,
        size_sqft: b.square_footage || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching organization metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization metadata' },
      { status: 500 }
    );
  }
}
