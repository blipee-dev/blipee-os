'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Sun,
  Wind,
  Flame,
  Droplets,
  Factory,
  Leaf,
  AlertCircle,
  Info,
  Cloud,
  Gauge
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import type { Building } from '@/types/auth';
import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';

interface EnergyDashboardProps {
  organizationId: string;
  selectedSite: Building | null;
  selectedPeriod: TimePeriod;
}

const COLORS = {
  renewable: '#10B981',
  fossil: '#6B7280',
  electricity: '#3B82F6',
  heating: '#EF4444',
  cooling: '#06B6D4',
  steam: '#8B5CF6'
};

// Color palette for energy sources
const getSourceColor = (name: string): string => {
  const nameLower = name.toLowerCase();

  // EV Charging - Purple
  if (nameLower.includes('ev') || nameLower.includes('charging')) {
    return '#8B5CF6'; // Purple
  }

  // Grid/Purchased Electricity - Blue
  if (nameLower.includes('grid') || nameLower.includes('electricity')) {
    return '#3B82F6'; // Blue
  }

  // Heating - Orange
  if (nameLower.includes('heating')) {
    return '#F97316'; // Orange
  }

  // Cooling - Cyan
  if (nameLower.includes('cooling')) {
    return '#06B6D4'; // Cyan
  }

  // Solar - Amber
  if (nameLower.includes('solar')) {
    return '#F59E0B'; // Amber
  }

  // Wind - Green
  if (nameLower.includes('wind')) {
    return '#10B981'; // Green
  }

  // Natural Gas/Fossil - Gray
  if (nameLower.includes('gas') || nameLower.includes('fossil')) {
    return '#6B7280'; // Gray
  }

  // Default fallback
  return '#94A3B8'; // Slate
};

// Color palette for grid mix sources
const getGridMixColor = (name: string): string => {
  const nameLower = name.toLowerCase();

  // Renewable sources - Green shades
  if (nameLower.includes('solar')) return '#F59E0B'; // Amber
  if (nameLower.includes('wind')) return '#10B981'; // Green
  if (nameLower.includes('hydro')) return '#06B6D4'; // Cyan
  if (nameLower.includes('geothermal')) return '#EF4444'; // Red
  if (nameLower.includes('biomass')) return '#84CC16'; // Lime

  // Fossil fuels - Gray/Dark shades
  if (nameLower.includes('coal')) return '#1F2937'; // Dark gray
  if (nameLower.includes('gas') || nameLower.includes('natural gas')) return '#6B7280'; // Gray
  if (nameLower.includes('oil') || nameLower.includes('petroleum')) return '#374151'; // Medium gray

  // Nuclear - Purple
  if (nameLower.includes('nuclear')) return '#8B5CF6'; // Purple

  // Unknown - Light gray
  if (nameLower.includes('unknown')) return '#D1D5DB'; // Light gray

  return '#94A3B8'; // Slate fallback
};

export function EnergyDashboard({ organizationId, selectedSite, selectedPeriod }: EnergyDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'source' | 'type' | 'trends'>('overview');

  // Summary data
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [renewablePercentage, setRenewablePercentage] = useState(0);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [energyIntensity, setEnergyIntensity] = useState(0);

  // YoY comparison data
  const [yoyEnergyChange, setYoyEnergyChange] = useState<number | null>(null);
  const [yoyEmissionsChange, setYoyEmissionsChange] = useState<number | null>(null);
  const [yoyRenewableChange, setYoyRenewableChange] = useState<number | null>(null);

  // Target and compliance data
  const [annualTarget, setAnnualTarget] = useState<number | null>(null);
  const [forecastedTotal, setForecastedTotal] = useState<number | null>(null);
  const [targetStatus, setTargetStatus] = useState<'on-track' | 'at-risk' | 'off-track' | null>(null);

  // Weighted allocation targets
  const [categoryTargets, setCategoryTargets] = useState<any[]>([]);
  const [overallTargetPercent, setOverallTargetPercent] = useState<number | null>(null);

  // Breakdown data
  const [sourceBreakdown, setSourceBreakdown] = useState<any[]>([]);
  const [prevYearSourceBreakdown, setPrevYearSourceBreakdown] = useState<any[]>([]);
  const [typeBreakdown, setTypeBreakdown] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [prevYearMonthlyTrends, setPrevYearMonthlyTrends] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  // Energy mix data for different energy types (electricity, district heating, etc.)
  const [energyMixes, setEnergyMixes] = useState<Array<{
    energy_type: 'electricity' | 'district_heating' | 'district_cooling' | 'steam';
    provider_name?: string;
    year: number;
    sources: Array<{
      name: string;
      percentage: number | null;
      renewable: boolean;
    }>;
    renewable_percentage: number;
    has_unknown_sources: boolean;
    emission_factors?: {
      carbon_intensity_lifecycle: number;
      carbon_intensity_scope2: number;
      carbon_intensity_scope3_cat3: number;
    } | null;
  }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          start_date: selectedPeriod.start,
          end_date: selectedPeriod.end,
        });
        if (selectedSite) {
          params.append('site_id', selectedSite.id);
        }

        // Fetch energy sources
        const sourcesRes = await fetch(`/api/energy/sources?${params}`);
        const sourcesData = await sourcesRes.json();

        if (sourcesData.sources) {
          setTotalEnergy(sourcesData.total_consumption || 0);
          setRenewablePercentage(sourcesData.renewable_percentage || 0);
          setTotalEmissions(sourcesData.total_emissions || 0);

          // Process source breakdown
          const processedSources = sourcesData.sources.map((s: any) => ({
            name: s.name,
            value: s.consumption,
            renewable: s.renewable,
            emissions: s.emissions
          }));

          console.log('📊 Energy Sources Data:', processedSources);
          console.log('📊 Total Consumption:', sourcesData.total_consumption);
          console.log('📊 Renewable %:', sourcesData.renewable_percentage);
          console.log('📈 Monthly Trends from API:', sourcesData.monthly_trends);

          setSourceBreakdown(processedSources);

          // Use only real energy type breakdown from API - no fallback
          if (sourcesData.energy_types && sourcesData.energy_types.length > 0) {
            setTypeBreakdown(sourcesData.energy_types);
          } else {
            setTypeBreakdown([]);
          }

          // Use only real monthly trends from API - no fallback
          if (sourcesData.monthly_trends && sourcesData.monthly_trends.length > 0) {
            console.log('✅ Using real monthly trends from API');
            console.log('📊 Monthly trends sample:', sourcesData.monthly_trends[0]);
            setMonthlyTrends(sourcesData.monthly_trends);
          } else {
            console.log('⚠️ No monthly trends data from API');
            setMonthlyTrends([]);
          }

          // Set energy mix data if available (can be multiple types)
          if (sourcesData.energy_mixes && Array.isArray(sourcesData.energy_mixes)) {
            console.log('✅ Energy mix data available:', sourcesData.energy_mixes);
            setEnergyMixes(sourcesData.energy_mixes);
          } else if (sourcesData.grid_mix) {
            // Backward compatibility: convert old grid_mix format
            console.log('✅ Grid mix data available (legacy format):', sourcesData.grid_mix);
            const legacyMix = sourcesData.grid_mix;
            const converted = [{
              energy_type: 'electricity' as const,
              provider_name: legacyMix.provider,
              year: legacyMix.year,
              sources: legacyMix.sources || [],
              renewable_percentage: legacyMix.renewable_percentage || 0,
              has_unknown_sources: legacyMix.has_unknown_sources || false
            }];
            console.log('🔄 Converted to new format:', converted);
            setEnergyMixes(converted);
          }
        }

        // Fetch intensity
        const intensityRes = await fetch(`/api/energy/intensity?${params}`);
        const intensityData = await intensityRes.json();
        if (intensityData?.perSquareMeter?.value) {
          setEnergyIntensity(intensityData.perSquareMeter.value);
        }

        // Fetch previous year data for YoY comparison
        // Find the last actual data point from the monthly trends we just fetched
        let actualEndDate = new Date(selectedPeriod.end);

        if (sourcesData.monthly_trends && sourcesData.monthly_trends.length > 0) {
          // Get the last month with data
          const lastDataPoint = sourcesData.monthly_trends[sourcesData.monthly_trends.length - 1];
          const lastDataMonth = lastDataPoint.monthKey; // Format: "2025-07"

          // Set actualEndDate to the end of the last month with data
          const [year, month] = lastDataMonth.split('-').map(Number);
          actualEndDate = new Date(year, month, 0); // Last day of the month

          console.log('📅 Last data available:', lastDataMonth, '→', actualEndDate.toISOString().split('T')[0]);
        }

        const startDate = new Date(selectedPeriod.start);
        const previousYearStart = new Date(startDate);
        previousYearStart.setFullYear(startDate.getFullYear() - 1);
        const previousYearEnd = new Date(actualEndDate);
        previousYearEnd.setFullYear(actualEndDate.getFullYear() - 1);

        const prevParams = new URLSearchParams({
          start_date: previousYearStart.toISOString().split('T')[0],
          end_date: previousYearEnd.toISOString().split('T')[0],
        });
        if (selectedSite) {
          prevParams.append('site_id', selectedSite.id);
        }

        const prevSourcesRes = await fetch(`/api/energy/sources?${prevParams}`);
        const prevSourcesData = await prevSourcesRes.json();

        console.log('📊 YoY Comparison Debug:');
        console.log('  Selected Period:', selectedPeriod.start, 'to', selectedPeriod.end);
        console.log('  Actual End Date (adjusted to today):', actualEndDate.toISOString().split('T')[0]);
        console.log('  Current Period (for comparison):', selectedPeriod.start, 'to', actualEndDate.toISOString().split('T')[0]);
        console.log('  Previous Period (for comparison):', previousYearStart.toISOString().split('T')[0], 'to', previousYearEnd.toISOString().split('T')[0]);
        console.log('  Current Energy:', sourcesData.total_consumption, 'kWh');
        console.log('  Previous Energy:', prevSourcesData.total_consumption, 'kWh');
        console.log('  Current Emissions:', sourcesData.total_emissions, 'tCO2e');
        console.log('  Previous Emissions:', prevSourcesData.total_emissions, 'tCO2e');
        console.log('  Current monthly trends count:', sourcesData.monthly_trends?.length || 0);
        console.log('  Previous monthly trends count:', prevSourcesData.monthly_trends?.length || 0);
        console.log('  Previous data keys:', Object.keys(prevSourcesData));

        if (prevSourcesData.sources && prevSourcesData.total_consumption > 0) {
          // Calculate YoY changes
          const energyChange = ((sourcesData.total_consumption - prevSourcesData.total_consumption) / prevSourcesData.total_consumption) * 100;
          const emissionsChange = ((sourcesData.total_emissions - prevSourcesData.total_emissions) / prevSourcesData.total_emissions) * 100;
          const renewableChange = sourcesData.renewable_percentage - prevSourcesData.renewable_percentage;

          setYoyEnergyChange(energyChange);
          setYoyEmissionsChange(emissionsChange);
          setYoyRenewableChange(renewableChange);

          // Store previous year source breakdown for pie chart tooltips
          if (prevSourcesData.sources && prevSourcesData.sources.length > 0) {
            const processedPrevSources = prevSourcesData.sources.map((s: any) => ({
              name: s.name,
              value: s.consumption,
              renewable: s.renewable,
              emissions: s.emissions
            }));
            setPrevYearSourceBreakdown(processedPrevSources);
            console.log('📊 Previous Year Source Breakdown:', processedPrevSources.length, 'sources');
          }

          // Store previous year monthly trends for comparison
          if (prevSourcesData.monthly_trends && prevSourcesData.monthly_trends.length > 0) {
            setPrevYearMonthlyTrends(prevSourcesData.monthly_trends);
            console.log('📊 Previous Year Monthly Trends:', prevSourcesData.monthly_trends.length, 'months');
            console.log('📊 Previous Year Sample:', prevSourcesData.monthly_trends.slice(0, 3));
          } else {
            console.log('⚠️ No previous year monthly trends available');
            console.log('⚠️ prevSourcesData:', prevSourcesData);
          }

          console.log('📊 YoY Comparison Results:');
          console.log('  Energy Change:', energyChange.toFixed(1) + '%');
          console.log('  Emissions Change:', emissionsChange.toFixed(1) + '%');
          console.log('  Renewable Change:', renewableChange.toFixed(2) + ' percentage points');
          console.log('  Current Renewable %:', sourcesData.renewable_percentage.toFixed(2));
          console.log('  Previous Renewable %:', prevSourcesData.renewable_percentage.toFixed(2));
          console.log('  Will display YoY?', Math.abs(renewableChange) >= 0.1 ? 'YES' : 'NO (below 0.1pp threshold)');
        } else {
          console.log('⚠️ No previous year data available for comparison');
        }

        // Fetch ML forecast for remaining months (after we have previous year data)
        const forecastRes = await fetch(`/api/energy/forecast?${params}`);
        const forecastDataRes = await forecastRes.json();

        // Extract forecast data and filter to only future months
        let currentForecastData: any[] = [];

        if (forecastDataRes.forecast && forecastDataRes.forecast.length > 0) {
          // The API returns forecast for all months after the last actual data
          // Since we have data through July 2025, all forecast months (Aug-Dec) should be included
          // We use all forecast data since it represents months without actual data
          currentForecastData = forecastDataRes.forecast;

          console.log('🔮 ML Forecast loaded:', forecastDataRes.forecast.length, 'months');
          console.log('📊 Forecast method:', forecastDataRes.model);
          console.log('📊 Last actual month:', forecastDataRes.lastActualMonth);
          console.log('📈 Forecast values (Total):', forecastDataRes.forecast.map((f: any) => `${f.month}: ${(f.total / 1000).toFixed(1)} MWh`));
          console.log('📈 Forecast values (Renewable):', forecastDataRes.forecast.map((f: any) => `${f.month}: ${(f.renewable / 1000).toFixed(1)} MWh`));
          console.log('📈 Forecast values (Fossil):', forecastDataRes.forecast.map((f: any) => `${f.month}: ${(f.fossil / 1000).toFixed(1)} MWh`));
          console.log('📅 Forecast months:', currentForecastData.map((f: any) => f.monthKey));
          console.log('🔍 First forecast object full:', forecastDataRes.forecast[0]);
          if (forecastDataRes.metadata) {
            console.log('📊 R²:', forecastDataRes.metadata.r2?.toFixed(3));
            console.log('📈 Total trend:', forecastDataRes.metadata.totalTrend?.toFixed(3), 'kWh/month');
            console.log('📈 Renewable trend:', forecastDataRes.metadata.renewableTrend?.toFixed(3), 'kWh/month');
            console.log('📈 Fossil trend:', forecastDataRes.metadata.fossilTrend?.toFixed(3), 'kWh/month');
          }

          // Map forecast data with different keys to avoid overlapping with actual data
          setForecastData(forecastDataRes.forecast.map((f: any) => ({
            month: f.month,
            monthKey: f.monthKey,
            totalForecast: f.total,
            renewableForecast: f.renewable,
            fossilForecast: f.fossil,
            forecast: true
          })));

          // Calculate forecasted annual total
          const currentTotal = sourcesData.total_consumption || 0;
          const forecastTotal = forecastDataRes.forecast.reduce((sum: number, f: any) => sum + f.total, 0);
          const annualForecast = currentTotal + forecastTotal;
          setForecastedTotal(annualForecast);

          // Set annual target based on SBTi - ONLY for current year
          const currentYear = new Date().getFullYear();
          const selectedYear = new Date(selectedPeriod.start).getFullYear();

          // Note: SBTi targets apply to EMISSIONS, not energy consumption
          // Energy consumption can increase while emissions decrease (via renewable transition)
          // Removed incorrect SBTi energy consumption target logic
        } else {
          setForecastData([]);
        }

        // Fetch weighted allocation targets for energy categories
        const currentYear = new Date().getFullYear();
        const selectedYear = new Date(selectedPeriod.start).getFullYear();
        const baselineYear = 2023;

        if (selectedYear === currentYear) {
          // Fetch category-level targets from the database (source of truth) via API
          // This table stores the exact target percentages set for each category
          const categoryParams = new URLSearchParams({
            baseline_year: baselineYear.toString(),
            categories: 'Electricity,Purchased Energy'
          });

          const categoryRes = await fetch(`/api/sustainability/targets/category?${categoryParams}`);
          const categoryData = await categoryRes.json();

          console.log('🎯 Category targets from database:', categoryData.targets?.map((t: any) =>
            `${t.category}: ${t.baseline_emissions} tCO2e → ${t.adjusted_target_percent}% annual`
          ));

          // Use database targets if available, otherwise fall back to weighted allocation API
          let energyCategories: any[] = [];

          if (categoryData.targets && categoryData.targets.length > 0) {
            // Use targets from database
            energyCategories = categoryData.targets.map((t: any) => ({
              category: t.category,
              currentEmissions: t.baseline_emissions,
              emissionPercent: t.emission_percent,
              baselineTargetPercent: t.baseline_target_percent,
              adjustedTargetPercent: t.adjusted_target_percent,
              effortFactor: t.effort_factor,
              reason: t.allocation_reason,
              absoluteTarget: t.target_emissions,
              feasibility: t.feasibility
            }));
            console.log('✅ Using category targets from database');
          } else {
            // Fall back to weighted allocation API
            console.log('⚠️ No category targets in database, falling back to API');
            const allocParams = new URLSearchParams({
              baseline_year: baselineYear.toString(),
            });
            if (selectedSite) {
              allocParams.append('site_id', selectedSite.id);
            }

            const allocRes = await fetch(`/api/sustainability/targets/weighted-allocation?${allocParams}`);
            const allocData = await allocRes.json();

            energyCategories = allocData.allocations?.filter((a: any) =>
              a.category === 'Electricity' || a.category === 'Purchased Energy'
            ) || [];
          }

          // Fetch FULL YEAR 2023 baseline (not just same period)
          const baseline2023Params = new URLSearchParams({
            start_date: '2023-01-01',
            end_date: '2023-12-31',
          });
          if (selectedSite) {
            baseline2023Params.append('site_id', selectedSite.id);
          }

          const baseline2023Res = await fetch(`/api/energy/sources?${baseline2023Params}`);
          const baseline2023Data = await baseline2023Res.json();

          // Calculate 2025 full year projection = Actual YTD + Forecast remaining months
          const current2025YTD = sourcesData.total_emissions; // Jan-Jul actual (tCO2e)

          // Sum up forecast for remaining months (Aug-Dec)
          // Forecast data is in kWh, need to convert to tCO2e using emission factors
          const RENEWABLE_EMISSION_FACTOR = 0.02; // kgCO2e/kWh
          const FOSSIL_EMISSION_FACTOR = 0.4; // kgCO2e/kWh (IEA average)

          console.log('🔍 Inspecting forecast data structure:', currentForecastData);
          console.log('🔍 First forecast object:', currentForecastData[0]);

          const forecastRemaining = currentForecastData.reduce((sum: number, f: any) => {
            console.log('🔍 Processing forecast:', f);
            const renewableKWh = f.renewable || 0;
            const fossilKWh = f.fossil || 0;
            console.log(`  renewable: ${renewableKWh} kWh, fossil: ${fossilKWh} kWh`);
            const renewableEmissions = renewableKWh * RENEWABLE_EMISSION_FACTOR / 1000; // Convert to tCO2e
            const fossilEmissions = fossilKWh * FOSSIL_EMISSION_FACTOR / 1000; // Convert to tCO2e
            console.log(`  emissions: ${renewableEmissions + fossilEmissions} tCO2e`);
            return sum + renewableEmissions + fossilEmissions;
          }, 0);

          const projected2025FullYear = current2025YTD + forecastRemaining;

          console.log('📊 Full Year Comparison (2023 Baseline vs 2025 Projected):');
          console.log('  2023 Full Year (baseline):', baseline2023Data.total_emissions, 'tCO2e');
          console.log('  2025 YTD (Jan-Jul actual):', current2025YTD.toFixed(2), 'tCO2e');
          console.log('  2025 Forecast (Aug-Dec):', forecastRemaining.toFixed(2), 'tCO2e');
          console.log('  2025 Projected Full Year:', projected2025FullYear.toFixed(2), 'tCO2e');
          console.log('  Change:', ((projected2025FullYear - baseline2023Data.total_emissions) / baseline2023Data.total_emissions * 100).toFixed(1), '%');

          if (energyCategories.length > 0 && baseline2023Data.total_emissions) {
            // energyCategories is already populated from database or API above

            // Map energy sources to categories
            // Electricity = grid_electricity, solar, wind, renewable_electricity, ev_charging
            // Purchased Energy = purchased_heating, purchased_cooling, district_heating, district_cooling, steam
            const mapSourcesToCategories = (sources: any[]) => {
              const electricity = sources.filter((s: any) =>
                ['grid_electricity', 'solar', 'wind', 'renewable_electricity', 'ev_charging'].includes(s.type)
              ).reduce((sum, s) => sum + s.emissions, 0);

              const purchasedEnergy = sources.filter((s: any) =>
                ['purchased_heating', 'purchased_cooling', 'district_heating', 'district_cooling', 'steam'].includes(s.type)
              ).reduce((sum, s) => sum + s.emissions, 0);

              return {
                Electricity: electricity,
                'Purchased Energy': purchasedEnergy
              };
            };

            console.log('🔍 2025 YTD Sources:', sourcesData.sources.map((s: any) => `${s.name} (${s.type}): ${s.emissions.toFixed(2)} tCO2e`));
            console.log('🔍 2023 Full Year Sources:', baseline2023Data.sources.map((s: any) => `${s.name} (${s.type}): ${s.emissions.toFixed(2)} tCO2e`));

            const current2025YTDCategories = mapSourcesToCategories(sourcesData.sources);
            const baseline2023FullYearCategories = mapSourcesToCategories(baseline2023Data.sources);

            // Project 2025 full year by category using forecast data
            // Assume forecast proportions match YTD proportions
            const ytdTotal = sourcesData.total_emissions;
            const forecastTotal = forecastRemaining;
            const projectedTotal = projected2025FullYear;

            console.log('🔢 Projection Calculation:');
            console.log('  YTD Total:', ytdTotal, 'tCO2e');
            console.log('  Forecast Total:', forecastTotal, 'tCO2e');
            console.log('  Projected Total:', projectedTotal, 'tCO2e');

            const projected2025FullYearCategories: any = {};
            Object.keys(current2025YTDCategories).forEach(category => {
              const ytdCategoryEmissions = current2025YTDCategories[category];
              const categoryShare = ytdCategoryEmissions / ytdTotal;
              const forecastCategoryEmissions = forecastTotal * categoryShare;
              projected2025FullYearCategories[category] = ytdCategoryEmissions + forecastCategoryEmissions;
              console.log(`  ${category}: ${ytdCategoryEmissions.toFixed(1)} + ${forecastCategoryEmissions.toFixed(1)} = ${projected2025FullYearCategories[category].toFixed(1)} tCO2e`);
            });

            console.log('📊 2023 Full Year Categories:', baseline2023FullYearCategories);
            console.log('📊 2025 YTD Categories:', current2025YTDCategories);
            console.log('📊 2025 Projected Full Year Categories:', projected2025FullYearCategories);

            const enrichedCategories = energyCategories.map((cat: any) => {
              // Calculate expected reduction based on ANNUAL COMPOUNDING
              const yearsElapsed = currentYear - baselineYear; // 2025 - 2023 = 2 years
              const targetYear = 2030; // SBTi target year
              const annualReductionRate = cat.adjustedTargetPercent / 100; // e.g., 5.2% = 0.052

              console.log(`\n🔍 ${cat.category} calculation:`);
              console.log(`  Annual rate from API: ${cat.adjustedTargetPercent}% → ${annualReductionRate}`);
              console.log(`  Years elapsed: ${yearsElapsed}`);

              // Calculate target emissions using compound reduction: baseline × (1 - rate)^years
              const categoryFullYearBaseline = baseline2023FullYearCategories[cat.category] || 0;
              const expectedEmissions2025 = categoryFullYearBaseline * Math.pow(1 - annualReductionRate, yearsElapsed);

              console.log(`  Baseline: ${categoryFullYearBaseline.toFixed(1)} tCO2e`);
              console.log(`  Compound factor: (1 - ${annualReductionRate})^${yearsElapsed} = ${Math.pow(1 - annualReductionRate, yearsElapsed).toFixed(4)}`);
              console.log(`  Expected 2025: ${expectedEmissions2025.toFixed(1)} tCO2e`);

              // Calculate cumulative reduction percentage from baseline to current year
              const cumulativeReductionPercent = ((categoryFullYearBaseline - expectedEmissions2025) / categoryFullYearBaseline) * 100;
              console.log(`  Cumulative reduction: ${cumulativeReductionPercent.toFixed(2)}%`);

              // Get actual projected emissions for this category
              const categoryProjected2025 = projected2025FullYearCategories[cat.category] || 0;

              // Calculate actual change (comparing full years: 2023 baseline vs 2025 projected)
              // Positive = reduction, Negative = increase
              const categoryActualChange = categoryFullYearBaseline > 0
                ? ((categoryFullYearBaseline - categoryProjected2025) / categoryFullYearBaseline) * 100
                : 0;

              // Calculate progress: (actual reduction / expected reduction) * 100
              const progressPercent = cumulativeReductionPercent > 0
                ? (categoryActualChange / cumulativeReductionPercent) * 100
                : 0;

              return {
                ...cat,
                baselineEmissions: cat.currentEmissions, // From weighted allocation (full year 2023)
                baseline2023FullYear: categoryFullYearBaseline,
                projected2025FullYear: categoryProjected2025,
                expectedEmissions2025, // Target emissions for 2025
                actualReductionPercent: categoryActualChange, // Actual % change from baseline
                expectedReductionPercent: cumulativeReductionPercent, // Expected % reduction by 2025
                annualReductionRate: cat.adjustedTargetPercent, // Annual % (e.g., 5.2%)
                progressPercent,
                yearsElapsed,
                targetYear
              };
            });

            setCategoryTargets(enrichedCategories);
            setOverallTargetPercent(4.2); // SBTi 1.5°C target
            console.log('📊 Energy Category Progress (Annual Compounding):');
            enrichedCategories.forEach((cat: any) => {
              console.log(`  ${cat.category}:`);
              console.log(`    2023 baseline: ${cat.baseline2023FullYear.toFixed(1)} tCO2e`);
              console.log(`    2025 target: ${cat.expectedEmissions2025.toFixed(1)} tCO2e (${cat.annualReductionRate.toFixed(1)}% annual reduction)`);
              console.log(`    2025 projected: ${cat.projected2025FullYear.toFixed(1)} tCO2e`);
              console.log(`    Expected cumulative reduction: ${cat.expectedReductionPercent.toFixed(1)}%`);
              console.log(`    Actual change: ${cat.actualReductionPercent >= 0 ? cat.actualReductionPercent.toFixed(1) + '% reduction' : Math.abs(cat.actualReductionPercent).toFixed(1) + '% increase'}`);
              console.log(`    Progress: ${cat.progressPercent.toFixed(0)}%`);
            });
          }
        }

      } catch (error) {
        console.error('Error fetching energy data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod, selectedSite, organizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  console.log('🎨 Rendering Energy Dashboard with energyMixes:', energyMixes);

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Energy Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            GRI 302 • ESRS E1-5 • Energy consumption and intensity tracking
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 grid grid-cols-4 gap-4">
        {/* Total Energy */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Energy</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(totalEnergy / 1000).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">MWh</div>
            </div>
            {yoyEnergyChange !== null && (
              <div className="flex items-center gap-1">
                {yoyEnergyChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyEnergyChange > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span className={`text-xs ${yoyEnergyChange > 0 ? 'text-red-500' : yoyEnergyChange < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {yoyEnergyChange > 0 ? '+' : ''}{yoyEnergyChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Renewable Percentage */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Renewable</span>
            <Leaf className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {renewablePercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">of total</div>
            </div>
            {yoyRenewableChange !== null && Math.abs(yoyRenewableChange) >= 0.1 && (
              <div className="flex items-center gap-1">
                {yoyRenewableChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${yoyRenewableChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {yoyRenewableChange > 0 ? '+' : ''}{yoyRenewableChange.toFixed(1)}pp YoY
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Emissions */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Emissions</span>
            <Cloud className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalEmissions.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>
            {yoyEmissionsChange !== null && (
              <div className="flex items-center gap-1">
                {yoyEmissionsChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyEmissionsChange > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span className={`text-xs ${yoyEmissionsChange > 0 ? 'text-red-500' : yoyEmissionsChange < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {yoyEmissionsChange > 0 ? '+' : ''}{yoyEmissionsChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Intensity */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Intensity</span>
            <Gauge className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {energyIntensity.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">kWh/m²</div>
        </div>
      </div>

      {/* Energy Sources Pie Chart and Monthly Evolution - Side by Side */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-4">
        {/* Energy Sources Pie Chart */}
        {sourceBreakdown.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Energy Sources Distribution</h3>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 302-1
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E1-5
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="40%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={0}
                  label={({ cx, cy, midAngle, outerRadius, name, value }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 30;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percentage = ((value / totalEnergy) * 100).toFixed(1);
                    const color = getSourceColor(name);

                    // Determine text anchor - force right side labels to always be 'start'
                    const textAnchor = x > cx ? 'start' : 'end';

                    return (
                      <text
                        x={x}
                        y={y}
                        fill={color}
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        style={{ fontSize: '13px' }}
                      >
                        <tspan x={x} dy="0">{name}</tspan>
                        <tspan x={x} dy="14" fontWeight="bold" style={{ fontSize: '14px' }}>{percentage}%</tspan>
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {sourceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSourceColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = getSourceColor(data.name);

                      // Find matching previous year source by name
                      const prevSource = prevYearSourceBreakdown.find((s: any) => s.name === data.name);
                      let yoyChange = null;
                      if (prevSource && prevSource.value > 0) {
                        yoyChange = ((data.value - prevSource.value) / prevSource.value) * 100;
                      }

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.name}</p>
                          <p className="text-sm" style={{ color }}>
                            Consumption: {(data.value / 1000).toFixed(1)} MWh
                          </p>
                          <p className="text-sm" style={{ color }}>
                            Share: {((data.value / totalEnergy) * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Emissions: {data.emissions.toFixed(2)} tCO2e
                          </p>
                          {yoyChange !== null && (
                            <p className={`text-sm font-semibold mt-1 ${yoyChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              YoY: {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                            </p>
                          )}
                          {data.renewable && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              Renewable
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Evolution Chart */}
        {monthlyTrends.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Evolution</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Includes ML forecast for {forecastData.length} remaining months
                  {forecastData.length > 0 && forecastData[0].renewableForecast === 0 && (
                    <span className="ml-2 text-amber-500 dark:text-amber-400">
                      (Renewable forecast: 0 MWh - based on historical trend)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E1-5
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                  TCFD
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(() => {
                // Combine actual and forecast data with bridging point
                const combinedData = [...monthlyTrends];

                if (forecastData.length > 0) {
                  console.log('🔮 Adding forecast to chart:', forecastData.length, 'points');
                  console.log('🔍 First forecast item:', forecastData[0]);

                  // Get last actual data point to create bridge
                  const lastActual = monthlyTrends[monthlyTrends.length - 1];

                  // Add bridge point: has both actual and forecast keys with same values
                  // This connects the solid line to the dashed line
                  combinedData.push({
                    month: lastActual.month,
                    monthKey: lastActual.monthKey,
                    // Actual data (for solid line endpoint)
                    renewable: lastActual.renewable,
                    fossil: lastActual.fossil,
                    total: lastActual.total,
                    // Forecast data (for dashed line startpoint) - same values
                    renewableForecast: lastActual.renewable,
                    fossilForecast: lastActual.fossil,
                    totalForecast: lastActual.total,
                    bridge: true
                  });

                  // Add remaining forecast data with only forecast keys
                  forecastData.forEach((f: any) => {
                    combinedData.push({
                      month: f.month,
                      monthKey: f.monthKey,
                      renewableForecast: f.renewableForecast,
                      fossilForecast: f.fossilForecast,
                      totalForecast: f.totalForecast,
                      forecast: true
                    });
                  });

                  console.log('📊 Combined data length:', combinedData.length);
                  console.log('🌉 Bridge point:', combinedData[monthlyTrends.length]);
                  console.log('📊 Last 3 items:', combinedData.slice(-3));
                }

                return combinedData;
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}`}
                  label={{ value: 'MWh', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const isForecast = payload[0]?.payload?.forecast;
                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {label}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">(Forecast)</span>}
                          </p>
                          {payload.map((entry: any, index: number) => (
                            entry.value > 0 && (
                              <p key={index} style={{ color: entry.color }} className="text-sm">
                                {entry.name}: {(entry.value / 1000).toFixed(1)} MWh
                              </p>
                            )
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {/* Actual data - solid lines */}
                <Line
                  type="monotone"
                  dataKey="renewable"
                  stroke={COLORS.renewable}
                  strokeWidth={2}
                  dot={{ fill: COLORS.renewable, r: 3 }}
                  name="Renewable"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="fossil"
                  stroke={COLORS.fossil}
                  strokeWidth={2}
                  dot={{ fill: COLORS.fossil, r: 3 }}
                  name="Fossil"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 4 }}
                  name="Total"
                  connectNulls
                />
                {/* Forecast data - dashed lines (hide from legend) */}
                {forecastData.length > 0 && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="renewableForecast"
                      stroke={COLORS.renewable}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: COLORS.renewable, strokeWidth: 2, r: 3 }}
                      name="Renewable"
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="fossilForecast"
                      stroke={COLORS.fossil}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: COLORS.fossil, strokeWidth: 2, r: 3 }}
                      name="Fossil"
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalForecast"
                      stroke="#6366f1"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: '#6366f1', strokeWidth: 2, r: 4 }}
                      name="Total"
                      connectNulls
                      legendType="none"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Year-over-Year Comparison and Energy Mix Side by Side */}
        {monthlyTrends.length > 0 && yoyEnergyChange !== null && (() => {
          console.log('🔍 YoY Chart Rendering:', {
            monthlyTrendsCount: monthlyTrends.length,
            prevYearTrendsCount: prevYearMonthlyTrends.length,
            yoyEnergyChange,
            currentSample: monthlyTrends.slice(0, 2),
            prevSample: prevYearMonthlyTrends.slice(0, 2)
          });
          return true;
        })() && (
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex flex-col" style={{ height: '430px' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Year-over-Year Comparison</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Monthly change vs previous year
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 302-1
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E1-5
                </span>
              </div>
            </div>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                data={(() => {
                  // Create a simple API call to get previous year data for the same months
                  const chartData = monthlyTrends.map((trend: any) => {
                    // Extract year from monthKey (format: "2025-01")
                    const currentYear = parseInt(trend.monthKey.split('-')[0]);
                    const monthNum = trend.monthKey.split('-')[1];
                    const prevYearKey = `${currentYear - 1}-${monthNum}`;

                    // Find matching month from previous year by monthKey
                    const prevTrend = prevYearMonthlyTrends.find((prev: any) =>
                      prev.monthKey === prevYearKey || prev.month === trend.month
                    );

                    // Calculate month-specific YoY change
                    let change = 0;
                    let previous = 0;

                    if (prevTrend && prevTrend.total > 0) {
                      previous = prevTrend.total;
                      change = ((trend.total - prevTrend.total) / prevTrend.total) * 100;
                    } else if (yoyEnergyChange !== null) {
                      // Fallback to overall YoY if no monthly data available
                      change = yoyEnergyChange;
                    }

                    return {
                      month: trend.month,
                      monthKey: trend.monthKey,
                      change: change,
                      current: trend.total,
                      previous: previous
                    };
                  });

                  console.log('📊 Bar Chart Data:', chartData);
                  return chartData;
                })()}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
                  label={{ value: 'Change (%)', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const change = data.change;
                      const current = data.current;
                      const previous = data.previous;
                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.month}</p>
                          <div className="space-y-1 text-xs mb-2">
                            <p className="text-gray-300">
                              Current: <span className="font-medium text-white">{(current / 1000).toFixed(1)} MWh</span>
                            </p>
                            <p className="text-gray-300">
                              Last Year: <span className="font-medium text-white">{(previous / 1000).toFixed(1)} MWh</span>
                            </p>
                          </div>
                          <p className={`text-sm font-bold ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)}% YoY
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {change >= 0 ? 'Increase' : 'Decrease'} in consumption
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="change"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Electricity Grid Mix beside YoY */}
        {energyMixes.length > 0 && energyMixes.map((mix, idx) => {
          // Get title and icon based on energy type
          const getEnergyTypeConfig = (type: string) => {
            switch (type) {
              case 'electricity':
                return { title: 'Electricity Grid Mix', icon: Zap, color: 'text-blue-500' };
              case 'district_heating':
                return { title: 'District Heating Mix', icon: Flame, color: 'text-orange-500' };
              case 'district_cooling':
                return { title: 'District Cooling Mix', icon: Droplets, color: 'text-cyan-500' };
              case 'steam':
                return { title: 'Steam Mix', icon: Factory, color: 'text-purple-500' };
              default:
                return { title: 'Energy Mix', icon: Zap, color: 'text-green-500' };
            }
          };

          const config = getEnergyTypeConfig(mix.energy_type);
          const IconComponent = config.icon;

          return (
            <div key={idx} className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex flex-col" style={{ height: '430px' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {config.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Year {mix.year}
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                    GHG Scope 2
                  </span>
                  {mix.emission_factors && (
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                      GHG Scope 3.3
                    </span>
                  )}
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                    TCFD
                  </span>
                </div>
              </div>

              {/* Renewable Share with Emission Factors Tooltip */}
              <div className="mb-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg text-center relative group">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Renewable Energy</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {mix.renewable_percentage.toFixed(1)}%
                </div>

                {/* Emission Factors Tooltip */}
                {mix.emission_factors && (
                  <>
                    <Info className="w-4 h-4 text-gray-400 absolute top-3 right-3 cursor-help" />
                    <div className="absolute top-full right-0 mt-2 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-72">
                      <div className="text-xs font-semibold text-gray-300 mb-2 text-center">
                        Emission Factors (gCO₂eq/kWh)
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">Scope 2</div>
                          <div className="font-bold text-green-400">
                            {mix.emission_factors.carbon_intensity_scope2.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">Direct</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">Scope 3.3</div>
                          <div className="font-bold text-orange-400">
                            {mix.emission_factors.carbon_intensity_scope3_cat3.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">Upstream</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">Total</div>
                          <div className="font-bold text-blue-400">
                            {mix.emission_factors.carbon_intensity_lifecycle.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">Lifecycle</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {mix.sources.length > 0 ? (
                <div className="space-y-1.5 flex-1 overflow-y-auto">
                  {mix.sources.map((source, sourceIdx) => {
                    const percentage = source.percentage !== null && source.percentage !== undefined ? source.percentage : 0;
                    const color = getGridMixColor(source.name);

                    return (
                      <div key={sourceIdx} className="bg-white dark:bg-gray-800/50 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-900 dark:text-white">{source.name}</span>
                            {source.renewable === true && (
                              <Leaf className="w-2.5 h-2.5 text-green-500" />
                            )}
                            {source.renewable === false && (
                              <Flame className="w-2.5 h-2.5 text-gray-400" />
                            )}
                            {(source.percentage === null || source.percentage === undefined) && (
                              <span className="text-xs text-orange-500 dark:text-orange-400">Unknown</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {source.percentage !== null && source.percentage !== undefined ? `${percentage.toFixed(1)}%` : '?%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                    Detailed source breakdown not yet available
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">
                    Apply migrations to see Wind, Solar, Hydro, Gas, Coal breakdown
                  </p>
                </div>
              )}

              {mix.has_unknown_sources && (
                <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-xs text-orange-700 dark:text-orange-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Some energy sources are unknown. Contact your supplier for complete mix data.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly Consumption by Source - Stacked Bar Chart */}
      {monthlyTrends.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Consumption by Source</h3>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 302-1
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E1-5
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={(() => {
                // Transform data to flatten sources
                const transformed = monthlyTrends.map((trend: any) => {
                  const flattened: any = {
                    month: trend.month,
                    monthKey: trend.monthKey,
                    total: trend.total
                  };
                  // Add each source as a separate key
                  if (trend.sources) {
                    Object.entries(trend.sources).forEach(([sourceName, value]: [string, any]) => {
                      flattened[sourceName] = value;
                    });
                  }
                  return flattened;
                });
                console.log('📊 Stacked Bar Data:', transformed);
                console.log('📊 Available sources:', sourceBreakdown.map(s => s.name));
                console.log('📊 Monthly trend keys sample:', transformed[0] ? Object.keys(transformed[0]) : []);
                return transformed;
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'MWh', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => (value / 1000).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.month}</p>
                          <div className="space-y-1 text-sm">
                            {payload.map((entry: any, idx: number) => {
                              if (entry.dataKey !== 'month' && entry.dataKey !== 'monthKey' && entry.dataKey !== 'total') {
                                return (
                                  <p key={idx} style={{ color: entry.fill }}>
                                    {entry.dataKey}: {(entry.value / 1000).toFixed(1)} MWh
                                  </p>
                                );
                              }
                              return null;
                            })}
                            <p className="text-white font-bold border-t border-gray-600 pt-1 mt-1">
                              Total: {(data.total / 1000).toFixed(1)} MWh
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="square"
                />
                {sourceBreakdown.map((source: any, idx: number) => (
                  <Bar
                    key={source.name}
                    dataKey={source.name}
                    stackId="energy"
                    fill={getSourceColor(source.name)}
                    name={source.name}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Target Progress */}
      {categoryTargets.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">SBTi Target Progress</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  1.5°C pathway • {overallTargetPercent}% annual reduction • Baseline 2023
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                  GHG Protocol
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                  SBTi
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {categoryTargets.map((cat: any) => (
                <div key={cat.category} className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {cat.category}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {cat.annualReductionRate.toFixed(1)}% annual • {cat.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        cat.progressPercent >= 100 ? 'text-green-600 dark:text-green-400' :
                        cat.progressPercent >= 80 ? 'text-blue-600 dark:text-blue-400' :
                        cat.progressPercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {cat.progressPercent.toFixed(0)}%
                      </div>
                      <div className={`text-xs font-medium ${
                        cat.progressPercent >= 100 ? 'text-green-600 dark:text-green-400' :
                        cat.progressPercent >= 80 ? 'text-blue-600 dark:text-blue-400' :
                        cat.progressPercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {cat.progressPercent >= 100 ? 'exceeding' :
                         cat.progressPercent >= 80 ? 'on track' :
                         cat.progressPercent >= 50 ? 'at risk' :
                         'off track'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Baseline:</span>
                      <span className="ml-1 text-gray-900 dark:text-white font-medium">
                        {cat.baseline2023FullYear.toFixed(1)} tCO2e
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Target 2025:</span>
                      <span className="ml-1 text-gray-900 dark:text-white font-medium">
                        {cat.expectedEmissions2025.toFixed(1)} tCO2e
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Projected:</span>
                      <span className={`ml-1 font-medium ${
                        cat.projected2025FullYear <= cat.expectedEmissions2025
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {cat.projected2025FullYear.toFixed(1)} tCO2e
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cat.progressPercent >= 100 ? 'bg-green-500' :
                        cat.progressPercent >= 80 ? 'bg-blue-500' :
                        cat.progressPercent >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(cat.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
