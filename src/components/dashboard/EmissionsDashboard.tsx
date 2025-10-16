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
  Battery,
  ChevronDown,
  ChevronRight,
  Plus,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  BarChart3
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
import { RecommendationsModal } from '@/components/sustainability/RecommendationsModal';
import { useTranslations, useLanguage } from '@/providers/LanguageProvider';
import { getCarbonEquivalent } from '@/lib/education/carbon-equivalents';
import { useEmissionsDashboard } from '@/hooks/useDashboardData';

interface EmissionsDashboardProps {
  organizationId: string;
  selectedSite: Building | null;
  selectedPeriod: TimePeriod;
}

// Helper function to get action recommendation key for emission sources
const getActionRecommendationKey = (categoryName: string): string => {
  const nameLower = categoryName.toLowerCase();

  if (nameLower.includes('electricity') || nameLower.includes('grid')) {
    return 'electricity';
  }
  if (nameLower.includes('natural gas') || nameLower.includes('gas') || nameLower.includes('stationary')) {
    return 'naturalGas';
  }
  if (nameLower.includes('business travel') || nameLower.includes('travel')) {
    return 'businessTravel';
  }
  if (nameLower.includes('fleet') || nameLower.includes('vehicle') || nameLower.includes('mobile')) {
    return 'fleet';
  }
  if (nameLower.includes('commut')) {
    return 'commuting';
  }
  if (nameLower.includes('fugitive')) {
    return 'fugitive';
  }
  if (nameLower.includes('waste')) {
    return 'waste';
  }
  if (nameLower.includes('purchase') || nameLower.includes('supply')) {
    return 'purchasedGoods';
  }

  return 'default';
};

// Helper function to get scope translation key
const getScopeKey = (scope: string): string => {
  if (!scope) return '';
  const scopeNum = scope.replace(/[^0-9]/g, '');
  if (scopeNum === '1') return 'scope1';
  if (scopeNum === '2') return 'scope2';
  if (scopeNum === '3') return 'scope3';
  return scope;
};

// Helper function to get category name translation key
const getCategoryNameKey = (categoryName: string): string | null => {
  const nameLower = categoryName.toLowerCase();

  if (nameLower.includes('business travel') || nameLower === 'business travel') return 'businessTravel';
  if (nameLower.includes('purchased electricity') || nameLower === 'purchased electricity') return 'purchasedElectricity';
  if (nameLower === 'electricity') return 'electricity';
  if (nameLower === 'waste') return 'waste';
  if (nameLower.includes('purchased goods') || nameLower === 'purchased goods') return 'purchasedGoods';
  if (nameLower.includes('natural gas') || nameLower === 'natural gas') return 'naturalGas';
  if (nameLower.includes('stationary combustion')) return 'stationaryCombustion';
  if (nameLower.includes('mobile combustion')) return 'mobileCombustion';
  if (nameLower.includes('fleet')) return 'fleet';
  if (nameLower.includes('commuting')) return 'commuting';
  if (nameLower.includes('fugitive')) return 'fugitiveEmissions';

  return null; // Return null if no match, will use original name
};

// Helper function to add target reduction path to monthly trends
const addTargetPath = (trends: any[], targetsResult: any, replanningTrajectory?: any): any[] => {
  if (!trends || trends.length === 0) return trends;
  if (!targetsResult || !targetsResult.targets || targetsResult.targets.length === 0) return trends;

  // Find first target with valid baseline and target data (regardless of status)
  const target = targetsResult.targets.find((t: any) =>
    (t.baseline_emissions || 0) > 0 &&
    (t.target_year || 0) > (t.baseline_year || 0)
  );

  if (!target) return trends;

  const baselineEmissions = target.baseline_emissions || 0;
  const targetEmissions = target.target_emissions || 0;
  const baselineYear = target.baseline_year || 2023;
  const targetYear = target.target_year || 2030;

  if (baselineEmissions === 0 || targetYear <= baselineYear) return trends;

  // Map month names to numbers
  const monthMap: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  // If replanning trajectory exists, create a lookup map
  const replanningMap = new Map<string, number>();
  if (replanningTrajectory && replanningTrajectory.trajectory) {
    replanningTrajectory.trajectory.forEach((point: any) => {
      const key = `${point.year}-${point.month}`;
      replanningMap.set(key, point.plannedEmissions);
    });
  }

  // Calculate linear reduction per month (fallback if no replanning)
  const totalReduction = baselineEmissions - targetEmissions;
  const yearsToTarget = targetYear - baselineYear;

  return trends.map((dataPoint: any) => {
    // Extract year and month from month string (e.g., "Jan 2025" or "Jan 25")
    const monthStr = dataPoint.month || '';

    // Extract month name
    const monthNameMatch = monthStr.match(/^([A-Za-z]{3})/);
    if (!monthNameMatch) return dataPoint;

    const monthName = monthNameMatch[1];
    const monthIndex = monthMap[monthName];
    if (monthIndex === undefined) return dataPoint;

    // Try to match 4-digit year first, then 2-digit year
    let yearMatch = monthStr.match(/\d{4}/);
    let pointYear = 0;

    if (yearMatch) {
      pointYear = parseInt(yearMatch[0]);
    } else {
      // Try 2-digit year (e.g., "25" from "Jan 25")
      yearMatch = monthStr.match(/\b(\d{2})\b/);
      if (yearMatch) {
        const twoDigitYear = parseInt(yearMatch[1]);
        // Convert 2-digit year to 4-digit (assuming 20xx for years 00-99)
        pointYear = twoDigitYear < 50 ? 2000 + twoDigitYear : 1900 + twoDigitYear;
      }
    }

    if (pointYear > 0) {
      // Check if we have replanned data for this month
      const replanningKey = `${pointYear}-${monthIndex + 1}`;
      if (replanningMap.has(replanningKey)) {
        const plannedEmissions = replanningMap.get(replanningKey)!;
        return {
          ...dataPoint,
          targetPath: plannedEmissions,
          isReplanned: true
        };
      }

      // Fallback to linear calculation if no replanning data
      // Annual target to distribute monthly
      const annualTargetForYear = baselineEmissions - ((totalReduction / yearsToTarget) * (pointYear - baselineYear));
      const monthlyTarget = annualTargetForYear / 12;

      return {
        ...dataPoint,
        targetPath: Math.max(monthlyTarget, targetEmissions / 12),
        isReplanned: false
      };
    }
    return dataPoint;
  });
};

// Function to get category-specific colors (replicated from OverviewDashboard)
const getCategoryColor = (name: string): string => {
  const nameLower = name.toLowerCase();

  // Electricity - Blue
  if (nameLower.includes('electricity') || nameLower.includes('grid')) {
    return '#3B82F6'; // Blue
  }

  // Natural Gas / Heating - Orange
  if (nameLower.includes('gas') || nameLower.includes('heating')) {
    return '#F97316'; // Orange
  }

  // Transportation / Vehicles - Purple
  if (nameLower.includes('transport') || nameLower.includes('vehicle') || nameLower.includes('fleet')) {
    return '#8B5CF6'; // Purple
  }

  // Waste - Brown
  if (nameLower.includes('waste')) {
    return '#92400E'; // Brown
  }

  // Business Travel - Indigo
  if (nameLower.includes('travel') || nameLower.includes('flight')) {
    return '#4F46E5'; // Indigo
  }

  // Cooling / Refrigerants - Cyan
  if (nameLower.includes('cooling') || nameLower.includes('refrigerant') || nameLower.includes('hvac')) {
    return '#06B6D4'; // Cyan
  }

  // Fuel - Red
  if (nameLower.includes('fuel') || nameLower.includes('diesel') || nameLower.includes('petrol')) {
    return '#EF4444'; // Red
  }

  // Water - Teal
  if (nameLower.includes('water')) {
    return '#14B8A6'; // Teal
  }

  // Default - Gray
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
  const t = useTranslations('sustainability.ghgEmissions');
  const { t: tGlobal } = useLanguage();

  // Fetch data with React Query (cached, parallel)
  const {
    scopeAnalysis,
    dashboard,
    targets,
    trajectory,
    feasibility,
    metricTargets: metricTargetsQuery,
    prevYearScopeAnalysis,
    fullPrevYearScopeAnalysis,
    isLoading
  } = useEmissionsDashboard(selectedPeriod, selectedSite, organizationId);

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
  const [scope2Metrics, setScope2Metrics] = useState<any[]>([]); // Individual metrics for Scope 2

  // Scope 3 coverage
  const [scope3Coverage, setScope3Coverage] = useState<any>(null);
  const [scope3CategoriesData, setScope3CategoriesData] = useState<any>({});

  // Trends
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [prevYearMonthlyTrends, setPrevYearMonthlyTrends] = useState<any[]>([]);
  const [replanningTrajectory, setReplanningTrajectory] = useState<any>(null);
  // feasibility now comes from React Query hook (line 396)

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
  const [previousYearTotalEmissions, setPreviousYearTotalEmissions] = useState<number>(0);

  // Metric-level targets for expandable view
  const [metricTargets, setMetricTargets] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedMetricForInitiative, setSelectedMetricForInitiative] = useState<string | null>(null);

  // Processing useEffect - runs when cached data changes
  useEffect(() => {
    // Wait for all required data to be available
    if (!scopeAnalysis.data || !dashboard.data) return;

    const processEmissionsData = async () => {
      try {
        const scopeData = scopeAnalysis.data;
        const dashboardData = dashboard.data;
        const prevScopeData = prevYearScopeAnalysis.data;
        const fullPrevYearData = fullPrevYearScopeAnalysis.data;

        // Set target data from query
        if (targets.data) {
          setTargetData(targets.data);
        }

        // Set replanning trajectory from query
        if (trajectory.data) {
          setReplanningTrajectory(trajectory.data);
        } else {
          setReplanningTrajectory(null);
        }

        // feasibility.data is directly available from the hook

        // Set metric targets from query
        if (metricTargetsQuery.data) {
          setMetricTargets(metricTargetsQuery.data);
        }


        // Extract scope totals
        const extractedScopeData = scopeData.scopeData || scopeData;
        const prevExtractedScopeData = prevScopeData ? (prevScopeData.scopeData || prevScopeData) : {};
        const fullPrevYearExtractedScopeData = fullPrevYearData ? (fullPrevYearData.scopeData || fullPrevYearData) : {};

        const s1Current = extractedScopeData.scope_1?.total || 0;
        const s2Current = extractedScopeData.scope_2?.total || 0;
        const s3Current = extractedScopeData.scope_3?.total || 0;

        const s1Previous = prevExtractedScopeData.scope_1?.total || 0;
        const s2Previous = prevExtractedScopeData.scope_2?.total || 0;
        const s3Previous = prevExtractedScopeData.scope_3?.total || 0;

        const s1FullPrevYear = fullPrevYearExtractedScopeData.scope_1?.total || 0;
        const s2FullPrevYear = fullPrevYearExtractedScopeData.scope_2?.total || 0;
        const s3FullPrevYear = fullPrevYearExtractedScopeData.scope_3?.total || 0;

        const currentTotal = s1Current + s2Current + s3Current;
        const previousTotal = s1Previous + s2Previous + s3Previous;
        const fullPreviousYearTotal = s1FullPrevYear + s2FullPrevYear + s3FullPrevYear;

        setScope1Total(s1Current);
        setScope2Total(s2Current);
        setScope3Total(s3Current);
        setTotalEmissions(currentTotal);
        setPreviousYearTotalEmissions(fullPreviousYearTotal);

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
          console.log('🔍 Scope 2 Categories from API:', extractedScopeData.scope_2.categories);
          console.log('🔍 Full Scope 2 data:', extractedScopeData.scope_2);
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


          // Fetch enterprise forecast for remaining months (same approach as Overview)
          const forecastParams = new URLSearchParams({
            start_date: selectedPeriod.start,
            end_date: selectedPeriod.end,
          });
          if (selectedSite) {
            forecastParams.append('site_id', selectedSite.id);
          }
          const forecastRes = await fetch(`/api/sustainability/forecast?${forecastParams}`);
          if (forecastRes.ok) {
            const forecastData = await forecastRes.json();

            if (forecastData.forecast && forecastData.forecast.length > 0) {

              // Add forecast months to trends with separate keys
              const forecastMonths = forecastData.forecast.map((f: any) => ({
                month: f.month,
                totalForecast: f.total || 0,
                scope1Forecast: f.scope1 || 0,
                scope2Forecast: f.scope2 || 0,
                scope3Forecast: f.scope3 || 0,
                forecast: true
              }));

              // Calculate total projected emissions for the year (actual + forecast)
              const actualEmissions = trends.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
              const forecastedEmissionsTotal = forecastMonths.reduce((sum: number, f: any) => sum + f.totalForecast, 0);
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

              // Add forecast keys to the last actual data point to create smooth transition
              const lastActual = trends[trends.length - 1];
              const modifiedTrends = [...trends];
              modifiedTrends[modifiedTrends.length - 1] = {
                ...lastActual,
                // Add forecast data keys with same values to create transition point
                totalForecast: lastActual.total,
                scope1Forecast: lastActual.scope1,
                scope2Forecast: lastActual.scope2,
                scope3Forecast: lastActual.scope3
              };


              // Add target reduction path to each data point
              const combinedTrends = [...modifiedTrends, ...forecastMonths];
              const trendsWithTarget = addTargetPath(combinedTrends, targetData, replanningTrajectory);
              setMonthlyTrends(trendsWithTarget);
            } else {
              const trendsWithTarget = addTargetPath(trends, targetData, replanningTrajectory);
              setMonthlyTrends(trendsWithTarget);
            }
          } else {
            console.warn('⚠️ Forecast API not available, showing actual data only');
            const trendsWithTarget = addTargetPath(trends, targetData, replanningTrajectory);
            setMonthlyTrends(trendsWithTarget);
          }
        } else if (dashboardData.trends) {
          const trendsWithTarget = addTargetPath(dashboardData.trends, targetData, replanningTrajectory);
          setMonthlyTrends(trendsWithTarget);
        }

        // Fetch previous year data for YoY comparison (monthly trends)
        // Find the last actual data point from the monthly trends we just fetched
        let actualEndDate = new Date(selectedPeriod.end);

        if (dashboardData.trendData && dashboardData.trendData.length > 0) {
          // Get the last month with data
          const lastDataPoint = dashboardData.trendData[dashboardData.trendData.length - 1];
          const lastDataMonth = lastDataPoint.month; // Format: "Jan" or similar

          // Find the month index and create proper end date
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const monthIndex = monthNames.indexOf(lastDataMonth);
          if (monthIndex !== -1) {
            const currentYear = new Date(selectedPeriod.start).getFullYear();
            actualEndDate = new Date(currentYear, monthIndex + 1, 0); // Last day of the month
          }
        }

        const startDate = new Date(selectedPeriod.start);
        const previousYearStart = new Date(startDate);
        previousYearStart.setFullYear(startDate.getFullYear() - 1);
        const previousYearEnd = new Date(actualEndDate);
        previousYearEnd.setFullYear(actualEndDate.getFullYear() - 1);

        const prevYearParams = new URLSearchParams({
          start_date: previousYearStart.toISOString().split('T')[0],
          end_date: previousYearEnd.toISOString().split('T')[0],
        });

        if (selectedSite) {
          prevYearParams.append('site_id', selectedSite.id);
        }

        try {

          const prevYearUrl = `/api/sustainability/dashboard?${prevYearParams}`;
          const prevDashboardRes = await fetch(prevYearUrl);
          const prevDashboardData = await prevDashboardRes.json();


          // Extract monthly trends from previous year dashboard data
          if (prevDashboardData.trendData && prevDashboardData.trendData.length > 0) {
            const prevTrends = prevDashboardData.trendData.map((m: any) => ({
              month: m.month,
              total: m.emissions || 0,
              scope1: m.scope1 || 0,
              scope2: m.scope2 || 0,
              scope3: m.scope3 || 0,
              monthKey: m.monthKey || undefined // Try to preserve monthKey if available
            }));

            setPrevYearMonthlyTrends(prevTrends);
          } else {
            console.warn('⚠️ No previous year trend data available');
            setPrevYearMonthlyTrends([]);
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch previous year data for YoY comparison:', error);
          setPrevYearMonthlyTrends([]);
        }

        // Fetch Top Emitters at METRIC level (not category level)
        // This shows individual metrics like "Grid Electricity", "EV Chargers", "District Heating"
        // instead of aggregated categories like "Purchased Electricity"
        const topMetricsParams = new URLSearchParams({
          start_date: selectedPeriod.start,
          end_date: selectedPeriod.end,
        });
        if (selectedSite) {
          topMetricsParams.append('site_id', selectedSite.id);
        }

        try {
          const topMetricsResponse = await fetch(`/api/sustainability/top-metrics?${topMetricsParams}`);
          const topMetricsData = await topMetricsResponse.json();

          if (topMetricsData.metrics && topMetricsData.metrics.length > 0) {
            // Map the metric-level data to the format expected by the UI
            const topFive = topMetricsData.metrics.slice(0, 5).map((metric: any) => ({
              name: metric.name,
              emissions: metric.emissions,
              percentage: currentTotal > 0 ? (metric.emissions / currentTotal) * 100 : 0,
              scope: metric.scope === 'scope_1' ? 'Scope 1' : metric.scope === 'scope_2' ? 'Scope 2' : 'Scope 3'
            }));

            setTopEmitters(topFive);
          } else {
            setTopEmitters([]);
          }
        } catch (error) {
          console.error('❌ [Top Emitters] Error fetching top metrics:', error);
          setTopEmitters([]);
        }

        // Fetch Scope 2 individual metrics (using s2Current for accurate percentages)
        try {
          const scope2MetricsParams = new URLSearchParams({
            start_date: selectedPeriod.start,
            end_date: selectedPeriod.end,
            limit: '50' // Get up to 50 metrics to ensure we capture all Scope 2 sources
          });
          if (selectedSite) {
            scope2MetricsParams.append('site_id', selectedSite.id);
          }

          const scope2MetricsResponse = await fetch(`/api/sustainability/top-metrics?${scope2MetricsParams}`);
          const scope2MetricsData = await scope2MetricsResponse.json();

          if (scope2MetricsData.metrics && scope2MetricsData.metrics.length > 0) {
            // Filter for only Scope 2 metrics and calculate percentages using s2Current
            const scope2Only = scope2MetricsData.metrics
              .filter((metric: any) => metric.scope === 'scope_2')
              .map((metric: any) => ({
                name: metric.name,
                emissions: metric.emissions,
                percentage: s2Current > 0 ? (metric.emissions / s2Current) * 100 : 0
              }));

            setScope2Metrics(scope2Only);
          } else {
            setScope2Metrics([]);
          }
        } catch (error) {
          console.error('❌ [Scope 2 Metrics] Error fetching scope 2 metrics:', error);
          setScope2Metrics([]);
        }

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
        console.error('Error processing emissions data:', error);
      }
    };

    processEmissionsData();
  }, [
    scopeAnalysis.data,
    dashboard.data,
    prevYearScopeAnalysis.data,
    fullPrevYearScopeAnalysis.data,
    targets.data,
    trajectory.data,
    feasibility.data,
    metricTargetsQuery.data,
    selectedPeriod,
    selectedSite,
    organizationId
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Scope breakdown data for pie chart
  const scopeBreakdown = [
    { name: t('scopes.scope1'), value: scope1Total, color: '#F97316' },
    { name: t('scopes.scope2'), value: scope2Total, color: '#3B82F6' },
    { name: t('scopes.scope3'), value: scope3Total, color: '#6B7280' }
  ].filter(s => s.value > 0);

  const scopePercentages = {
    scope1: totalEmissions > 0 ? (scope1Total / totalEmissions) * 100 : 0,
    scope2: totalEmissions > 0 ? (scope2Total / totalEmissions) * 100 : 0,
    scope3: totalEmissions > 0 ? (scope3Total / totalEmissions) * 100 : 0
  };

  return (
    <>
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Total Emissions */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 relative shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.totalEmissions.title')}</span>
          </div>
          <div>
            <div className="relative group inline-block">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1 cursor-help">
                {totalEmissions.toFixed(1)}
              </div>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                  {t('explanations.totalEmissions')}
                </p>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.totalEmissions.unit')}</div>
              <div className="flex items-center gap-1">
                {totalEmissionsYoY < 0 ? (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingUp className={`w-3 h-3 ${totalEmissionsYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                )}
                <span className={`text-xs ${totalEmissionsYoY < 0 ? 'text-green-500' : totalEmissionsYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {totalEmissionsYoY > 0 ? '+' : ''}{totalEmissionsYoY.toFixed(1)}% {t('cards.totalEmissions.yoy')}
                </span>
              </div>
            </div>
            {projectedAnnualEmissions > 0 &&
             forecastedEmissions > 0 &&
             new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear() && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-purple-500 dark:text-purple-400">
                  {t('cards.totalEmissions.projected')}: {projectedAnnualEmissions.toFixed(1)} {t('cards.totalEmissions.unit')}
                </span>
                {(() => {
                  // Calculate YoY for projected emissions: compare projected annual vs previous year's total
                  const projectedYoY = previousYearTotalEmissions > 0
                    ? ((projectedAnnualEmissions - previousYearTotalEmissions) / previousYearTotalEmissions) * 100
                    : 0;

                  return (
                    <div className="flex items-center gap-1">
                      {projectedYoY < 0 ? (
                        <TrendingDown className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingUp className={`w-3 h-3 ${projectedYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                      )}
                      <span className={`text-xs ${projectedYoY < 0 ? 'text-green-500' : projectedYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {projectedYoY > 0 ? '+' : ''}{projectedYoY.toFixed(1)}% YoY
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Emissions Intensity - Summary Card */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 relative shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.intensity.title')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="relative group">
              <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                {intensityMetrics.perEmployee.toFixed(2)}
              </div>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                  {t('explanations.intensity')}
                </p>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.intensity.unit')}</div>
            </div>
            <div className="flex items-center gap-1">
              {intensityYoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${intensityYoY < 0 ? 'text-green-500' : intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {intensityYoY > 0 ? '+' : ''}{intensityYoY.toFixed(1)}% {t('cards.intensity.yoy')}
              </span>
            </div>
          </div>
        </div>

        {/* Scope 3 Coverage */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 relative shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.scope3Coverage.title')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="relative group">
              <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                {scope3Coverage?.tracked || 0}/15
              </div>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                  {t('explanations.scope3Coverage')}
                </p>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.scope3Coverage.categories')}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">{t('cards.scope3Coverage.coverage')}</span>
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
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 relative shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.dataQuality.title')}</span>
          </div>
          {dataQuality ? (
            <>
              <div className="flex items-end justify-between">
                <div className="relative group">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                    {dataQuality.primaryDataPercentage}%
                  </div>
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      {t('explanations.dataQuality')}
                    </p>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.dataQuality.primaryData')}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">{t('cards.dataQuality.verified')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {dataQuality.verifiedPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${dataQuality.verifiedPercentage}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-20">
              <span className="text-sm text-gray-400 dark:text-gray-500">{t('common.noData')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Scope Breakdown & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Scope Breakdown */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 h-[420px] shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-500" />
              <div className="relative group inline-block">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('scopeBreakdown.title')}</h3>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('explanations.scopeBreakdown')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-400/30">
                      GHG Protocol
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 305-1/2/3
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                      ESRS E1
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <Pie
                  data={scopeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={130}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent, value }) => `${name}: ${value.toFixed(1)} tCO2e (${(percent * 100).toFixed(0)}%)`}
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
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 h-[420px] shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-purple-500" />
              <div className="relative group inline-block">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('emissionsTrend.title')}</h3>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('explanations.emissionsTrend')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-400/30">
                      TCFD
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                      ESRS E1
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
            </div>
            {feasibility.data && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                feasibility.data.status === 'on-track' ? 'bg-green-500/10 text-green-400' :
                feasibility.data.status === 'challenging' ? 'bg-yellow-500/10 text-yellow-400' :
                feasibility.data.status === 'at-risk' ? 'bg-orange-500/10 text-orange-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                <span className="text-sm font-medium">
                  {feasibility.data.status === 'on-track' ? '✓' :
                   feasibility.data.status === 'challenging' ? '⚡' :
                   feasibility.data.status === 'at-risk' ? '⚠' : '✗'}
                </span>
                <span className="text-xs font-semibold">
                  {feasibility.data.status === 'on-track' ? 'On Track' :
                   feasibility.data.status === 'challenging' ? 'Challenging' :
                   feasibility.data.status === 'at-risk' ? 'At Risk' : t('emissionsTrend.targetMissed')}
                </span>
                {feasibility.data.reductionRequiredPercent > 0 && feasibility.data.isAchievable && (
                  <span className="text-xs opacity-75">
                    ({feasibility.data.reductionRequiredPercent.toFixed(0)}% ↓)
                  </span>
                )}
              </div>
            )}
          </div>

          {monthlyTrends.length > 0 ? (
            <>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={true} horizontal={true} />
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

                      // Get values from either actual or forecast keys
                      const scope1 = data.scope1 ?? data.scope1Forecast;
                      const scope2 = data.scope2 ?? data.scope2Forecast;
                      const scope3 = data.scope3 ?? data.scope3Forecast;
                      const total = data.total ?? data.totalForecast;

                      // Skip if all values are null
                      if (!total && !scope1 && !scope2 && !scope3) {
                        return null;
                      }
                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {data.month}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">(Forecast)</span>}
                          </p>
                          <div className="space-y-1">
                            {scope1 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-orange-400 text-sm">Scope 1:</span>
                                <span className="text-white font-medium">{scope1.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {scope2 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-blue-400 text-sm">Scope 2:</span>
                                <span className="text-white font-medium">{scope2.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {scope3 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-400 text-sm">Scope 3:</span>
                                <span className="text-white font-medium">{scope3.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {total != null && (
                              <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-700">
                                <span className="text-purple-400 text-sm font-semibold">Total:</span>
                                <span className="text-white font-semibold">{total.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {data.targetPath != null && (
                              <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-700">
                                <span className={`${data.isReplanned ? 'text-amber-400' : 'text-green-400'} text-sm font-semibold flex items-center gap-1`}>
                                  {data.isReplanned ? '🎯 Replanned Target:' : 'Target Path:'}
                                </span>
                                <span className={`${data.isReplanned ? 'text-amber-400' : 'text-green-400'} font-semibold`}>
                                  {data.targetPath.toFixed(1)} tCO2e
                                </span>
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
                {/* Actual data - solid lines */}
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  name={t('emissionsTrend.legends.totalEmissions')}
                  dot={{ r: 4, fill: "#8B5CF6" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scope1"
                  stroke="#F97316"
                  strokeWidth={2}
                  name={t('emissionsTrend.legends.scope1')}
                  dot={{ r: 3, fill: "#F97316" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scope2"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name={t('emissionsTrend.legends.scope2')}
                  dot={{ r: 3, fill: "#3B82F6" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scope3"
                  stroke="#6B7280"
                  strokeWidth={2}
                  name={t('emissionsTrend.legends.scope3')}
                  dot={{ r: 3, fill: "#6B7280" }}
                  connectNulls
                />
                {/* Forecast data - dashed lines (hidden from legend) */}
                <Line
                  type="monotone"
                  dataKey="totalForecast"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  name={t('emissionsTrend.legends.totalEmissions')}
                  dot={{ fill: 'transparent', stroke: "#8B5CF6", strokeWidth: 2, r: 4 }}
                  connectNulls
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="scope1Forecast"
                  stroke="#F97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={t('emissionsTrend.legends.scope1')}
                  dot={{ fill: 'transparent', stroke: "#F97316", strokeWidth: 2, r: 3 }}
                  connectNulls
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="scope2Forecast"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Scope 2"
                  dot={{ fill: 'transparent', stroke: "#3B82F6", strokeWidth: 2, r: 3 }}
                  connectNulls
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="scope3Forecast"
                  stroke="#6B7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Scope 3"
                  dot={{ fill: 'transparent', stroke: "#6B7280", strokeWidth: 2, r: 3 }}
                  connectNulls
                  legendType="none"
                />
                {/* Target reduction path line - color changes based on replanning status */}
                <Line
                  type="monotone"
                  dataKey="targetPath"
                  stroke={replanningTrajectory ? "#F59E0B" : "#10B981"}
                  strokeWidth={replanningTrajectory ? 2.5 : 2}
                  strokeDasharray={replanningTrajectory ? "6 3" : "8 4"}
                  name={replanningTrajectory ? "Replanned Target" : "Target Path"}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
            </>
          ) : (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-gray-400 text-sm">{t('emissionsTrend.noData')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Emissions Intensity Metrics */}
      <div className="mb-6">
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <div className="relative group inline-block">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('intensityMetrics.title')}</h3>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('intensityMetrics.tooltip')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-400/30">
                      GRI 305-4
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                      ESRS E1
                    </span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-400/30">
                      TCFD
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      SBTi
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Per Employee */}
            {intensityMetrics.perEmployee > 0 && (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('intensityMetrics.perEmployee.title')}</span>
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {intensityMetrics.perEmployee.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('intensityMetrics.perEmployee.unit')}</div>
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
                        {t('intensityMetrics.perEmployee.sectorAvg')}
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
            )}

            {/* Per Revenue - ESRS E1 Mandatory */}
            {intensityMetrics.perRevenue > 0 && (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('intensityMetrics.perRevenue.title')}</span>
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
            )}

            {/* Per Area */}
            {intensityMetrics.perSqm > 0 && (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
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
            {intensityMetrics.perValueAdded > 0 && (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
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
            )}

            {/* Production-Based - Sector-Specific */}
            {intensityMetrics.sectorSpecific && intensityMetrics.sectorSpecific.productionUnit !== 'FTE' && intensityMetrics.sectorSpecific.intensity > 0 && (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
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
            {intensityMetrics.perOperatingHour > 0 && (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per Operating Hour</span>
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
            )}

            {/* Per Customer */}
            {intensityMetrics.perCustomer > 0 && (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
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
            )}
          </div>
        </div>
      </div>

      {/* Year-over-Year Comparison */}
      {monthlyTrends.length > 0 && totalEmissionsYoY !== null && prevYearMonthlyTrends.length > 0 && (() => {
        // Check if we have actual previous year data with values (not all zeros)
        const hasPreviousData = prevYearMonthlyTrends.some((trend: any) => trend.total > 0);
        return hasPreviousData;
      })() && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm h-[420px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <div className="relative group inline-block">
                    <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('yoyComparison.title')}</h3>
                    {/* Tooltip */}
                    <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                      <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                        {t('explanations.yoyComparison')}
                      </p>
                      <div className="flex gap-1 mt-3 flex-wrap">
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                          GRI 305-5
                        </span>
                      </div>
                      <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('yoyComparison.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1" style={{ height: 'calc(100% - 60px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(() => {
                    // Filter out forecast months - only show actual data for YoY comparison
                    const actualMonths = monthlyTrends.filter((trend: any) => !trend.forecast);

                    // Create chart data with YoY percentage change
                    const chartData = actualMonths.map((trend: any) => {
                      // Extract just the month name (e.g., "Jan" from "Jan 25")
                      const currentMonthName = trend.month.split(' ')[0];

                      // Find matching month from previous year by comparing just the month name
                      const prevTrend = prevYearMonthlyTrends.find((prev: any) => {
                        const prevMonthName = prev.month.split(' ')[0];
                        return prevMonthName === currentMonthName;
                      });

                      // Calculate month-specific YoY change percentage
                      let change = 0;
                      let current = trend.total;
                      let previous = 0;

                      if (prevTrend && prevTrend.total > 0) {
                        previous = prevTrend.total;
                        change = ((trend.total - prevTrend.total) / prevTrend.total) * 100;
                      } else if (totalEmissionsYoY !== null) {
                        // Fallback to overall YoY if no monthly data available
                        change = totalEmissionsYoY;
                      }

                      return {
                        month: trend.month,
                        change,
                        current,
                        previous,
                        isForecast: trend.isForecast || false
                      };
                    });

                    return chartData;
                  })()}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={true} horizontal={true} />
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const { current, previous, change } = data;

                        // Skip if data is incomplete (e.g., bridge point)
                        if (current == null || previous == null || change == null) {
                          return null;
                        }

                        return (
                          <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                            <p className="font-medium text-white mb-2">{data.month}</p>
                            <div className="space-y-1">
                              <p className="text-gray-300">
                                {t('yoyComparison.tooltip.thisYear')}: <span className="font-medium text-white">{current.toFixed(1)} tCO2e</span>
                              </p>
                              <p className="text-gray-300">
                                {t('yoyComparison.tooltip.lastYear')}: <span className="font-medium text-white">{previous.toFixed(1)} tCO2e</span>
                              </p>
                            </div>
                            <p className={`text-sm font-bold mt-2 ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}% {t('yoyComparison.tooltip.yoy')}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {change >= 0 ? t('yoyComparison.tooltip.increase') : t('yoyComparison.tooltip.decrease')} {t('yoyComparison.tooltip.emissionsChange')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="change"
                    radius={[4, 4, 4, 4]}
                    fill="#8B5CF6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Emission Sources */}
          {topEmitters.length > 0 && (
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm h-[420px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div className="relative group inline-block">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('topEmitters.title')}</h3>
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      {t('explanations.topEmitters')}
                    </p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                        GRI 305-1/2/3
                      </span>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {topEmitters.map((source, index) => {
                const sourceColor = getCategoryColor(source.name);
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

                const carbonEquivalent = getCarbonEquivalent(source.emissions, 'portugal', tGlobal);
                const recommendationKey = getActionRecommendationKey(source.name);
                const recommendation = recommendationKey ? t(`topEmitters.recommendations.${recommendationKey}`) : '';

                return (
                  <div key={index} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {index + 1}. {source.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 dark:text-white font-semibold">
                          {source.emissions.toFixed(1)} tCO2e
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({source.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress bar with tooltip */}
                    <div className="relative group">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 cursor-help">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${source.percentage}%`,
                            backgroundColor: sourceColor
                          }}
                        />
                      </div>

                      {/* Carbon Equivalent Tooltip */}
                      {carbonEquivalent && (carbonEquivalent.educationalContext || carbonEquivalent.didYouKnow) && (
                        <div className="absolute left-0 top-full mt-1 w-72 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                          {/* Intro */}
                          <div className="mb-2">
                            <p className="text-purple-200 text-[11px] font-medium mb-1.5">
                              {tGlobal('carbonEquivalentTooltip.intro')}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-lg">{carbonEquivalent.icon}</span>
                              <span className="font-semibold text-white text-[11px] break-words">{carbonEquivalent.description}</span>
                            </div>
                          </div>

                          {carbonEquivalent.educationalContext && (
                            <div className="mb-2 pt-2 border-t border-purple-500/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-purple-300">ℹ️</span>
                                <span className="font-semibold text-purple-200 text-[10px]">{tGlobal('carbonEquivalentTooltip.howThisWorks')}</span>
                              </div>
                              <p className="text-gray-200 text-[10px] leading-relaxed break-words">
                                {carbonEquivalent.educationalContext}
                              </p>
                            </div>
                          )}

                          {carbonEquivalent.didYouKnow && (
                            <div className="pt-2 border-t border-purple-500/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-yellow-300">💡</span>
                                <span className="font-semibold text-yellow-200 text-[10px]">{tGlobal('carbonEquivalentTooltip.didYouKnow')}</span>
                              </div>
                              <p className="text-gray-200 text-[10px] leading-relaxed break-words">
                                {carbonEquivalent.didYouKnow}
                              </p>
                            </div>
                          )}

                          {/* Recommendation */}
                          {recommendation && (
                            <div className="pt-2 border-t border-purple-500/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-green-300">✨</span>
                                <span className="font-semibold text-green-200 text-[10px]">Recomendação</span>
                              </div>
                              <p className="text-gray-200 text-[10px] leading-relaxed break-words">
                                {recommendation}
                              </p>
                            </div>
                          )}

                          {/* Compliance Badges */}
                          <div className="mt-3 pt-2 border-t border-purple-500/30">
                            <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                              {tGlobal('carbonEquivalentTooltip.compliantWith')}
                            </p>
                            <div className="flex gap-1 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                                {tGlobal('carbonEquivalentTooltip.badges.ghgProtocol')}
                              </span>
                              <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                                {tGlobal('carbonEquivalentTooltip.badges.gri305')}
                              </span>
                              <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                                {tGlobal('carbonEquivalentTooltip.badges.tcfd')}
                              </span>
                              <span className="px-1.5 py-0.5 bg-orange-100/20 text-orange-300 text-[9px] rounded border border-orange-500/30">
                                {tGlobal('carbonEquivalentTooltip.badges.esrsE1')}
                              </span>
                            </div>
                          </div>

                          {/* Pointer arrow */}
                          <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>
      )}

      {/* All Detailed Breakdown Sections */}
      {(siteComparison.length > 1 || topEmitters.length > 0 || scope1Sources.length > 0 || scope2Total > 0 || scope3Total > 0) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Site Comparison by Emissions Intensity */}
        {siteComparison.length > 1 && (
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-500" />
                <div className="relative group inline-block">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
                    {t('sitePerformance.title')}
                  </h3>
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      {t('explanations.sitePerformance')}
                    </p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                        GRI 305-4
                      </span>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              {/* Horizontal Bar Chart */}
              {(() => {
                // Benchmark from sector-intensity.ts for Professional Services: perArea
                const benchmark = { low: 20.0, average: 35.0, high: 60.0 };

                const getBarColor = (intensity: number) => {
                  if (intensity <= benchmark.low) return '#10b981'; // green-500
                  if (intensity <= benchmark.average) return '#f59e0b'; // amber-500
                  return '#ef4444'; // red-500
                };

                // Prepare chart data - reverse to show best performers at top
                const chartData = [...siteComparison].reverse().map((site, index) => ({
                  name: site.name,
                  intensity: parseFloat(site.intensity.toFixed(1)),
                  fill: getBarColor(site.intensity),
                  rank: siteComparison.length - index
                }));

                return (
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={Math.max(300, siteComparison.length * 60)}>
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                        <XAxis
                          type="number"
                          stroke="rgba(156, 163, 175, 0.5)"
                          tick={{ fill: 'rgba(156, 163, 175, 0.8)', fontSize: 12 }}
                          label={{ value: 'kgCO2e/m²', position: 'insideBottom', offset: -5, fill: 'rgba(156, 163, 175, 0.8)', fontSize: 12 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="rgba(156, 163, 175, 0.5)"
                          tick={false}
                          width={0}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            border: '1px solid rgba(75, 85, 99, 0.3)',
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                          labelStyle={{ color: '#f3f4f6', fontWeight: 600, marginBottom: '4px' }}
                          formatter={(value: any) => [`${value} kgCO2e/m²`, 'Intensidade']}
                        />
                        <Bar
                          dataKey="intensity"
                          radius={[0, 4, 4, 0]}
                          label={(props: any) => {
                            const { x, y, width, height, value, index } = props;
                            const site = chartData[index];
                            return (
                              <g>
                                {/* Site name above the value */}
                                <text
                                  x={x + width + 5}
                                  y={y + height / 2 - 8}
                                  fill="rgba(156, 163, 175, 0.9)"
                                  fontSize={11}
                                  fontWeight={500}
                                  textAnchor="start"
                                >
                                  {site.name}
                                </text>
                                {/* Value below the site name, on the right of the bar */}
                                <text
                                  x={x + width + 5}
                                  y={y + height / 2 + 8}
                                  fill="rgba(156, 163, 175, 0.9)"
                                  fontSize={11}
                                  textAnchor="start"
                                >
                                  {value} kgCO2e/m²
                                </text>
                              </g>
                            );
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Legend for performance levels */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Excelente (≤{benchmark.low})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-amber-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Bom ({benchmark.low}-{benchmark.average})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Precisa Melhorar (&gt;{benchmark.average})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
        </div>
        )}

        {/* Scope 1 Detailed Breakdown */}
        {scope1Sources.length > 0 && (
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div className="relative group inline-block">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('scope1Breakdown.title')}</h3>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('explanations.scope1')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-400/30">
                      GHG Protocol
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 305-1
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {scope1Sources.map((source: any, index: number) => {
              const sourceName = source.name.toLowerCase();
              const sourceColor = getCategoryColor(source.name);
              let SourceIcon = Factory;

              if (sourceName.includes('stationary')) {
                SourceIcon = Flame;
              } else if (sourceName.includes('mobile')) {
                SourceIcon = Car;
              } else if (sourceName.includes('fugitive')) {
                SourceIcon = Wind;
              } else if (sourceName.includes('process')) {
                SourceIcon = Factory;
              }

              return (
                <div key={index} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SourceIcon className="w-4 h-4" style={{ color: sourceColor }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(() => {
                          const key = getCategoryNameKey(source.name);
                          return key ? t(`topEmitters.categoryNames.${key}`) : source.name;
                        })()}
                      </span>
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
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div className="relative group inline-block">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('scope2Breakdown.title')}</h3>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('explanations.scope2')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-400/30">
                      GHG Protocol
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 305-2
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
            </div>
          </div>

          {/* Dual Reporting - Improved UI */}
          <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('scope2Breakdown.dualReporting.title')}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('scope2Breakdown.dualReporting.locationBased')}</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {scope2LocationBased.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {t('scope2Breakdown.dualReporting.gridAverage')}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('scope2Breakdown.dualReporting.marketBased')}</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {scope2MarketBased.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {t('scope2Breakdown.dualReporting.recsGOs')}
                </div>
              </div>
            </div>

            {renewablePercentage > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('scope2Breakdown.dualReporting.renewableImpact.title')}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {renewablePercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {(scope2LocationBased - scope2MarketBased).toFixed(1)} {t('scope2Breakdown.dualReporting.renewableImpact.reduction')}
                </div>
              </div>
            )}
          </div>

          {/* Scope 2 Metrics List (individual metrics) */}
          {scope2Metrics.length > 0 ? (
            <div className="space-y-3">
              {scope2Metrics.map((metric, index) => {
                const metricColor = getCategoryColor(metric.name);
                const metricName = metric.name.toLowerCase();
                let MetricIcon = Zap;

                // Determine icon based on metric name
                if (metricName.includes('heating') || metricName.includes('heat')) {
                  MetricIcon = Flame;
                } else if (metricName.includes('cooling') || metricName.includes('cool')) {
                  MetricIcon = Snowflake;
                } else if (metricName.includes('steam')) {
                  MetricIcon = Thermometer;
                } else {
                  MetricIcon = Zap; // Default to electricity icon
                }

                return (
                  <div key={index} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MetricIcon className="w-4 h-4" style={{ color: metricColor }} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {metric.emissions.toFixed(1)} tCO2e
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {metric.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${metric.percentage}%`,
                          backgroundColor: metricColor
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
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <div className="relative group inline-block">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('scope3Breakdown.title')}</h3>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('explanations.scope3')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-400/30">
                      GHG Protocol
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 305-3
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
            </div>
          </div>

          {/* Coverage Status Card - Improved */}
          <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 mb-4 relative group">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('scope3Breakdown.valueChainCoverage.title')}</span>
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </div>

            {/* Tooltip for Scope 3 */}
            <div className="absolute top-full left-0 mt-2 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-96">
              <div className="text-xs font-semibold text-white mb-3">
                {t('scope3Breakdown.valueChainCoverage.tooltip.title')}
              </div>

              <p className="text-xs text-gray-300 leading-relaxed mb-3">
                {t('scope3Breakdown.valueChainCoverage.tooltip.description')}
              </p>

              <div className="space-y-2 mb-3">
                <div className="text-xs font-semibold text-gray-400">{t('scope3Breakdown.valueChainCoverage.tooltip.upstream.title')}</div>
                <p className="text-xs text-gray-300">{t('scope3Breakdown.valueChainCoverage.tooltip.upstream.items')}</p>

                <div className="text-xs font-semibold text-gray-400 mt-2">{t('scope3Breakdown.valueChainCoverage.tooltip.downstream.title')}</div>
                <p className="text-xs text-gray-300">{t('scope3Breakdown.valueChainCoverage.tooltip.downstream.items')}</p>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 italic">
                  {t('scope3Breakdown.valueChainCoverage.tooltip.footer')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {scope3Coverage?.tracked || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('scope3Breakdown.valueChainCoverage.tracked')}</div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-1">
                  {scope3Coverage?.missing || 15}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('scope3Breakdown.valueChainCoverage.missing')}</div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  (scope3Coverage?.percentage || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                  (scope3Coverage?.percentage || 0) >= 40 ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {(scope3Coverage?.percentage || 0).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('scope3Breakdown.valueChainCoverage.coverage')}</div>
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
                {scope3Coverage.percentage < 40 ? t('scope3Breakdown.valueChainCoverage.lowCoverage') : t('scope3Breakdown.valueChainCoverage.goodProgress')}
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
                  const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const categoryColor = getCategoryColor(categoryName);
                  const CategoryIcon = getScope3CategoryIcon(category);

                  return (
                    <div key={index} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3">
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
        <div className="mb-12">
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div className="relative group inline-block">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
                      {t('sbtiProgress.title')}
                    </h3>
                    {/* Tooltip */}
                    <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                      <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                        {t('explanations.sbtiProgress')}
                      </p>
                      <div className="flex gap-1 mt-3 flex-wrap">
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                          SBTi
                        </span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-400/30">
                          TCFD
                        </span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-400/30">
                          GRI 305-5
                        </span>
                      </div>
                      <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {targetData.targets[0].target_name} • {targetData.targets[0].baseline_year} → {targetData.targets[0].target_year}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  {targetData.targets[0].target_reduction_percent?.toFixed(1) || '42.0'}% {t('sbtiProgress.reductionTarget')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {/* Baseline */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sbtiProgress.baseline')} ({targetData.targets[0].baseline_year})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {targetData.targets[0].baseline_emissions?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
              </div>

              {/* Current */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-orange-200/50 dark:border-orange-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sbtiProgress.current')} ({new Date().getFullYear()})
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
                    <span className="text-purple-500">{t('sbtiProgress.actualMLForecast')}</span>
                  ) : (
                    <span>tCO2e</span>
                  )}
                </div>
              </div>

              {/* Required (Current Year Target) */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sbtiProgress.required')} ({new Date().getFullYear()})
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
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e {t('sbtiProgress.onTrack')}</div>
              </div>

              {/* Target */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sbtiProgress.target')} ({targetData.targets[0].target_year})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {targetData.targets[0].target_emissions?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
              </div>

              {/* Progress */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('sbtiProgress.progress')}</span>
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
                      return t('sbtiProgress.aboveBaseline');
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
              <ResponsiveContainer width="100%" height={320}>
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

            {/* Metric-level Expandable Targets */}
            {metricTargets.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Metric-Level Targets</h4>
                <div className="space-y-2">
                  {Array.from(new Set(metricTargets.map(mt => mt.category))).map((category) => {
                    const isExpanded = expandedCategories.has(category);
                    const categoryMetrics = metricTargets.filter(m => m.category === category);

                    return (
                      <div key={category}>
                        {/* Category Row - Clickable to expand */}
                        <div
                          className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors border border-gray-200 dark:border-gray-700"
                          onClick={() => {
                            setExpandedCategories(prev => {
                              const next = new Set(prev);
                              if (next.has(category)) {
                                next.delete(category);
                              } else {
                                next.add(category);
                              }
                              return next;
                            });
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                  {category}
                                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                    {categoryMetrics.length} metrics
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Click to expand and view individual metric targets
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {categoryMetrics.length > 0 ? categoryMetrics[0].progress.progressPercent.toFixed(0) : 0}%
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                avg. progress
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Metric-level Targets */}
                        {isExpanded && categoryMetrics.length > 0 && (
                          <div className="ml-6 mt-2 space-y-2">
                            {categoryMetrics.map((metric) => (
                              <div key={metric.id} className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border-l-2 border-blue-400">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {metric.metricName}
                                      </span>
                                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                                        {formatScope(metric.scope)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className={`text-sm font-semibold ${
                                    metric.progress.trajectoryStatus === 'on-track' ? 'text-green-600 dark:text-green-400' :
                                    metric.progress.trajectoryStatus === 'at-risk' ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {metric.progress.progressPercent.toFixed(0)}%
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Baseline:</span>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {metric.baselineEmissions?.toFixed(1)} tCO2e
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Target:</span>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {metric.targetEmissions?.toFixed(1)} tCO2e
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Current:</span>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {metric.currentEmissions?.toFixed(1)} tCO2e
                                    </div>
                                  </div>
                                </div>

                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      metric.progress.trajectoryStatus === 'on-track' ? 'bg-green-500' :
                                      metric.progress.trajectoryStatus === 'at-risk' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(100, metric.progress.progressPercent)}%` }}
                                  />
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMetricForInitiative(metric.id);
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-300 text-xs font-medium transition-all"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Initiative
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {selectedMetricForInitiative && (
        <RecommendationsModal
          isOpen={true}
          onClose={() => setSelectedMetricForInitiative(null)}
          organizationId={organizationId}
          metricTarget={metricTargets.find(mt => mt.id === selectedMetricForInitiative)}
          onSave={async (initiative) => {
            try {

              const selectedMetric = metricTargets.find(mt => mt.id === selectedMetricForInitiative);
              if (!selectedMetric) {
                throw new Error('Metric target not found');
              }

              // Calculate estimated reduction percentage
              const baselineValue = selectedMetric.baselineEmissions || selectedMetric.baselineValue || 0;
              const estimatedReductionPercent = baselineValue > 0
                ? (initiative.estimatedReduction / baselineValue) * 100
                : 0;

              // Determine start and completion dates
              const startDate = new Date().toISOString().split('T')[0];
              const completionDate = initiative.timeline
                ? new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0]
                : null;

              // Determine initiative type based on category
              const category = selectedMetric.category?.toLowerCase() || '';
              let initiativeType = 'emissions_reduction';
              if (category.includes('electricity') || category.includes('energy')) {
                initiativeType = 'renewable_energy';
              } else if (category.includes('waste')) {
                initiativeType = 'waste_reduction';
              } else if (category.includes('transport')) {
                initiativeType = 'fleet_electrification';
              }

              // Create the initiative via API
              const response = await fetch('/api/sustainability/initiatives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  organization_id: organizationId,
                  metric_target_id: selectedMetricForInitiative,
                  sustainability_target_id: 'd4a00170-7964-41e2-a61e-3d7b0059cfe5', // SBTi target ID
                  name: initiative.name,
                  description: initiative.description,
                  initiative_type: initiativeType,
                  estimated_reduction_tco2e: initiative.estimatedReduction,
                  estimated_reduction_percentage: estimatedReductionPercent,
                  start_date: startDate,
                  completion_date: completionDate,
                  implementation_status: 'planned',
                  capex: initiative.estimatedCost || null,
                  annual_opex: null,
                  annual_savings: null,
                  roi_years: null,
                  confidence_score: 0.7,
                  risk_level: 'medium',
                  risks: null,
                  dependencies: null
                })
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save initiative');
              }

              const result = await response.json();

              // Close modal
              setSelectedMetricForInitiative(null);

              // Optionally: Show success message or refresh data
            } catch (error: any) {
              console.error('❌ Error saving emissions initiative:', error);
              alert(`Failed to save initiative: ${error.message}`);
            }
          }}
        />
      )}
    </>
  );
}
