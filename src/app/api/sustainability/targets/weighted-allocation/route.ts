import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Effort factors based on abatement potential and technology readiness
// Comprehensive mapping for ALL possible metrics_catalog categories
const CATEGORY_EFFORT_FACTORS = {
  // ===== SCOPE 1: Direct Emissions =====
  'Stationary Combustion': { effortFactor: 1.2, reason: 'Medium-high: fuel switching, efficiency gains, heat recovery' },
  'Mobile Combustion': { effortFactor: 1.0, reason: 'Medium: fleet electrification, route optimization, alternative fuels' },
  'Fugitive Emissions': { effortFactor: 0.8, reason: 'Low-medium: leak detection, equipment upgrades, refrigerant management' },
  'Process Emissions': { effortFactor: 0.7, reason: 'Low-medium: process redesign, carbon capture, material substitution' },
  'Natural Gas': { effortFactor: 1.2, reason: 'Medium-high: electrification, biogas, efficiency improvements' },
  'Diesel': { effortFactor: 1.1, reason: 'Medium-high: biodiesel, electrification, fuel efficiency' },
  'Gasoline': { effortFactor: 1.1, reason: 'Medium-high: EV transition, ethanol blends, efficiency' },
  'LPG': { effortFactor: 1.1, reason: 'Medium-high: electrification, bioLPG, efficiency' },
  'Coal': { effortFactor: 1.3, reason: 'High: phase-out feasible, renewable alternatives available' },
  'Fuel Oil': { effortFactor: 1.2, reason: 'Medium-high: fuel switching, electrification' },

  // ===== SCOPE 2: Indirect Energy Emissions =====
  'Purchased Energy': { effortFactor: 1.4, reason: 'High: renewable procurement, grid mix improvement, PPAs' },
  'Electricity': { effortFactor: 1.4, reason: 'High: renewable energy, efficiency, on-site generation' },
  'District Heating': { effortFactor: 1.1, reason: 'Medium-high: renewable district heating, building efficiency' },
  'District Cooling': { effortFactor: 1.1, reason: 'Medium-high: efficient systems, renewable cooling' },
  'Steam': { effortFactor: 1.0, reason: 'Medium: efficiency, waste heat recovery, renewable sources' },

  // ===== SCOPE 3: Value Chain Emissions =====
  // Category 1: Purchased Goods & Services
  'Purchased Goods': { effortFactor: 0.7, reason: 'Low-medium: supplier engagement, material substitution, circularity' },
  'Purchased Goods & Services': { effortFactor: 0.7, reason: 'Low-medium: supplier standards, procurement policies' },
  'Services': { effortFactor: 0.8, reason: 'Low-medium: vendor selection, service optimization' },

  // Category 2: Capital Goods
  'Capital Goods': { effortFactor: 0.6, reason: 'Low: long lifecycle, limited control, supplier collaboration' },

  // Category 3: Fuel & Energy Related Activities
  'Fuel Production': { effortFactor: 0.9, reason: 'Medium: renewable fuel selection, efficiency' },
  'Transmission & Distribution Losses': { effortFactor: 1.2, reason: 'Medium-high: renewable energy reduces T&D emissions' },

  // Category 4: Upstream Transportation
  'Upstream Transport': { effortFactor: 0.8, reason: 'Low-medium: logistics optimization, supplier proximity' },
  'Inbound Logistics': { effortFactor: 0.8, reason: 'Low-medium: route optimization, mode shifting' },

  // Category 5: Waste Generated in Operations
  'Waste': { effortFactor: 1.3, reason: 'High: waste reduction, recycling, composting, circular economy' },
  'Solid Waste': { effortFactor: 1.3, reason: 'High: reduction, diversion, recycling programs' },
  'Hazardous Waste': { effortFactor: 0.9, reason: 'Medium: reduction, proper disposal, material substitution' },
  'Wastewater': { effortFactor: 1.0, reason: 'Medium: treatment efficiency, water conservation' },

  // Category 6: Business Travel
  'Business Travel': { effortFactor: 1.1, reason: 'Medium-high: virtual meetings, policy changes, sustainable modes' },
  'Air Travel': { effortFactor: 1.0, reason: 'Medium: video conferencing, travel policy, SAF' },
  'Rail Travel': { effortFactor: 1.2, reason: 'Medium-high: already low-carbon, modal shift opportunity' },
  'Road Travel': { effortFactor: 1.1, reason: 'Medium-high: EV rentals, carpooling, public transport' },
  'Hotel Stays': { effortFactor: 0.9, reason: 'Medium: sustainable accommodation policies' },

  // Category 7: Employee Commuting
  'Employee Commuting': { effortFactor: 0.9, reason: 'Medium: remote work, public transport, EV incentives' },
  'Commuting': { effortFactor: 0.9, reason: 'Medium: flexible work, transit benefits, bike programs' },

  // Category 8: Upstream Leased Assets
  'Upstream Leased Assets': { effortFactor: 0.7, reason: 'Low-medium: green lease clauses, energy efficiency' },

  // Category 9: Downstream Transportation
  'Downstream Transport': { effortFactor: 0.8, reason: 'Low-medium: logistics optimization, low-carbon shipping' },
  'Distribution': { effortFactor: 0.8, reason: 'Low-medium: route optimization, efficient vehicles' },
  'Transport': { effortFactor: 0.9, reason: 'Medium: logistics optimization, mode shifting, efficient fleet' },

  // Category 10: Processing of Sold Products
  'Processing Sold Products': { effortFactor: 0.6, reason: 'Low: limited control, customer engagement' },

  // Category 11: Use of Sold Products
  'Product Use': { effortFactor: 0.6, reason: 'Low: product design, energy efficiency, customer education' },

  // Category 12: End-of-Life Treatment
  'End-of-Life': { effortFactor: 0.8, reason: 'Low-medium: design for circularity, take-back programs' },

  // Category 13: Downstream Leased Assets
  'Downstream Leased Assets': { effortFactor: 0.7, reason: 'Low-medium: tenant engagement, green leases' },

  // Category 14: Franchises
  'Franchises': { effortFactor: 0.7, reason: 'Low-medium: franchise standards, support programs' },

  // Category 15: Investments
  'Investments': { effortFactor: 0.6, reason: 'Low: portfolio decarbonization, engagement' },

  // ===== RESOURCE CONSUMPTION =====
  'Water': { effortFactor: 1.0, reason: 'Medium: efficiency improvements, recycling, local sourcing' },
  'Water Consumption': { effortFactor: 1.0, reason: 'Medium: conservation, recycling, smart meters' },
  'Water Withdrawal': { effortFactor: 1.0, reason: 'Medium: efficiency, treatment, reuse systems' },
  'Paper': { effortFactor: 1.2, reason: 'Medium-high: digitalization, recycled content, reduction' },
  'Materials': { effortFactor: 0.8, reason: 'Low-medium: material efficiency, recycled content' },

  // ===== REFRIGERANTS & CHEMICALS =====
  'Refrigerants': { effortFactor: 1.1, reason: 'Medium-high: natural refrigerants, leak prevention, recovery' },
  'Chemicals': { effortFactor: 0.8, reason: 'Low-medium: green chemistry, substitution, efficiency' },

  // ===== OTHER CATEGORIES =====
  'Renewable Energy': { effortFactor: 1.5, reason: 'Very high: scaling renewable generation, storage' },
  'Carbon Offsets': { effortFactor: 0.5, reason: 'Low: supplementary to direct reductions, verification needed' },
  'Land Use': { effortFactor: 0.7, reason: 'Low-medium: reforestation, sustainable land management' },

  // Default for any uncategorized metrics
  'Other': { effortFactor: 1.0, reason: 'Default: requires specific analysis based on context' }
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
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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
    const baselineYear = parseInt(searchParams.get('baseline_year') || new Date().getFullYear().toString()) - 1;
    const siteId = searchParams.get('site_id');
    const categoriesParam = searchParams.get('categories'); // Optional: filter by specific categories

    // Fetch emissions data for baseline year by category
    const startDate = new Date(baselineYear, 0, 1);
    const endDate = new Date(baselineYear, 11, 31);

    let metricsQuery = supabaseAdmin
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

    if (siteId) {
      metricsQuery = metricsQuery.eq('site_id', siteId);
    }

    // Filter by specific categories if provided (e.g., "Electricity,Purchased Energy")
    if (categoriesParam) {
      const categories = categoriesParam.split(',').map(c => c.trim());
      metricsQuery = metricsQuery.in('metrics_catalog.category', categories);
    }

    const { data: metricsData, error: metricsError } = await metricsQuery;

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch emissions data' }, { status: 500 });
    }

    // Aggregate by category
    const categoryEmissions = new Map<string, number>();
    let totalEmissions = 0;

    metricsData?.forEach(record => {
      const category = record.metrics_catalog?.category || 'Other';
      const emissions = record.co2e_emissions || 0;

      categoryEmissions.set(
        category,
        (categoryEmissions.get(category) || 0) + emissions
      );
      totalEmissions += emissions;
    });

    // Calculate weighted allocation for each category
    const allocations: CategoryAllocation[] = [];

    categoryEmissions.forEach((emissions, category) => {
      const emissionPercent = totalEmissions > 0 ? (emissions / totalEmissions) * 100 : 0;

      // Get effort factor for this category
      const categoryConfig = CATEGORY_EFFORT_FACTORS[category] || CATEGORY_EFFORT_FACTORS['Other'];

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
        feasibility
      });
    });

    // Sort by emission percent (highest first)
    allocations.sort((a, b) => b.emissionPercent - a.emissionPercent);

    // Calculate weighted average to verify it matches overall target
    const weightedAverage = allocations.reduce((sum, alloc) =>
      sum + (alloc.adjustedTargetPercent * alloc.emissionPercent / 100), 0
    );

    // Normalize if needed to match overall target exactly
    const normalizationFactor = overallTarget / weightedAverage;
    allocations.forEach(alloc => {
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
        highFeasibility: allocations.filter(a => a.feasibility === 'high').length,
        mediumFeasibility: allocations.filter(a => a.feasibility === 'medium').length,
        lowFeasibility: allocations.filter(a => a.feasibility === 'low').length,
        weightedAverage: allocations.reduce((sum, alloc) =>
          sum + (alloc.adjustedTargetPercent * alloc.emissionPercent / 100), 0
        )
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
