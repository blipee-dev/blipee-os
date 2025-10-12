import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const siteId = searchParams.get('siteId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Fetch biodiversity sites
    let query = supabase
      .from('biodiversity_sites')
      .select('*')
      .eq('organization_id', organizationId);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    if (year) {
      query = query.eq('reporting_year', year);
    }

    const { data: biodiversitySites, error: sitesError } = await query.order('site_name');

    if (sitesError) {
      console.error('Error fetching biodiversity sites:', sitesError);
      return NextResponse.json(
        { error: 'Failed to fetch biodiversity data' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalSites = biodiversitySites?.length || 0;

    // GRI 304-1: Protected areas
    const sitesInProtectedAreas = biodiversitySites?.filter(s => s.in_protected_area).length || 0;
    const sitesAdjacentToProtected = biodiversitySites?.filter(s => s.adjacent_to_protected_area).length || 0;

    // Total area
    const totalArea = biodiversitySites?.reduce((sum, site) => sum + (parseFloat(site.total_area_hectares) || 0), 0) || 0;
    const protectedAreaHectares = biodiversitySites?.reduce((sum, site) => sum + (parseFloat(site.habitat_protected_hectares) || 0), 0) || 0;
    const restoredAreaHectares = biodiversitySites?.reduce((sum, site) => sum + (parseFloat(site.habitat_restored_hectares) || 0), 0) || 0;

    // GRI 304-2: Impacts on biodiversity
    const sitesByImpactLevel: { [key: string]: number } = {};
    biodiversitySites?.forEach(site => {
      if (site.operational_impact_level) {
        sitesByImpactLevel[site.operational_impact_level] = (sitesByImpactLevel[site.operational_impact_level] || 0) + 1;
      }
    });

    // GRI 304-3: Habitats protected or restored
    const sitesWithConservation = biodiversitySites?.filter(s =>
      (s.habitat_protected_hectares && s.habitat_protected_hectares > 0) ||
      (s.habitat_restored_hectares && s.habitat_restored_hectares > 0)
    ).length || 0;

    const sitesWithMonitoring = biodiversitySites?.filter(s => s.monitoring_program_in_place).length || 0;

    // GRI 304-4: IUCN Red List species
    const sitesWithIUCNSpecies = biodiversitySites?.filter(s => s.iucn_species_present).length || 0;
    const totalIUCNSpecies = biodiversitySites?.reduce((sum, site) => sum + (site.iucn_species_count || 0), 0) || 0;

    // Biodiversity value distribution
    const sitesByBiodiversityValue: { [key: string]: number } = {};
    biodiversitySites?.forEach(site => {
      if (site.biodiversity_value) {
        sitesByBiodiversityValue[site.biodiversity_value] = (sitesByBiodiversityValue[site.biodiversity_value] || 0) + 1;
      }
    });

    return NextResponse.json({
      year,
      organizationId,
      siteId,

      // Overview
      totalSites,
      totalArea,

      // GRI 304-1: Operational sites in protected areas
      sitesInProtectedAreas,
      sitesAdjacentToProtected,

      // GRI 304-2: Significant impacts on biodiversity
      sitesByImpactLevel,

      // GRI 304-3: Habitats protected or restored
      protectedAreaHectares,
      restoredAreaHectares,
      sitesWithConservation,
      sitesWithMonitoring,

      // GRI 304-4: IUCN Red List species
      sitesWithIUCNSpecies,
      totalIUCNSpecies,

      // Biodiversity value
      sitesByBiodiversityValue,

      // Detailed site data
      sites: biodiversitySites?.map(site => ({
        id: site.id,
        name: site.site_name,
        location: site.location_description,
        area: site.total_area_hectares,
        coordinates: site.latitude && site.longitude ? {
          lat: site.latitude,
          lng: site.longitude
        } : null,
        inProtectedArea: site.in_protected_area,
        adjacentToProtected: site.adjacent_to_protected_area,
        protectedAreaName: site.protected_area_name,
        protectedAreaType: site.protected_area_type,
        biodiversityValue: site.biodiversity_value,
        habitatsPresent: site.habitats_present,
        impactLevel: site.operational_impact_level,
        impactsDescription: site.impacts_description,
        protectedHectares: site.habitat_protected_hectares,
        restoredHectares: site.habitat_restored_hectares,
        conservationMeasures: site.conservation_measures,
        monitoringProgram: site.monitoring_program_in_place,
        iucnSpeciesPresent: site.iucn_species_present,
        iucnSpeciesCount: site.iucn_species_count,
        iucnSpeciesList: site.iucn_species_list,
        assessmentDate: site.assessment_date,
      })) || [],

      // Methodology
      methodology: {
        reportingPeriod: year ? `Year ${year}` : 'All reporting periods',
        standards: 'GRI 304: Biodiversity 2016',
        boundaries: siteId ? 'Site-specific data' : 'Organization-wide data',
        assessmentApproach: 'Site-level biodiversity assessments following GRI guidelines',
      },
    });
  } catch (error) {
    console.error('Error in GRI 304 API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
