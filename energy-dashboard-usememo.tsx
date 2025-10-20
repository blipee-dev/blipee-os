  // Process all energy data with useMemo (replaces useEffect + useState pattern)
  const dashboardMetrics = useMemo(() => {
    if (!sources.data) {
      return {
        totalEnergy: 0,
        renewablePercentage: 0,
        totalEmissions: 0,
        energyIntensity: 0,
        yoyEnergyChange: null,
        yoyEmissionsChange: null,
        yoyRenewableChange: null,
        annualTarget: null,
        forecastedTotal: null,
        targetStatus: null,
        categoryTargets: [],
        overallTargetPercent: null,
        metricTargets: [],
        sourceBreakdown: [],
        prevYearSourceBreakdown: [],
        typeBreakdown: [],
        monthlyTrends: [],
        prevYearMonthlyTrends: [],
        forecastData: [],
        energyMixes: [],
      };
    }

    try {
      const sourcesData = sources.data;
      const intensityData = intensity.data;
      const prevSourcesData = prevYearSources.data;
      const forecastDataRes = forecast.data;
      const targetsData = targets.data;
      const weightedAllocationData = weightedAllocation.data;
      const baselineData2023 = baselineData.data;

      // Summary data
      const totalEnergyResult = sourcesData.total_consumption || 0;
      const renewablePercentageResult = sourcesData.renewable_percentage || 0;
      const totalEmissionsResult = sourcesData.total_emissions || 0;

      // Process source breakdown
      const sourceBreakdownResult = sourcesData.sources
        ? sourcesData.sources.map((s: any) => ({
            name: s.name,
            value: s.consumption,
            renewable: s.renewable,
            emissions: s.emissions
          }))
        : [];

      // Type breakdown
      const typeBreakdownResult = sourcesData.energy_types && sourcesData.energy_types.length > 0
        ? sourcesData.energy_types
        : [];

      // Monthly trends
      const monthlyTrendsResult = sourcesData.monthly_trends && sourcesData.monthly_trends.length > 0
        ? sourcesData.monthly_trends
        : [];

      // Energy mixes
      let energyMixesResult: any[] = [];
      if (sourcesData.energy_mixes && Array.isArray(sourcesData.energy_mixes)) {
        energyMixesResult = sourcesData.energy_mixes;
      } else if (sourcesData.grid_mix) {
        const legacyMix = sourcesData.grid_mix;
        energyMixesResult = [{
          energy_type: 'electricity' as const,
          provider_name: legacyMix.provider,
          year: legacyMix.year,
          sources: legacyMix.sources || [],
          renewable_percentage: legacyMix.renewable_percentage || 0,
          has_unknown_sources: legacyMix.has_unknown_sources || false
        }];
      }

      // Energy intensity
      const energyIntensityResult = intensityData?.perSquareMeter?.value || 0;

      // YoY comparison
      let yoyEnergyChangeResult: number | null = null;
      let yoyEmissionsChangeResult: number | null = null;
      let yoyRenewableChangeResult: number | null = null;
      let prevYearSourceBreakdownResult: any[] = [];
      let prevYearMonthlyTrendsResult: any[] = [];

      if (prevSourcesData?.sources && prevSourcesData.total_consumption > 0) {
        yoyEnergyChangeResult = ((sourcesData.total_consumption - prevSourcesData.total_consumption) / prevSourcesData.total_consumption) * 100;
        yoyEmissionsChangeResult = ((sourcesData.total_emissions - prevSourcesData.total_emissions) / prevSourcesData.total_emissions) * 100;
        yoyRenewableChangeResult = sourcesData.renewable_percentage - prevSourcesData.renewable_percentage;

        if (prevSourcesData.sources && prevSourcesData.sources.length > 0) {
          prevYearSourceBreakdownResult = prevSourcesData.sources.map((s: any) => ({
            name: s.name,
            value: s.consumption,
            renewable: s.renewable,
            emissions: s.emissions
          }));
        }

        if (prevSourcesData.monthly_trends && prevSourcesData.monthly_trends.length > 0) {
          prevYearMonthlyTrendsResult = prevSourcesData.monthly_trends;
        }
      }

      // Forecast data
      let forecastDataResult: any[] = [];
      if (forecastDataRes?.forecast && forecastDataRes.forecast.length > 0) {
        forecastDataResult = forecastDataRes.forecast;
      }

      // Targets and category data
      let categoryTargetsResult: any[] = [];
      let overallTargetPercentResult: number | null = null;
      let annualTargetResult: number | null = null;
      let forecastedTotalResult: number | null = null;
      let targetStatusResult: 'on-track' | 'at-risk' | 'off-track' | null = null;
      let metricTargetsResult: any[] = [];

      // Use targets from hook instead of fetching
      if (targetsData && targetsData.targets && targetsData.targets.length > 0) {
        categoryTargetsResult = targetsData.targets.map((t: any) => ({
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
      } else if (weightedAllocationData?.allocations) {
        // Use weighted allocation from hook as fallback
        categoryTargetsResult = weightedAllocationData.allocations.filter((a: any) =>
          a.category === 'Electricity' || a.category === 'Purchased Energy'
        ) || [];
      }

      // Calculate targets if we have baseline data
      if (baselineData2023 && categoryTargetsResult.length > 0) {
        const currentYTD = sourcesData.total_emissions;
        const RENEWABLE_EMISSION_FACTOR = 0.02;
        const FOSSIL_EMISSION_FACTOR = 0.4;

        const forecastRemaining = forecastDataResult.reduce((sum: number, f: any) => {
          const renewableKWh = f.renewable || 0;
          const fossilKWh = f.fossil || 0;
          const renewableEmissions = renewableKWh * RENEWABLE_EMISSION_FACTOR / 1000;
          const fossilEmissions = fossilKWh * FOSSIL_EMISSION_FACTOR / 1000;
          return sum + renewableEmissions + fossilEmissions;
        }, 0);

        const projected2025FullYear = currentYTD + forecastRemaining;
        forecastedTotalResult = projected2025FullYear;

        // Calculate targets based on category data
        const totalBaselineTarget = categoryTargetsResult.reduce((sum, cat) =>
          sum + (cat.absoluteTarget || 0), 0);

        if (totalBaselineTarget > 0) {
          annualTargetResult = totalBaselineTarget;

          if (projected2025FullYear <= totalBaselineTarget) {
            targetStatusResult = 'on-track';
          } else if (projected2025FullYear <= totalBaselineTarget * 1.1) {
            targetStatusResult = 'at-risk';
          } else {
            targetStatusResult = 'off-track';
          }
        }
      }

      // Use metric targets from hook
      if (metricTargetsQuery.data) {
        const targetsData = Array.isArray(metricTargetsQuery.data)
          ? metricTargetsQuery.data
          : metricTargetsQuery.data.data || [];
        metricTargetsResult = targetsData;
      }

      return {
        totalEnergy: totalEnergyResult,
        renewablePercentage: renewablePercentageResult,
        totalEmissions: totalEmissionsResult,
        energyIntensity: energyIntensityResult,
        yoyEnergyChange: yoyEnergyChangeResult,
        yoyEmissionsChange: yoyEmissionsChangeResult,
        yoyRenewableChange: yoyRenewableChangeResult,
        annualTarget: annualTargetResult,
        forecastedTotal: forecastedTotalResult,
        targetStatus: targetStatusResult,
        categoryTargets: categoryTargetsResult,
        overallTargetPercent: overallTargetPercentResult,
        metricTargets: metricTargetsResult,
        sourceBreakdown: sourceBreakdownResult,
        prevYearSourceBreakdown: prevYearSourceBreakdownResult,
        typeBreakdown: typeBreakdownResult,
        monthlyTrends: monthlyTrendsResult,
        prevYearMonthlyTrends: prevYearMonthlyTrendsResult,
        forecastData: forecastDataResult,
        energyMixes: energyMixesResult,
      };
    } catch (error) {
      console.error('Error processing energy data:', error);
      return {
        totalEnergy: 0,
        renewablePercentage: 0,
        totalEmissions: 0,
        energyIntensity: 0,
        yoyEnergyChange: null,
        yoyEmissionsChange: null,
        yoyRenewableChange: null,
        annualTarget: null,
        forecastedTotal: null,
        targetStatus: null,
        categoryTargets: [],
        overallTargetPercent: null,
        metricTargets: [],
        sourceBreakdown: [],
        prevYearSourceBreakdown: [],
        typeBreakdown: [],
        monthlyTrends: [],
        prevYearMonthlyTrends: [],
        forecastData: [],
        energyMixes: [],
      };
    }
  }, [
    sources.data,
    intensity.data,
    forecast.data,
    prevYearSources.data,
    targets.data,
    weightedAllocation.data,
    baselineData.data,
    metricTargetsQuery.data,
    organizationId,
    selectedSite,
    selectedPeriod
  ]);

  // Destructure all computed metrics
  const {
    totalEnergy,
    renewablePercentage,
    totalEmissions,
    energyIntensity,
    yoyEnergyChange,
    yoyEmissionsChange,
    yoyRenewableChange,
    annualTarget,
    forecastedTotal,
    targetStatus,
    categoryTargets,
    overallTargetPercent,
    metricTargets,
    sourceBreakdown,
    prevYearSourceBreakdown,
    typeBreakdown,
    monthlyTrends,
    prevYearMonthlyTrends,
    forecastData,
    energyMixes,
  } = dashboardMetrics;
