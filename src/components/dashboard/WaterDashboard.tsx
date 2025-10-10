"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Droplet,
  TrendingUp,
  TrendingDown,
  Cloud,
  Waves,
  Home,
  Recycle,
  DollarSign,
  Activity,
  Gauge,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface WaterDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: { start: string; end: string; label: string };
}

interface WaterSource {
  name: string;
  type: string;
  withdrawal: number;
  discharge: number;
  cost: number;
  isRecycled: boolean;
}

export function WaterDashboard({
  organizationId,
  selectedSite,
  selectedPeriod,
}: WaterDashboardProps) {
  const [loading, setLoading] = React.useState(true);
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  const [totalWithdrawal, setTotalWithdrawal] = useState(0);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalDischarge, setTotalDischarge] = useState(0);
  const [totalRecycled, setTotalRecycled] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [recyclingRate, setRecyclingRate] = useState(0);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [prevYearMonthlyTrends, setPrevYearMonthlyTrends] = useState<any[]>([]);
  const [waterIntensity, setWaterIntensity] = useState(0);
  const [endUseBreakdown, setEndUseBreakdown] = useState<any[]>([]);
  const [endUseYoY, setEndUseYoY] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);

  // YoY comparison state
  const [yoyWithdrawalChange, setYoyWithdrawalChange] = useState<number | null>(
    null,
  );
  const [yoyConsumptionChange, setYoyConsumptionChange] = useState<
    number | null
  >(null);
  const [yoyDischargeChange, setYoyDischargeChange] = useState<number | null>(
    null,
  );
  const [yoyRecyclingChange, setYoyRecyclingChange] = useState<number | null>(
    null,
  );

  // Water reduction target state
  const [waterTarget, setWaterTarget] = useState<any>(null);
  const [defaultTargetPercent] = useState(2.5); // CDP Water Security benchmark: 2.5% annual reduction

  // Fetch water data
  React.useEffect(() => {
    const fetchWaterData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedPeriod) {
          params.append("start_date", selectedPeriod.start);
          params.append("end_date", selectedPeriod.end);
        }
        if (selectedSite) {
          params.append("site_id", selectedSite.id);
        }

        const res = await fetch(`/api/water/sources?${params}`);
        const data = await res.json();

        if (data.sources) {
          setWaterSources(data.sources);
          setTotalWithdrawal(data.total_withdrawal || 0);
          setTotalConsumption(data.total_consumption || 0);
          setTotalDischarge(data.total_discharge || 0);
          setTotalRecycled(data.total_recycled || 0);
          setTotalCost(data.total_cost || 0);
          setRecyclingRate(data.recycling_rate || 0);
          setMonthlyTrends(data.monthly_trends || []);
          setWaterIntensity(data.water_intensity || 0);
          setEndUseBreakdown(data.end_use_breakdown || []);
          setEndUseYoY(data.end_use_yoy || []);
        }

        // Fetch previous year data for YoY comparison (matching Energy dashboard pattern)
        if (
          selectedPeriod &&
          data.monthly_trends &&
          data.monthly_trends.length > 0
        ) {
          const startDate = new Date(selectedPeriod.start);
          const previousYearStart = new Date(startDate);
          previousYearStart.setFullYear(startDate.getFullYear() - 1);

          const endDate = new Date(selectedPeriod.end);
          const previousYearEnd = new Date(endDate);
          previousYearEnd.setFullYear(endDate.getFullYear() - 1);

          const prevParams = new URLSearchParams({
            start_date: previousYearStart.toISOString().split("T")[0],
            end_date: previousYearEnd.toISOString().split("T")[0],
          });
          if (selectedSite) {
            prevParams.append("site_id", selectedSite.id);
          }

          const prevRes = await fetch(`/api/water/sources?${prevParams}`);
          const prevData = await prevRes.json();

          console.log(
            "  Previous year API response:",
            prevData.monthly_trends?.length || 0,
            "months",
          );
          if (prevData.monthly_trends && prevData.monthly_trends.length > 0) {
            console.log(
              "  Previous year months:",
              prevData.monthly_trends.map((m: any) => m.monthKey).join(", "),
            );
            setPrevYearMonthlyTrends(prevData.monthly_trends);
            console.log(
              "📊 Water Previous Year Monthly Trends:",
              prevData.monthly_trends.length,
              "months",
            );
          } else {
            console.log("⚠️ No previous year water monthly trends available");
            setPrevYearMonthlyTrends([]);
          }

          // Calculate YoY changes (matching Energy dashboard pattern)
          if (prevData.total_withdrawal && prevData.total_withdrawal > 0) {
            const withdrawalChange =
              ((data.total_withdrawal - prevData.total_withdrawal) /
                prevData.total_withdrawal) *
              100;
            const consumptionChange =
              ((data.total_consumption - prevData.total_consumption) /
                prevData.total_consumption) *
              100;
            const dischargeChange =
              ((data.total_discharge - prevData.total_discharge) /
                prevData.total_discharge) *
              100;
            const recyclingChange =
              data.recycling_rate - prevData.recycling_rate;

            setYoyWithdrawalChange(withdrawalChange);
            setYoyConsumptionChange(consumptionChange);
            setYoyDischargeChange(dischargeChange);
            setYoyRecyclingChange(recyclingChange);
          }
        }

        // Calculate water reduction target (CDP Water Security benchmark)
        // Only show for current year
        const baselineYear = 2023;
        const currentYear = new Date().getFullYear();
        const selectedYear = selectedPeriod ? new Date(selectedPeriod.start).getFullYear() : currentYear;

        // Only calculate target if viewing current year
        if (selectedYear === currentYear) {
          const yearsSinceBaseline = currentYear - baselineYear;

          // For baseline, we need full year 2023 data
          const baseline2023Params = new URLSearchParams({
            start_date: "2023-01-01",
            end_date: "2023-12-31",
          });
          if (selectedSite) {
            baseline2023Params.append("site_id", selectedSite.id);
          }

          const baseline2023Res = await fetch(
            `/api/water/sources?${baseline2023Params}`,
          );
          const baseline2023Data = await baseline2023Res.json();
          const baseline2023Consumption = baseline2023Data.total_consumption || 0;

          // Calculate target for current year using compound reduction
          const annualReductionRate = defaultTargetPercent / 100; // 2.5% = 0.025
          const targetConsumption =
            baseline2023Consumption *
            Math.pow(1 - annualReductionRate, yearsSinceBaseline);

          // Project full year consumption based on current data
          const monthsOfData = monthlyTrends.length;
          const projectedFullYear =
            monthsOfData > 0 ? (data.total_consumption / monthsOfData) * 12 : 0;

          // Calculate progress
          const reductionNeeded = baseline2023Consumption - targetConsumption;
          const reductionAchieved = baseline2023Consumption - projectedFullYear;
          const progressPercent =
            reductionNeeded > 0 ? (reductionAchieved / reductionNeeded) * 100 : 0;

          setWaterTarget({
            baseline: baseline2023Consumption,
            target: targetConsumption,
            projected: projectedFullYear,
            progressPercent,
            annualReductionRate: defaultTargetPercent,
            isDefault: true, // Flag to show it's using CDP default
            targetYear: currentYear,
          });
        } else {
          // Clear target when viewing past years
          setWaterTarget(null);
        }

        // Fetch water forecast data
        if (selectedPeriod) {
          const forecastParams = new URLSearchParams({
            start_date: selectedPeriod.start,
            end_date: selectedPeriod.end,
          });
          if (selectedSite) {
            forecastParams.append("site_id", selectedSite.id);
          }

          const forecastRes = await fetch(`/api/water/forecast?${forecastParams}`);
          const forecastData = await forecastRes.json();

          if (forecastData.forecast && forecastData.forecast.length > 0) {
            console.log(`🔮 Water Forecast: ${forecastData.forecast.length} months, Method: ${forecastData.model}`);
            setForecastData(forecastData);
          } else {
            console.log('⚠️ No water forecast data available');
            setForecastData(null);
          }
        }
      } catch (error) {
        console.error("Error fetching water data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWaterData();
  }, [selectedSite, selectedPeriod, defaultTargetPercent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const getSourceColor = (type: string) => {
    const colors: { [key: string]: string } = {
      municipal: "#3b82f6",
      groundwater: "#06b6d4",
      surface_water: "#0ea5e9",
      rainwater: "#60a5fa",
      recycled: "#10b981",
      seawater: "#0284c7",
      wastewater: "#6b7280",
      other: "#94a3b8",
      // End-use colors
      toilet: "#8b5cf6",
      kitchen: "#f59e0b",
      cleaning: "#06b6d4",
      irrigation: "#10b981",
      other_use: "#6366f1",
    };
    return colors[type] || colors["other"];
  };

  // Prepare data for source breakdown pie chart
  const sourceBreakdown = waterSources.map((source) => ({
    name: source.name,
    value: source.withdrawal,
    type: source.type,
    discharge: source.discharge,
    isRecycled: source.isRecycled,
  }));

  const totalWithdrawalForPie = sourceBreakdown.reduce(
    (sum, s) => sum + s.value,
    0,
  );

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Droplet className="w-6 h-6 text-blue-500" />
            Water & Effluents
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            GRI 303 • ESRS E3 • Water withdrawal, consumption, discharge &
            recycling
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 pb-6 grid grid-cols-5 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Withdrawal
            </span>
            <Droplet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(totalWithdrawal / 1000).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">ML</div>
            </div>
            {yoyWithdrawalChange !== null && (
              <div className="flex items-center gap-1">
                {yoyWithdrawalChange >= 0 ? (
                  <TrendingUp
                    className={`w-3 h-3 ${yoyWithdrawalChange > 0 ? "text-red-500" : "text-gray-400"}`}
                  />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span
                  className={`text-xs ${yoyWithdrawalChange > 0 ? "text-red-500" : yoyWithdrawalChange < 0 ? "text-green-500" : "text-gray-400"}`}
                >
                  {yoyWithdrawalChange > 0 ? "+" : ""}
                  {yoyWithdrawalChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Consumption
            </span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(totalConsumption / 1000).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">ML</div>
            </div>
            {yoyConsumptionChange !== null && (
              <div className="flex items-center gap-1">
                {yoyConsumptionChange >= 0 ? (
                  <TrendingUp
                    className={`w-3 h-3 ${yoyConsumptionChange > 0 ? "text-red-500" : "text-gray-400"}`}
                  />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span
                  className={`text-xs ${yoyConsumptionChange > 0 ? "text-red-500" : yoyConsumptionChange < 0 ? "text-green-500" : "text-gray-400"}`}
                >
                  {yoyConsumptionChange > 0 ? "+" : ""}
                  {yoyConsumptionChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Discharge
            </span>
            <Waves className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(totalDischarge / 1000).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">ML</div>
            </div>
            {yoyDischargeChange !== null && (
              <div className="flex items-center gap-1">
                {yoyDischargeChange >= 0 ? (
                  <TrendingUp
                    className={`w-3 h-3 ${yoyDischargeChange > 0 ? "text-red-500" : "text-gray-400"}`}
                  />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span
                  className={`text-xs ${yoyDischargeChange > 0 ? "text-red-500" : yoyDischargeChange < 0 ? "text-green-500" : "text-gray-400"}`}
                >
                  {yoyDischargeChange > 0 ? "+" : ""}
                  {yoyDischargeChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Recycling Rate
            </span>
            <Recycle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {recyclingRate.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              of total
            </div>
            {yoyRecyclingChange !== null && (
              <div className="flex items-center gap-1">
                {yoyRecyclingChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={`text-xs ${yoyRecyclingChange >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {yoyRecyclingChange > 0 ? "+" : ""}
                  {yoyRecyclingChange.toFixed(1)}pp YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Intensity
            </span>
            <Gauge className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(waterIntensity / 1000).toFixed(3)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ML per employee
          </div>
        </div>
      </div>

      {/* Water Sources Distribution and Monthly Trends */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-4">
        {/* Water Sources Distribution Pie Chart */}
        {sourceBreakdown.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Water Sources Distribution
              </h3>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 303-3
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E3
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => {
                    const percent = (
                      (entry.value / totalWithdrawalForPie) *
                      100
                    ).toFixed(1);
                    const words = entry.name.split(" ");
                    // If name has multiple words, split into 3 lines max
                    if (words.length > 2) {
                      return `${words.slice(0, 2).join(" ")}\n${words.slice(2).join(" ")}\n${percent}%`;
                    } else if (words.length === 2) {
                      return `${words[0]}\n${words[1]}\n${percent}%`;
                    }
                    return `${entry.name}\n${percent}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: "11px" }}
                >
                  {sourceBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getSourceColor(entry.type)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = getSourceColor(data.type);

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {data.name}
                          </p>
                          <p className="text-sm" style={{ color }}>
                            Withdrawal: {(data.value / 1000).toFixed(2)} ML
                          </p>
                          <p className="text-sm" style={{ color }}>
                            Share:{" "}
                            {(
                              (data.value / totalWithdrawalForPie) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Discharge: {(data.discharge / 1000).toFixed(2)} ML
                          </p>
                          {data.isRecycled && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              Recycled
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

        {/* Monthly Water Balance Trend */}
        {monthlyTrends.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Monthly Water Balance
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Withdrawal, discharge, and consumption
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E3
                </span>
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                  TCFD
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(() => {
                // Prepare chart data with separate keys for actual and forecast
                const actualData = monthlyTrends;

                if (!forecastData || !forecastData.forecast || forecastData.forecast.length === 0) {
                  return actualData;
                }

                // Create forecast months with separate keys
                const forecastMonths = forecastData.forecast.map((f: any) => ({
                  month: f.month,
                  withdrawalForecast: f.withdrawal || 0,
                  dischargeForecast: f.discharge || 0,
                  consumptionForecast: f.consumption || 0,
                  forecast: true
                }));

                // Create bridge point to connect actual and forecast lines
                const lastActual = actualData[actualData.length - 1];
                const bridgePoint = {
                  month: lastActual.month,
                  // Actual data keys (for solid lines)
                  withdrawal: lastActual.withdrawal,
                  discharge: lastActual.discharge,
                  consumption: lastActual.consumption,
                  // Forecast data keys with same values (for dashed lines)
                  withdrawalForecast: lastActual.withdrawal,
                  dischargeForecast: lastActual.discharge,
                  consumptionForecast: lastActual.consumption,
                  bridge: true
                };

                return [...actualData, bridgePoint, ...forecastMonths];
              })()}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "#888", fontSize: 12 }}
                  label={{
                    value: "ML",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#888", fontSize: 12 },
                  }}
                  tickFormatter={(value) => (value / 1000).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isForecast = data.forecast;

                      // Get values from either actual or forecast keys
                      const withdrawal = data.withdrawal ?? data.withdrawalForecast;
                      const discharge = data.discharge ?? data.dischargeForecast;
                      const consumption = data.consumption ?? data.consumptionForecast;

                      // Skip if all values are null
                      if (!withdrawal && !discharge && !consumption) {
                        return null;
                      }

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {data.month}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">(Forecast)</span>}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm" style={{ color: "#3b82f6" }}>
                              Withdrawal: {((withdrawal || 0) / 1000).toFixed(2)} ML
                            </p>
                            <p className="text-sm" style={{ color: "#06b6d4" }}>
                              Discharge: {((discharge || 0) / 1000).toFixed(2)} ML
                            </p>
                            <p className="text-sm" style={{ color: "#6366f1" }}>
                              Consumption: {((consumption || 0) / 1000).toFixed(2)} ML
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {/* Actual data - solid lines */}
                <Line
                  type="monotone"
                  dataKey="withdrawal"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  name="Withdrawal"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="discharge"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#06b6d4" }}
                  name="Discharge"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#6366f1" }}
                  name="Consumption (Total)"
                  connectNulls
                />
                {/* Forecast data - dashed lines (hidden from legend) */}
                {forecastData && forecastData.forecast && forecastData.forecast.length > 0 && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="withdrawalForecast"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#3b82f6", strokeWidth: 2, r: 3 }}
                      name="Withdrawal"
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="dischargeForecast"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#06b6d4", strokeWidth: 2, r: 3 }}
                      name="Discharge"
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="consumptionForecast"
                      stroke="#6366f1"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#6366f1", strokeWidth: 2, r: 4 }}
                      name="Consumption (Total)"
                      connectNulls
                      legendType="none"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Year-over-Year Comparison and Water Balance */}
      {monthlyTrends.length > 0 && (
        <div className="px-6 pb-6 grid grid-cols-2 gap-4">
          {/* Monthly YoY Comparison - only show when we have previous year data */}
          {yoyWithdrawalChange !== null && prevYearMonthlyTrends.length > 0 && (
            <div
              className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex flex-col"
              style={{ height: "430px" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Monthly YoY Comparison
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total consumption vs previous year
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                    GRI 303-5
                  </span>
                  <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                    TCFD
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={(() => {
                    // GRI 303-5: Water Consumption YoY comparison
                    const chartData = monthlyTrends.map((trend: any) => {
                      // Extract year from monthKey (format: "2025-01")
                      const currentYear = parseInt(
                        trend.monthKey.split("-")[0],
                      );
                      const monthNum = trend.monthKey.split("-")[1];
                      const prevYearKey = `${currentYear - 1}-${monthNum}`;

                      // Find matching month from previous year by monthKey
                      const prevTrend = prevYearMonthlyTrends.find(
                        (prev: any) =>
                          prev.monthKey === prevYearKey ||
                          prev.month === trend.month,
                      );

                      // Calculate consumption (withdrawal - discharge) for GRI 303-5
                      const currentConsumption =
                        trend.consumption || trend.withdrawal - trend.discharge;
                      const previousConsumption = prevTrend
                        ? prevTrend.consumption ||
                          prevTrend.withdrawal - prevTrend.discharge
                        : 0;

                      // Calculate month-specific YoY change
                      let change = 0;

                      if (previousConsumption > 0) {
                        change =
                          ((currentConsumption - previousConsumption) /
                            previousConsumption) *
                          100;
                      }

                      return {
                        month: trend.month,
                        monthKey: trend.monthKey,
                        change: change,
                        current: currentConsumption,
                        previous: previousConsumption,
                      };
                    });

                    return chartData;
                  })()}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#888", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "#888", fontSize: 12 }}
                    tickFormatter={(value) =>
                      `${value > 0 ? "+" : ""}${value}%`
                    }
                    label={{
                      value: "Change (%)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#888", fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const change = data.change;
                        const current = data.current;
                        const previous = data.previous;
                        return (
                          <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                            <p className="text-white font-semibold mb-2">
                              {data.month}
                            </p>
                            <div className="space-y-1 text-xs mb-2">
                              <p className="text-gray-300">
                                Current:{" "}
                                <span className="font-medium text-white">
                                  {(current / 1000).toFixed(2)} ML
                                </span>
                              </p>
                              <p className="text-gray-300">
                                Last Year:{" "}
                                <span className="font-medium text-white">
                                  {(previous / 1000).toFixed(2)} ML
                                </span>
                              </p>
                            </div>
                            <p
                              className={`text-sm font-bold ${change >= 0 ? "text-red-400" : "text-green-400"}`}
                            >
                              {change > 0 ? "+" : ""}
                              {change.toFixed(1)}% YoY
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {change >= 0 ? "Increase" : "Decrease"} in
                              consumption
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="change" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Water Balance Summary */}
          {waterSources.length > 0 && (
            <div
              className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex flex-col"
              style={{ height: "430px" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Water Balance Summary
                  </h3>
                  <div
                    className="group relative"
                    title="GRI 303-5: Water consumption is calculated as total withdrawal minus total discharge. This represents water that is not returned to local ecosystems or communities."
                  >
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto absolute z-[9999] w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-2xl left-0 top-7 border border-gray-700 transition-opacity duration-200">
                      <strong>GRI 303-5:</strong> Water consumption is
                      calculated as total withdrawal minus total discharge. This
                      represents water that is not returned to local ecosystems
                      or communities.
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                    GRI 303-5
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                    ESRS E3
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-evenly">
                <div className="space-y-8">
                  {/* Withdrawal */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Total Withdrawal
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {(totalWithdrawal / 1000).toFixed(1)} ML
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  {/* Discharge */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Total Discharge
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {(totalDischarge / 1000).toFixed(1)} ML
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-cyan-500"
                        style={{
                          width: `${(totalDischarge / totalWithdrawal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Consumption */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Consumption (W - D)
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {(totalConsumption / 1000).toFixed(1)} ML
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{
                          width: `${(totalConsumption / totalWithdrawal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recycled */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Recycle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Recycled Water
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {(totalRecycled / 1000).toFixed(1)} ML (
                        {recyclingRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${recyclingRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Water Reduction Target */}
      {waterTarget && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Water Reduction Target
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {waterTarget.isDefault ? "CDP Benchmark" : "Custom"} •{" "}
                  {waterTarget.annualReductionRate}% annual reduction • Baseline
                  2023
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 303-5
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  CDP Water
                </span>
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                  ESRS E3
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Water Consumption
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {waterTarget.isDefault
                      ? "Using CDP Water Security benchmark (2.5% annual)"
                      : `Custom target: ${waterTarget.annualReductionRate}% annual`}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xl font-bold ${
                      waterTarget.progressPercent >= 100
                        ? "text-green-600 dark:text-green-400"
                        : waterTarget.progressPercent >= 80
                          ? "text-blue-600 dark:text-blue-400"
                          : waterTarget.progressPercent >= 50
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {waterTarget.progressPercent.toFixed(0)}%
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      waterTarget.progressPercent >= 100
                        ? "text-green-600 dark:text-green-400"
                        : waterTarget.progressPercent >= 80
                          ? "text-blue-600 dark:text-blue-400"
                          : waterTarget.progressPercent >= 50
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {waterTarget.progressPercent >= 100
                      ? "exceeding"
                      : waterTarget.progressPercent >= 80
                        ? "on track"
                        : waterTarget.progressPercent >= 50
                          ? "at risk"
                          : "off track"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Baseline
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">2023</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {(waterTarget.baseline / 1000).toFixed(2)} ML
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Target</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {waterTarget.targetYear}
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {(waterTarget.target / 1000).toFixed(2)} ML
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Projected
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {waterTarget.targetYear}
                  </div>
                  <div
                    className={`font-medium ${
                      waterTarget.projected <= waterTarget.target
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {(waterTarget.projected / 1000).toFixed(2)} ML
                  </div>
                </div>
              </div>

              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    waterTarget.progressPercent >= 100
                      ? "bg-green-500"
                      : waterTarget.progressPercent >= 80
                        ? "bg-blue-500"
                        : waterTarget.progressPercent >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(waterTarget.progressPercent, 0), 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
