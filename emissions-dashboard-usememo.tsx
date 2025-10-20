  // Process all emissions data with useMemo (replaces useEffect + useState pattern)
  const dashboardMetrics = useMemo(() => {
    // Wait for all required data
    if (!scopeAnalysis.data || !dashboard.data) {
      return {
        totalEmissions: 0,
        totalEmissionsYoY: 0,
        intensityMetric: 0,
        intensityYoY: 0,
        intensityMetrics: {
          perEmployee: 0,
          perRevenue: 0,
          perSqm: 0,
          perValueAdded: 0,
          perOperatingHour: 0,
          perCustomer: 0,
          sectorSpecific: null,
          scope1: { perEmployee: 0, perRevenue: 0, perSqm: 0 },
          scope2: { perEmployee: 0, perRevenue: 0, perSqm: 0 },
          scope3: { perEmployee: 0, perRevenue: 0, perSqm: 0 }
        },
        intensityPerEmployee: 0,
        intensityPerRevenue: 0,
        intensityPerSqm: 0,
        siteComparison: [],
        scope1Total: 0,
        scope2Total: 0,
        scope3Total: 0,
        scopeYoY: { scope1: 0, scope2: 0, scope3: 0 },
        scope2LocationBased: 0,
        scope2MarketBased: 0,
        renewablePercentage: 0,
        scope2CategoriesData: {},
        scope2Metrics: [],
        scope3Coverage: null,
        scope3CategoriesData: {},
        monthlyTrends: [],
        prevYearMonthlyTrends: [],
        replanningTrajectory: null,
        topEmitters: [],
        scope1Sources: [],
        scope1ByGas: [],
        geographicBreakdown: [],
        targetData: null,
        dataQuality: null,
        projectedAnnualEmissions: 0,
        actualEmissionsYTD: 0,
        forecastedEmissions: 0,
        previousYearTotalEmissions: 0,
        metricTargets: [],
      };
    }

    try {
      const scopeData = scopeAnalysis.data;
      const dashboardData = dashboard.data;
      const prevScopeData = prevYearScopeAnalysis.data;
      const fullPrevYearData = fullPrevYearScopeAnalysis.data;

      // Target data from query
      const targetDataResult = targets.data || null;

      // Replanning trajectory from query
      const replanningTrajectoryResult = trajectory.data || null;

      // Metric targets from unified API response
      const metricTargetsResult = metricTargetsQuery.data
        ? (Array.isArray(metricTargetsQuery.data) ? metricTargetsQuery.data : metricTargetsQuery.data.data || [])
        : [];

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

      // Calculate YoY changes
      const totalYoY = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
      const s1YoY = s1Previous > 0 ? ((s1Current - s1Previous) / s1Previous) * 100 : 0;
      const s2YoY = s2Previous > 0 ? ((s2Current - s2Previous) / s2Previous) * 100 : 0;
      const s3YoY = s3Previous > 0 ? ((s3Current - s3Previous) / s3Previous) * 100 : 0;

      // Multiple intensity metrics
      const employees = scopeData.organizationEmployees || extractedScopeData.organizationEmployees || 200;
      const revenue = scopeData.annualRevenue || extractedScopeData.annualRevenue || 0;
      const totalArea = scopeData.totalAreaSqm || extractedScopeData.totalAreaSqm || 0;

      // Per employee (tCO2e/FTE)
      const intensityEmployee = employees > 0 ? currentTotal / employees : 0;
      const prevIntensityEmployee = employees > 0 ? previousTotal / employees : 0;
      const intensityYoYCalc = prevIntensityEmployee > 0 ? ((intensityEmployee - prevIntensityEmployee) / prevIntensityEmployee) * 100 : 0;

      // Per revenue (tCO2e/M€ or tCO2e/M$)
      const intensityRev = revenue > 0 ? (currentTotal * 1000000) / revenue : 0;

      // Per sqm (kgCO2e/m²)
      const intensitySqm = totalArea > 0 ? (currentTotal * 1000) / totalArea : 0;

      // Use comprehensive intensity metrics from API if available
      let intensityMetricsResult;
      let intensityPerEmployeeResult;
      let intensityPerRevenueResult;
      let intensityPerSqmResult;
      let intensityMetricResult;

      if (scopeData.intensityMetrics) {
        intensityMetricsResult = scopeData.intensityMetrics;
        intensityPerEmployeeResult = scopeData.intensityMetrics.perEmployee;
        intensityPerRevenueResult = scopeData.intensityMetrics.perRevenue;
        intensityPerSqmResult = scopeData.intensityMetrics.perSqm;
        intensityMetricResult = scopeData.intensityMetrics.perEmployee;
      } else {
        intensityMetricResult = intensityEmployee;
        intensityPerEmployeeResult = intensityEmployee;
        intensityPerRevenueResult = intensityRev;
        intensityPerSqmResult = intensitySqm;
        intensityMetricsResult = {
          perEmployee: intensityEmployee,
          perRevenue: intensityRev,
          perSqm: intensitySqm,
          perValueAdded: 0,
          perOperatingHour: 0,
          perCustomer: 0,
          sectorSpecific: null,
          scope1: { perEmployee: 0, perRevenue: 0, perSqm: 0 },
          scope2: { perEmployee: 0, perRevenue: 0, perSqm: 0 },
          scope3: { perEmployee: 0, perRevenue: 0, perSqm: 0 }
        };
      }

      // Scope 2 dual reporting and categories
      const scope2LocationBasedResult = extractedScopeData.scope_2?.locationBased || s2Current;
      const scope2MarketBasedResult = extractedScopeData.scope_2?.marketBased || s2Current;
      const renewablePercentageResult = extractedScopeData.scope_2?.renewablePercentage || 0;

      // Extract Scope 2 categories
      const scope2CategoriesDataResult = extractedScopeData.scope_2?.categories || {};

      // Scope 3 coverage - categories is an object with nested data
      const scope3Categories = extractedScopeData.scope_3?.categories || {};

      // Extract emissions from nested objects or use direct values
      const scope3CategoriesFlat: any = {};
      Object.entries(scope3Categories).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if ('value' in value) {
            const emissionsValue = (value as any).value;
            scope3CategoriesFlat[key] = emissionsValue;
          } else if ('emissions' in value) {
            const emissionsValue = (value as any).emissions / 1000;
            scope3CategoriesFlat[key] = emissionsValue;
          }
        } else if (typeof value === 'number') {
          scope3CategoriesFlat[key] = value;
        }
      });

      const trackedCategories = Object.values(scope3CategoriesFlat).filter((emissions: any) => emissions > 0).length;

      const scope3CoverageResult = {
        tracked: trackedCategories,
        missing: 15 - trackedCategories,
        percentage: (trackedCategories / 15) * 100
      };

      // Monthly trends from dashboard API with enterprise forecasting
      let monthlyTrendsResult: any[] = [];
      let projectedAnnualEmissionsResult = 0;
      let actualEmissionsYTDResult = 0;
      let forecastedEmissionsResult = 0;

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

        // Use forecast data from React Query hook instead of fetch()
        if (forecast.data && forecast.data.forecast && forecast.data.forecast.length > 0) {
          const forecastData = forecast.data;

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

          // Store projected emissions
          projectedAnnualEmissionsResult = projectedTotal;
          actualEmissionsYTDResult = actualEmissions;
          forecastedEmissionsResult = forecastedEmissionsTotal;

          // Add forecast keys to the last actual data point to create smooth transition
          const lastActual = trends[trends.length - 1];
          const modifiedTrends = [...trends];
          modifiedTrends[modifiedTrends.length - 1] = {
            ...lastActual,
            totalForecast: lastActual.total,
            scope1Forecast: lastActual.scope1,
            scope2Forecast: lastActual.scope2,
            scope3Forecast: lastActual.scope3
          };

          // Add target reduction path to each data point
          const combinedTrends = [...modifiedTrends, ...forecastMonths];
          monthlyTrendsResult = addTargetPath(combinedTrends, targetDataResult, replanningTrajectoryResult);
        } else {
          monthlyTrendsResult = addTargetPath(trends, targetDataResult, replanningTrajectoryResult);
        }
      } else if (dashboardData.trends) {
        monthlyTrendsResult = addTargetPath(dashboardData.trends, targetDataResult, replanningTrajectoryResult);
      }

      // Fetch previous year dashboard data using React Query hook instead of fetch()
      let prevYearMonthlyTrendsResult: any[] = [];
      if (prevYearDashboard.data && prevYearDashboard.data.trendData && prevYearDashboard.data.trendData.length > 0) {
        const prevDashboardData = prevYearDashboard.data;
        prevYearMonthlyTrendsResult = prevDashboardData.trendData.map((m: any) => ({
          month: m.month,
          total: m.emissions || 0,
          scope1: m.scope1 || 0,
          scope2: m.scope2 || 0,
          scope3: m.scope3 || 0,
          monthKey: m.monthKey || undefined
        }));
      }

      // Fetch Top Emitters using React Query hook instead of fetch()
      let topEmittersResult: Array<{ name: string; emissions: number; percentage: number; scope: string }> = [];
      if (topMetrics.data && topMetrics.data.metrics && topMetrics.data.metrics.length > 0) {
        const topMetricsData = topMetrics.data;
        topEmittersResult = topMetricsData.metrics.slice(0, 5).map((metric: any) => ({
          name: metric.name,
          emissions: metric.emissions,
          percentage: currentTotal > 0 ? (metric.emissions / currentTotal) * 100 : 0,
          scope: metric.scope === 'scope_1' ? 'Scope 1' : metric.scope === 'scope_2' ? 'Scope 2' : 'Scope 3'
        }));
      }

      // Fetch Scope 2 individual metrics using React Query hook instead of fetch()
      let scope2MetricsResult: any[] = [];
      if (scope2MetricsQuery.data && scope2MetricsQuery.data.metrics && scope2MetricsQuery.data.metrics.length > 0) {
        const scope2MetricsData = scope2MetricsQuery.data;
        scope2MetricsResult = scope2MetricsData.metrics
          .filter((metric: any) => metric.scope === 'scope_2')
          .map((metric: any) => ({
            name: metric.name,
            emissions: metric.emissions,
            percentage: s2Current > 0 ? (metric.emissions / s2Current) * 100 : 0
          }));
      }

      // Scope 1 detailed breakdown
      let scope1SourcesResult: any[] = [];
      if (extractedScopeData.scope_1?.categories) {
        Object.entries(extractedScopeData.scope_1.categories).forEach(([key, value]) => {
          if ((value as number) > 0) {
            scope1SourcesResult.push({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              emissions: value as number
            });
          }
        });
      }

      // Scope 1 by gas type (if available)
      let scope1ByGasResult: any[] = [];
      if (extractedScopeData.scope_1?.byGasType) {
        scope1ByGasResult = Object.entries(extractedScopeData.scope_1.byGasType)
          .filter(([_, value]) => (value as number) > 0)
          .map(([name, emissions]) => ({
            name: name.toUpperCase(),
            value: emissions as number
          }));
      }

      // Geographic breakdown (if available)
      let geographicBreakdownResult: any[] = [];
      if (scopeData.geographicBreakdown) {
        geographicBreakdownResult = scopeData.geographicBreakdown;
      }

      // Data quality metrics
      const dataQualityResult = scopeData.dataQuality || null;

      return {
        totalEmissions: currentTotal,
        totalEmissionsYoY: totalYoY,
        intensityMetric: intensityMetricResult,
        intensityYoY: intensityYoYCalc,
        intensityMetrics: intensityMetricsResult,
        intensityPerEmployee: intensityPerEmployeeResult,
        intensityPerRevenue: intensityPerRevenueResult,
        intensityPerSqm: intensityPerSqmResult,
        siteComparison: scopeData.siteComparison || [],
        scope1Total: s1Current,
        scope2Total: s2Current,
        scope3Total: s3Current,
        scopeYoY: { scope1: s1YoY, scope2: s2YoY, scope3: s3YoY },
        scope2LocationBased: scope2LocationBasedResult,
        scope2MarketBased: scope2MarketBasedResult,
        renewablePercentage: renewablePercentageResult,
        scope2CategoriesData: scope2CategoriesDataResult,
        scope2Metrics: scope2MetricsResult,
        scope3Coverage: scope3CoverageResult,
        scope3CategoriesData: scope3CategoriesFlat,
        monthlyTrends: monthlyTrendsResult,
        prevYearMonthlyTrends: prevYearMonthlyTrendsResult,
        replanningTrajectory: replanningTrajectoryResult,
        topEmitters: topEmittersResult,
        scope1Sources: scope1SourcesResult,
        scope1ByGas: scope1ByGasResult,
        geographicBreakdown: geographicBreakdownResult,
        targetData: targetDataResult,
        dataQuality: dataQualityResult,
        projectedAnnualEmissions: projectedAnnualEmissionsResult,
        actualEmissionsYTD: actualEmissionsYTDResult,
        forecastedEmissions: forecastedEmissionsResult,
        previousYearTotalEmissions: fullPreviousYearTotal,
        metricTargets: metricTargetsResult,
      };
    } catch (error) {
      console.error('Error processing emissions data:', error);
      // Return default values on error
      return {
        totalEmissions: 0,
        totalEmissionsYoY: 0,
        intensityMetric: 0,
        intensityYoY: 0,
        intensityMetrics: {
          perEmployee: 0,
          perRevenue: 0,
          perSqm: 0,
          perValueAdded: 0,
          perOperatingHour: 0,
          perCustomer: 0,
          sectorSpecific: null,
          scope1: { perEmployee: 0, perRevenue: 0, perSqm: 0 },
          scope2: { perEmployee: 0, perRevenue: 0, perSqm: 0 },
          scope3: { perEmployee: 0, perRevenue: 0, perSqm: 0 }
        },
        intensityPerEmployee: 0,
        intensityPerRevenue: 0,
        intensityPerSqm: 0,
        siteComparison: [],
        scope1Total: 0,
        scope2Total: 0,
        scope3Total: 0,
        scopeYoY: { scope1: 0, scope2: 0, scope3: 0 },
        scope2LocationBased: 0,
        scope2MarketBased: 0,
        renewablePercentage: 0,
        scope2CategoriesData: {},
        scope2Metrics: [],
        scope3Coverage: null,
        scope3CategoriesData: {},
        monthlyTrends: [],
        prevYearMonthlyTrends: [],
        replanningTrajectory: null,
        topEmitters: [],
        scope1Sources: [],
        scope1ByGas: [],
        geographicBreakdown: [],
        targetData: null,
        dataQuality: null,
        projectedAnnualEmissions: 0,
        actualEmissionsYTD: 0,
        forecastedEmissions: 0,
        previousYearTotalEmissions: 0,
        metricTargets: [],
      };
    }
  }, [
    scopeAnalysis.data,
    dashboard.data,
    prevYearScopeAnalysis.data,
    fullPrevYearScopeAnalysis.data,
    targets.data,
    trajectory.data,
    feasibility.data,
    metricTargetsQuery.data,
    forecast.data,
    prevYearDashboard.data,
    topMetrics.data,
    scope2MetricsQuery.data,
    selectedPeriod,
    selectedSite,
    organizationId
  ]);

  // Destructure all computed metrics
  const {
    totalEmissions,
    totalEmissionsYoY,
    intensityMetric,
    intensityYoY,
    intensityMetrics,
    intensityPerEmployee,
    intensityPerRevenue,
    intensityPerSqm,
    siteComparison,
    scope1Total,
    scope2Total,
    scope3Total,
    scopeYoY,
    scope2LocationBased,
    scope2MarketBased,
    renewablePercentage,
    scope2CategoriesData,
    scope2Metrics,
    scope3Coverage,
    scope3CategoriesData,
    monthlyTrends,
    prevYearMonthlyTrends,
    replanningTrajectory,
    topEmitters,
    scope1Sources,
    scope1ByGas,
    geographicBreakdown,
    targetData,
    dataQuality,
    projectedAnnualEmissions,
    actualEmissionsYTD,
    forecastedEmissions,
    previousYearTotalEmissions,
    metricTargets,
  } = dashboardMetrics;
