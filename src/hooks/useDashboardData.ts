import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';
import type { Building } from '@/types/auth';

// Query keys for organized cache management
export const dashboardKeys = {
  all: ['dashboard'] as const,
  energy: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.all, 'energy', period, siteId] as const,
  energySources: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.energy(period, siteId), 'sources'] as const,
  energyIntensity: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.energy(period, siteId), 'intensity'] as const,
  energyForecast: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.energy(period, siteId), 'forecast'] as const,

  water: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.all, 'water', period, siteId] as const,
  waterSources: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.water(period, siteId), 'sources'] as const,

  waste: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.all, 'waste', period, siteId] as const,
  wasteStreams: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.waste(period, siteId), 'streams'] as const,

  overview: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.all, 'overview', period, siteId] as const,
  emissions: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.all, 'emissions', period, siteId] as const,
  transportation: (period: TimePeriod, siteId?: string) =>
    [...dashboardKeys.all, 'transportation', period, siteId] as const,
  compliance: () =>
    [...dashboardKeys.all, 'compliance'] as const,
};

// Energy Dashboard Hooks
export function useEnergySources(period: TimePeriod, selectedSite?: Building | null) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  return useQuery({
    queryKey: dashboardKeys.energySources(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/energy/sources?${params}`);
      if (!response.ok) throw new Error('Failed to fetch energy sources');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEnergyIntensity(period: TimePeriod, selectedSite?: Building | null) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  return useQuery({
    queryKey: dashboardKeys.energyIntensity(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/energy/intensity?${params}`);
      if (!response.ok) throw new Error('Failed to fetch energy intensity');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEnergyForecast(period: TimePeriod, selectedSite?: Building | null) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  return useQuery({
    queryKey: dashboardKeys.energyForecast(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/energy/forecast?${params}`);
      if (!response.ok) throw new Error('Failed to fetch energy forecast');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - forecasts don't change often
  });
}

// Comprehensive Energy Dashboard Hook (fetches all data in parallel)
export function useEnergyDashboard(period: TimePeriod, selectedSite?: Building | null, organizationId?: string) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  // Fetch current period data
  const sources = useQuery({
    queryKey: dashboardKeys.energySources(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/energy/sources?${params}`);
      if (!response.ok) throw new Error('Failed to fetch energy sources');
      return response.json();
    },
  });

  const intensity = useQuery({
    queryKey: dashboardKeys.energyIntensity(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/energy/intensity?${params}`);
      if (!response.ok) throw new Error('Failed to fetch energy intensity');
      return response.json();
    },
  });

  const forecast = useQuery({
    queryKey: dashboardKeys.energyForecast(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/energy/forecast?${params}`);
      if (!response.ok) throw new Error('Failed to fetch energy forecast');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch previous year data for YoY comparison
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  const previousYearStart = new Date(startDate);
  previousYearStart.setFullYear(startDate.getFullYear() - 1);
  const previousYearEnd = new Date(endDate);
  previousYearEnd.setFullYear(endDate.getFullYear() - 1);

  const prevParams = new URLSearchParams({
    start_date: previousYearStart.toISOString().split('T')[0],
    end_date: previousYearEnd.toISOString().split('T')[0],
  });
  if (selectedSite) {
    prevParams.append('site_id', selectedSite.id);
  }

  const prevYearSources = useQuery({
    queryKey: [...dashboardKeys.energySources(period, selectedSite?.id), 'prevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/energy/sources?${prevParams}`);
      if (!response.ok) throw new Error('Failed to fetch previous year data');
      return response.json();
    },
    enabled: !!sources.data, // Only fetch after current data is available
  });

  // Fetch targets data if organizationId is provided
  const targets = useQuery({
    queryKey: [...dashboardKeys.energy(period, selectedSite?.id), 'targets', organizationId],
    queryFn: async () => {
      const baselineYear = new Date(period.start).getFullYear() - 2;
      const categoryParams = new URLSearchParams({
        organization_id: organizationId!,
        baseline_year: baselineYear.toString(),
        categories: 'Electricity,Purchased Energy'
      });
      const response = await fetch(`/api/sustainability/targets/category?${categoryParams}`);
      if (!response.ok) throw new Error('Failed to fetch targets');
      return response.json();
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // Targets don't change often
  });

  return {
    sources,
    intensity,
    forecast,
    prevYearSources,
    targets,
    isLoading: sources.isLoading || intensity.isLoading,
    isError: sources.isError || intensity.isError,
    error: sources.error || intensity.error,
  };
}

// Water Dashboard Hooks
export function useWaterSources(period: TimePeriod, selectedSite?: Building | null) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  return useQuery({
    queryKey: dashboardKeys.waterSources(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/water/sources?${params}`);
      if (!response.ok) throw new Error('Failed to fetch water sources');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Comprehensive Water Dashboard Hook (fetches all data in parallel)
export function useWaterDashboard(period: TimePeriod, selectedSite?: Building | null, organizationId?: string) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  // Fetch current period data
  const sources = useQuery({
    queryKey: dashboardKeys.waterSources(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/water/sources?${params}`);
      if (!response.ok) throw new Error('Failed to fetch water sources');
      return response.json();
    },
  });

  // Fetch previous year data for YoY comparison
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  const previousYearStart = new Date(startDate);
  previousYearStart.setFullYear(startDate.getFullYear() - 1);
  const previousYearEnd = new Date(endDate);
  previousYearEnd.setFullYear(endDate.getFullYear() - 1);

  const prevParams = new URLSearchParams({
    start_date: previousYearStart.toISOString().split('T')[0],
    end_date: previousYearEnd.toISOString().split('T')[0],
  });
  if (selectedSite) {
    prevParams.append('site_id', selectedSite.id);
  }

  const prevYearSources = useQuery({
    queryKey: [...dashboardKeys.waterSources(period, selectedSite?.id), 'prevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/water/sources?${prevParams}`);
      if (!response.ok) throw new Error('Failed to fetch previous year water data');
      return response.json();
    },
    enabled: !!sources.data,
  });

  // Fetch forecast data
  const forecast = useQuery({
    queryKey: [...dashboardKeys.water(period, selectedSite?.id), 'forecast'],
    queryFn: async () => {
      const response = await fetch(`/api/water/forecast?${params}`);
      if (!response.ok) throw new Error('Failed to fetch water forecast');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    sources,
    prevYearSources,
    forecast,
    isLoading: sources.isLoading,
    isError: sources.isError,
    error: sources.error,
  };
}

// Waste Dashboard Hooks
export function useWasteStreams(period: TimePeriod, selectedSite?: Building | null) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  return useQuery({
    queryKey: dashboardKeys.wasteStreams(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/waste/streams?${params}`);
      if (!response.ok) throw new Error('Failed to fetch waste streams');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Comprehensive Waste Dashboard Hook (fetches all data in parallel)
export function useWasteDashboard(period: TimePeriod, selectedSite?: Building | null, organizationId?: string) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  // Fetch current period data
  const streams = useQuery({
    queryKey: dashboardKeys.wasteStreams(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/waste/streams?${params}`);
      if (!response.ok) throw new Error('Failed to fetch waste streams');
      return response.json();
    },
  });

  // Fetch previous year data for YoY comparison
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  const previousYearStart = new Date(startDate);
  previousYearStart.setFullYear(startDate.getFullYear() - 1);
  const previousYearEnd = new Date(endDate);
  previousYearEnd.setFullYear(endDate.getFullYear() - 1);

  const prevParams = new URLSearchParams({
    start_date: previousYearStart.toISOString().split('T')[0],
    end_date: previousYearEnd.toISOString().split('T')[0],
  });
  if (selectedSite) {
    prevParams.append('site_id', selectedSite.id);
  }

  const prevYearStreams = useQuery({
    queryKey: [...dashboardKeys.wasteStreams(period, selectedSite?.id), 'prevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/waste/streams?${prevParams}`);
      if (!response.ok) throw new Error('Failed to fetch previous year waste data');
      return response.json();
    },
    enabled: !!streams.data,
  });

  // Fetch forecast data
  const forecast = useQuery({
    queryKey: [...dashboardKeys.waste(period, selectedSite?.id), 'forecast'],
    queryFn: async () => {
      const response = await fetch(`/api/waste/forecast?${params}`);
      if (!response.ok) throw new Error('Failed to fetch waste forecast');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch baseline data (2023) for SBTi targets - only for current year
  const currentYear = new Date().getFullYear();
  const selectedYear = new Date(period.start).getFullYear();

  const baseline2023Params = new URLSearchParams({
    start_date: '2023-01-01',
    end_date: '2023-12-31',
  });
  if (selectedSite) {
    baseline2023Params.append('site_id', selectedSite.id);
  }

  const baseline2023 = useQuery({
    queryKey: [...dashboardKeys.waste(period, selectedSite?.id), 'baseline2023'],
    queryFn: async () => {
      const response = await fetch(`/api/waste/streams?${baseline2023Params}`);
      if (!response.ok) throw new Error('Failed to fetch baseline waste data');
      return response.json();
    },
    enabled: selectedYear === currentYear, // Only fetch for current year
    staleTime: 10 * 60 * 1000,
  });

  // Fetch metric-level targets for current year
  const wasteCategories = [
    'Waste', 'Waste to Landfill', 'Waste Incinerated',
    'Paper & Cardboard Recycling', 'Plastic Recycling', 'Metal Recycling',
    'Glass Recycling', 'Mixed Materials Recycling',
    'Food Waste Composting', 'Garden Waste Composting',
    'E-Waste', 'Hazardous Waste'
  ].join(',');

  const metricTargets = useQuery({
    queryKey: [...dashboardKeys.waste(period, selectedSite?.id), 'metricTargets', organizationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/sustainability/targets/by-category?organizationId=${organizationId}&targetId=d4a00170-7964-41e2-a61e-3d7b0059cfe5&categories=${encodeURIComponent(wasteCategories)}`
      );
      if (!response.ok) throw new Error('Failed to fetch waste metric targets');
      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!organizationId && selectedYear === currentYear,
    staleTime: 10 * 60 * 1000,
  });

  return {
    streams,
    prevYearStreams,
    forecast,
    baseline2023,
    metricTargets,
    isLoading: streams.isLoading,
    isError: streams.isError,
    error: streams.error,
  };
}

// Comprehensive Emissions Dashboard Hook (fetches all data in parallel)
export function useEmissionsDashboard(period: TimePeriod, selectedSite?: Building | null, organizationId?: string) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  // 1. Fetch scope analysis (current period)
  const scopeAnalysis = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'scopeAnalysis'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/scope-analysis?${params}`);
      if (!response.ok) throw new Error('Failed to fetch scope analysis');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch dashboard trends
  const dashboard = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'dashboard'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard trends');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // 3. Fetch targets
  const targets = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'targets'],
    queryFn: async () => {
      const response = await fetch('/api/sustainability/targets');
      if (!response.ok) throw new Error('Failed to fetch targets');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Targets don't change often
  });

  // 4. Fetch replanning trajectory
  const trajectory = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'trajectory', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/targets/trajectory?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch trajectory');
      const data = await response.json();
      return data.success && data.hasReplanning ? data : null;
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // 5. Fetch feasibility status
  const feasibility = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'feasibility', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/targets/feasibility?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch feasibility');
      const data = await response.json();
      return data.success ? data.feasibility : null;
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // 6. Fetch metric-level targets
  const emissionCategories = [
    'Natural Gas', 'Heating Oil', 'Diesel', 'Gasoline', 'Propane',
    'Refrigerants', 'Fugitive Emissions', 'Heating', 'Cooling',
    'Electricity', 'Purchased Energy', 'Purchased Heating', 'Purchased Cooling', 'Purchased Steam',
    'Transportation', 'Business Travel', 'Employee Commuting',
    'Upstream Transportation', 'Downstream Transportation',
    'Waste', 'Purchased Goods', 'Capital Goods',
    'Fuel and Energy Related', 'Upstream Leased Assets',
    'Processing of Sold Products', 'Use of Sold Products',
    'End of Life', 'Downstream Leased Assets',
    'Franchises', 'Investments'
  ].join(',');

  const metricTargets = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'metricTargets', organizationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/sustainability/targets/by-category?organizationId=${organizationId}&targetId=d4a00170-7964-41e2-a61e-3d7b0059cfe5&categories=${encodeURIComponent(emissionCategories)}`
      );
      if (!response.ok) throw new Error('Failed to fetch metric targets');
      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // 7. Fetch previous year data (matching selected period)
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  const previousYear = startDate.getFullYear() - 1;

  const previousYearStart = new Date(startDate);
  previousYearStart.setFullYear(previousYear);
  const previousYearEnd = new Date(endDate);
  previousYearEnd.setFullYear(previousYear);

  const prevParams = new URLSearchParams({
    start_date: previousYearStart.toISOString().split('T')[0],
    end_date: previousYearEnd.toISOString().split('T')[0],
  });
  if (selectedSite) {
    prevParams.append('site_id', selectedSite.id);
  }

  const prevYearScopeAnalysis = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'scopeAnalysis', 'prevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/scope-analysis?${prevParams}`);
      if (!response.ok) throw new Error('Failed to fetch previous year scope analysis');
      return response.json();
    },
    enabled: !!scopeAnalysis.data,
    staleTime: 5 * 60 * 1000,
  });

  // 8. Fetch full previous year data (for YoY projection)
  const fullPrevYearParams = new URLSearchParams({
    start_date: `${previousYear}-01-01`,
    end_date: `${previousYear}-12-31`,
  });
  if (selectedSite) {
    fullPrevYearParams.append('site_id', selectedSite.id);
  }

  const fullPrevYearScopeAnalysis = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'scopeAnalysis', 'fullPrevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/scope-analysis?${fullPrevYearParams}`);
      if (!response.ok) throw new Error('Failed to fetch full previous year scope analysis');
      return response.json();
    },
    enabled: !!scopeAnalysis.data,
    staleTime: 5 * 60 * 1000,
  });

  return {
    scopeAnalysis,
    dashboard,
    targets,
    trajectory,
    feasibility,
    metricTargets,
    prevYearScopeAnalysis,
    fullPrevYearScopeAnalysis,
    isLoading: scopeAnalysis.isLoading || dashboard.isLoading,
    isError: scopeAnalysis.isError || dashboard.isError,
    error: scopeAnalysis.error || dashboard.error,
  };
}

// Comprehensive Overview Dashboard Hook (fetches all data in parallel)
export function useOverviewDashboard(period: TimePeriod, selectedSite?: Building | null, organizationId?: string) {
  const params = new URLSearchParams({
    start_date: period.start,
    end_date: period.end,
  });
  if (selectedSite) {
    params.append('site_id', selectedSite.id);
  }

  // Calculate previous year parameters
  const currentYear = new Date(period.start).getFullYear();
  const previousYear = currentYear - 1;

  const prevYearStart = new Date(period.start);
  prevYearStart.setFullYear(previousYear);
  const prevYearEnd = new Date(period.end);
  prevYearEnd.setFullYear(previousYear);

  const prevParams = new URLSearchParams({
    start_date: prevYearStart.toISOString().split('T')[0],
    end_date: prevYearEnd.toISOString().split('T')[0],
  });
  if (selectedSite) {
    prevParams.append('site_id', selectedSite.id);
  }

  const fullPrevYearParams = new URLSearchParams({
    start_date: `${previousYear}-01-01`,
    end_date: `${previousYear}-12-31`,
  });
  if (selectedSite) {
    fullPrevYearParams.append('site_id', selectedSite.id);
  }

  // 1. Fetch scope analysis (current period)
  const scopeAnalysis = useQuery({
    queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'scopeAnalysis'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/scope-analysis?${params}`);
      if (!response.ok) throw new Error('Failed to fetch scope analysis');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 2. Fetch sustainability targets
  const targets = useQuery({
    queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'targets'],
    queryFn: async () => {
      const response = await fetch('/api/sustainability/targets');
      if (!response.ok) throw new Error('Failed to fetch targets');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 3. Fetch previous year scope analysis
  const prevYearScopeAnalysis = useQuery({
    queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'scopeAnalysis', 'prevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/scope-analysis?${prevParams}`);
      if (!response.ok) throw new Error('Failed to fetch previous year scope analysis');
      return response.json();
    },
    enabled: !!scopeAnalysis.data,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 4. Fetch full previous year scope analysis (for YoY projection)
  const fullPrevYearScopeAnalysis = useQuery({
    queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'scopeAnalysis', 'fullPrevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/scope-analysis?${fullPrevYearParams}`);
      if (!response.ok) throw new Error('Failed to fetch full previous year scope analysis');
      return response.json();
    },
    enabled: !!scopeAnalysis.data,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 5. Fetch dashboard trends
  const dashboard = useQuery({
    queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'dashboard'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard trends');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 6. Fetch forecast data
  const forecast = useQuery({
    queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'forecast'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/forecast?${params}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 7. Fetch top metrics (biggest emitters)
  const topMetrics = useQuery({
    queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'topMetrics'],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/top-metrics?${params}`);
      if (!response.ok) return { metrics: [] };
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    scopeAnalysis,
    targets,
    prevYearScopeAnalysis,
    fullPrevYearScopeAnalysis,
    dashboard,
    forecast,
    topMetrics,
    isLoading: scopeAnalysis.isLoading || targets.isLoading || dashboard.isLoading,
    isError: scopeAnalysis.isError || targets.isError || dashboard.isError,
    error: scopeAnalysis.error || targets.error || dashboard.error,
  };
}

// Hook to prefetch next dashboard data for smoother navigation
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  const prefetchEnergy = (period: TimePeriod, selectedSite?: Building | null) => {
    const params = new URLSearchParams({
      start_date: period.start,
      end_date: period.end,
    });
    if (selectedSite) {
      params.append('site_id', selectedSite.id);
    }

    // Prefetch all energy data
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.energySources(period, selectedSite?.id),
      queryFn: async () => {
        const response = await fetch(`/api/energy/sources?${params}`);
        return response.json();
      },
    });

    queryClient.prefetchQuery({
      queryKey: dashboardKeys.energyIntensity(period, selectedSite?.id),
      queryFn: async () => {
        const response = await fetch(`/api/energy/intensity?${params}`);
        return response.json();
      },
    });
  };

  const prefetchWater = (period: TimePeriod, selectedSite?: Building | null) => {
    const params = new URLSearchParams({
      start_date: period.start,
      end_date: period.end,
    });
    if (selectedSite) {
      params.append('site_id', selectedSite.id);
    }

    queryClient.prefetchQuery({
      queryKey: dashboardKeys.waterSources(period, selectedSite?.id),
      queryFn: async () => {
        const response = await fetch(`/api/water/sources?${params}`);
        return response.json();
      },
    });
  };

  const prefetchWaste = (period: TimePeriod, selectedSite?: Building | null) => {
    const params = new URLSearchParams({
      start_date: period.start,
      end_date: period.end,
    });
    if (selectedSite) {
      params.append('site_id', selectedSite.id);
    }

    queryClient.prefetchQuery({
      queryKey: dashboardKeys.wasteStreams(period, selectedSite?.id),
      queryFn: async () => {
        const response = await fetch(`/api/waste/streams?${params}`);
        return response.json();
      },
    });
  };

  const prefetchEmissions = (period: TimePeriod, selectedSite?: Building | null) => {
    const params = new URLSearchParams({
      start_date: period.start,
      end_date: period.end,
    });
    if (selectedSite) {
      params.append('site_id', selectedSite.id);
    }

    // Prefetch main emissions queries
    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'scopeAnalysis'],
      queryFn: async () => {
        const response = await fetch(`/api/sustainability/scope-analysis?${params}`);
        return response.json();
      },
    });

    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'dashboard'],
      queryFn: async () => {
        const response = await fetch(`/api/sustainability/dashboard?${params}`);
        return response.json();
      },
    });

    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'targets'],
      queryFn: async () => {
        const response = await fetch('/api/sustainability/targets');
        return response.json();
      },
    });
  };

  const prefetchOverview = (period: TimePeriod, selectedSite?: Building | null) => {
    const params = new URLSearchParams({
      start_date: period.start,
      end_date: period.end,
    });
    if (selectedSite) {
      params.append('site_id', selectedSite.id);
    }

    // Prefetch main overview queries
    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'scopeAnalysis'],
      queryFn: async () => {
        const response = await fetch(`/api/sustainability/scope-analysis?${params}`);
        return response.json();
      },
    });

    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'targets'],
      queryFn: async () => {
        const response = await fetch('/api/sustainability/targets');
        return response.json();
      },
    });

    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'dashboard'],
      queryFn: async () => {
        const response = await fetch(`/api/sustainability/dashboard?${params}`);
        return response.json();
      },
    });

    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'topMetrics'],
      queryFn: async () => {
        const response = await fetch(`/api/sustainability/top-metrics?${params}`);
        return response.json();
      },
    });
  };

  const prefetchTransportation = (period: TimePeriod, selectedSite?: Building | null) => {
    // Prefetch transportation queries
    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.transportation(period, selectedSite?.id), 'fleet'],
      queryFn: async () => {
        const response = await fetch('/api/transportation/fleet');
        return response.json();
      },
    });

    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.transportation(period, selectedSite?.id), 'businessTravel'],
      queryFn: async () => {
        const response = await fetch('/api/transportation/business-travel');
        return response.json();
      },
    });
  };

  const prefetchCompliance = () => {
    // Prefetch compliance queries
    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.compliance(), 'userRole'],
      queryFn: async () => {
        const response = await fetch('/api/auth/user-role');
        return response.json();
      },
    });

    queryClient.prefetchQuery({
      queryKey: [...dashboardKeys.compliance(), 'industry'],
      queryFn: async () => {
        const response = await fetch('/api/organizations/industry');
        return response.json();
      },
    });
  };

  return {
    prefetchEnergy,
    prefetchWater,
    prefetchWaste,
    prefetchEmissions,
    prefetchOverview,
    prefetchTransportation,
    prefetchCompliance,
  };
}

// Comprehensive Transportation Dashboard Hook (fetches all data in parallel)
export function useTransportationDashboard(period: TimePeriod, selectedSite?: Building | null, organizationId?: string) {
  // 1. Fleet data
  const fleet = useQuery({
    queryKey: [...dashboardKeys.transportation(period, selectedSite?.id), 'fleet'],
    queryFn: async () => {
      const response = await fetch('/api/transportation/fleet');
      if (!response.ok) throw new Error('Failed to fetch fleet data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 2. Business travel data
  const businessTravel = useQuery({
    queryKey: [...dashboardKeys.transportation(period, selectedSite?.id), 'businessTravel'],
    queryFn: async () => {
      const response = await fetch('/api/transportation/business-travel');
      if (!response.ok) throw new Error('Failed to fetch business travel data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 3. Target allocation (conditional on baseline_year)
  const currentYear = new Date().getFullYear();
  const targetAllocation = useQuery({
    queryKey: [...dashboardKeys.transportation(period, selectedSite?.id), 'targetAllocation'],
    queryFn: async () => {
      const allocParams = new URLSearchParams({
        baseline_year: (currentYear - 1).toString(),
      });
      const response = await fetch(`/api/sustainability/targets/weighted-allocation?${allocParams}`);
      if (!response.ok) throw new Error('Failed to fetch target allocation');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    fleet,
    businessTravel,
    targetAllocation,
    isLoading: fleet.isLoading || businessTravel.isLoading,
    isError: fleet.isError || businessTravel.isError,
    error: fleet.error || businessTravel.error,
  };
}

/**
 * Hook for ComplianceDashboard data
 * Fetches user role and organization industry settings
 */
export function useComplianceDashboard() {
  // Fetch user role to check super admin status
  const userRole = useQuery({
    queryKey: [...dashboardKeys.compliance(), 'userRole'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user-role');
      if (!response.ok) throw new Error('Failed to fetch user role');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (role changes are infrequent)
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch organization industry settings
  const industry = useQuery({
    queryKey: [...dashboardKeys.compliance(), 'industry'],
    queryFn: async () => {
      const response = await fetch('/api/organizations/industry');
      if (!response.ok) throw new Error('Failed to fetch industry');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (industry settings change rarely)
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const isLoading = userRole.isLoading || industry.isLoading;
  const isError = userRole.isError || industry.isError;
  const error = userRole.error || industry.error;

  return {
    userRole,
    industry,
    isLoading,
    isError,
    error,
  };
}
