import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';
import { calculateProgress } from '@/lib/utils/progress-calculation';
import type { Building } from '@/types/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  compliance: () => [...dashboardKeys.all, 'compliance'] as const,
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
export function useEnergyDashboard(
  period: TimePeriod,
  selectedSite?: Building | null,
  organizationId?: string
) {
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

  // For forecast, always use end of year if viewing current year
  const currentYear = new Date().getFullYear();
  const selectedYear = new Date(period.start).getFullYear();
  const forecastEndDate = selectedYear === currentYear ? `${currentYear}-12-31` : period.end;

  const forecastParams = new URLSearchParams({
    start_date: period.start,
    end_date: forecastEndDate,
  });
  if (selectedSite) {
    forecastParams.append('site_id', selectedSite.id);
  }

  const forecast = useQuery({
    queryKey: dashboardKeys.energyForecast(period, selectedSite?.id),
    queryFn: async () => {
      const response = await fetch(`/api/energy/forecast?${forecastParams}`);
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
    staleTime: 10 * 60 * 1000,
  });

  // Fetch FULL previous year data (Jan-Dec) for projected YoY comparison
  const isCurrentYear = startDate.getFullYear() === currentYear;

  const fullPrevYearParams = new URLSearchParams({
    start_date: `${currentYear - 1}-01-01`,
    end_date: `${currentYear - 1}-12-31`,
  });
  if (selectedSite) {
    fullPrevYearParams.append('site_id', selectedSite.id);
  }

  const fullPrevYearSources = useQuery({
    queryKey: [...dashboardKeys.energySources(period, selectedSite?.id), 'fullPrevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/energy/sources?${fullPrevYearParams}`);
      if (!response.ok) throw new Error('Failed to fetch full previous year data');
      return response.json();
    },
    enabled: isCurrentYear, // Only fetch for current year view
    staleTime: 10 * 60 * 1000,
  });

  // Fetch sustainability targets (contains baseline_year and target_year)
  const sustainabilityTargets = useQuery({
    queryKey: [
      ...dashboardKeys.energy(period, selectedSite?.id),
      'sustainabilityTargets',
      organizationId,
    ],
    queryFn: async () => {
      const response = await fetch('/api/sustainability/targets');
      if (!response.ok) throw new Error('Failed to fetch sustainability targets');
      return response.json();
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // Targets don't change often
  });

  // Extract baseline year from sustainability targets (dynamic!)
  const baselineYear = sustainabilityTargets.data?.targets?.[0]?.baseline_year || 2023;
  const targetYear = currentYear; // Target year is always current year per user requirement

  // Fetch targets data if organizationId is provided
  const targets = useQuery({
    queryKey: [
      ...dashboardKeys.energy(period, selectedSite?.id),
      'targets',
      organizationId,
      baselineYear,
    ],
    queryFn: async () => {
      const categoryParams = new URLSearchParams({
        baseline_year: baselineYear.toString(),
        categories: 'Electricity,Purchased Energy',
      });
      const response = await fetch(`/api/sustainability/targets/category?${categoryParams}`);
      if (!response.ok) throw new Error('Failed to fetch targets');
      return response.json();
    },
    enabled: !!organizationId && !!sustainabilityTargets.data,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch baseline data dynamically based on organization's baseline_year
  const baselineParams = new URLSearchParams({
    start_date: `${baselineYear}-01-01`,
    end_date: `${baselineYear}-12-31`,
  });
  if (selectedSite) {
    baselineParams.append('site_id', selectedSite.id);
  }

  const baselineData = useQuery({
    queryKey: [...dashboardKeys.energy(period, selectedSite?.id), 'baseline', baselineYear],
    queryFn: async () => {
      const response = await fetch(`/api/energy/sources?${baselineParams}`);
      if (!response.ok) throw new Error('Failed to fetch baseline data');
      return response.json();
    },
    enabled: !!organizationId && selectedYear === currentYear && !!sustainabilityTargets.data,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch weighted allocation (fallback when targets are empty)
  const weightedAllocation = useQuery({
    queryKey: [
      ...dashboardKeys.energy(period, selectedSite?.id),
      'weightedAllocation',
      baselineYear,
    ],
    queryFn: async () => {
      const allocParams = new URLSearchParams({
        baseline_year: baselineYear.toString(),
      });
      if (selectedSite) {
        allocParams.append('site_id', selectedSite.id);
      }
      const response = await fetch(
        `/api/sustainability/targets/weighted-allocation?${allocParams}`
      );
      if (!response.ok) throw new Error('Failed to fetch weighted allocation');
      return response.json();
    },
    enabled: !!organizationId && !!sustainabilityTargets.data,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch metric-level targets
  const energyCategories = [
    'Electricity',
    'Purchased Energy',
    'Purchased Heating',
    'Purchased Cooling',
    'Purchased Steam',
    'Natural Gas',
    'Heating Oil',
    'Diesel',
    'Gasoline',
    'Propane',
    'Heating',
    'Cooling',
    'Steam',
  ].join(',');

  const metricTargets = useQuery({
    queryKey: [
      ...dashboardKeys.energy(period, selectedSite?.id),
      'metricTargets',
      'unified',
      organizationId,
    ],
    queryFn: async () => {
      const url = `/api/sustainability/targets/unified-energy?organizationId=${organizationId}&categories=${encodeURIComponent(energyCategories)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch unified energy targets');
      const data = await response.json();

      return {
        data: data.data || [],
        overall: data.overall,
        configuration: data.configuration,
      };
    },
    enabled: !!organizationId && selectedYear === currentYear && !!sustainabilityTargets.data,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: false,
  });

  return {
    sources,
    intensity,
    forecast,
    prevYearSources,
    fullPrevYearSources,
    targets,
    sustainabilityTargets,
    baselineYear,
    targetYear,
    baselineData,
    weightedAllocation,
    metricTargets,
    isLoading: sources.isLoading || intensity.isLoading,
    isError: sources.isError || intensity.isError,
    error: sources.error || intensity.error,
  };
}

// Energy Site Comparison Hook
export function useEnergySiteComparison(
  period: TimePeriod,
  selectedSite?: Building | null,
  organizationId?: string
) {
  const query = useQuery({
    queryKey: [
      ...dashboardKeys.energy(period, selectedSite?.id),
      'siteComparison',
      'v4',
      organizationId,
    ],
    queryFn: async () => {
      if (!organizationId) {
        return [];
      }

      // Fetch all sites for the organization
      const sitesResponse = await fetch(`/api/sites?organization_id=${organizationId}`);
      if (!sitesResponse.ok) throw new Error('Failed to fetch sites');
      const sitesData = await sitesResponse.json();

      if (!sitesData.sites || sitesData.sites.length <= 1) {
        return [];
      }

      // Fetch energy data for each site in parallel
      const params = new URLSearchParams({
        start_date: period.start,
        end_date: period.end,
      });

      const siteDataPromises = sitesData.sites.map(async (site: any) => {
        const siteParams = new URLSearchParams(params);
        siteParams.append('site_id', site.id);

        try {
          const sourcesRes = await fetch(`/api/energy/sources?${siteParams}`);
          if (!sourcesRes.ok) return null;

          const sourcesData = await sourcesRes.json();

          // API returns total_consumption directly in the response (in kWh)
          const totalEnergy = sourcesData.total_consumption || 0; // kWh
          const area = site.total_area_sqm || 1000; // m²

          // Calculate intensity ourselves (kWh/m²)
          const intensity = totalEnergy / area;

          return {
            id: site.id,
            name: site.name,
            energy: totalEnergy,
            intensity: parseFloat(intensity.toFixed(2)), // kWh/m²
          };
        } catch (error) {
          console.error(`Error fetching data for site ${site.name}:`, error);
          return null;
        }
      });

      const siteData = (await Promise.all(siteDataPromises)).filter(Boolean);

      // Sort by intensity (highest first)
      return siteData.sort((a: any, b: any) => b.intensity - a.intensity);
    },
    enabled: !selectedSite && !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  return query;
}

// Water Site Comparison Hook
export function useWaterSiteComparison(
  period: TimePeriod,
  selectedSite?: Building | null,
  organizationId?: string
) {
  return useQuery({
    queryKey: [
      ...dashboardKeys.water(period, selectedSite?.id),
      'siteComparison',
      'v2',
      organizationId,
    ],
    queryFn: async () => {
      if (!organizationId) {
        return [];
      }

      // Fetch all sites for the organization
      const sitesResponse = await fetch(`/api/sites?organization_id=${organizationId}`);
      if (!sitesResponse.ok) throw new Error('Failed to fetch sites');
      const sitesData = await sitesResponse.json();

      if (!sitesData.sites || sitesData.sites.length <= 1) {
        return [];
      }

      // Fetch water data for each site in parallel
      const params = new URLSearchParams({
        start_date: period.start,
        end_date: period.end,
      });

      const siteDataPromises = sitesData.sites.map(async (site: any) => {
        const siteParams = new URLSearchParams(params);
        siteParams.append('site_id', site.id);

        try {
          const sourcesRes = await fetch(`/api/water/sources?${siteParams}`);
          if (!sourcesRes.ok) return null;

          const sourcesData = await sourcesRes.json();

          // API returns total_withdrawal directly in the response (in m³)
          const totalWater = sourcesData.total_withdrawal || 0; // m³
          const area = site.total_area_sqm || 1000; // m²
          const intensity = totalWater / area; // m³/m²

          return {
            id: site.id,
            name: site.name,
            totalWater: parseFloat(totalWater.toFixed(1)), // m³
            area,
            intensity: parseFloat(intensity.toFixed(2)), // m³/m²
          };
        } catch (error) {
          console.error(`Error fetching data for site ${site.name}:`, error);
          return null;
        }
      });

      const siteData = (await Promise.all(siteDataPromises)).filter(Boolean);

      // Sort by intensity (highest first)
      return siteData.sort((a: any, b: any) => b.intensity - a.intensity);
    },
    enabled: !selectedSite && !!organizationId,
    staleTime: 10 * 60 * 1000,
  });
}

// Waste Site Comparison Hook
export function useWasteSiteComparison(
  period: TimePeriod,
  selectedSite?: Building | null,
  organizationId?: string
) {
  return useQuery({
    queryKey: [
      ...dashboardKeys.waste(period, selectedSite?.id),
      'siteComparison',
      'v2',
      organizationId,
    ],
    queryFn: async () => {
      if (!organizationId) {
        return [];
      }

      // Fetch all sites for the organization
      const sitesResponse = await fetch(`/api/sites?organization_id=${organizationId}`);
      if (!sitesResponse.ok) throw new Error('Failed to fetch sites');
      const sitesData = await sitesResponse.json();

      if (!sitesData.sites || sitesData.sites.length <= 1) {
        return [];
      }

      // Fetch waste data for each site in parallel
      const params = new URLSearchParams({
        start_date: period.start,
        end_date: period.end,
      });

      const siteDataPromises = sitesData.sites.map(async (site: any) => {
        const siteParams = new URLSearchParams(params);
        siteParams.append('site_id', site.id);

        try {
          const streamsRes = await fetch(`/api/waste/streams?${siteParams}`);
          if (!streamsRes.ok) return null;

          const streamsData = await streamsRes.json();

          // API returns total_generated directly in the response (in tonnes)
          const totalWaste = streamsData.total_generated || 0; // tonnes
          const area = site.total_area_sqm || 1000; // m²

          // Convert tonnes to kg for intensity calculation (kg/m²)
          const intensity = (totalWaste * 1000) / area;

          return {
            id: site.id,
            name: site.name,
            totalWaste: parseFloat(totalWaste.toFixed(1)), // tonnes
            area,
            intensity: parseFloat(intensity.toFixed(2)), // kg/m²
          };
        } catch (error) {
          console.error(`Error fetching data for site ${site.name}:`, error);
          return null;
        }
      });

      const siteData = (await Promise.all(siteDataPromises)).filter(Boolean);

      // Sort by intensity (highest first)
      return siteData.sort((a: any, b: any) => b.intensity - a.intensity);
    },
    enabled: !selectedSite && !!organizationId,
    staleTime: 10 * 60 * 1000,
  });
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
export function useWaterDashboard(
  period: TimePeriod,
  selectedSite?: Building | null,
  organizationId?: string
) {
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
    staleTime: 10 * 60 * 1000,
  });

  // Fetch FULL previous year data (Jan-Dec) for projected YoY comparison
  const currentYearWater = new Date().getFullYear();
  const selectedYearWater = new Date(period.start).getFullYear();
  const isCurrentYearWater = selectedYearWater === currentYearWater;

  const fullPrevYearParamsWater = new URLSearchParams({
    start_date: `${currentYearWater - 1}-01-01`,
    end_date: `${currentYearWater - 1}-12-31`,
  });
  if (selectedSite) {
    fullPrevYearParamsWater.append('site_id', selectedSite.id);
  }

  const fullPrevYearSources = useQuery({
    queryKey: [...dashboardKeys.waterSources(period, selectedSite?.id), 'fullPrevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/water/sources?${fullPrevYearParamsWater}`);
      if (!response.ok) throw new Error('Failed to fetch full previous year water data');
      return response.json();
    },
    enabled: isCurrentYearWater, // Only fetch if viewing current year
    staleTime: 10 * 60 * 1000,
  });

  // Fetch forecast data - always use end of year if viewing current year
  const forecastEndDateWater =
    selectedYearWater === currentYearWater ? `${currentYearWater}-12-31` : period.end;

  const forecastParamsWater = new URLSearchParams({
    start_date: period.start,
    end_date: forecastEndDateWater,
  });
  if (selectedSite) {
    forecastParamsWater.append('site_id', selectedSite.id);
  }

  const forecast = useQuery({
    queryKey: [...dashboardKeys.water(period, selectedSite?.id), 'forecast'],
    queryFn: async () => {
      const response = await fetch(`/api/water/forecast?${forecastParamsWater}`);
      if (!response.ok) throw new Error('Failed to fetch water forecast');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch sustainability targets (contains baseline_year and target_year)
  const currentYear = currentYearWater;
  const selectedYear = new Date(period.start).getFullYear();

  const sustainabilityTargets = useQuery({
    queryKey: [
      ...dashboardKeys.water(period, selectedSite?.id),
      'sustainabilityTargets',
      organizationId,
    ],
    queryFn: async () => {
      const response = await fetch('/api/sustainability/targets');
      if (!response.ok) throw new Error('Failed to fetch sustainability targets');
      return response.json();
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // Extract baseline year from sustainability targets (dynamic!)
  const baselineYear = sustainabilityTargets.data?.targets?.[0]?.baseline_year || 2023;
  const targetYear = currentYear; // Target year is always current year

  const baselineParams = new URLSearchParams({
    start_date: `${baselineYear}-01-01`,
    end_date: `${baselineYear}-12-31`,
  });
  if (selectedSite) {
    baselineParams.append('site_id', selectedSite.id);
  }

  const baselineData = useQuery({
    queryKey: [...dashboardKeys.water(period, selectedSite?.id), 'baseline', baselineYear],
    queryFn: async () => {
      const response = await fetch(`/api/water/sources?${baselineParams}`);
      if (!response.ok) throw new Error('Failed to fetch baseline water data');
      return response.json();
    },
    enabled: selectedYear === currentYear && !!sustainabilityTargets.data,
    staleTime: 10 * 60 * 1000,
  });

  // Calculate water target using shared utility
  const waterTarget = useQuery({
    queryKey: [
      ...dashboardKeys.water(period, selectedSite?.id),
      'target',
      organizationId,
      baselineYear,
      targetYear,
    ],
    queryFn: async () => {
      const defaultTargetPercent = 2.5; // CDP Water Security benchmark
      const yearsSinceBaseline = currentYear - baselineYear;

      if (!sources.data || !baselineData.data) {
        return null;
      }

      const baselineConsumption = baselineData.data.total_consumption || 0;
      const currentYTD = sources.data.total_consumption || 0;

      // Calculate target using compound reduction
      const annualReductionRate = defaultTargetPercent / 100;
      const targetConsumption =
        baselineConsumption * Math.pow(1 - annualReductionRate, yearsSinceBaseline);

      // Project full year consumption
      let projectedFullYear = 0;
      if (forecast.data?.forecast?.length > 0) {
        // Use forecast data
        const forecastRemaining = forecast.data.forecast.reduce((sum: number, f: any) => {
          return sum + (f.consumption || 0);
        }, 0);
        projectedFullYear = currentYTD + forecastRemaining;
      } else {
        // Fallback to linear projection
        const monthsOfData = sources.data.monthly_trends?.length || 0;
        projectedFullYear = monthsOfData > 0 ? (currentYTD / monthsOfData) * 12 : 0;
      }

      // Calculate progress using shared utility
      const progress = calculateProgress(baselineConsumption, targetConsumption, projectedFullYear);

      return {
        baseline: baselineConsumption,
        target: targetConsumption,
        projected: projectedFullYear,
        progressPercent: progress.progressPercent,
        exceedancePercent: progress.exceedancePercent,
        status: progress.status,
        annualReductionRate: defaultTargetPercent,
        isDefault: true,
        targetYear: currentYear,
        baselineYear,
      };
    },
    enabled:
      selectedYear === currentYear && !!sources.data && !!baselineData.data && !!forecast.data,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch metric-level targets
  const waterCategories = [
    'Water Consumption',
    'Water Withdrawal',
    'Water Discharge',
    'Water Recycling',
    'Water Reuse',
    'Rainwater Harvesting',
    'Groundwater',
    'Surface Water',
    'Municipal Water',
    'Wastewater',
  ].join(',');

  const metricTargets = useQuery({
    queryKey: [
      ...dashboardKeys.water(period, selectedSite?.id),
      'metricTargets',
      'unified',
      organizationId,
    ],
    queryFn: async () => {
      const url = `/api/sustainability/targets/unified-water?organizationId=${organizationId}&categories=${encodeURIComponent(waterCategories)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch water metric targets');
      const data = await response.json();

      return {
        data: data.data || [],
        overall: data.overall,
        configuration: data.configuration,
      };
    },
    enabled: !!organizationId && selectedYear === currentYear && !!sustainabilityTargets.data,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: false,
  });

  return {
    sources,
    prevYearSources,
    fullPrevYearSources,
    forecast,
    sustainabilityTargets,
    baselineYear,
    targetYear,
    baselineData,
    waterTarget,
    metricTargets,
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
export function useWasteDashboard(
  period: TimePeriod,
  selectedSite?: Building | null,
  organizationId?: string
) {
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
    staleTime: 10 * 60 * 1000,
  });

  // Fetch FULL previous year data (Jan-Dec) for projected YoY comparison
  const currentYearWaste = new Date().getFullYear();
  const selectedYearWaste = new Date(period.start).getFullYear();
  const isCurrentYearWaste = selectedYearWaste === currentYearWaste;

  const fullPrevYearParamsWaste = new URLSearchParams({
    start_date: `${currentYearWaste - 1}-01-01`,
    end_date: `${currentYearWaste - 1}-12-31`,
  });
  if (selectedSite) {
    fullPrevYearParamsWaste.append('site_id', selectedSite.id);
  }

  const fullPrevYearStreams = useQuery({
    queryKey: [...dashboardKeys.wasteStreams(period, selectedSite?.id), 'fullPrevYear'],
    queryFn: async () => {
      const response = await fetch(`/api/waste/streams?${fullPrevYearParamsWaste}`);
      if (!response.ok) throw new Error('Failed to fetch full previous year waste data');
      return response.json();
    },
    enabled: isCurrentYearWaste, // Only fetch if viewing current year
    staleTime: 10 * 60 * 1000,
  });

  // Fetch forecast data - always use end of year if viewing current year
  const forecastEndDateWaste =
    selectedYearWaste === currentYearWaste ? `${currentYearWaste}-12-31` : period.end;

  const forecastParamsWaste = new URLSearchParams({
    start_date: period.start,
    end_date: forecastEndDateWaste,
  });
  if (selectedSite) {
    forecastParamsWaste.append('site_id', selectedSite.id);
  }

  const forecast = useQuery({
    queryKey: [...dashboardKeys.waste(period, selectedSite?.id), 'forecast'],
    queryFn: async () => {
      const response = await fetch(`/api/waste/forecast?${forecastParamsWaste}`);
      if (!response.ok) throw new Error('Failed to fetch waste forecast');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch sustainability targets (contains baseline_year and target_year)
  const currentYear = currentYearWaste;
  const selectedYear = new Date(period.start).getFullYear();

  const sustainabilityTargets = useQuery({
    queryKey: [
      ...dashboardKeys.waste(period, selectedSite?.id),
      'sustainabilityTargets',
      organizationId,
    ],
    queryFn: async () => {
      const response = await fetch('/api/sustainability/targets');
      if (!response.ok) throw new Error('Failed to fetch sustainability targets');
      return response.json();
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // Extract baseline year from sustainability targets (dynamic!)
  const baselineYear = sustainabilityTargets.data?.targets?.[0]?.baseline_year || 2023;
  const targetYear = currentYear; // Target year is always current year

  const baselineParams = new URLSearchParams({
    start_date: `${baselineYear}-01-01`,
    end_date: `${baselineYear}-12-31`,
  });
  if (selectedSite) {
    baselineParams.append('site_id', selectedSite.id);
  }

  const baselineData = useQuery({
    queryKey: [...dashboardKeys.waste(period, selectedSite?.id), 'baseline', baselineYear],
    queryFn: async () => {
      const response = await fetch(`/api/waste/streams?${baselineParams}`);
      if (!response.ok) throw new Error('Failed to fetch baseline waste data');
      return response.json();
    },
    enabled: selectedYear === currentYear && !!sustainabilityTargets.data,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch metric-level targets for current year
  const wasteCategories = [
    'Waste',
    'Waste to Landfill',
    'Waste Incinerated',
    'Paper & Cardboard Recycling',
    'Plastic Recycling',
    'Metal Recycling',
    'Glass Recycling',
    'Mixed Materials Recycling',
    'Food Waste Composting',
    'Garden Waste Composting',
    'E-Waste',
    'Hazardous Waste',
  ].join(',');

  const metricTargets = useQuery({
    queryKey: [
      ...dashboardKeys.waste(period, selectedSite?.id),
      'metricTargets',
      'unified',
      organizationId,
    ],
    queryFn: async () => {
      const url = `/api/sustainability/targets/unified-waste?organizationId=${organizationId}&categories=${encodeURIComponent(wasteCategories)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch waste metric targets');
      const data = await response.json();

      return {
        data: data.data || [],
        overall: data.overall,
        configuration: data.configuration,
      };
    },
    enabled: !!organizationId && selectedYear === currentYear && !!sustainabilityTargets.data,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: false,
  });

  return {
    streams,
    prevYearStreams,
    fullPrevYearStreams,
    forecast,
    sustainabilityTargets,
    baselineYear,
    targetYear,
    baselineData,
    metricTargets,
    isLoading: streams.isLoading,
    isError: streams.isError,
    error: streams.error,
  };
}

// Comprehensive Emissions Dashboard Hook (fetches all data in parallel)
export function useEmissionsDashboard(
  period: TimePeriod,
  selectedSite?: Building | null,
  organizationId?: string
) {
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

  // 3. Fetch targets (with site-specific progress tracking)
  const targets = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'targets'],
    queryFn: async () => {
      const targetParams = new URLSearchParams();
      if (selectedSite) {
        targetParams.append('site_id', selectedSite.id);
      }
      const url = targetParams.toString()
        ? `/api/sustainability/targets?${targetParams}`
        : '/api/sustainability/targets';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch targets');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Targets don't change often
  });

  // 4. Fetch replanning trajectory
  const trajectory = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'trajectory', organizationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/sustainability/targets/trajectory?organizationId=${organizationId}`
      );
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
      const response = await fetch(
        `/api/sustainability/targets/feasibility?organizationId=${organizationId}`
      );
      if (!response.ok) throw new Error('Failed to fetch feasibility');
      const data = await response.json();
      return data.success ? data.feasibility : null;
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // 6. Fetch sustainability targets to get current year check
  const currentYearForEmissions = new Date().getFullYear();
  const selectedYearForEmissions = new Date(period.start).getFullYear();

  const sustainabilityTargets = useQuery({
    queryKey: [
      ...dashboardKeys.emissions(period, selectedSite?.id),
      'sustainabilityTargets',
      organizationId,
    ],
    queryFn: async () => {
      const response = await fetch('/api/sustainability/targets');
      if (!response.ok) throw new Error('Failed to fetch sustainability targets');
      return response.json();
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // 7. Fetch metric-level targets using unified API
  const emissionCategories = [
    'Natural Gas',
    'Heating Oil',
    'Diesel',
    'Gasoline',
    'Propane',
    'Refrigerants',
    'Fugitive Emissions',
    'Heating',
    'Cooling',
    'Stationary Combustion',
    'Mobile Combustion',
    'Electricity',
    'Purchased Energy',
    'Purchased Heating',
    'Purchased Cooling',
    'Purchased Steam',
    'Transportation',
    'Business Travel',
    'Employee Commuting',
    'Upstream Transportation',
    'Downstream Transportation',
    'Waste',
    'Purchased Goods',
    'Capital Goods',
    'Fuel and Energy Related',
    'Upstream Leased Assets',
    'Processing of Sold Products',
    'Use of Sold Products',
    'End of Life',
    'Downstream Leased Assets',
    'Franchises',
    'Investments',
  ].join(',');

  const metricTargets = useQuery({
    queryKey: [
      ...dashboardKeys.emissions(period, selectedSite?.id),
      'metricTargets',
      'unified',
      organizationId,
    ],
    queryFn: async () => {
      const url = `/api/sustainability/targets/unified-emissions?organizationId=${organizationId}&categories=${encodeURIComponent(emissionCategories)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch unified emissions targets');
      const data = await response.json();

      return {
        data: data.data || [],
        overall: data.overall,
        configuration: data.configuration,
      };
    },
    enabled:
      !!organizationId &&
      selectedYearForEmissions === currentYearForEmissions &&
      !!sustainabilityTargets.data,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
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
    queryKey: [
      ...dashboardKeys.emissions(period, selectedSite?.id),
      'scopeAnalysis',
      'fullPrevYear',
    ],
    queryFn: async () => {
      const response = await fetch(`/api/sustainability/scope-analysis?${fullPrevYearParams}`);
      if (!response.ok) throw new Error('Failed to fetch full previous year scope analysis');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // 9. Fetch forecast data - always use end of year if viewing current year
  const currentYearEmissions = new Date().getFullYear();
  const selectedYearEmissions = new Date(period.start).getFullYear();
  const forecastEndDateEmissions =
    selectedYearEmissions === currentYearEmissions ? `${currentYearEmissions}-12-31` : period.end;

  const forecast = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'forecast', 'v2'], // Added v2 to force cache invalidation
    queryFn: async () => {
      const forecastParams = new URLSearchParams({
        organization_id: organizationId || '',
        start_date: period.start,
        end_date: forecastEndDateEmissions,
      });
      if (selectedSite) {
        forecastParams.append('site_id', selectedSite.id);
      }
      const response = await fetch(`/api/sustainability/forecast?${forecastParams}`);
      if (!response.ok) {
        console.error('Emissions forecast API error:', response.status);
        return null;
      }
      return response.json();
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  // 10. Fetch previous year dashboard data (for monthly trends)
  const prevYearDashboardUrl = `/api/sustainability/dashboard?${prevParams}`;
  const prevYearDashboard = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'dashboard', 'prevYear'],
    queryFn: async () => {
      const response = await fetch(prevYearDashboardUrl);
      if (!response.ok) throw new Error('Failed to fetch previous year dashboard');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // 11. Fetch top metrics (individual metric-level emitters)
  const topMetrics = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'topMetrics'],
    queryFn: async () => {
      const topMetricsParams = new URLSearchParams({
        start_date: period.start,
        end_date: period.end,
      });
      if (selectedSite) {
        topMetricsParams.append('site_id', selectedSite.id);
      }
      const response = await fetch(`/api/sustainability/top-metrics?${topMetricsParams}`);
      if (!response.ok) return { metrics: [] };
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // 12. Fetch Scope 2 individual metrics (for detailed breakdown)
  const scope2Metrics = useQuery({
    queryKey: [...dashboardKeys.emissions(period, selectedSite?.id), 'scope2Metrics'],
    queryFn: async () => {
      const scope2MetricsParams = new URLSearchParams({
        start_date: period.start,
        end_date: period.end,
        limit: '50',
      });
      if (selectedSite) {
        scope2MetricsParams.append('site_id', selectedSite.id);
      }
      const response = await fetch(`/api/sustainability/top-metrics?${scope2MetricsParams}`);
      if (!response.ok) return { metrics: [] };
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    scopeAnalysis,
    dashboard,
    targets,
    trajectory,
    feasibility,
    sustainabilityTargets,
    metricTargets,
    prevYearScopeAnalysis,
    fullPrevYearScopeAnalysis,
    forecast,
    prevYearDashboard,
    topMetrics,
    scope2Metrics,
    isLoading: scopeAnalysis.isLoading || dashboard.isLoading,
    isError: scopeAnalysis.isError || dashboard.isError,
    error: scopeAnalysis.error || dashboard.error,
  };
}

// Comprehensive Overview Dashboard Hook (fetches all data in parallel)
export function useOverviewDashboard(
  period: TimePeriod,
  selectedSite?: Building | null,
  organizationId?: string
) {
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

  // 2. Fetch sustainability targets (with site-specific progress tracking)
  const targets = useQuery({
    queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'targets'],
    queryFn: async () => {
      const targetParams = new URLSearchParams();
      if (selectedSite) {
        targetParams.append('site_id', selectedSite.id);
      }
      const url = targetParams.toString()
        ? `/api/sustainability/targets?${targetParams}`
        : '/api/sustainability/targets';
      const response = await fetch(url);
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
    queryKey: [
      ...dashboardKeys.overview(period, selectedSite?.id),
      'scopeAnalysis',
      'fullPrevYear',
    ],
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

  // 6. Fetch forecast data - always use end of year if viewing current year
  const currentYearOverview = new Date().getFullYear();
  const selectedYearOverview = new Date(period.start).getFullYear();
  const forecastEndDateOverview =
    selectedYearOverview === currentYearOverview ? `${currentYearOverview}-12-31` : period.end;

  const forecastParamsOverview = new URLSearchParams({
    start_date: period.start,
    end_date: forecastEndDateOverview,
  });
  if (selectedSite) {
    forecastParamsOverview.append('site_id', selectedSite.id);
  }

  const forecast = useQuery({
    queryKey: [...dashboardKeys.overview(period, selectedSite?.id), 'forecast', 'v2'], // Added v2 to force cache invalidation
    queryFn: async () => {
      const url = `/api/sustainability/forecast?${forecastParamsOverview}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Forecast API error:', response.status);
        return null;
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Changed to true to force refetch
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
export function useTransportationDashboard(
  period: TimePeriod,
  selectedSite?: Building | null,
  organizationId?: string
) {
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

  // 3. Commute data
  const commute = useQuery({
    queryKey: [...dashboardKeys.transportation(period, selectedSite?.id), 'commute'],
    queryFn: async () => {
      const response = await fetch('/api/transportation/commute');
      if (!response.ok) throw new Error('Failed to fetch commute data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 4. Logistics data
  const logistics = useQuery({
    queryKey: [...dashboardKeys.transportation(period, selectedSite?.id), 'logistics'],
    queryFn: async () => {
      const response = await fetch('/api/transportation/logistics');
      if (!response.ok) throw new Error('Failed to fetch logistics data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 5. Target allocation (conditional on baseline_year)
  const currentYear = new Date().getFullYear();
  const targetAllocation = useQuery({
    queryKey: [...dashboardKeys.transportation(period, selectedSite?.id), 'targetAllocation'],
    queryFn: async () => {
      const allocParams = new URLSearchParams({
        baseline_year: (currentYear - 1).toString(),
      });
      const response = await fetch(
        `/api/sustainability/targets/weighted-allocation?${allocParams}`
      );
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
    commute,
    logistics,
    targetAllocation,
    isLoading:
      fleet.isLoading || businessTravel.isLoading || commute.isLoading || logistics.isLoading,
    isError: fleet.isError || businessTravel.isError || commute.isError || logistics.isError,
    error: fleet.error || businessTravel.error || commute.error || logistics.error,
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

/**
 * Hook for GHG Protocol Inventory data
 * Fetches GHG Protocol compliance settings and emissions data
 */
export function useGHGProtocolInventory(year: number, selectedSite?: Building | null) {
  const params = new URLSearchParams({
    year: year.toString(),
  });
  if (selectedSite?.id) {
    params.append('siteId', selectedSite.id);
  }

  return useQuery({
    queryKey: [...dashboardKeys.compliance(), 'ghgProtocol', year, selectedSite?.id],
    queryFn: async () => {
      const response = await fetch(`/api/compliance/ghg-protocol?${params}`);
      if (!response.ok) throw new Error('Failed to fetch GHG Protocol data');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (compliance data changes rarely)
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Generic hook for GRI Disclosures data
 * Works for all GRI standards (301-308)
 */
export function useGRIDisclosures(
  standardCode: string, // '301', '302', '303', etc.
  year: number,
  selectedSite?: Building | null
) {
  const params = new URLSearchParams({
    year: year.toString(),
  });
  if (selectedSite?.id) {
    params.append('siteId', selectedSite.id);
  }

  return useQuery({
    queryKey: [...dashboardKeys.compliance(), `gri${standardCode}`, year, selectedSite?.id],
    queryFn: async () => {
      const response = await fetch(`/api/compliance/gri-${standardCode}?${params}`);
      if (!response.ok) throw new Error(`Failed to fetch GRI ${standardCode} data`);
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (GRI disclosure data changes rarely)
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook for Reduction Initiatives (used by GRI 305)
 * Fetches emission reduction initiatives for an organization
 */
export function useReductionInitiatives(organizationId?: string) {
  const params = new URLSearchParams();
  if (organizationId) {
    params.append('organizationId', organizationId);
  }

  return useQuery({
    queryKey: [...dashboardKeys.compliance(), 'reductionInitiatives', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/compliance/reduction-initiatives?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reduction initiatives');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (initiatives can be added/updated)
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
