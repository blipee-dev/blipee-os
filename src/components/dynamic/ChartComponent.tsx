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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";

interface ChartComponentProps {
  title?: string;
  chartType?: "line" | "bar" | "pie" | "area" | "doughnut";
  data?: any;
  options?: any;
}

const COLORS = [
  "#0EA5E9",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];
const COLORS_LIGHT = [
  "#0080FF",
  "#6750A4",
  "#059669",
  "#D97706",
  "#DC2626",
  "#DB2777",
];

export function ChartComponent({
  title,
  chartType = "line",
  data = [],
}: ChartComponentProps) {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsLightMode(document.documentElement.classList.contains("light-mode"));
    };

    checkTheme();
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Format data for recharts
  const chartData = Array.isArray(data) ? data : data.data || [];

  const colors = isLightMode ? COLORS_LIGHT : COLORS;
  const gridColor = isLightMode ? "#e5e7eb" : "#1e293b";
  const axisColor = isLightMode ? "#6b7280" : "#94a3b8";
  const tooltipBg = isLightMode ? "#ffffff" : "#1e293b";
  const tooltipBorder = isLightMode ? "#e5e7eb" : "none";
  const tooltipText = isLightMode ? "#1f2937" : "#f1f5f9";

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder ? `1px solid ${tooltipBorder}` : "none",
                borderRadius: "8px",
                boxShadow: isLightMode ? "0 4px 16px rgba(0,0,0,0.1)" : "none",
              }}
              labelStyle={{ color: tooltipText }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={2}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder ? `1px solid ${tooltipBorder}` : "none",
                borderRadius: "8px",
                boxShadow: isLightMode ? "0 4px 16px rgba(0,0,0,0.1)" : "none",
              }}
              labelStyle={{ color: tooltipText }}
            />
            <Bar dataKey="value" fill={colors[0]} />
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} />
            <YAxis stroke={axisColor} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder ? `1px solid ${tooltipBorder}` : "none",
                borderRadius: "8px",
                boxShadow: isLightMode ? "0 4px 16px rgba(0,0,0,0.1)" : "none",
              }}
              labelStyle={{ color: tooltipText }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
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
              label={(entry) => entry.name}
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
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder ? `1px solid ${tooltipBorder}` : "none",
                borderRadius: "8px",
                boxShadow: isLightMode ? "0 4px 16px rgba(0,0,0,0.1)" : "none",
              }}
              labelStyle={{ color: tooltipText }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ color: axisColor }}
            />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="glass-card glass-card-default light-mode:bg-white/70 light-mode:border-gray-200"
      style={{
        background: isLightMode
          ? "rgba(255, 255, 255, 0.7)"
          : "rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${isLightMode ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.05)"}`,
        borderRadius: "1rem",
        padding: "1.5rem",
        boxShadow: isLightMode
          ? "0 4px 16px rgba(0, 0, 0, 0.06)"
          : "0 4px 16px rgba(0, 0, 0, 0.15)",
      }}
    >
      {title && (
        <h3 className="text-lg font-medium text-white light-mode:text-gray-800 mb-4">
          {title}
        </h3>
      )}
      <div className="w-full h-64">
        {chartType && (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div />}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
