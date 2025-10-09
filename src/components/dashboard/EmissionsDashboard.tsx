'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  TrendingUp,
  TrendingDown,
  Leaf,
  Target,
  Factory,
  Info,
  AlertTriangle,
  Flame,
  Zap,
  Wind,
  MapPin,
  Users,
  Building2,
  CheckCircle,
  ShoppingCart,
  Plane,
  Trash2,
  Truck,
  Package,
  Home,
  Wrench,
  Globe,
  Car,
  Thermometer,
  Clock,
  Snowflake,
  Battery
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { Building } from '@/types/auth';
import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';

interface EmissionsDashboardProps {
  organizationId: string;
  selectedSite: Building | null;
  selectedPeriod: TimePeriod;
}

// Helper function to get action recommendations for emission sources
const getActionRecommendation = (categoryName: string): string => {
  const nameLower = categoryName.toLowerCase();

  if (nameLower.includes('electricity') || nameLower.includes('grid')) {
    return '💡 Switch to renewable energy contracts';
  }
  if (nameLower.includes('natural gas') || nameLower.includes('gas') || nameLower.includes('stationary')) {
    return '🔥 Install heat pump or upgrade boilers';
  }
  if (nameLower.includes('business travel') || nameLower.includes('travel')) {
    return '✈️ Implement virtual meetings policy';
  }
  if (nameLower.includes('fleet') || nameLower.includes('vehicle') || nameLower.includes('mobile')) {
    return '🚗 Transition to electric vehicles';
  }
  if (nameLower.includes('commut')) {
    return '🚲 Promote public transit & remote work';
  }
  if (nameLower.includes('fugitive')) {
    return '🔧 Improve refrigerant leak detection';
  }
  if (nameLower.includes('waste')) {
    return '♻️ Increase recycling & composting';
  }
  if (nameLower.includes('purchase') || nameLower.includes('supply')) {
    return '🏭 Engage suppliers on emissions reduction';
  }

  return '📊 Review and optimize this source';
};

// Function to get category-specific colors
const getCategoryColor = (name: string): string => {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('electricity') || nameLower.includes('grid')) {
    return '#3B82F6'; // Blue
  }
  if (nameLower.includes('gas') || nameLower.includes('heating') || nameLower.includes('stationary')) {
    return '#F97316'; // Orange
  }
  if (nameLower.includes('transport') || nameLower.includes('vehicle') || nameLower.includes('fleet') || nameLower.includes('mobile')) {
    return '#8B5CF6'; // Purple
  }
  if (nameLower.includes('waste')) {
    return '#92400E'; // Brown
  }
  if (nameLower.includes('travel') || nameLower.includes('flight')) {
    return '#4F46E5'; // Indigo
  }
  if (nameLower.includes('fugitive') || nameLower.includes('refrigerant')) {
    return '#06B6D4'; // Cyan
  }
  if (nameLower.includes('commut')) {
    return '#10B981'; // Green
  }
  if (nameLower.includes('purchase') || nameLower.includes('supply')) {
    return '#EC4899'; // Pink
  }

  return '#6B7280'; // Gray
};

// Function to get GHG Protocol recommended colors for Scope 2 energy types
const getScope2CategoryColor = (categoryKey: string): string => {
  switch (categoryKey) {
    case 'purchased_electricity':
      return '#F59E0B'; // Amber - GHG Protocol color for electricity
    case 'purchased_heat':
    case 'purchased_heating':
      return '#F97316'; // Orange - heating/thermal energy
    case 'purchased_cooling':
      return '#3B82F6'; // Blue - cooling
    case 'purchased_steam':
      return '#8B5CF6'; // Purple - steam
    default:
      return '#F59E0B'; // Default to amber
  }
};

// Function to get GHG Protocol recommended colors for Scope 3 categories (15 categories)
const getScope3CategoryColor = (categoryKey: string): string => {
  switch (categoryKey) {
    case 'purchased_goods':
      return '#8B5CF6'; // Purple - purchased goods & services
    case 'capital_goods':
      return '#7C3AED'; // Violet - capital goods
    case 'fuel_energy':
      return '#F59E0B'; // Amber - fuel & energy related
    case 'upstream_transportation':
      return '#3B82F6'; // Blue - upstream transportation
    case 'waste':
      return '#92400E'; // Brown - waste generated in operations
    case 'business_travel':
      return '#EF4444'; // Red - business travel
    case 'employee_commuting':
      return '#10B981'; // Green - employee commuting
    case 'upstream_leased':
      return '#6366F1'; // Indigo - upstream leased assets
    case 'downstream_transportation':
      return '#06B6D4'; // Cyan - downstream transportation
    case 'processing':
      return '#EC4899'; // Pink - processing of sold products
    case 'use_of_products':
      return '#F97316'; // Orange - use of sold products
    case 'end_of_life':
      return '#78716C'; // Stone - end-of-life treatment
    case 'downstream_leased':
      return '#14B8A6'; // Teal - downstream leased assets
    case 'franchises':
      return '#A855F7'; // Fuchsia - franchises
    case 'investments':
      return '#2563EB'; // Blue 600 - investments
    default:
      return '#6B7280'; // Gray - default
  }
};

// Helper function to get color for emissions source based on scope and category name
const getEmissionSourceColor = (categoryName: string, scope: string): string => {
  // Convert category name to snake_case key for matching
  const categoryKey = categoryName.toLowerCase().replace(/ /g, '_');

  if (scope === 'Scope 2') {
    return getScope2CategoryColor(categoryKey);
  } else if (scope === 'Scope 3') {
    return getScope3CategoryColor(categoryKey);
  } else if (scope === 'Scope 1') {
    // Scope 1 colors
    if (categoryKey.includes('stationary')) return '#F97316'; // Orange
    if (categoryKey.includes('mobile')) return '#8B5CF6'; // Purple
    if (categoryKey.includes('fugitive')) return '#06B6D4'; // Cyan
    if (categoryKey.includes('process')) return '#EF4444'; // Red
  }

  // Fallback to generic color
  return getCategoryColor(categoryName);
};

// Helper function to get icon for Scope 2 energy categories
const getScope2CategoryIcon = (categoryKey: string) => {
  switch (categoryKey) {
    case 'purchased_electricity':
      return Zap;
    case 'purchased_heat':
    case 'purchased_heating':
      return Flame;
    case 'purchased_cooling':
      return Snowflake;
    case 'purchased_steam':
      return Thermometer;
    default:
      return Zap;
  }
};

// Helper function to get icon for Scope 3 categories
const getScope3CategoryIcon = (categoryKey: string) => {
  switch (categoryKey) {
    case 'purchased_goods':
      return ShoppingCart;
    case 'capital_goods':
      return Wrench;
    case 'fuel_energy':
      return Flame;
    case 'upstream_transport':
      return Truck;
    case 'waste':
      return Trash2;
    case 'business_travel':
      return Plane;
    case 'employee_commuting':
      return Car;
    case 'upstream_leased':
      return Building2;
    case 'downstream_transport':
      return Truck;
    case 'processing':
      return Factory;
    case 'use_of_products':
      return Package;
    case 'end_of_life':
      return Trash2;
    case 'downstream_leased':
      return Home;
    case 'franchises':
      return Globe;
    case 'investments':
      return TrendingUp;
    default:
      return Package;
  }
};

export function EmissionsDashboard({ organizationId, selectedSite, selectedPeriod }: EmissionsDashboardProps) {
  const [loading, setLoading] = useState(true);

  // Summary metrics
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [totalEmissionsYoY, setTotalEmissionsYoY] = useState(0);
  const [intensityMetric, setIntensityMetric] = useState(0);
  const [intensityYoY, setIntensityYoY] = useState(0);

  // Comprehensive intensity metrics for all standards
  const [intensityMetrics, setIntensityMetrics] = useState<any>({
    // GRI 305-4 & TCFD
    perEmployee: 0,
    perRevenue: 0,
    perSqm: 0,
    // SBTi GEVA
    perValueAdded: 0,
    // Additional
    perOperatingHour: 0,
    perCustomer: 0,
    // Sector-specific (SBTi pathways & GRI production-based)
    sectorSpecific: null,
    // Scope-specific
    scope1: { perEmployee: 0, perRevenue: 0, perSqm: 0 },
    scope2: { perEmployee: 0, perRevenue: 0, perSqm: 0 },
    scope3: { perEmployee: 0, perRevenue: 0, perSqm: 0 }
  });

  // Keep individual states for backward compatibility
  const [intensityPerEmployee, setIntensityPerEmployee] = useState(0);
  const [intensityPerRevenue, setIntensityPerRevenue] = useState(0);
  const [intensityPerSqm, setIntensityPerSqm] = useState(0);

  // Site comparison
  const [siteComparison, setSiteComparison] = useState<any[]>([]);

  // Scope breakdown
  const [scope1Total, setScope1Total] = useState(0);
  const [scope2Total, setScope2Total] = useState(0);
  const [scope3Total, setScope3Total] = useState(0);
  const [scopeYoY, setScopeYoY] = useState({ scope1: 0, scope2: 0, scope3: 0 });

  // Scope 2 dual reporting
  const [scope2LocationBased, setScope2LocationBased] = useState(0);
  const [scope2MarketBased, setScope2MarketBased] = useState(0);
  const [renewablePercentage, setRenewablePercentage] = useState(0);
  const [scope2CategoriesData, setScope2CategoriesData] = useState<any>({});

  // Scope 3 coverage
  const [scope3Coverage, setScope3Coverage] = useState<any>(null);
  const [scope3CategoriesData, setScope3CategoriesData] = useState<any>({});

  // Trends
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);

  // Top emission sources
  const [topEmitters, setTopEmitters] = useState<Array<{ name: string; emissions: number; percentage: number }>>([]);

  // Scope 1 detailed breakdown
  const [scope1Sources, setScope1Sources] = useState<any[]>([]);
  const [scope1ByGas, setScope1ByGas] = useState<any[]>([]);

  // Geographic breakdown
  const [geographicBreakdown, setGeographicBreakdown] = useState<any[]>([]);

  // Targets
  const [targetData, setTargetData] = useState<any>(null);

  // Data quality
  const [dataQuality, setDataQuality] = useState<any>(null);

  // Projected emissions for SBTi tracker
  const [projectedAnnualEmissions, setProjectedAnnualEmissions] = useState(0);
  const [actualEmissionsYTD, setActualEmissionsYTD] = useState(0);
  const [forecastedEmissions, setForecastedEmissions] = useState(0);

  useEffect(() => {
    const fetchEmissionsData = async () => {
      setLoading(true);
      try {
        // Build params
        const params = new URLSearchParams({
          start_date: selectedPeriod.start,
          end_date: selectedPeriod.end,
        });
        if (selectedSite) {
          params.append('site_id', selectedSite.id);
        }

        // Fetch scope analysis (main API)
        const scopeResponse = await fetch(`/api/sustainability/scope-analysis?${params}`);
        const scopeData = await scopeResponse.json();

        // Fetch dashboard data for trends
        const dashboardResponse = await fetch(`/api/sustainability/dashboard?${params}`);
        const dashboardData = await dashboardResponse.json();

        // Fetch targets
        const targetsResponse = await fetch('/api/sustainability/targets');
        const targetsResult = await targetsResponse.json();
        setTargetData(targetsResult);

        // Fetch previous year for YoY comparison
        const currentYear = new Date(selectedPeriod.start).getFullYear();
        const previousYear = currentYear - 1;

        const prevYearStart = new Date(selectedPeriod.start);
        prevYearStart.setFullYear(previousYear);
        const prevYearEnd = new Date(selectedPeriod.end);
        prevYearEnd.setFullYear(previousYear);

        const prevParams = new URLSearchParams({
          start_date: prevYearStart.toISOString().split('T')[0],
          end_date: prevYearEnd.toISOString().split('T')[0],
        });
        if (selectedSite) {
          prevParams.append('site_id', selectedSite.id);
        }

        const prevScopeResponse = await fetch(`/api/sustainability/scope-analysis?${prevParams}`);
        const prevScopeData = await prevScopeResponse.json();

        console.log('📊 Emissions Dashboard Data:', { scopeData, dashboardData, targetsResult });

        // Extract scope totals
        const extractedScopeData = scopeData.scopeData || scopeData;
        console.log('📊 Extracted Scope Data:', extractedScopeData);
        const prevExtractedScopeData = prevScopeData.scopeData || prevScopeData;

        const s1Current = extractedScopeData.scope_1?.total || 0;
        const s2Current = extractedScopeData.scope_2?.total || 0;
        const s3Current = extractedScopeData.scope_3?.total || 0;

        const s1Previous = prevExtractedScopeData.scope_1?.total || 0;
        const s2Previous = prevExtractedScopeData.scope_2?.total || 0;
        const s3Previous = prevExtractedScopeData.scope_3?.total || 0;

        const currentTotal = s1Current + s2Current + s3Current;
        const previousTotal = s1Previous + s2Previous + s3Previous;

        setScope1Total(s1Current);
        setScope2Total(s2Current);
        setScope3Total(s3Current);
        setTotalEmissions(currentTotal);

        console.log('📊 Totals Set:', {
          scope1: s1Current,
          scope2: s2Current,
          scope3: s3Current,
          total: currentTotal
        });

        // Calculate YoY changes
        const totalYoY = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
        const s1YoY = s1Previous > 0 ? ((s1Current - s1Previous) / s1Previous) * 100 : 0;
        const s2YoY = s2Previous > 0 ? ((s2Current - s2Previous) / s2Previous) * 100 : 0;
        const s3YoY = s3Previous > 0 ? ((s3Current - s3Previous) / s3Previous) * 100 : 0;

        setTotalEmissionsYoY(totalYoY);
        setScopeYoY({ scope1: s1YoY, scope2: s2YoY, scope3: s3YoY });

        // Multiple intensity metrics
        const employees = scopeData.organizationEmployees || extractedScopeData.organizationEmployees || 200;
        const revenue = scopeData.annualRevenue || extractedScopeData.annualRevenue || 0;
        const totalArea = scopeData.totalAreaSqm || extractedScopeData.totalAreaSqm || 0;

        // Per employee (tCO2e/FTE)
        const intensityEmployee = employees > 0 ? currentTotal / employees : 0;
        const prevIntensityEmployee = employees > 0 ? previousTotal / employees : 0;
        const intensityYoYCalc = prevIntensityEmployee > 0 ? ((intensityEmployee - prevIntensityEmployee) / prevIntensityEmployee) * 100 : 0;

        // Per revenue (tCO2e/M€ or tCO2e/M$)
        const intensityRev = revenue > 0 ? (currentTotal * 1000000) / revenue : 0; // tCO2e per million revenue

        // Per sqm (kgCO2e/m²)
        const intensitySqm = totalArea > 0 ? (currentTotal * 1000) / totalArea : 0; // Convert tonnes to kg

        // Use comprehensive intensity metrics from API if available
        if (scopeData.intensityMetrics) {
          setIntensityMetrics(scopeData.intensityMetrics);
          setIntensityPerEmployee(scopeData.intensityMetrics.perEmployee);
          setIntensityPerRevenue(scopeData.intensityMetrics.perRevenue);
          setIntensityPerSqm(scopeData.intensityMetrics.perSqm);
          setIntensityMetric(scopeData.intensityMetrics.perEmployee); // Keep for backwards compatibility
        } else {
          // Fallback to manual calculation
          setIntensityMetric(intensityEmployee);
          setIntensityPerEmployee(intensityEmployee);
          setIntensityPerRevenue(intensityRev);
          setIntensityPerSqm(intensitySqm);
        }
        setIntensityYoY(intensityYoYCalc);

        // Scope 2 dual reporting and categories
        setScope2LocationBased(extractedScopeData.scope_2?.locationBased || s2Current);
        setScope2MarketBased(extractedScopeData.scope_2?.marketBased || s2Current);
        setRenewablePercentage(extractedScopeData.scope_2?.renewablePercentage || 0);

        // Extract Scope 2 categories
        if (extractedScopeData.scope_2?.categories) {
          setScope2CategoriesData(extractedScopeData.scope_2.categories);
        }

        // Scope 3 coverage - categories is an object with nested data
        const scope3Categories = extractedScopeData.scope_3?.categories || {};

        // Extract emissions from nested objects or use direct values
        const scope3CategoriesFlat: any = {};
        Object.entries(scope3Categories).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Nested object - check for 'value' or 'emissions' property
            if ('value' in value) {
              const emissionsValue = (value as any).value; // Already in tonnes from API
              scope3CategoriesFlat[key] = emissionsValue;
            } else if ('emissions' in value) {
              const emissionsValue = (value as any).emissions / 1000; // Convert kg to tonnes
              scope3CategoriesFlat[key] = emissionsValue;
            }
          } else if (typeof value === 'number') {
            // Direct number value (already in correct unit)
            scope3CategoriesFlat[key] = value;
          }
        });

        const trackedCategories = Object.values(scope3CategoriesFlat).filter((emissions: any) => emissions > 0).length;

        setScope3Coverage({
          tracked: trackedCategories,
          missing: 15 - trackedCategories,
          percentage: (trackedCategories / 15) * 100
        });
        setScope3CategoriesData(scope3CategoriesFlat);

        // Monthly trends from dashboard API with enterprise forecasting
        if (dashboardData.trendData && dashboardData.trendData.length > 0) {
          // Transform trend data to include 'total' field
          const trends = dashboardData.trendData.map((m: any) => ({
            month: m.month,
            total: m.emissions || 0,
            scope1: m.scope1 || 0,
            scope2: m.scope2 || 0,
            scope3: m.scope3 || 0,
            forecast: false
          }));

          console.log('📈 Monthly trends (actual):', trends.length, 'months');
          console.log('📈 Actual months:', trends.map(t => t.month));

          // Fetch enterprise forecast for remaining months (same approach as Overview)
          const forecastRes = await fetch(`/api/sustainability/forecast?${params}`);
          if (forecastRes.ok) {
            const forecastData = await forecastRes.json();

            if (forecastData.forecast && forecastData.forecast.length > 0) {
              console.log('🔮 Enterprise forecast loaded:', forecastData.forecast.length, 'months');
              console.log('🔮 Forecast months:', forecastData.forecast.map((f: any) => f.month));
              console.log('📊 Model:', forecastData.model, 'Confidence:', forecastData.confidence);

              // Add forecast months to trends
              const forecastMonths = forecastData.forecast.map((f: any) => ({
                month: f.month,
                total: f.total || 0,
                scope1: f.scope1 || 0,
                scope2: f.scope2 || 0,
                scope3: f.scope3 || 0,
                forecast: true
              }));

              // Calculate total projected emissions for the year (actual + forecast)
              const actualEmissions = trends.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
              const forecastedEmissionsTotal = forecastMonths.reduce((sum: number, f: any) => sum + f.total, 0);
              const projectedTotal = actualEmissions + forecastedEmissionsTotal;

              console.log('📊 Projected annual emissions:', {
                actual: actualEmissions.toFixed(1),
                forecasted: forecastedEmissionsTotal.toFixed(1),
                total: projectedTotal.toFixed(1)
              });

              // Store projected emissions in state for SBTi tracker
              setProjectedAnnualEmissions(projectedTotal);
              setActualEmissionsYTD(actualEmissions);
              setForecastedEmissions(forecastedEmissionsTotal);

              console.log('📊 Final combined:', trends.length, 'actual +', forecastMonths.length, 'forecast =', trends.length + forecastMonths.length, 'total months');
              setMonthlyTrends([...trends, ...forecastMonths]);
            } else {
              console.log('⚠️ No forecast data returned');
              setMonthlyTrends(trends);
            }
          } else {
            console.warn('⚠️ Forecast API not available, showing actual data only');
            setMonthlyTrends(trends);
          }
        } else if (dashboardData.trends) {
          setMonthlyTrends(dashboardData.trends);
        }

        // Top emission sources
        const allCategories: any[] = [];

        // Categories is an object, not an array - use Object.entries like Overview does
        if (extractedScopeData.scope_1?.categories) {
          Object.entries(extractedScopeData.scope_1.categories).forEach(([key, value]) => {
            allCategories.push({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              emissions: value as number,
              scope: 'Scope 1'
            });
          });
        }

        if (extractedScopeData.scope_2?.categories) {
          Object.entries(extractedScopeData.scope_2.categories).forEach(([key, value]) => {
            allCategories.push({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              emissions: value as number,
              scope: 'Scope 2'
            });
          });
        }

        if (extractedScopeData.scope_3?.categories) {
          Object.entries(extractedScopeData.scope_3.categories).forEach(([key, value]) => {
            // Scope 3 categories are objects with {value, included, data_quality}
            const emissionsValue = typeof value === 'object' && value !== null && 'value' in value
              ? (value as any).value
              : (typeof value === 'number' ? value : 0);

            allCategories.push({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              emissions: emissionsValue,
              scope: 'Scope 3'
            });
          });
        }

        const topFive = allCategories
          .filter(c => c.emissions > 0)
          .sort((a, b) => b.emissions - a.emissions)
          .slice(0, 5)
          .map(cat => ({
            ...cat,
            percentage: currentTotal > 0 ? (cat.emissions / currentTotal) * 100 : 0
          }));

        setTopEmitters(topFive);

        // Scope 1 detailed breakdown
        if (extractedScopeData.scope_1?.categories) {
          const scope1CategoriesArray: any[] = [];
          Object.entries(extractedScopeData.scope_1.categories).forEach(([key, value]) => {
            if ((value as number) > 0) {
              scope1CategoriesArray.push({
                name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                emissions: value as number
              });
            }
          });
          setScope1Sources(scope1CategoriesArray);
        }

        // Scope 1 by gas type (if available)
        if (extractedScopeData.scope_1?.byGasType) {
          const gasData = Object.entries(extractedScopeData.scope_1.byGasType)
            .filter(([_, value]) => (value as number) > 0)
            .map(([name, emissions]) => ({
              name: name.toUpperCase(),
              value: emissions as number
            }));
          setScope1ByGas(gasData);
        }

        // Geographic breakdown (if available)
        if (scopeData.geographic) {
          setGeographicBreakdown(scopeData.geographic);
        }

        // Site comparison (from dashboard API)
        if (dashboardData.siteComparison && dashboardData.siteComparison.length > 1) {
          // Use data directly from API - it already has intensity calculated
          const siteComparisonData = dashboardData.siteComparison.map((site: any) => ({
            name: site.site || 'Unknown Site',
            emissions: site.total || site.totalEmissions || 0,
            area: site.area || 0,
            intensity: site.intensity || site.emissions || 0, // kgCO2e/m² - already calculated by API
            performance: site.performanceStatus || site.performance || 'unknown',
            employees: site.employees || 0
          })).sort((a: any, b: any) => b.intensity - a.intensity); // Sort by highest intensity first

          setSiteComparison(siteComparisonData);
        }

        // Data quality
        if (scopeData.dataQuality) {
          setDataQuality(scopeData.dataQuality);
        }

      } catch (error) {
        console.error('Error fetching emissions data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      fetchEmissionsData();
    }
  }, [organizationId, selectedSite, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="text-gray-400">Loading emissions data...</p>
        </div>
      </div>
    );
  }

  // Scope breakdown data for pie chart
  const scopeBreakdown = [
    { name: 'Scope 1', value: scope1Total, color: '#EF4444' },
    { name: 'Scope 2', value: scope2Total, color: '#3B82F6' },
    { name: 'Scope 3', value: scope3Total, color: '#6B7280' }
  ].filter(s => s.value > 0);

  const scopePercentages = {
    scope1: totalEmissions > 0 ? (scope1Total / totalEmissions) * 100 : 0,
    scope2: totalEmissions > 0 ? (scope2Total / totalEmissions) * 100 : 0,
    scope3: totalEmissions > 0 ? (scope3Total / totalEmissions) * 100 : 0
  };

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-500" />
            GHG Emissions Reporting
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            GHG Protocol • GRI 305 • ESRS E1 • TCFD • Comprehensive emissions analysis
          </p>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="p-6 grid grid-cols-4 gap-4">
        {/* Total Emissions */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Emissions</span>
            <Cloud className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalEmissions.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>
            <div className="flex items-center gap-1">
              {totalEmissionsYoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${totalEmissionsYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${totalEmissionsYoY < 0 ? 'text-green-500' : totalEmissionsYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {totalEmissionsYoY > 0 ? '+' : ''}{totalEmissionsYoY.toFixed(1)}% YoY
              </span>
            </div>
          </div>
        </div>

        {/* Emissions Intensity - Summary Card */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Intensity</span>
            <Leaf className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {intensityMetrics.perEmployee.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e/FTE</div>
            </div>
            <div className="flex items-center gap-1">
              {intensityYoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${intensityYoY < 0 ? 'text-green-500' : intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {intensityYoY > 0 ? '+' : ''}{intensityYoY.toFixed(1)}% YoY
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-400">GRI 305-4</span>
          </div>
        </div>

        {/* Scope 3 Coverage */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Scope 3 Coverage</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {scope3Coverage?.tracked || 0}/15
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">categories</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Coverage</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {scope3Coverage?.percentage?.toFixed(0) || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${scope3Coverage?.percentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Data Quality */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Data Quality</span>
            <Info className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dataQuality?.primaryDataPercentage || 85}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Primary Data</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Verified</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {dataQuality?.verifiedPercentage || 92}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${dataQuality?.verifiedPercentage || 92}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scope Breakdown & Trend */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scope Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emissions by Scope</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Protocol
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-1/2/3
              </span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                ESRS E1
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={scopeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {scopeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const scopeName = data.name;

                      if (scopeName === 'Scope 1') {
                        return (
                          <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                            <div className="font-semibold mb-1">Scope 1: Direct Emissions</div>
                            <div className="text-gray-300 mb-2">
                              Direct GHG emissions from owned/controlled sources (vehicles, facilities, equipment)
                            </div>
                            <div className="font-medium">{scope1Total.toFixed(1)} tCO2e ({scopePercentages.scope1.toFixed(0)}%)</div>
                            <div className="text-gray-400 text-[10px] mt-1">GRI 305-1 • GHG Protocol Scope 1</div>
                          </div>
                        );
                      } else if (scopeName === 'Scope 2') {
                        return (
                          <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs">
                            <div className="font-semibold mb-2">Scope 2: Energy Indirect</div>
                            <div className="space-y-1 text-gray-300 mb-2">
                              <div><span className="font-medium">Location-Based:</span> {scope2LocationBased.toFixed(1)} tCO2e</div>
                              <div><span className="font-medium">Market-Based:</span> {scope2MarketBased.toFixed(1)} tCO2e</div>
                              {renewablePercentage > 0 && (
                                <div><span className="font-medium">Renewable:</span> {renewablePercentage.toFixed(0)}%</div>
                              )}
                            </div>
                            <div className="text-gray-300 mb-2">
                              Purchased electricity, heat, steam, cooling. Dual reporting per GRI 305-2.
                            </div>
                            <div className="font-medium">{scope2Total.toFixed(1)} tCO2e ({scopePercentages.scope2.toFixed(0)}%)</div>
                          </div>
                        );
                      } else if (scopeName === 'Scope 3') {
                        return (
                          <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs">
                            <div className="font-semibold mb-2">Scope 3: Value Chain</div>
                            <div className="space-y-1 text-gray-300 mb-2">
                              <div><span className="font-medium">Total:</span> {scope3Total.toFixed(1)} tCO2e</div>
                              <div><span className="font-medium">Share:</span> {scopePercentages.scope3.toFixed(0)}%</div>
                              <div className="pt-1 border-t border-gray-700 mt-1">
                                <div className="font-medium mb-1">Coverage: {scope3Coverage?.tracked || 0}/15 categories</div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-green-400">✓ {scope3Coverage?.tracked || 0} Tracked</span>
                                  <span className="text-orange-400">⚠ {scope3Coverage?.missing || 15} Missing</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-gray-400 text-[10px]">
                              All upstream & downstream value chain emissions • GRI 305-3
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emissions Trend */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emissions Trend</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                TCFD
              </span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                ESRS E1
              </span>
            </div>
          </div>

          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  style={{ fontSize: '10px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '10px' }}
                  label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: '10px' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isForecast = data.forecast;
                      // Skip if all values are null
                      if (!data.total && !data.scope1 && !data.scope2 && !data.scope3) {
                        return null;
                      }
                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {data.month}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">(Forecast)</span>}
                          </p>
                          <div className="space-y-1">
                            {data.scope1 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-red-400 text-sm">Scope 1:</span>
                                <span className="text-white font-medium">{data.scope1.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {data.scope2 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-blue-400 text-sm">Scope 2:</span>
                                <span className="text-white font-medium">{data.scope2.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {data.scope3 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-400 text-sm">Scope 3:</span>
                                <span className="text-white font-medium">{data.scope3.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {data.total != null && (
                              <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-700">
                                <span className="text-purple-400 text-sm font-semibold">Total:</span>
                                <span className="text-white font-semibold">{data.total.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {/* Total Emissions */}
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  name="Total Emissions"
                  dot={{ r: 4, fill: "#8B5CF6" }}
                />
                {/* Scope 1 */}
                <Line
                  type="monotone"
                  dataKey="scope1"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Scope 1"
                  dot={{ r: 3, fill: "#EF4444" }}
                />
                {/* Scope 2 */}
                <Line
                  type="monotone"
                  dataKey="scope2"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Scope 2"
                  dot={{ r: 3, fill: "#3B82F6" }}
                />
                {/* Scope 3 */}
                <Line
                  type="monotone"
                  dataKey="scope3"
                  stroke="#6B7280"
                  strokeWidth={2}
                  name="Scope 3"
                  dot={{ r: 3, fill: "#6B7280" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-gray-400 text-sm">No trend data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Emissions Intensity Metrics */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emissions Intensity Metrics</h3>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                  All intensity metrics calculated according to international standards
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-4
              </span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                ESRS E1
              </span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                TCFD
              </span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                SBTi
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Per Employee */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Per Employee</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {intensityMetrics.perEmployee.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e/FTE</div>
                </div>
                <div className="flex items-center gap-1">
                  {intensityYoY < 0 ? (
                    <TrendingDown className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingUp className={`w-3 h-3 ${intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                  )}
                  <span className={`text-xs ${intensityYoY < 0 ? 'text-green-500' : intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {intensityYoY > 0 ? '+' : ''}{intensityYoY.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  GRI 305-4, TCFD
                  {intensityMetrics.sectorSpecific?.productionUnit === 'FTE' && (
                    <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs">
                      Sector
                    </span>
                  )}
                </span>
                {intensityMetrics.perEmployeeBenchmark && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    intensityMetrics.perEmployeeBenchmark === 'excellent'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : intensityMetrics.perEmployeeBenchmark === 'good'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : intensityMetrics.perEmployeeBenchmark === 'average'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    Avg: {intensityMetrics.perEmployeeBenchmarkValue?.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Per Revenue - ESRS E1 Mandatory */}
            {intensityMetrics.perRevenue > 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Revenue</span>
                  <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {intensityMetrics.perRevenue.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e/M€</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                    ESRS E1
                  </span>
                  {intensityMetrics.perRevenueBenchmark && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      intensityMetrics.perRevenueBenchmark === 'excellent'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : intensityMetrics.perRevenueBenchmark === 'good'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : intensityMetrics.perRevenueBenchmark === 'average'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      Avg: {intensityMetrics.perRevenueBenchmarkValue?.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            ) : intensityMetrics.dataQuality?.revenue?.available === false && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Revenue</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Add annual revenue in organization settings to calculate this ESRS E1 mandatory metric
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">-</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">No data</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                    ESRS E1
                  </span>
                  {intensityMetrics.perRevenueBenchmarkValue && (
                    <span className="text-xs text-gray-400">
                      Avg: {intensityMetrics.perRevenueBenchmarkValue.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Per Area */}
            {intensityMetrics.perSqm > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Area</span>
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {intensityMetrics.perSqm.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">kgCO2e/m²</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-400">GRI 305-4</span>
                  {intensityMetrics.perSqmBenchmark && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      intensityMetrics.perSqmBenchmark === 'excellent'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : intensityMetrics.perSqmBenchmark === 'good'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : intensityMetrics.perSqmBenchmark === 'average'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      Avg: {intensityMetrics.perSqmBenchmarkValue?.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Per Value Added - SBTi GEVA */}
            {intensityMetrics.perValueAdded > 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Value Added</span>
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {intensityMetrics.perValueAdded.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e/M€ VA</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                    SBTi GEVA
                  </span>
                  {intensityMetrics.perValueAddedBenchmark && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      intensityMetrics.perValueAddedBenchmark === 'excellent'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : intensityMetrics.perValueAddedBenchmark === 'good'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : intensityMetrics.perValueAddedBenchmark === 'average'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      Avg: {intensityMetrics.perValueAddedBenchmarkValue?.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            ) : intensityMetrics.dataQuality?.valueAdded?.available === false && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Value Added</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Add value added (Revenue - Purchased Goods/Services) in organization settings for SBTi GEVA economic intensity metric
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">-</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">No data</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                    SBTi GEVA
                  </span>
                  {intensityMetrics.perValueAddedBenchmarkValue && (
                    <span className="text-xs text-gray-400">
                      Avg: {intensityMetrics.perValueAddedBenchmarkValue.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Production-Based - Sector-Specific */}
            {intensityMetrics.sectorSpecific && intensityMetrics.sectorSpecific.productionUnit !== 'FTE' && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Production-Based</span>
                  <Factory className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {intensityMetrics.sectorSpecific.intensity.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{intensityMetrics.sectorSpecific.unit}</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Sector-specific
                    {intensityMetrics.sectorSpecific.sbtiPathway && (
                      <span className="ml-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                        SBTi
                      </span>
                    )}
                  </span>
                  {intensityMetrics.sectorSpecific.benchmark && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      intensityMetrics.sectorSpecific.benchmark === 'excellent'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : intensityMetrics.sectorSpecific.benchmark === 'good'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : intensityMetrics.sectorSpecific.benchmark === 'average'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      Avg: {intensityMetrics.sectorSpecific.benchmarkValue?.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Per Operating Hour */}
            {intensityMetrics.perOperatingHour > 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Operating Hour</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    {intensityMetrics.dataQuality?.operatingHours?.isEstimated && (
                      <div className="group relative">
                        <Info className="w-3 h-3 text-blue-500 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                          Calculated using 40 hours/week × 52 weeks = 2,080 hours/year per FTE
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {intensityMetrics.perOperatingHour.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">kgCO2e/h</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-400">Operational efficiency</span>
                </div>
              </div>
            ) : intensityMetrics.dataQuality?.operatingHours?.available === false && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Operating Hour</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Add operating hours or employee data to calculate
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">-</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">No data</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-400">Operational efficiency</span>
                </div>
              </div>
            )}

            {/* Per Customer */}
            {intensityMetrics.perCustomer > 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Customer</span>
                  <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {intensityMetrics.perCustomer.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">kgCO2e/customer</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-400">Service efficiency</span>
                </div>
              </div>
            ) : intensityMetrics.dataQuality?.customers?.available === false && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Customer</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Add annual customer count in organization settings
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">-</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">No data</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-400">Service efficiency</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Detailed Breakdown Sections */}
      {(siteComparison.length > 1 || topEmitters.length > 0 || scope1Sources.length > 0 || scope2Total > 0 || scope3Total > 0) && (
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Site Comparison by Emissions Intensity */}
        {siteComparison.length > 1 && (
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Site Performance Comparison</h3>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 305-4
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  Intensity per m²
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {siteComparison.map((site, index) => {
                // Determine performance color
                let performanceColor = 'text-gray-400';
                let performanceBg = 'bg-gray-100 dark:bg-gray-700';

                if (index === 0) {
                  performanceColor = 'text-red-600 dark:text-red-400';
                  performanceBg = 'bg-red-100 dark:bg-red-900/30';
                } else if (index === siteComparison.length - 1) {
                  performanceColor = 'text-green-600 dark:text-green-400';
                  performanceBg = 'bg-green-100 dark:bg-green-900/30';
                }

                // Calculate max intensity for bar width
                const maxIntensity = siteComparison[0]?.intensity || 1;
                const barWidth = (site.intensity / maxIntensity) * 100;

                return (
                  <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className={`w-4 h-4 ${performanceColor}`} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{site.name}</span>
                        {index === 0 && (
                          <span className={`px-2 py-0.5 ${performanceBg} ${performanceColor} text-xs rounded`}>
                            Highest
                          </span>
                        )}
                        {index === siteComparison.length - 1 && (
                          <span className={`px-2 py-0.5 ${performanceBg} ${performanceColor} text-xs rounded`}>
                            Best Performer
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Emissions Intensity */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Intensity</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {site.intensity.toFixed(2)} kgCO2e/m²
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              index === 0
                                ? 'bg-red-500'
                                : index === siteComparison.length - 1
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>

                      {/* Total Emissions & Area */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Total Emissions</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {site.emissions.toFixed(1)} tCO2e
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Area</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {site.area.toLocaleString()} m²
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Sites are ranked by emissions intensity (kgCO2e/m²). Lower intensity indicates better energy efficiency and emissions performance per unit area.
                </div>
              </div>
            </div>
        </div>
        )}

        {/* Top Emission Sources */}
        {topEmitters.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Emission Sources</h3>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-1/2/3
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {topEmitters.map((source, index) => {
              const sourceColor = getEmissionSourceColor(source.name, source.scope);
              const sourceName = source.name.toLowerCase();
              const categoryKey = sourceName.replace(/ /g, '_');
              let SourceIcon = Factory;

              // Determine icon based on scope and category
              if (source.scope === 'Scope 1') {
                if (sourceName.includes('stationary')) SourceIcon = Flame;
                else if (sourceName.includes('mobile')) SourceIcon = Car;
                else if (sourceName.includes('fugitive')) SourceIcon = Wind;
                else if (sourceName.includes('process')) SourceIcon = Factory;
              } else if (source.scope === 'Scope 2') {
                SourceIcon = getScope2CategoryIcon(categoryKey);
              } else if (source.scope === 'Scope 3') {
                SourceIcon = getScope3CategoryIcon(categoryKey);
              }

              return (
                <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SourceIcon className="w-4 h-4" style={{ color: sourceColor }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{source.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({source.scope})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {source.emissions.toFixed(1)} tCO2e
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {source.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${source.percentage}%`,
                        backgroundColor: sourceColor
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400" title={getActionRecommendation(source.name)}>
                    💡 {getActionRecommendation(source.name)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Scope 1 Detailed Breakdown */}
        {scope1Sources.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scope 1 Breakdown</h3>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-1
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {scope1Sources.map((source: any, index: number) => {
              const sourceName = source.name.toLowerCase();
              let sourceColor = '#6B7280';
              let SourceIcon = Factory;

              if (sourceName.includes('stationary')) {
                sourceColor = '#F97316'; // Orange
                SourceIcon = Flame;
              } else if (sourceName.includes('mobile')) {
                sourceColor = '#8B5CF6'; // Purple
                SourceIcon = Car;
              } else if (sourceName.includes('fugitive')) {
                sourceColor = '#06B6D4'; // Cyan
                SourceIcon = Wind;
              } else if (sourceName.includes('process')) {
                sourceColor = '#EF4444'; // Red
                SourceIcon = Factory;
              }

              return (
                <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SourceIcon className="w-4 h-4" style={{ color: sourceColor }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{source.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {source.emissions.toFixed(1)} tCO2e
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {scope1Total > 0 ? ((source.emissions / scope1Total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${scope1Total > 0 ? (source.emissions / scope1Total) * 100 : 0}%`,
                        backgroundColor: sourceColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Scope 2 Detailed Breakdown */}
        {scope2Total > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scope 2 Breakdown</h3>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-2
              </span>
            </div>
          </div>

          {/* Dual Reporting - Improved UI */}
          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 mb-4 relative group">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Dual Reporting Method</span>
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </div>

            {/* Tooltip */}
            <div className="absolute top-full left-0 mt-2 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-80">
              <div className="text-xs font-semibold text-white mb-3">
                GHG Protocol Dual Reporting
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-semibold text-blue-400">Location-Based Method</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Uses average emission factors for the local electricity grid. Reflects regional energy mix and grid infrastructure.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-semibold text-green-400">Market-Based Method</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Uses emission factors from contractual instruments (RECs, GOs, PPAs). Reflects your energy purchasing choices and renewable commitments.
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400 italic">
                    GRI 305-2 requires reporting both methods for complete transparency.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location-Based</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {scope2LocationBased.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Grid average
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Market-Based</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {scope2MarketBased.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  RECs & GOs
                </div>
              </div>
            </div>

            {renewablePercentage > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Renewable Energy Impact</span>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {renewablePercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {(scope2LocationBased - scope2MarketBased).toFixed(1)} tCO2e reduction
                </div>
              </div>
            )}
          </div>

          {/* Scope 2 Category List */}
          {Object.keys(scope2CategoriesData).filter(key => (scope2CategoriesData[key] as number) > 0).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(scope2CategoriesData)
                .filter(([_, emissions]) => (emissions as number) > 0)
                .map(([category, emissions], index) => {
                  const categoryColor = getScope2CategoryColor(category);
                  const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const CategoryIcon = getScope2CategoryIcon(category);

                  return (
                    <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4" style={{ color: categoryColor }} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{categoryName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {(emissions as number).toFixed(1)} tCO2e
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {scope2Total > 0 ? (((emissions as number) / scope2Total) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${scope2Total > 0 ? ((emissions as number) / scope2Total) * 100 : 0}%`,
                            backgroundColor: categoryColor
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No Scope 2 emissions data available</p>
            </div>
          )}
        </div>
        )}

        {/* Scope 3 Detailed Breakdown */}
        {scope3Total > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scope 3 Breakdown</h3>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-3
              </span>
            </div>
          </div>

          {/* Coverage Status Card - Improved */}
          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 mb-4 relative group">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Value Chain Coverage</span>
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </div>

            {/* Tooltip for Scope 3 */}
            <div className="absolute top-full left-0 mt-2 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-96">
              <div className="text-xs font-semibold text-white mb-3">
                Scope 3: Value Chain Emissions (15 Categories)
              </div>

              <p className="text-xs text-gray-300 leading-relaxed mb-3">
                Scope 3 covers all indirect emissions in your value chain, from suppliers to end-users. The GHG Protocol defines 15 categories across upstream and downstream activities.
              </p>

              <div className="space-y-2 mb-3">
                <div className="text-xs font-semibold text-gray-400">Upstream (8 categories):</div>
                <p className="text-xs text-gray-300">Purchased goods, capital goods, fuel & energy, transportation, waste, business travel, commuting, leased assets</p>

                <div className="text-xs font-semibold text-gray-400 mt-2">Downstream (7 categories):</div>
                <p className="text-xs text-gray-300">Transportation, processing, use of products, end-of-life, leased assets, franchises, investments</p>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 italic">
                  GRI 305-3 requires disclosure of significant Scope 3 categories. Aim for 80%+ coverage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {scope3Coverage?.tracked || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tracked</div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-1">
                  {scope3Coverage?.missing || 15}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Missing</div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  (scope3Coverage?.percentage || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                  (scope3Coverage?.percentage || 0) >= 40 ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {(scope3Coverage?.percentage || 0).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Coverage</div>
              </div>
            </div>

            {/* Coverage indicator with color coding */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (scope3Coverage?.percentage || 0) >= 80 ? 'bg-green-500' :
                      (scope3Coverage?.percentage || 0) >= 40 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${scope3Coverage?.percentage || 0}%` }}
                  />
                </div>
              </div>
              {scope3Coverage && scope3Coverage.percentage < 80 && (
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              )}
              {scope3Coverage && scope3Coverage.percentage >= 80 && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>

            {scope3Coverage && scope3Coverage.percentage < 80 && (
              <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                {scope3Coverage.percentage < 40 ? '⚠️ Low coverage - expand tracking to key categories' : '💡 Good progress - aim for 80% coverage'}
              </div>
            )}
          </div>

          {/* Scope 3 Categories - Full List */}
          {Object.keys(scope3CategoriesData).filter(key => (scope3CategoriesData[key] as number) > 0).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(scope3CategoriesData)
                .filter(([_, emissions]) => (emissions as number) > 0)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([category, emissions], index) => {
                  const categoryColor = getScope3CategoryColor(category);
                  const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const CategoryIcon = getScope3CategoryIcon(category);

                  return (
                    <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4" style={{ color: categoryColor }} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{categoryName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {(emissions as number).toFixed(1)} tCO2e
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {scope3Total > 0 ? (((emissions as number) / scope3Total) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${scope3Total > 0 ? ((emissions as number) / scope3Total) * 100 : 0}%`,
                            backgroundColor: categoryColor
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : null}

          {Object.keys(scope3CategoriesData).length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No Scope 3 emissions data available</p>
            </div>
          )}
        </div>
        )}
      </div>
      )}

      {/* SBTi Target Progress - Only show for current year */}
      {targetData?.targets && targetData.targets.length > 0 &&
       new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear() && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  SBTi Target Progress
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {targetData.targets[0].target_name} • {targetData.targets[0].baseline_year} → {targetData.targets[0].target_year}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-wrap justify-end">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                    SBTi
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                    GRI 305-5
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                    TCFD
                  </span>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                    ESRS E1
                  </span>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  {targetData.targets[0].target_reduction_percent.toFixed(1)}% Reduction Target
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {/* Baseline */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Baseline ({targetData.targets[0].baseline_year})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {targetData.targets[0].baseline_emissions?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
              </div>

              {/* Current */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-orange-200/50 dark:border-orange-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Current ({new Date().getFullYear()})
                    {targetData.targets[0].is_forecast && (
                      <span className="ml-1 text-purple-500">*</span>
                    )}
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {projectedAnnualEmissions > 0 && forecastedEmissions > 0 ? (
                    <span className="text-sm">
                      {actualEmissionsYTD.toFixed(1)} + {forecastedEmissions.toFixed(1)}
                    </span>
                  ) : (
                    <span>{(targetData.targets[0].current_emissions || totalEmissions)?.toFixed(1)}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {projectedAnnualEmissions > 0 ? (
                    <span className="text-purple-500">Actual + ML Forecast</span>
                  ) : (
                    <span>tCO2e</span>
                  )}
                </div>
              </div>

              {/* Required (Current Year Target) */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Required ({new Date().getFullYear()})
                  </span>
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {(() => {
                    const baseline = targetData.targets[0].baseline_emissions || 0;
                    const target = targetData.targets[0].target_emissions || 0;
                    const baselineYear = targetData.targets[0].baseline_year;
                    const targetYear = targetData.targets[0].target_year;
                    const currentYear = new Date().getFullYear();

                    const yearsElapsed = currentYear - baselineYear;
                    const totalYears = targetYear - baselineYear;
                    const totalReduction = baseline - target;
                    const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
                    const requiredEmissions = baseline - requiredReduction;

                    return requiredEmissions.toFixed(1);
                  })()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e on track</div>
              </div>

              {/* Target */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Target ({targetData.targets[0].target_year})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {targetData.targets[0].target_emissions?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
              </div>

              {/* Progress */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                </div>
                <div className="text-xl font-bold">
                  {(() => {
                    const baseline = targetData.targets[0].baseline_emissions || 0;
                    // Use ML-forecasted annual projection
                    const current = projectedAnnualEmissions || targetData.targets[0].current_emissions || totalEmissions;
                    const target = targetData.targets[0].target_emissions || 0;

                    // Check if emissions increased or decreased
                    if (current > baseline) {
                      // Emissions INCREASED - show as % above baseline
                      const increasePercent = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
                      return (
                        <span className="text-red-600 dark:text-red-400">
                          ↑ {increasePercent.toFixed(1)}%
                        </span>
                      );
                    } else {
                      // Emissions DECREASED - show progress toward target
                      const progress = baseline > 0 ? ((baseline - current) / (baseline - target)) * 100 : 0;
                      const progressColor = progress >= 95 ? 'text-green-600 dark:text-green-400' :
                                          progress >= 85 ? 'text-yellow-600 dark:text-yellow-400' :
                                          'text-orange-600 dark:text-orange-400';
                      return (
                        <span className={progressColor}>
                          {progress.toFixed(1)}%
                        </span>
                      );
                    }
                  })()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    const baseline = targetData.targets[0].baseline_emissions || 0;
                    const baselineYear = targetData.targets[0].baseline_year;
                    // Use ML-forecasted annual projection
                    const current = projectedAnnualEmissions || targetData.targets[0].current_emissions || totalEmissions;
                    const currentYear = new Date().getFullYear();
                    const yearsElapsed = currentYear - baselineYear;
                    const annualRate = targetData.targets[0].annual_reduction_rate || 4.2;
                    const requiredReduction = annualRate * yearsElapsed;

                    if (current > baseline) {
                      return 'Above Baseline';
                    } else {
                      const actualReduction = baseline > 0 ? ((baseline - current) / baseline) * 100 : 0;
                      const status = actualReduction >= requiredReduction ? 'On Track' : 'At Risk';
                      return status;
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Waterfall Chart */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Emissions Trajectory</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={(() => {
                    const baseline = targetData.targets[0].baseline_emissions || 0;
                    // Use ML-forecasted annual projection instead of simple extrapolation
                    const current = projectedAnnualEmissions || targetData.targets[0].current_emissions || totalEmissions;
                    const target = targetData.targets[0].target_emissions || 0;
                    const baselineYear = targetData.targets[0].baseline_year;
                    const currentYear = new Date().getFullYear();
                    const targetYear = targetData.targets[0].target_year;

                    // Calculate the change from baseline to current
                    const changeFromBaseline = current - baseline;

                    // Calculate required emissions for current year (linear trajectory)
                    const yearsElapsed = currentYear - baselineYear;
                    const totalYears = targetYear - baselineYear;
                    const totalReduction = baseline - target;
                    const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
                    const requiredEmissions = baseline - requiredReduction;
                    const gapFromRequired = current - requiredEmissions;

                    // Waterfall data with invisible base bars and visible change bars
                    return [
                      {
                        name: `${baselineYear}\nBaseline`,
                        base: 0,
                        value: baseline,
                        total: baseline,
                        label: baseline.toFixed(1)
                      },
                      {
                        name: `Required\nReduction`,
                        base: requiredEmissions, // Position at the bottom (where we should end up)
                        value: requiredReduction, // Height of the reduction bar
                        total: baseline, // Connects to baseline
                        label: `-${requiredReduction.toFixed(1)}`,
                        isRequiredReduction: true
                      },
                      {
                        name: `${currentYear}\nRequired`,
                        base: 0,
                        value: requiredEmissions,
                        total: requiredEmissions,
                        label: requiredEmissions.toFixed(1),
                        isRequired: true
                      },
                      {
                        name: 'Gap from\nRequired',
                        base: requiredEmissions,
                        value: gapFromRequired,
                        total: current,
                        label: `+${gapFromRequired.toFixed(1)}`,
                        isGap: true
                      },
                      {
                        name: `${currentYear}\nActual`,
                        base: 0,
                        value: current,
                        total: current,
                        label: current.toFixed(1),
                        isCurrent: true
                      },
                      {
                        name: `${targetYear}\nTarget`,
                        base: 0,
                        value: target,
                        total: target,
                        label: target.toFixed(1),
                        isTarget: true
                      }
                    ];
                  })()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={11}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={11}
                    tick={{ fill: '#6b7280' }}
                    label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const value = Math.abs(data.value || 0);
                        const total = data.total || 0;

                        return (
                          <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                            <p className="text-white font-semibold mb-2">
                              {data.name.replace('\n', ' ')}
                            </p>
                            <div className="space-y-1 text-xs">
                              {data.label && data.label.includes('-') ? (
                                <p className="text-green-400">
                                  Reduction: <span className="font-medium">{value.toFixed(1)} tCO2e</span>
                                </p>
                              ) : data.label && data.label.includes('+') ? (
                                <p className="text-red-400">
                                  Increase: <span className="font-medium">{value.toFixed(1)} tCO2e</span>
                                </p>
                              ) : (
                                <p className="text-gray-300">
                                  Total: <span className="font-medium text-white">{total.toFixed(1)} tCO2e</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Invisible base bars to create waterfall effect */}
                  <Bar dataKey="base" stackId="a" fill="transparent" />
                  {/* Visible value bars */}
                  <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                    {(() => {
                      const baseline = targetData.targets[0].baseline_emissions || 0;
                      const current = targetData.targets[0].current_emissions || totalEmissions;
                      const target = targetData.targets[0].target_emissions || 0;

                      const yearsElapsed = new Date().getFullYear() - targetData.targets[0].baseline_year;
                      const totalYears = targetData.targets[0].target_year - targetData.targets[0].baseline_year;
                      const totalReduction = baseline - target;
                      const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
                      const requiredEmissions = baseline - requiredReduction;

                      const colors = [
                        '#6b7280', // baseline - gray
                        '#10b981', // required reduction - green (downward)
                        '#3b82f6', // required target - blue
                        '#ef4444', // gap from required - red (upward, showing we're off track)
                        '#f97316', // current actual - orange
                        '#10b981' // final target - green
                      ];

                      return colors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ));
                    })()}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
