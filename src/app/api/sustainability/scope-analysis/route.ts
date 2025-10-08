import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization from organization_members table
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'year';
    const siteId = searchParams.get('site_id');

    // Support custom date ranges
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const yearParam = searchParams.get('year');

    // Get current year and period boundaries
    const currentDate = new Date();
    const currentYear = parseInt(yearParam || currentDate.getFullYear().toString());
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;

    let startDate: Date;
    let endDate: Date;

    // If custom dates provided, use those
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else if (yearParam) {
      // If year provided, use full year
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31);
    } else {
      // Otherwise use period-based logic
      switch (period) {
        case 'month':
          startDate = new Date(currentYear, currentMonth - 1, 1);
          endDate = new Date(currentYear, currentMonth, 0);
          break;
        case 'quarter':
          startDate = new Date(currentYear, (currentQuarter - 1) * 3, 1);
          endDate = new Date(currentYear, currentQuarter * 3, 0);
          break;
        case 'year':
          startDate = new Date(currentYear, 0, 1);
          endDate = new Date(currentYear, 11, 31);
          break;
        default:
          startDate = new Date(2020, 0, 1);
          endDate = currentDate;
      }
    }

    // Fetch metrics data with catalog info
    let query = supabaseAdmin
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog!inner(
          id,
          name,
          category,
          subcategory,
          scope,
          unit,
          emission_factor
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString());

    // Apply site filter if provided
    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
    }

    // Calculate scope data from real metrics
    const scopeData = calculateScopeDataFromMetrics(metricsData || []);

    // Calculate GHG Protocol compliance score
    const complianceScore = calculateComplianceScore(scopeData);

    // Calculate data quality metrics
    const dataQuality = calculateDataQuality(metricsData || []);

    // Calculate Scope 3 coverage
    const scope3Coverage = calculateScope3Coverage(scopeData.scope_3.categories);

    // Get organization context for boundaries
    const orgContext = await getOrganizationContext(organizationId);

    return NextResponse.json({
      scopeData,
      complianceScore,
      dataQuality,
      scope3Coverage,
      organizationalBoundaries: orgContext,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      metadata: {
        totalDataPoints: metricsData?.length || 0,
        uniqueMetrics: new Set(metricsData?.map(m => m.metric_id)).size || 0
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateScopeDataFromMetrics(metricsData: any[]) {
  // Initialize scope data structure
  const scopeData = {
    scope_1: {
      total: 0,
      categories: {
        stationary_combustion: 0,
        mobile_combustion: 0,
        process_emissions: 0,
        fugitive_emissions: 0
      },
      trend: 0,
      sources: []
    },
    scope_2: {
      total: 0,
      categories: {
        purchased_electricity: 0,
        purchased_heat: 0,
        purchased_steam: 0,
        purchased_cooling: 0
      },
      location_based: 0,
      market_based: 0,
      trend: 0,
      sources: []
    },
    scope_3: {
      total: 0,
      categories: {
        'purchased_goods': { value: 0, included: false, data_quality: 0 },
        'capital_goods': { value: 0, included: false, data_quality: 0 },
        'fuel_energy': { value: 0, included: false, data_quality: 0 },
        'upstream_transportation': { value: 0, included: false, data_quality: 0 },
        'waste': { value: 0, included: false, data_quality: 0 },
        'business_travel': { value: 0, included: false, data_quality: 0 },
        'employee_commuting': { value: 0, included: false, data_quality: 0 },
        'upstream_leased': { value: 0, included: false, data_quality: 0 },
        'downstream_transportation': { value: 0, included: false, data_quality: 0 },
        'processing': { value: 0, included: false, data_quality: 0 },
        'use_of_products': { value: 0, included: false, data_quality: 0 },
        'end_of_life': { value: 0, included: false, data_quality: 0 },
        'downstream_leased': { value: 0, included: false, data_quality: 0 },
        'franchises': { value: 0, included: false, data_quality: 0 },
        'investments': { value: 0, included: false, data_quality: 0 }
      },
      trend: 0,
      coverage: 0
    }
  };

  // Map of category names to scope 1 categories
  const scope1CategoryMap: { [key: string]: keyof typeof scopeData.scope_1.categories } = {
    'Stationary Combustion': 'stationary_combustion',
    'Mobile Combustion': 'mobile_combustion',
    'Process Emissions': 'process_emissions',
    'Fugitive Emissions': 'fugitive_emissions'
  };

  // Map of subcategories to scope 2 categories
  const scope2CategoryMap: { [key: string]: keyof typeof scopeData.scope_2.categories } = {
    'Electricity': 'purchased_electricity',
    'Heat': 'purchased_heat',
    'Steam': 'purchased_steam',
    'Cooling': 'purchased_cooling'
  };

  // Map of categories to scope 3 categories
  const scope3CategoryMap: { [key: string]: keyof typeof scopeData.scope_3.categories } = {
    'Purchased Goods & Services': 'purchased_goods',
    'Capital Goods': 'capital_goods',
    'Fuel & Energy Related': 'fuel_energy',
    'Upstream Transportation': 'upstream_transportation',
    'Waste': 'waste',
    'Business Travel': 'business_travel',
    'Employee Commuting': 'employee_commuting',
    'Downstream Transportation': 'downstream_transportation',
    'End of Life Treatment': 'end_of_life'
  };

  // Track unique sources
  const scope1Sources = new Set<string>();
  const scope2Sources = new Set<string>();

  // Process each metrics record
  metricsData.forEach(record => {
    // IMPORTANT: co2e_emissions is stored in kgCO2e, convert to tCO2e
    const emissions = (record.co2e_emissions || 0) / 1000;
    const scope = record.metrics_catalog?.scope;
    const category = record.metrics_catalog?.category;
    const subcategory = record.metrics_catalog?.subcategory;
    const name = record.metrics_catalog?.name;

    if (scope === 'scope_1' || scope === 1) {
      scopeData.scope_1.total += emissions;

      // Map to specific category
      const mappedCategory = scope1CategoryMap[category];
      if (mappedCategory) {
        scopeData.scope_1.categories[mappedCategory] += emissions;
      } else {
        // Default to process emissions if not mapped
        scopeData.scope_1.categories.process_emissions += emissions;
      }

      if (name) scope1Sources.add(name);
    }
    else if (scope === 'scope_2' || scope === 2) {
      scopeData.scope_2.total += emissions;
      scopeData.scope_2.location_based += emissions;

      // Market-based calculation:
      // Check if energy has renewable attributes (RECs, GOs, PPAs)
      const isRenewable = record.metadata?.is_renewable || false;
      const renewablePercentage = record.metadata?.renewable_percentage || 0;

      if (isRenewable || renewablePercentage > 0) {
        // Apply renewable discount to market-based
        const renewableDiscount = renewablePercentage / 100;
        scopeData.scope_2.market_based += emissions * (1 - renewableDiscount);
      } else {
        // No renewable attributes, same as location-based
        scopeData.scope_2.market_based += emissions;
      }

      // Map to specific category
      const mappedCategory = scope2CategoryMap[subcategory] || scope2CategoryMap[category];
      if (mappedCategory) {
        scopeData.scope_2.categories[mappedCategory] += emissions;
      } else {
        // Default to electricity if not mapped
        scopeData.scope_2.categories.purchased_electricity += emissions;
      }

      if (name) scope2Sources.add(name);
    }
    else {
      // Scope 3
      scopeData.scope_3.total += emissions;

      // Map to specific category
      const mappedCategory = scope3CategoryMap[category];
      if (mappedCategory) {
        scopeData.scope_3.categories[mappedCategory].value += emissions;
        scopeData.scope_3.categories[mappedCategory].included = true;
        // Estimate data quality based on whether we have verification
        scopeData.scope_3.categories[mappedCategory].data_quality =
          record.verification_status === 'verified' ? 0.95 :
          record.data_quality || 0.7;
      }
    }
  });

  // Convert sources to arrays
  scopeData.scope_1.sources = Array.from(scope1Sources).slice(0, 10);
  scopeData.scope_2.sources = Array.from(scope2Sources).slice(0, 10);

  // Calculate renewable energy percentage for Scope 2
  if (scopeData.scope_2.location_based > 0) {
    const renewableImpact = scopeData.scope_2.location_based - scopeData.scope_2.market_based;
    scopeData.scope_2.renewable_percentage = Math.round((renewableImpact / scopeData.scope_2.location_based) * 100);
    scopeData.scope_2.renewable_impact = renewableImpact;
  } else {
    scopeData.scope_2.renewable_percentage = 0;
    scopeData.scope_2.renewable_impact = 0;
  }

  // Calculate trends (mock for now - would need historical comparison)
  scopeData.scope_1.trend = -5.2;
  scopeData.scope_2.trend = -8.1;
  scopeData.scope_3.trend = -3.5;

  // Calculate Scope 3 coverage
  const includedCategories = Object.values(scopeData.scope_3.categories)
    .filter((cat: any) => cat.included).length;
  scopeData.scope_3.coverage = Math.round((includedCategories / 15) * 100);

  return scopeData;
}

function calculateComplianceScore(scopeData: any): number {
  let score = 0;
  let maxScore = 100;

  // Organizational boundaries (20 points)
  score += 20; // Assuming proper boundaries are set

  // Scope 1 completeness (15 points)
  if (scopeData.scope_1.total > 0) {
    score += 15;
  }

  // Scope 2 completeness (15 points)
  if (scopeData.scope_2.total > 0) {
    score += 15;
  }

  // Scope 3 screening (20 points)
  const scope3Coverage = scopeData.scope_3.coverage;
  score += Math.min(20, (scope3Coverage / 100) * 20);

  // Calculation methodology (15 points)
  // Check if we have diverse categories
  const scope1Categories = Object.values(scopeData.scope_1.categories).filter(v => v > 0).length;
  const scope2Categories = Object.values(scopeData.scope_2.categories).filter(v => v > 0).length;
  score += Math.min(15, (scope1Categories + scope2Categories) * 3);

  // Reporting standards (15 points)
  score += 8; // Partial credit for reporting

  return Math.round(score);
}

function calculateDataQuality(metricsData: any[]) {
  if (metricsData.length === 0) {
    return {
      primaryDataPercentage: 0,
      estimatedDataPercentage: 0,
      verifiedPercentage: 0,
      pendingVerification: 0,
      totalRecords: 0
    };
  }

  let primaryCount = 0;
  let estimatedCount = 0;
  let verifiedCount = 0;

  metricsData.forEach(record => {
    // Check data_quality field (assuming 1 = primary, < 1 = estimated)
    if (record.data_quality >= 0.9) {
      primaryCount++;
    } else {
      estimatedCount++;
    }

    // Check verification_status
    if (record.verification_status === 'verified') {
      verifiedCount++;
    }
  });

  const total = metricsData.length;
  const primaryPercentage = (primaryCount / total) * 100;
  const estimatedPercentage = (estimatedCount / total) * 100;
  const verifiedPercentage = (verifiedCount / total) * 100;

  return {
    primaryDataPercentage: Math.round(primaryPercentage),
    estimatedDataPercentage: Math.round(estimatedPercentage),
    verifiedPercentage: Math.round(verifiedPercentage),
    pendingVerification: Math.round(100 - verifiedPercentage),
    totalRecords: total
  };
}

function calculateScope3Coverage(scope3Categories: any) {
  const allCategories = [
    'purchased_goods',
    'capital_goods',
    'fuel_energy',
    'upstream_transportation',
    'waste',
    'business_travel',
    'employee_commuting',
    'upstream_leased',
    'downstream_transportation',
    'processing',
    'use_of_products',
    'end_of_life',
    'downstream_leased',
    'franchises',
    'investments'
  ];

  let tracked = 0;
  let notMaterial = 0;
  let missing = 0;

  const trackedCategories: string[] = [];
  const missingCategories: string[] = [];

  allCategories.forEach(category => {
    const categoryData = scope3Categories[category];
    if (categoryData && categoryData.included) {
      tracked++;
      trackedCategories.push(category);
    } else {
      // For now, assume missing categories are "missing" not "not material"
      // In production, this would come from a materiality assessment
      missing++;
      missingCategories.push(category);
    }
  });

  return {
    total: 15,
    tracked,
    notMaterial,
    missing,
    trackedCategories,
    missingCategories,
    coveragePercentage: Math.round((tracked / 15) * 100)
  };
}

async function getOrganizationContext(organizationId: string) {
  try {
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .select('name, industry, employees, base_year')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return {
        consolidationApproach: 'Operational Control',
        sitesIncluded: 0,
        sitesTotal: 0,
        baseYear: 2019,
        coverage: 100
      };
    }

    // Get site count
    const { data: sites } = await supabaseAdmin
      .from('sites')
      .select('id')
      .eq('organization_id', organizationId);

    return {
      consolidationApproach: 'Operational Control', // Default - would come from org settings
      sitesIncluded: sites?.length || 0,
      sitesTotal: sites?.length || 0,
      baseYear: org?.base_year || 2019,
      coverage: 100, // Percentage of operations covered
      employees: org?.employees || 0,
      industry: org?.industry || 'Not specified'
    };
  } catch (error) {
    console.error('Error in getOrganizationContext:', error);
    return {
      consolidationApproach: 'Operational Control',
      sitesIncluded: 0,
      sitesTotal: 0,
      baseYear: 2019,
      coverage: 100,
      employees: 0,
      industry: 'Not specified'
    };
  }
}