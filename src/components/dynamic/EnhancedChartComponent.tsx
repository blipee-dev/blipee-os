"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Treemap,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface EnhancedChartComponentProps {
  title?: string;
  subtitle?: string;
  chartType?:
    | "line"
    | "bar"
    | "pie"
    | "area"
    | "doughnut"
    | "radial"
    | "treemap"
    | "scatter"
    | "waterfall"
    | "emissions-trend"
    | "scope-breakdown"
    | "target-progress";
  data?: any;
  target?: number;
  showTrend?: boolean;
  unit?: string;
  options?: any;
}

// Our brand colors
const BRAND_COLORS = [
  "#ec4899", // pink-500
  "#a855f7", // purple-500
  "#6366f1", // indigo-500
  "#3b82f6", // blue-500
  "#14b8a6", // teal-500
  "#f59e0b", // amber-500
];

const BRAND_COLORS_LIGHT = [
  "#db2777", // pink-600
  "#9333ea", // purple-600
  "#4f46e5", // indigo-600
  "#2563eb", // blue-600
  "#0d9488", // teal-600
  "#d97706", // amber-600
];

// Sustainability-specific color schemes
const EMISSION_COLORS = {
  scope1: "#ef4444", // red-500 - Direct emissions
  scope2: "#f59e0b", // amber-500 - Indirect energy
  scope3: "#3b82f6", // blue-500 - Value chain
  reduction: "#10b981", // emerald-500 - Reductions
  target: "#a855f7", // purple-500 - Target line
};

export function EnhancedChartComponent({
  title,
  subtitle,
  chartType = "line",
  data = [],
  target,
  showTrend = false,
  unit = "",
  options = {},
}: EnhancedChartComponentProps) {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsLightMode(document.documentElement.classList.contains("light-mode"));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Format data for recharts
  const chartData = Array.isArray(data) ? data : data.data || [];

  // Calculate trend if requested
  const calculateTrend = () => {
    if (!showTrend || chartData.length < 2) return null;
    const firstValue = chartData[0]?.value || 0;
    const lastValue = chartData[chartData.length - 1]?.value || 0;
    const percentChange = ((lastValue - firstValue) / firstValue) * 100;
    return {
      value: percentChange,
      isPositive: percentChange > 0,
    };
  };

  const trend = calculateTrend();

  const colors = isLightMode ? BRAND_COLORS_LIGHT : BRAND_COLORS;
  const gridColor = isLightMode ? "#e5e7eb" : "#1e293b";
  const axisColor = isLightMode ? "#6b7280" : "#94a3b8";
  const tooltipBg = isLightMode ? "#ffffff" : "#1e293b";
  const tooltipBorder = isLightMode ? "#e5e7eb" : "none";
  const tooltipText = isLightMode ? "#1f2937" : "#f1f5f9";

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg shadow-lg"
          style={{
            backgroundColor: tooltipBg,
            border: tooltipBorder ? `1px solid ${tooltipBorder}` : "none",
            color: tooltipText,
          }}
        >
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} {unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case "emissions-trend":
        return (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip content={customTooltip} />
            {target && (
              <ReferenceLine
                y={target}
                stroke={EMISSION_COLORS.target}
                strokeDasharray="5 5"
                label={{
                  value: `Target: ${target} ${unit}`,
                  position: "right",
                  fill: EMISSION_COLORS.target,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              fillOpacity={1}
              fill="url(#colorEmissions)"
            />
          </AreaChart>
        );

      case "scope-breakdown":
        return (
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis type="number" stroke={axisColor} />
            <YAxis dataKey="name" type="category" stroke={axisColor} />
            <Tooltip content={customTooltip} />
            <Bar dataKey="scope1" stackId="a" fill={EMISSION_COLORS.scope1} />
            <Bar dataKey="scope2" stackId="a" fill={EMISSION_COLORS.scope2} />
            <Bar dataKey="scope3" stackId="a" fill={EMISSION_COLORS.scope3} />
            <Legend />
          </BarChart>
        );

      case "target-progress":
        return (
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="90%"
            data={chartData}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={colors[0]}
              background={{ fill: gridColor }}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-3xl font-bold"
              fill={axisColor}
            >
              {chartData[0]?.value}%
            </text>
            <text
              x="50%"
              y="60%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm"
              fill={axisColor}
            >
              of target
            </text>
          </RadialBarChart>
        );

      case "treemap":
        return (
          <Treemap
            data={chartData}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill={colors[0]}
          >
            <Tooltip content={customTooltip} />
          </Treemap>
        );

      case "scatter":
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              type="number"
              dataKey="x"
              name="Energy Use"
              stroke={axisColor}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Emissions"
              stroke={axisColor}
            />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="Size" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={customTooltip}
            />
            <Scatter name="Buildings" data={chartData} fill={colors[0]}>
              {chartData.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Scatter>
          </ScatterChart>
        );

      // Fall back to existing chart types
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip content={customTooltip} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip content={customTooltip} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip content={customTooltip} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              fillOpacity={1}
              fill="url(#colorArea)"
            />
          </AreaChart>
        );

      case "pie":
      case "doughnut":
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.name}: ${entry.value}${unit}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              innerRadius={chartType === "doughnut" ? 40 : 0}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card glass-card-default light-mode:bg-white/70 light-mode:border-gray-200"
      style={{
        background: isLightMode
          ? "rgba(255, 255, 255, 0.7)"
          : "rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${
          isLightMode ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.05)"
        }`,
        borderRadius: "1rem",
        padding: "1.5rem",
        boxShadow: isLightMode
          ? "0 4px 16px rgba(0, 0, 0, 0.06)"
          : "0 4px 16px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          {title && (
            <h3 className="text-lg font-medium text-white light-mode:text-gray-800">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-400 light-mode:text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {trend && (
          <div className="flex items-center space-x-2">
            {trend.isPositive ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-500" />
            )}
            <span
              className={`text-sm font-semibold ${
                trend.isPositive ? "text-red-500" : "text-green-500"
              }`}
            >
              {Math.abs(trend.value).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div className="w-full h-64">
        {chartType && (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div />}
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
