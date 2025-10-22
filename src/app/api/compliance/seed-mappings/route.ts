import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';

/**
 * Seeds the framework_mappings table with cross-references between GRI, ESRS, TCFD, and IFRS S2
 * This is a one-time operation to establish interoperability between frameworks
 */
export async function POST(request: NextRequest) {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if mappings already exist
    const { data: existingMappings, error: checkError } = await supabase
      .from('framework_mappings')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing mappings:', checkError);
      return NextResponse.json({ error: 'Failed to check existing mappings' }, { status: 500 });
    }

    if (existingMappings && existingMappings.length > 0) {
      return NextResponse.json({
        message: 'Framework mappings already exist',
        count: existingMappings.length
      });
    }

    // Define framework mappings based on official standards
    const mappings = [
      // SCOPE 1 EMISSIONS
      { datapoint_code: 'scope1_total', gri_codes: ['305-1'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.i'], description: 'Gross direct (Scope 1) GHG emissions', unit: 'tCO2e' },
      { datapoint_code: 'scope1_biogenic', gri_codes: ['305-1'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.iii'], description: 'Biogenic CO2 emissions from Scope 1', unit: 'tCO2e' },

      // SCOPE 2 EMISSIONS (dual reporting)
      { datapoint_code: 'scope2_location_based', gri_codes: ['305-2'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.ii'], description: 'Gross Scope 2 emissions (location-based)', unit: 'tCO2e' },
      { datapoint_code: 'scope2_market_based', gri_codes: ['305-2'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.ii'], description: 'Gross Scope 2 emissions (market-based)', unit: 'tCO2e' },

      // SCOPE 3 EMISSIONS
      { datapoint_code: 'scope3_total', gri_codes: ['305-3'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.iv'], description: 'Gross Scope 3 GHG emissions', unit: 'tCO2e' },
      { datapoint_code: 'scope3_cat1', gri_codes: ['305-3'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.iv'], description: 'Scope 3 Category 1: Purchased Goods & Services', unit: 'tCO2e' },
      { datapoint_code: 'scope3_cat2', gri_codes: ['305-3'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.iv'], description: 'Scope 3 Category 2: Capital Goods', unit: 'tCO2e' },
      { datapoint_code: 'scope3_cat3', gri_codes: ['305-3'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.iv'], description: 'Scope 3 Category 3: Fuel and Energy Related Activities', unit: 'tCO2e' },
      { datapoint_code: 'scope3_cat6', gri_codes: ['305-3'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.iv'], description: 'Scope 3 Category 6: Business Travel', unit: 'tCO2e' },
      { datapoint_code: 'scope3_cat7', gri_codes: ['305-3'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.i'], ifrs_s2_codes: ['29.a.iv'], description: 'Scope 3 Category 7: Employee Commuting', unit: 'tCO2e' },

      // INTENSITY METRICS
      { datapoint_code: 'intensity_revenue', gri_codes: ['305-4'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.ii'], ifrs_s2_codes: ['29.b'], description: 'GHG emissions intensity per revenue', unit: 'tCO2e/€M' },
      { datapoint_code: 'intensity_area', gri_codes: ['305-4'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.ii'], ifrs_s2_codes: null, description: 'GHG emissions intensity per area', unit: 'tCO2e/m²' },
      { datapoint_code: 'intensity_fte', gri_codes: ['305-4'], esrs_codes: ['E1-6'], tcfd_references: ['Metrics a.ii'], ifrs_s2_codes: null, description: 'GHG emissions intensity per FTE', unit: 'tCO2e/FTE' },

      // REMOVALS AND CREDITS
      { datapoint_code: 'removals_total', gri_codes: ['305-1', '305-2', '305-3'], esrs_codes: ['E1-7'], tcfd_references: null, ifrs_s2_codes: null, description: 'Total GHG removals and storage', unit: 'tCO2e' },
      { datapoint_code: 'credits_total', gri_codes: ['305-5'], esrs_codes: ['E1-7'], tcfd_references: null, ifrs_s2_codes: null, description: 'GHG emissions reductions from climate change mitigation projects', unit: 'tCO2e' },

      // ENERGY
      { datapoint_code: 'energy_consumption_total', gri_codes: ['302-1'], esrs_codes: ['E1-5'], tcfd_references: null, ifrs_s2_codes: ['6.a'], description: 'Total energy consumption', unit: 'MWh' },
      { datapoint_code: 'energy_renewable', gri_codes: ['302-1'], esrs_codes: ['E1-5'], tcfd_references: null, ifrs_s2_codes: ['6.b'], description: 'Renewable energy consumption', unit: 'MWh' },
      { datapoint_code: 'energy_intensity', gri_codes: ['302-3'], esrs_codes: ['E1-5'], tcfd_references: null, ifrs_s2_codes: null, description: 'Energy intensity', unit: 'MWh/€M' },

      // TARGETS
      { datapoint_code: 'target_scope1_reduction', gri_codes: ['305-5'], esrs_codes: ['E1-4'], tcfd_references: ['Metrics b'], ifrs_s2_codes: ['33'], description: 'Scope 1 emission reduction target', unit: '%' },
      { datapoint_code: 'target_scope2_reduction', gri_codes: ['305-5'], esrs_codes: ['E1-4'], tcfd_references: ['Metrics b'], ifrs_s2_codes: ['33'], description: 'Scope 2 emission reduction target', unit: '%' },
      { datapoint_code: 'target_scope3_reduction', gri_codes: ['305-5'], esrs_codes: ['E1-4'], tcfd_references: ['Metrics b'], ifrs_s2_codes: ['33'], description: 'Scope 3 emission reduction target', unit: '%' },

      // GOVERNANCE
      { datapoint_code: 'board_climate_oversight', gri_codes: null, esrs_codes: ['ESRS-2'], tcfd_references: ['Governance a'], ifrs_s2_codes: ['6'], description: 'Board oversight of climate-related issues', unit: 'text' },
      { datapoint_code: 'management_climate_role', gri_codes: null, esrs_codes: ['ESRS-2'], tcfd_references: ['Governance b'], ifrs_s2_codes: ['7'], description: 'Management role in climate-related issues', unit: 'text' },

      // RISKS & OPPORTUNITIES
      { datapoint_code: 'physical_risks', gri_codes: null, esrs_codes: ['E1-9'], tcfd_references: ['Risk a'], ifrs_s2_codes: ['10'], description: 'Physical climate risks', unit: 'text' },
      { datapoint_code: 'transition_risks', gri_codes: null, esrs_codes: ['E1-9'], tcfd_references: ['Risk a'], ifrs_s2_codes: ['10'], description: 'Transition climate risks', unit: 'text' },
      { datapoint_code: 'climate_opportunities', gri_codes: null, esrs_codes: ['E1-9'], tcfd_references: ['Strategy c'], ifrs_s2_codes: ['13'], description: 'Climate-related opportunities', unit: 'text' },

      // SCENARIO ANALYSIS
      { datapoint_code: 'scenario_1.5c', gri_codes: null, esrs_codes: ['E1-9'], tcfd_references: ['Strategy c'], ifrs_s2_codes: ['14'], description: 'Climate scenario analysis - 1.5°C pathway', unit: 'text' },
      { datapoint_code: 'scenario_2c', gri_codes: null, esrs_codes: ['E1-9'], tcfd_references: ['Strategy c'], ifrs_s2_codes: ['14'], description: 'Climate scenario analysis - 2°C pathway', unit: 'text' },

      // INTERNAL CARBON PRICE
      { datapoint_code: 'carbon_price', gri_codes: null, esrs_codes: ['E1-8'], tcfd_references: ['Metrics c'], ifrs_s2_codes: null, description: 'Internal carbon price', unit: '€/tCO2e' },
    ];

    // Insert mappings
    const { data: insertedMappings, error: insertError } = await supabase
      .from('framework_mappings')
      .insert(mappings)
      .select();

    if (insertError) {
      console.error('Error inserting framework mappings:', insertError);
      return NextResponse.json({ error: 'Failed to insert framework mappings', details: insertError }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Framework mappings seeded successfully',
      count: insertedMappings?.length || 0,
      mappings: insertedMappings
    });

  } catch (error) {
    console.error('Error in seed-mappings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
