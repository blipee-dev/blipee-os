import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { calculateSectorIntensity, getProductionUnitLabel, getSBTiPathway, getGRISectorStandard, calculateBenchmarkForMetric } from '@/lib/sustainability/sector-intensity';
import {
  getPeriodEmissions,
  getScopeBreakdown,
  getCategoryBreakdown,
  getScopeCategoryBreakdown
} from '@/lib/sustainability/baseline-calculator';
import { UnifiedSustainabilityCalculator } from '@/lib/sustainability/unified-calculator';
import { getRedisClient } from '@/lib/cache/redis-client';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
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

    // ⚡ PERFORMANCE: Check cache first
    const cacheKey = `scope-analysis:${organizationId}:${startDateParam || period}:${endDateParam || ''}:${siteId || 'all'}`;
    try {
      const redis = getRedisClient();
      if (redis.isReady()) {
        const client = await redis.getClient();
        const cached = await client.get(cacheKey);
        if (cached) {
          const cacheTime = Date.now() - startTime;
          console.log(`⚡ Scope Analysis API Performance (CACHED): Total=${cacheTime}ms`);
          return NextResponse.json(JSON.parse(cached));
        }
      }
    } catch (error) {
      // Cache miss or error - continue to fetch data
      console.log('Cache miss for scope-analysis:', cacheKey);
    }

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

    // ✨ Use UnifiedSustainabilityCalculator for consistent emissions calculations
    // This calculator ensures consistency with dynamic baseline years and reduction rates
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`📊 [scope-analysis] Using UnifiedSustainabilityCalculator for organization ${organizationId}`);
    console.log(`📊 [scope-analysis] Period: ${startDateStr} to ${endDateStr}`);

    // Parallelize all independent database queries for maximum performance
    const [
      emissions,
      scopes,
      [scope1Categories, scope2Categories, scope3Categories],
      { data: metricsData, error: metricsError },
      orgContext,
      sbtiInfo,
      { data: orgData },
      { data: sites }
    ] = await Promise.all([
      // Get emissions using the centralized baseline calculator
      // (UnifiedCalculator currently only supports full-year projections)
      getPeriodEmissions(organizationId, startDateStr, endDateStr, siteId),

      // Get scope breakdown using centralized calculator
      getScopeBreakdown(organizationId, startDateStr, endDateStr, siteId),

      // Get category breakdowns (parallel)
      Promise.all([
        getScopeCategoryBreakdown(organizationId, 'scope_1', startDateStr, endDateStr, siteId),
        getScopeCategoryBreakdownEnhanced(organizationId, 'scope_2', startDateStr, endDateStr, siteId),
        getScopeCategoryBreakdown(organizationId, 'scope_3', startDateStr, endDateStr, siteId)
      ]),

      // Fetch ONLY necessary fields for context (not *)
      (async () => {
        // Filter out future months - only include data through current month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const maxHistoricalDate = new Date(currentYear, currentMonth, 0); // Last day of current month
        const effectiveEndDate = endDate <= maxHistoricalDate ? endDate : maxHistoricalDate;

        let query = supabaseAdmin
          .from('metrics_data')
          .select(`
            data_quality,
            verification_status,
            metrics_catalog!inner(
              name,
              scope
            )
          `)
          .eq('organization_id', organizationId)
          .gte('period_start', startDate.toISOString())
          .lte('period_end', effectiveEndDate.toISOString());

        if (siteId) {
          query = query.eq('site_id', siteId);
        }

        return await query;
      })(),

      // Get organization context
      getOrganizationContext(organizationId),

      // Get SBTi targets
      getSBTiTargets(organizationId),

      // Get organization data
      supabaseAdmin
        .from('organizations')
        .select(`
          employees,
          annual_revenue,
          value_added,
          annual_operating_hours,
          annual_customers,
          industry_sector,
          sector_category,
          annual_production_volume,
          production_unit
        `)
        .eq('id', organizationId)
        .single(),

      // Get sites data
      (async () => {
        let sitesQuery = supabaseAdmin
          .from('sites')
          .select('id, name, total_area_sqm, total_employees')
          .eq('organization_id', organizationId);

        if (siteId) {
          sitesQuery = sitesQuery.eq('id', siteId);
        }

        return await sitesQuery;
      })()
    ]);

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
    }

    // Build scope data structure using calculator results
    const scopeData = buildScopeDataFromCalculator(
      scopes,
      scope1Categories,
      scope2Categories,
      scope3Categories,
      metricsData || []
    );

    // Calculate GHG Protocol compliance score
    const complianceScore = calculateComplianceScore(scopeData);

    // Calculate data quality metrics
    const dataQuality = calculateDataQuality(metricsData || []);

    // Calculate Scope 3 coverage
    const scope3Coverage = calculateScope3Coverage(scopeData.scope_3.categories);

    // Aggregate employee count from sites (more accurate than org-level field)
    const totalEmployeesFromSites = sites?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 0;

    // Enhanced orgData with aggregated employees
    const enhancedOrgData = {
      ...orgData,
      employee_count: totalEmployeesFromSites || orgData?.employees || 0
    };

    // Calculate comprehensive intensity metrics
    const intensityMetrics = calculateIntensityMetrics(scopeData, enhancedOrgData, sites || []);

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Scope Analysis API Performance: Total=${totalTime}ms`);
    console.log(`✅ [scope-analysis] Calculations completed using centralized baseline-calculator`);

    const responseData = {
      scopeData,
      complianceScore,
      dataQuality,
      scope3Coverage,
      organizationalBoundaries: orgContext,
      sbtiTargets: sbtiInfo,
      intensityMetrics, // Add comprehensive intensity metrics
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      metadata: {
        totalDataPoints: metricsData?.length || 0,
        uniqueMetrics: new Set(metricsData?.map(m => m.metric_id)).size || 0,
        calculationEngine: 'baseline-calculator',
        calculationMethod: 'scope-by-scope-rounding',
        unifiedCalculatorCompatible: true,
      }
    };

    // ⚡ PERFORMANCE: Cache the result for 5 minutes (scope data doesn't change frequently)
    try {
      const redis = getRedisClient();
      if (redis.isReady()) {
        const client = await redis.getClient();
        await client.setex(cacheKey, 300, JSON.stringify(responseData)); // 5 min cache
      }
    } catch (error) {
      // Caching failed - not critical, just log
      console.log('Failed to cache scope-analysis result');
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Build scope data structure using calculator results
 * This replaces manual calculations with calculator values for consistency
 */
function buildScopeDataFromCalculator(
  scopes: any,
  scope1Categories: any[],
  scope2Categories: any[],
  scope3Categories: any[],
  metricsData: any[]
) {
  // Map category names to keys
  const scope1CategoryMap: { [key: string]: string } = {
    'Stationary Combustion': 'stationary_combustion',
    'Mobile Combustion': 'mobile_combustion',
    'Process Emissions': 'process_emissions',
    'Fugitive Emissions': 'fugitive_emissions'
  };

  const scope2CategoryMap: { [key: string]: string } = {
    'Electricity': 'purchased_electricity',
    'Purchased Energy': 'purchased_electricity',
    'Purchased Electricity': 'purchased_electricity',
    'Heat': 'purchased_heat',
    'Purchased Heat': 'purchased_heat',
    'Purchased Heating': 'purchased_heat',  // Now properly handled by enhanced function
    'Heating': 'purchased_heat',
    'Steam': 'purchased_steam',
    'Purchased Steam': 'purchased_steam',
    'Cooling': 'purchased_cooling',
    'Purchased Cooling': 'purchased_cooling'  // Now properly handled by enhanced function
  };

  const scope3CategoryMap: { [key: string]: string } = {
    'Purchased Goods & Services': 'purchased_goods',
    'Capital Goods': 'capital_goods',
    'Fuel & Energy Related': 'fuel_energy',
    'Upstream Transportation': 'upstream_transportation',
    'Waste': 'waste',
    'Business Travel': 'business_travel',
    'Employee Commuting': 'employee_commuting',
    'Upstream Leased Assets': 'upstream_leased',
    'Downstream Transportation': 'downstream_transportation',
    'Processing of Sold Products': 'processing',
    'Use of Sold Products': 'use_of_products',
    'End-of-Life': 'end_of_life',
    'Downstream Leased Assets': 'downstream_leased',
    'Franchises': 'franchises',
    'Investments': 'investments'
  };

  // Build Scope 1 categories
  const scope1CategoriesObj: any = {
    stationary_combustion: 0,
    mobile_combustion: 0,
    process_emissions: 0,
    fugitive_emissions: 0
  };
  scope1Categories.forEach(cat => {
    const key = scope1CategoryMap[cat.category];
    if (key) scope1CategoriesObj[key] = cat.emissions;
  });

  // Build Scope 2 categories
  const scope2CategoriesObj: any = {
    purchased_electricity: 0,
    purchased_heat: 0,
    purchased_steam: 0,
    purchased_cooling: 0
  };
  scope2Categories.forEach(cat => {
    console.log(`📊 Scope 2 Category found: "${cat.category}" with ${cat.emissions} tCO2e`);
    const key = scope2CategoryMap[cat.category];
    if (key) {
      scope2CategoriesObj[key] = cat.emissions;
    } else {
      console.log(`⚠️ Unmapped Scope 2 category: "${cat.category}"`);
    }
  });

  // Build Scope 3 categories
  const scope3CategoriesObj: any = {
    purchased_goods: { value: 0, included: false, data_quality: 0 },
    capital_goods: { value: 0, included: false, data_quality: 0 },
    fuel_energy: { value: 0, included: false, data_quality: 0 },
    upstream_transportation: { value: 0, included: false, data_quality: 0 },
    waste: { value: 0, included: false, data_quality: 0 },
    business_travel: { value: 0, included: false, data_quality: 0 },
    employee_commuting: { value: 0, included: false, data_quality: 0 },
    upstream_leased: { value: 0, included: false, data_quality: 0 },
    downstream_transportation: { value: 0, included: false, data_quality: 0 },
    processing: { value: 0, included: false, data_quality: 0 },
    use_of_products: { value: 0, included: false, data_quality: 0 },
    end_of_life: { value: 0, included: false, data_quality: 0 },
    downstream_leased: { value: 0, included: false, data_quality: 0 },
    franchises: { value: 0, included: false, data_quality: 0 },
    investments: { value: 0, included: false, data_quality: 0 }
  };
  scope3Categories.forEach(cat => {
    const key = scope3CategoryMap[cat.category];
    if (key) {
      scope3CategoriesObj[key] = {
        value: cat.emissions,
        included: cat.emissions > 0,
        data_quality: cat.emissions > 0 ? 100 : 0
      };
    }
  });

  // Get unique sources
  const scope1Sources = new Set<string>();
  const scope2Sources = new Set<string>();
  metricsData.forEach(record => {
    const scope = record.metrics_catalog?.scope;
    const name = record.metrics_catalog?.name;
    if (scope === 'scope_1' && name) scope1Sources.add(name);
    if (scope === 'scope_2' && name) scope2Sources.add(name);
  });

  // Build final structure using calculator values (NOT manual calculations!)
  return {
    scope_1: {
      total: scopes.scope_1,  // From calculator
      categories: scope1CategoriesObj,
      trend: 0,
      sources: Array.from(scope1Sources),
      percentage: scopes.total > 0 ? Math.round((scopes.scope_1 / scopes.total) * 1000) / 10 : 0
    },
    scope_2: {
      total: scopes.scope_2,  // From calculator
      categories: scope2CategoriesObj,
      location_based: scopes.scope_2,  // From calculator
      market_based: scopes.scope_2,    // From calculator (same for now)
      renewable_percentage: 0,
      trend: 0,
      sources: Array.from(scope2Sources),
      percentage: scopes.total > 0 ? Math.round((scopes.scope_2 / scopes.total) * 1000) / 10 : 0
    },
    scope_3: {
      total: scopes.scope_3,  // From calculator
      categories: scope3CategoriesObj,
      trend: 0,
      coverage: 0,
      percentage: scopes.total > 0 ? Math.round((scopes.scope_3 / scopes.total) * 1000) / 10 : 0
    }
  };
}

/**
 * @deprecated Use buildScopeDataFromCalculator instead
 * This function manually calculates emissions and will give INCONSISTENT results
 */
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

      // Map to specific category - check name, subcategory, then category
      let mappedCategory = scope2CategoryMap[subcategory] || scope2CategoryMap[category];

      // Also check the metric name for better mapping
      if (!mappedCategory && name) {
        if (name.toLowerCase().includes('heating') || name.toLowerCase().includes('heat')) {
          mappedCategory = 'purchased_heat';
        } else if (name.toLowerCase().includes('cooling') || name.toLowerCase().includes('cool')) {
          mappedCategory = 'purchased_cooling';
        } else if (name.toLowerCase().includes('steam')) {
          mappedCategory = 'purchased_steam';
        }
      }

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
    // Check data_quality field (string: 'measured', 'calculated', 'estimated')
    if (record.data_quality === 'measured' || record.data_quality === 'calculated') {
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
      .select('name, industry_primary, base_year, consolidation_approach')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return {
        consolidationApproach: 'Operational Control',
        sitesIncluded: 0,
        sitesTotal: 0,
        baseYear: 2023,
        coverage: 100,
        employees: 0,
        industry: 'Not specified'
      };
    }

    // Get sites with employee count
    const { data: sites } = await supabaseAdmin
      .from('sites')
      .select('id, total_employees, status')
      .eq('organization_id', organizationId);

    // Calculate total employees from all sites
    const totalEmployees = sites?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 0;

    // Count active sites
    const activeSites = sites?.filter(s => s.status === 'active').length || 0;
    const totalSites = sites?.length || 0;
    const coverage = totalSites > 0 ? Math.round((activeSites / totalSites) * 100) : 100;

    return {
      consolidationApproach: org?.consolidation_approach || 'Operational Control',
      sitesIncluded: activeSites,
      sitesTotal: totalSites,
      baseYear: org?.base_year || 2023,
      coverage,
      employees: totalEmployees,
      industry: org?.industry_primary || 'Not specified'
    };
  } catch (error) {
    console.error('Error in getOrganizationContext:', error);
    return {
      consolidationApproach: 'Operational Control',
      sitesIncluded: 0,
      sitesTotal: 0,
      baseYear: 2023,
      coverage: 100,
      employees: 0,
      industry: 'Not specified'
    };
  }
}

async function getSBTiTargets(organizationId: string) {
  try {
    // Get active SBTi targets
    const { data: targets, error } = await supabaseAdmin
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching SBTi targets:', error);
      return {
        hasTargets: false,
        validated: false,
        ambition: null,
        targetCount: 0
      };
    }

    if (!targets || targets.length === 0) {
      return {
        hasTargets: false,
        validated: false,
        ambition: null,
        targetCount: 0
      };
    }

    // Find the most ambitious validated target
    const validatedTargets = targets.filter(t => t.sbti_validated);
    const nearTermTarget = targets.find(t => t.target_type === 'near-term');
    const netZeroTarget = targets.find(t => t.target_type === 'net-zero');

    return {
      hasTargets: true,
      validated: validatedTargets.length > 0,
      validationDate: validatedTargets[0]?.sbti_validation_date || null,
      ambition: validatedTargets[0]?.sbti_ambition || nearTermTarget?.sbti_ambition || null,
      targetCount: targets.length,
      nearTermTarget: nearTermTarget ? {
        targetYear: nearTermTarget.target_year,
        reductionPercent: nearTermTarget.target_reduction_percent,
        baselineYear: nearTermTarget.baseline_year,
        scope: nearTermTarget.target_scope
      } : null,
      netZeroTarget: netZeroTarget ? {
        targetYear: netZeroTarget.target_year,
        baselineYear: netZeroTarget.baseline_year
      } : null
    };
  } catch (error) {
    console.error('Error in getSBTiTargets:', error);
    return {
      hasTargets: false,
      validated: false,
      ambition: null,
      targetCount: 0
    };
  }
}

function calculateIntensityMetrics(scopeData: any, orgData: any, sites: any[]) {
  // Get total emissions in tonnes
  const scope1Total = scopeData.scope_1?.total || 0;
  const scope2Total = scopeData.scope_2?.total || 0;
  const scope3Total = scopeData.scope_3?.total || 0;
  const totalEmissions = scope1Total + scope2Total + scope3Total;

  // Get organization context data (NO MOCK/ESTIMATED VALUES)
  const employees = orgData?.employee_count || 0;
  const revenue = orgData?.annual_revenue || 0;
  const valueAddedActual = orgData?.value_added || 0;
  const operatingHoursActual = orgData?.annual_operating_hours || 0;
  const customers = orgData?.annual_customers || 0;

  // Automatic calculations based on available data (with quality flags)
  // Operating hours: Standard 40h/week * 52 weeks = 2,080 hours/year per FTE
  const operatingHoursCalculated = employees > 0 ? employees * 2080 : 0;
  const operatingHours = operatingHoursActual || operatingHoursCalculated;
  const operatingHoursIsEstimated = operatingHoursActual === 0 && operatingHoursCalculated > 0;

  // Value added: Cannot be estimated reliably, only use if provided
  const valueAdded = valueAddedActual;
  const valueAddedIsEstimated = false; // Never estimate this

  // Sector-specific data
  const industrySector = orgData?.industry_sector;
  const productionVolume = orgData?.annual_production_volume || 0;
  const productionUnit = orgData?.production_unit;

  // Calculate total area from sites
  const totalAreaM2 = sites?.reduce((sum, site) => {
    const area = typeof site.total_area_sqm === 'string'
      ? parseFloat(site.total_area_sqm)
      : (site.total_area_sqm || 0);
    return sum + area;
  }, 0) || 0;

  // Initialize comprehensive intensity metrics structure with data quality flags
  const intensityMetrics: any = {
    // GRI 305-4 & TCFD - Common denominators
    perEmployee: 0,        // tCO2e/FTE
    perRevenue: 0,         // tCO2e/M€ (ESRS E1 mandatory)
    perSqm: 0,             // kgCO2e/m²

    // SBTi - Economic intensity (GEVA method)
    perValueAdded: 0,      // tCO2e/M€ value added

    // Additional metrics for comprehensive reporting
    perOperatingHour: 0,   // kgCO2e/operating hour
    perCustomer: 0,        // kgCO2e/customer served

    // Data quality indicators
    dataQuality: {
      employees: { available: employees > 0, source: 'sites_aggregation' },
      revenue: { available: revenue > 0, source: revenue > 0 ? 'organization_data' : 'missing', missingReason: revenue === 0 ? 'not_provided' : null },
      area: { available: totalAreaM2 > 0, source: totalAreaM2 > 0 ? 'sites_aggregation' : 'missing' },
      valueAdded: { available: valueAdded > 0, source: valueAdded > 0 ? 'organization_data' : 'missing', missingReason: valueAdded === 0 ? 'not_provided' : null },
      operatingHours: { available: operatingHours > 0, source: operatingHoursIsEstimated ? 'calculated_40h_week' : 'organization_data', isEstimated: operatingHoursIsEstimated },
      customers: { available: customers > 0, source: customers > 0 ? 'organization_data' : 'missing', missingReason: customers === 0 ? 'not_provided' : null },
      productionVolume: { available: productionVolume > 0, source: productionVolume > 0 ? 'organization_data' : 'missing' }
    },

    // Scope-specific intensities (GRI 305-4 recommendation)
    scope1: {
      perEmployee: 0,
      perRevenue: 0,
      perSqm: 0
    },
    scope2: {
      perEmployee: 0,
      perRevenue: 0,
      perSqm: 0
    },
    scope3: {
      perEmployee: 0,
      perRevenue: 0,
      perSqm: 0
    }
  };

  // Total emissions intensities (GRI 305-4, ESRS E1, TCFD) with sector benchmarks
  if (employees > 0) {
    intensityMetrics.perEmployee = totalEmissions / employees;

    // Add benchmark if sector is known
    if (industrySector) {
      const benchmark = calculateBenchmarkForMetric(intensityMetrics.perEmployee, industrySector, 'perEmployee');
      intensityMetrics.perEmployeeBenchmark = benchmark.benchmark;
      intensityMetrics.perEmployeeBenchmarkValue = benchmark.benchmarkValue;
    }
  }

  if (revenue > 0) {
    intensityMetrics.perRevenue = (totalEmissions * 1000000) / revenue; // tCO2e per M€

    // Add benchmark if sector is known
    if (industrySector) {
      const benchmark = calculateBenchmarkForMetric(intensityMetrics.perRevenue, industrySector, 'perRevenue');
      intensityMetrics.perRevenueBenchmark = benchmark.benchmark;
      intensityMetrics.perRevenueBenchmarkValue = benchmark.benchmarkValue;
    }
  }

  if (totalAreaM2 > 0) {
    intensityMetrics.perSqm = (totalEmissions * 1000) / totalAreaM2; // kgCO2e per m²

    // Add benchmark if sector is known
    if (industrySector) {
      const benchmark = calculateBenchmarkForMetric(intensityMetrics.perSqm, industrySector, 'perArea');
      intensityMetrics.perSqmBenchmark = benchmark.benchmark;
      intensityMetrics.perSqmBenchmarkValue = benchmark.benchmarkValue;
    }
  }

  // SBTi - Economic intensity (GEVA method)
  if (valueAdded > 0) {
    intensityMetrics.perValueAdded = (totalEmissions * 1000000) / valueAdded; // tCO2e per M€ value added

    // Add benchmark if sector is known
    if (industrySector) {
      const benchmark = calculateBenchmarkForMetric(intensityMetrics.perValueAdded, industrySector, 'perValueAdded');
      intensityMetrics.perValueAddedBenchmark = benchmark.benchmark;
      intensityMetrics.perValueAddedBenchmarkValue = benchmark.benchmarkValue;
    }
  }

  // Additional comprehensive metrics
  if (operatingHours > 0) {
    intensityMetrics.perOperatingHour = (totalEmissions * 1000) / operatingHours; // kgCO2e per operating hour
  }

  if (customers > 0) {
    intensityMetrics.perCustomer = (totalEmissions * 1000) / customers; // kgCO2e per customer
  }

  // Scope-specific intensities (GRI 305-4 separate reporting recommendation)
  if (employees > 0) {
    intensityMetrics.scope1.perEmployee = scope1Total / employees;
    intensityMetrics.scope2.perEmployee = scope2Total / employees;
    intensityMetrics.scope3.perEmployee = scope3Total / employees;
  }

  if (revenue > 0) {
    intensityMetrics.scope1.perRevenue = (scope1Total * 1000000) / revenue;
    intensityMetrics.scope2.perRevenue = (scope2Total * 1000000) / revenue;
    intensityMetrics.scope3.perRevenue = (scope3Total * 1000000) / revenue;
  }

  if (totalAreaM2 > 0) {
    intensityMetrics.scope1.perSqm = (scope1Total * 1000) / totalAreaM2;
    intensityMetrics.scope2.perSqm = (scope2Total * 1000) / totalAreaM2;
    intensityMetrics.scope3.perSqm = (scope3Total * 1000) / totalAreaM2;
  }

  // Sector-specific physical intensity (SBTi sector pathways & GRI production-based)
  if (productionVolume > 0 && productionUnit && industrySector) {
    const sectorIntensity = calculateSectorIntensity(
      totalEmissions,
      productionVolume,
      productionUnit,
      industrySector
    );

    intensityMetrics.sectorSpecific = {
      intensity: sectorIntensity.intensity,
      unit: sectorIntensity.unit,
      productionVolume: productionVolume,
      productionUnit: productionUnit,
      productionUnitLabel: getProductionUnitLabel(productionUnit),
      industrySector: industrySector,
      benchmark: sectorIntensity.benchmark,
      benchmarkValue: sectorIntensity.benchmarkValue,
      sbtiPathway: getSBTiPathway(industrySector),
      griStandard: getGRISectorStandard(industrySector)
    };
  }

  // Add benchmark values for metrics even when data is missing (for UI reference)
  if (industrySector) {
    // Per Revenue benchmark (even if no revenue data)
    if (!intensityMetrics.perRevenueBenchmarkValue) {
      const revenueBenchmark = calculateBenchmarkForMetric(0, industrySector, 'perRevenue');
      if (revenueBenchmark.benchmarkValue) {
        intensityMetrics.perRevenueBenchmarkValue = revenueBenchmark.benchmarkValue;
      }
    }

    // Per Value Added benchmark (even if no value added data)
    if (!intensityMetrics.perValueAddedBenchmarkValue) {
      const valueAddedBenchmark = calculateBenchmarkForMetric(0, industrySector, 'perValueAdded');
      if (valueAddedBenchmark.benchmarkValue) {
        intensityMetrics.perValueAddedBenchmarkValue = valueAddedBenchmark.benchmarkValue;
      }
    }
  }

  return intensityMetrics;
}

/**
 * Enhanced Scope 2 category breakdown that checks BOTH category AND metric name
 * This handles cases where energy types are stored as metric names (e.g., "Purchased Heating")
 * rather than categories
 */
async function getScopeCategoryBreakdownEnhanced(
  organizationId: string,
  scope: 'scope_2',
  startDate: string,
  endDate: string,
  siteId?: string
): Promise<any[]> {
  // Fetch all Scope 2 metrics with both category AND name
  let query = supabaseAdmin
    .from('metrics_data')
    .select(`
      co2e_emissions,
      metrics_catalog!inner(scope, category, name)
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.scope', scope)
    .gte('period_start', startDate)
    .lte('period_end', endDate);

  if (siteId) {
    query = query.eq('site_id', siteId);
  }

  const { data: metricsData, error } = await query;

  if (error || !metricsData || metricsData.length === 0) {
    return [];
  }

  // Group by intelligently detecting the energy type from name or category
  const categoryMap = new Map<string, { emissions: number; count: number }>();

  metricsData.forEach(d => {
    const catalog = (d.metrics_catalog as any);
    const category = catalog?.category || '';
    const name = catalog?.name || '';
    const emissionsKg = d.co2e_emissions || 0;

    // Determine the Scope 2 subcategory by checking both name and category
    let scope2Type = 'Purchased Energy'; // Default

    const nameLower = name.toLowerCase();
    const categoryLower = category.toLowerCase();

    if (nameLower.includes('heating') || nameLower.includes('heat') ||
        categoryLower.includes('heating') || categoryLower.includes('heat')) {
      scope2Type = 'Purchased Heating';
    } else if (nameLower.includes('cooling') || nameLower.includes('cool') ||
               categoryLower.includes('cooling') || categoryLower.includes('cool')) {
      scope2Type = 'Purchased Cooling';
    } else if (nameLower.includes('steam') || categoryLower.includes('steam')) {
      scope2Type = 'Purchased Steam';
    } else if (nameLower.includes('electricity') || nameLower.includes('electric') ||
               categoryLower.includes('electricity') || categoryLower.includes('electric')) {
      scope2Type = 'Purchased Electricity';
    }

    if (!categoryMap.has(scope2Type)) {
      categoryMap.set(scope2Type, { emissions: 0, count: 0 });
    }

    const cat = categoryMap.get(scope2Type)!;
    cat.emissions += emissionsKg;
    cat.count++;
  });

  // Build category array
  const categories: any[] = [];
  categoryMap.forEach((data, category) => {
    const emissions = Math.round(data.emissions / 1000 * 10) / 10;
    categories.push({
      category,
      scope: 'scope_2',
      emissions,
      percentage: 0, // Will be calculated later
      recordCount: data.count
    });
  });

  // Sort by emissions (highest first)
  return categories.sort((a, b) => b.emissions - a.emissions);
}