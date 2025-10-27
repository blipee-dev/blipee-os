import { getAPIUser } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCategoryBreakdown } from '@/lib/sustainability/baseline-calculator';
import { NextRequest, NextResponse } from 'next/server';

// Effort factors based on abatement potential and technology readiness
// Comprehensive mapping for ALL possible metrics_catalog categories
const CATEGORY_EFFORT_FACTORS = {
  // ===== SCOPE 1: Direct Emissions =====
  'Stationary Combustion': {
    effortFactor: 1.2,
    reason: 'Medium-high: fuel switching, efficiency gains, heat recovery',
  },
  'Mobile Combustion': {
    effortFactor: 1.0,
    reason: 'Medium: fleet electrification, route optimization, alternative fuels',
  },
  'Fugitive Emissions': {
    effortFactor: 0.8,
    reason: 'Low-medium: leak detection, equipment upgrades, refrigerant management',
  },
  'Process Emissions': {
    effortFactor: 0.7,
    reason: 'Low-medium: process redesign, carbon capture, material substitution',
  },
  'Natural Gas': {
    effortFactor: 1.2,
    reason: 'Medium-high: electrification, biogas, efficiency improvements',
  },
  Diesel: { effortFactor: 1.1, reason: 'Medium-high: biodiesel, electrification, fuel efficiency' },
  Gasoline: { effortFactor: 1.1, reason: 'Medium-high: EV transition, ethanol blends, efficiency' },
  LPG: { effortFactor: 1.1, reason: 'Medium-high: electrification, bioLPG, efficiency' },
  Coal: { effortFactor: 1.3, reason: 'High: phase-out feasible, renewable alternatives available' },
  'Fuel Oil': { effortFactor: 1.2, reason: 'Medium-high: fuel switching, electrification' },

  // ===== SCOPE 2: Indirect Energy Emissions =====
  'Purchased Energy': {
    effortFactor: 1.4,
    reason: 'High: renewable procurement, grid mix improvement, PPAs',
  },
  Electricity: {
    effortFactor: 1.4,
    reason: 'High: renewable energy, efficiency, on-site generation',
  },
  'District Heating': {
    effortFactor: 1.1,
    reason: 'Medium-high: renewable district heating, building efficiency',
  },
  'District Cooling': {
    effortFactor: 1.1,
    reason: 'Medium-high: efficient systems, renewable cooling',
  },
  Steam: {
    effortFactor: 1.0,
    reason: 'Medium: efficiency, waste heat recovery, renewable sources',
  },

  // ===== SCOPE 3: Value Chain Emissions =====
  // Category 1: Purchased Goods & Services
  'Purchased Goods': {
    effortFactor: 0.7,
    reason: 'Low-medium: supplier engagement, material substitution, circularity',
  },
  'Purchased Goods & Services': {
    effortFactor: 0.7,
    reason: 'Low-medium: supplier standards, procurement policies',
  },
  Services: { effortFactor: 0.8, reason: 'Low-medium: vendor selection, service optimization' },

  // Category 2: Capital Goods
  'Capital Goods': {
    effortFactor: 0.6,
    reason: 'Low: long lifecycle, limited control, supplier collaboration',
  },

  // Category 3: Fuel & Energy Related Activities
  'Fuel Production': { effortFactor: 0.9, reason: 'Medium: renewable fuel selection, efficiency' },
  'Transmission & Distribution Losses': {
    effortFactor: 1.2,
    reason: 'Medium-high: renewable energy reduces T&D emissions',
  },

  // Category 4: Upstream Transportation
  'Upstream Transport': {
    effortFactor: 0.8,
    reason: 'Low-medium: logistics optimization, supplier proximity',
  },
  'Inbound Logistics': {
    effortFactor: 0.8,
    reason: 'Low-medium: route optimization, mode shifting',
  },

  // Category 5: Waste Generated in Operations
  Waste: {
    effortFactor: 1.3,
    reason: 'High: waste reduction, recycling, composting, circular economy',
  },
  'Solid Waste': { effortFactor: 1.3, reason: 'High: reduction, diversion, recycling programs' },
  'Hazardous Waste': {
    effortFactor: 0.9,
    reason: 'Medium: reduction, proper disposal, material substitution',
  },
  Wastewater: { effortFactor: 1.0, reason: 'Medium: treatment efficiency, water conservation' },

  // Category 6: Business Travel
  'Business Travel': {
    effortFactor: 1.1,
    reason: 'Medium-high: virtual meetings, policy changes, sustainable modes',
  },
  'Air Travel': { effortFactor: 1.0, reason: 'Medium: video conferencing, travel policy, SAF' },
  'Rail Travel': {
    effortFactor: 1.2,
    reason: 'Medium-high: already low-carbon, modal shift opportunity',
  },
  'Road Travel': {
    effortFactor: 1.1,
    reason: 'Medium-high: EV rentals, carpooling, public transport',
  },
  'Hotel Stays': { effortFactor: 0.9, reason: 'Medium: sustainable accommodation policies' },

  // Category 7: Employee Commuting
  'Employee Commuting': {
    effortFactor: 0.9,
    reason: 'Medium: remote work, public transport, EV incentives',
  },
  Commuting: {
    effortFactor: 0.9,
    reason: 'Medium: flexible work, transit benefits, bike programs',
  },

  // Category 8: Upstream Leased Assets
  'Upstream Leased Assets': {
    effortFactor: 0.7,
    reason: 'Low-medium: green lease clauses, energy efficiency',
  },

  // Category 9: Downstream Transportation
  'Downstream Transport': {
    effortFactor: 0.8,
    reason: 'Low-medium: logistics optimization, low-carbon shipping',
  },
  Distribution: { effortFactor: 0.8, reason: 'Low-medium: route optimization, efficient vehicles' },
  Transport: {
    effortFactor: 0.9,
    reason: 'Medium: logistics optimization, mode shifting, efficient fleet',
  },

  // Category 10: Processing of Sold Products
  'Processing Sold Products': {
    effortFactor: 0.6,
    reason: 'Low: limited control, customer engagement',
  },

  // Category 11: Use of Sold Products
  'Product Use': {
    effortFactor: 0.6,
    reason: 'Low: product design, energy efficiency, customer education',
  },

  // Category 12: End-of-Life Treatment
  'End-of-Life': {
    effortFactor: 0.8,
    reason: 'Low-medium: design for circularity, take-back programs',
  },

  // Category 13: Downstream Leased Assets
  'Downstream Leased Assets': {
    effortFactor: 0.7,
    reason: 'Low-medium: tenant engagement, green leases',
  },

  // Category 14: Franchises
  Franchises: { effortFactor: 0.7, reason: 'Low-medium: franchise standards, support programs' },

  // Category 15: Investments
  Investments: { effortFactor: 0.6, reason: 'Low: portfolio decarbonization, engagement' },

  // ===== RESOURCE CONSUMPTION =====
  Water: {
    effortFactor: 1.0,
    reason: 'Medium: efficiency improvements, recycling, local sourcing',
  },
  'Water Consumption': {
    effortFactor: 1.0,
    reason: 'Medium: conservation, recycling, smart meters',
  },
  'Water Withdrawal': { effortFactor: 1.0, reason: 'Medium: efficiency, treatment, reuse systems' },
  Paper: { effortFactor: 1.2, reason: 'Medium-high: digitalization, recycled content, reduction' },
  Materials: { effortFactor: 0.8, reason: 'Low-medium: material efficiency, recycled content' },

  // ===== REFRIGERANTS & CHEMICALS =====
  Refrigerants: {
    effortFactor: 1.1,
    reason: 'Medium-high: natural refrigerants, leak prevention, recovery',
  },
  Chemicals: { effortFactor: 0.8, reason: 'Low-medium: green chemistry, substitution, efficiency' },

  // ===== OTHER CATEGORIES =====
  'Renewable Energy': {
    effortFactor: 1.5,
    reason: 'Very high: scaling renewable generation, storage',
  },
  'Carbon Offsets': {
    effortFactor: 0.5,
    reason: 'Low: supplementary to direct reductions, verification needed',
  },
  'Land Use': {
    effortFactor: 0.7,
    reason: 'Low-medium: reforestation, sustainable land management',
  },

  // Default for any uncategorized metrics
  Other: { effortFactor: 1.0, reason: 'Default: requires specific analysis based on context' },
};

interface CategoryAllocation {
  category: string;
  currentEmissions: number;
  emissionPercent: number;
  baselineTargetPercent: number;
  adjustedTargetPercent: number;
  effortFactor: number;
  reason: string;
  absoluteTarget: number;
  feasibility: 'high' | 'medium' | 'low';
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;
    const { searchParams } = new URL(request.url);
    const overallTarget = parseFloat(searchParams.get('target') || '4.2'); // Default SBTi 1.5°C
    const baselineYear =
      parseInt(searchParams.get('baseline_year') || new Date().getFullYear().toString()) - 1;
    const siteId = searchParams.get('site_id');
    const categoriesParam = searchParams.get('categories'); // Optional: filter by specific categories

    // ✅ Using calculator for category breakdown (handles scope-by-scope rounding)
    const startDate = `${baselineYear}-01-01`;
    const endDate = `${baselineYear}-12-31`;

    const categoryBreakdown = await getCategoryBreakdown(
      organizationId,
      startDate,
      endDate,
      siteId || undefined
    );

    // Note: categoriesParam filtering not yet supported by calculator
    // TODO: Extend calculator to support category filtering if needed
    if (categoriesParam) {
      console.warn('⚠️ categoriesParam filtering not yet supported by calculator');
    }

    // Convert calculator output to map format (emissions already in tCO2e)
    const categoryEmissions = new Map<string, number>();
    let totalEmissions = 0;

    categoryBreakdown.forEach((cat) => {
      categoryEmissions.set(cat.category, cat.total * 1000); // Convert back to kg for consistency with old code
      totalEmissions += cat.total * 1000;
    });

    // Calculate weighted allocation for each category
    const allocations: CategoryAllocation[] = [];

    categoryEmissions.forEach((emissions, category) => {
      const emissionPercent = totalEmissions > 0 ? (emissions / totalEmissions) * 100 : 0;

      // Get effort factor for this category
      const categoryConfig =
        CATEGORY_EFFORT_FACTORS[category as keyof typeof CATEGORY_EFFORT_FACTORS] ||
        CATEGORY_EFFORT_FACTORS['Other'];

      // Calculate adjusted target:
      // Categories with high emission % and high effort factor get higher reduction targets
      const baselineTargetPercent = overallTarget * (emissionPercent / 100);
      const adjustedTargetPercent = baselineTargetPercent * categoryConfig.effortFactor;

      // Calculate absolute target (emissions after reduction)
      const absoluteTarget = emissions * (1 - adjustedTargetPercent / 100);

      // Determine feasibility
      let feasibility: 'high' | 'medium' | 'low' = 'medium';
      if (categoryConfig.effortFactor >= 1.3) feasibility = 'high';
      else if (categoryConfig.effortFactor <= 0.9) feasibility = 'low';

      allocations.push({
        category,
        currentEmissions: emissions / 1000, // Convert to tons
        emissionPercent,
        baselineTargetPercent,
        adjustedTargetPercent,
        effortFactor: categoryConfig.effortFactor,
        reason: categoryConfig.reason,
        absoluteTarget: absoluteTarget / 1000, // Convert to tons
        feasibility,
      });
    });

    // Sort by emission percent (highest first)
    allocations.sort((a, b) => b.emissionPercent - a.emissionPercent);

    // Calculate weighted average to verify it matches overall target
    const weightedAverage = allocations.reduce(
      (sum, alloc) => sum + (alloc.adjustedTargetPercent * alloc.emissionPercent) / 100,
      0
    );

    // Normalize if needed to match overall target exactly
    const normalizationFactor = overallTarget / weightedAverage;
    allocations.forEach((alloc) => {
      alloc.adjustedTargetPercent *= normalizationFactor;
      // Recalculate absolute target with normalized percentage
      alloc.absoluteTarget = alloc.currentEmissions * (1 - alloc.adjustedTargetPercent / 100);
    });

    return NextResponse.json({
      overallTarget,
      baselineYear,
      totalEmissions: totalEmissions / 1000, // tons
      allocations,
      summary: {
        highFeasibility: allocations.filter((a) => a.feasibility === 'high').length,
        mediumFeasibility: allocations.filter((a) => a.feasibility === 'medium').length,
        lowFeasibility: allocations.filter((a) => a.feasibility === 'low').length,
        weightedAverage: allocations.reduce(
          (sum, alloc) => sum + (alloc.adjustedTargetPercent * alloc.emissionPercent) / 100,
          0
        ),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;
    const { searchParams } = new URL(request.url);
    const overallTarget = parseFloat(searchParams.get('target') || '4.2');
    const baselineYear = parseInt(searchParams.get('baseline_year') || '2023');
    const targetYear = parseInt(searchParams.get('target_year') || '2025');

    // Get category breakdown from baseline year
    const startDate = `${baselineYear}-01-01`;
    const endDate = `${baselineYear}-12-31`;
    const categoryBreakdown = await getCategoryBreakdown(organizationId, startDate, endDate);

    // Convert to map
    const categoryEmissions = new Map<string, number>();
    let totalEmissions = 0;

    categoryBreakdown.forEach((cat) => {
      categoryEmissions.set(cat.category, cat.total * 1000); // kg
      totalEmissions += cat.total * 1000;
    });

    // Calculate weighted allocation
    const allocations: CategoryAllocation[] = [];

    categoryEmissions.forEach((emissions, category) => {
      const emissionPercent = totalEmissions > 0 ? (emissions / totalEmissions) * 100 : 0;
      const categoryConfig =
        CATEGORY_EFFORT_FACTORS[category as keyof typeof CATEGORY_EFFORT_FACTORS] ||
        CATEGORY_EFFORT_FACTORS['Other'];
      const baselineTargetPercent = overallTarget * (emissionPercent / 100);
      const adjustedTargetPercent = baselineTargetPercent * categoryConfig.effortFactor;
      const absoluteTarget = emissions * (1 - adjustedTargetPercent / 100);

      let feasibility: 'high' | 'medium' | 'low' = 'medium';
      if (categoryConfig.effortFactor >= 1.3) feasibility = 'high';
      else if (categoryConfig.effortFactor <= 0.9) feasibility = 'low';

      allocations.push({
        category,
        currentEmissions: emissions / 1000,
        emissionPercent,
        baselineTargetPercent,
        adjustedTargetPercent,
        effortFactor: categoryConfig.effortFactor,
        reason: categoryConfig.reason,
        absoluteTarget: absoluteTarget / 1000,
        feasibility,
      });
    });

    // Normalize
    const weightedAverage = allocations.reduce(
      (sum, alloc) => sum + (alloc.adjustedTargetPercent * alloc.emissionPercent) / 100,
      0
    );
    const normalizationFactor = overallTarget / weightedAverage;
    allocations.forEach((alloc) => {
      alloc.adjustedTargetPercent *= normalizationFactor;
      alloc.absoluteTarget = alloc.currentEmissions * (1 - alloc.adjustedTargetPercent / 100);
    });

    // Delete existing category targets for this org + baseline year
    const { error: deleteError } = await supabaseAdmin
      .from('category_targets')
      .delete()
      .eq('organization_id', organizationId)
      .eq('baseline_year', baselineYear);

    if (deleteError) {
      console.error('Error deleting old category targets:', deleteError);
    }

    // Helper function to determine scope from category
    const getCategoryScope = (category: string): string => {
      // Scope 2 categories
      if (
        [
          'Electricity',
          'Purchased Energy',
          'Purchased Heating',
          'Purchased Cooling',
          'Purchased Steam',
          'District Heating',
          'District Cooling',
          'Steam',
        ].includes(category)
      ) {
        return 'scope_2';
      }
      // Scope 1 categories
      if (
        [
          'Natural Gas',
          'Diesel',
          'Gasoline',
          'Propane',
          'Heating Oil',
          'LPG',
          'Coal',
          'Fuel Oil',
          'Stationary Combustion',
          'Mobile Combustion',
          'Fugitive Emissions',
          'Process Emissions',
          'Refrigerants',
        ].includes(category)
      ) {
        return 'scope_1';
      }
      // Everything else is Scope 3
      return 'scope_3';
    };

    // Insert new category targets (matching actual schema)
    const categoryTargetsToInsert = allocations.map((alloc) => ({
      organization_id: organizationId,
      category: alloc.category,
      scope: getCategoryScope(alloc.category),
      baseline_year: baselineYear,
      baseline_emissions: alloc.currentEmissions,
      emission_percent: alloc.emissionPercent,
      baseline_target_percent: alloc.baselineTargetPercent,
      adjusted_target_percent: alloc.adjustedTargetPercent,
      effort_factor: alloc.effortFactor,
      target_emissions: alloc.absoluteTarget,
      feasibility: alloc.feasibility,
      allocation_reason: alloc.reason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseAdmin
      .from('category_targets')
      .insert(categoryTargetsToInsert);

    if (insertError) {
      console.error('Error inserting category targets:', insertError);
      return NextResponse.json(
        { error: 'Failed to save category targets', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Created ${allocations.length} category targets`,
      overallTarget,
      baselineYear,
      targetYear,
      totalEmissions: totalEmissions / 1000,
      allocations,
    });
  } catch (error: any) {
    console.error('POST API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
