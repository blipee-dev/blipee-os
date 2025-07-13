"use client";

import { useState, useEffect } from "react";
import { motion as _motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  TrendingDown,
  TrendingUp,

  Award,
  AlertTriangle,
  Sparkles,
  Zap,
  Droplets,
  Recycle,

  Globe,
  Factory,
  ArrowDown,
  ArrowUp,
  Activity,
} from "lucide-react";

interface SustainabilityDashboardProps {
  title?: string;
  widgets?: Array<{
    type: "metric" | "progress" | "comparison" | "alert";
    title: string;
    value: string | number;
    unit?: string;
    change?: number;
    trend?: "up" | "down" | "stable";
    target?: number;
    icon?: any;
    color?: string;
    subtitle?: string;
    data?: any;
  }>;
  timeRange?: "day" | "week" | "month" | "year";
  realTime?: boolean;
}

export function SustainabilityDashboard({
  title = "Sustainability Command Center",
  widgets = [],
  timeRange = "month",
  realTime = true,
}: SustainabilityDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animatedValues, setAnimatedValues] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    if (realTime) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
        // Simulate real-time data updates
        setAnimatedValues((prev) => {
          const newValues = { ...prev };
          widgets.forEach((widget, index) => {
            if (typeof widget.value === "number") {
              const variance = widget.value * 0.02; // 2% variance
              newValues[index] =
                widget.value + (Math.random() - 0.5) * variance;
            }
          });
          return newValues;
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [realTime, widgets]);

  const getIcon = (widget: any) => {
    if (widget.icon) return widget.icon;

    const title = widget.title.toLowerCase();
    if (title.includes("emission") || title.includes("co2")) return Leaf;
    if (title.includes("energy")) return Zap;
    if (title.includes("water")) return Droplets;
    if (title.includes("waste")) return Recycle;
    if (title.includes("tree") || title.includes("forest")) return TreePine;
    if (title.includes("scope")) return Globe;
    return Factory;
  };

  const getGradient = (color?: string) => {
    const gradients = {
      green: "from-emerald-400 to-green-600",
      blue: "from-blue-400 to-indigo-600",
      purple: "from-purple-400 to-pink-600",
      yellow: "from-yellow-400 to-orange-600",
      red: "from-red-400 to-rose-600",
    };
    return (
      gradients[color as keyof typeof gradients] ||
      "from-purple-400 to-pink-600"
    );
  };

  const MetricWidget = ({ widget, index }: { widget: any; index: number }) => {
    const Icon = getIcon(widget);
    const displayValue = animatedValues[index] || widget.value;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="relative group"
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 h-full">
          {/* Gradient accent */}
          <div
            className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${getGradient(widget.color)}`}
          />

          {/* Icon and title */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${getGradient(widget.color)} bg-opacity-10`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/70">
                  {widget.title}
                </h3>
                {widget.subtitle && (
                  <p className="text-xs text-white/40 mt-0.5">
                    {widget.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Trend indicator */}
            {widget.trend && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  widget.trend === "down"
                    ? "text-green-400"
                    : widget.trend === "up"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {widget.trend === "down" ? (
                  <TrendingDown className="w-4 h-4" />
                ) : widget.trend === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
              </div>
            )}
          </div>

          {/* Value display */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
                animate={{ opacity: [1, 0.8, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {typeof displayValue === "number"
                  ? displayValue.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })
                  : displayValue}
              </motion.span>
              {widget.unit && (
                <span className="text-sm text-white/50">{widget.unit}</span>
              )}
            </div>

            {/* Change indicator */}
            {widget.change !== undefined && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  widget.change < 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {widget.change < 0 ? (
                  <ArrowDown className="w-3 h-3" />
                ) : (
                  <ArrowUp className="w-3 h-3" />
                )}
                <span>{Math.abs(widget.change)}%</span>
                <span className="text-white/40">vs last {timeRange}</span>
              </div>
            )}

            {/* Progress bar for targets */}
            {widget.target && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>Progress to target</span>
                  <span>
                    {Math.round((Number(widget.value) / widget.target) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${getGradient(widget.color)}`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((Number(widget.value) / widget.target) * 100, 100)}%`,
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const AlertWidget = ({ widget, index }: { widget: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex items-center gap-4 p-4 rounded-xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]"
    >
      <div
        className={`p-2 rounded-lg ${
          widget.data?.severity === "high"
            ? "bg-red-500/20"
            : widget.data?.severity === "medium"
              ? "bg-yellow-500/20"
              : "bg-blue-500/20"
        }`}
      >
        <AlertTriangle
          className={`w-5 h-5 ${
            widget.data?.severity === "high"
              ? "text-red-400"
              : widget.data?.severity === "medium"
                ? "text-yellow-400"
                : "text-blue-400"
          }`}
        />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-white">{widget.title}</h4>
        <p className="text-xs text-white/60 mt-0.5">{widget.value}</p>
      </div>
      <span className="text-xs text-white/40">
        {widget.data?.time || "Just now"}
      </span>
    </motion.div>
  );

  // Default widgets if none provided
  const defaultWidgets = [
    {
      type: "metric" as const,
      title: "Total Emissions",
      value: 2450,
      unit: "tons CO₂e",
      change: -12.5,
      trend: "down" as const,
      color: "green",
      subtitle: "Scope 1, 2 & 3 combined",
    },
    {
      type: "metric" as const,
      title: "Energy Efficiency",
      value: 87,
      unit: "%",
      change: 5.2,
      trend: "up" as const,
      color: "blue",
      target: 95,
    },
    {
      type: "metric" as const,
      title: "Water Conservation",
      value: 1.2,
      unit: "M gallons saved",
      change: -8.7,
      trend: "down" as const,
      color: "blue",
    },
    {
      type: "metric" as const,
      title: "Waste Diverted",
      value: 78,
      unit: "% from landfill",
      change: 3.4,
      trend: "up" as const,
      color: "yellow",
      target: 90,
    },
    {
      type: "metric" as const,
      title: "Renewable Energy",
      value: 65,
      unit: "%",
      change: 12.1,
      trend: "up" as const,
      color: "purple",
      target: 100,
    },
    {
      type: "metric" as const,
      title: "Carbon Offset",
      value: 320,
      unit: "tons",
      change: 28.5,
      trend: "up" as const,
      color: "green",
      subtitle: "Via verified projects",
    },
  ];

  const displayWidgets = widgets.length > 0 ? widgets : defaultWidgets;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-white/60 mt-1">
              Real-time sustainability metrics and insights
            </p>
          </div>

          {realTime && (
            <div className="flex items-center gap-2 text-sm text-white/40">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Live</span>
              <span className="text-white/20">•</span>
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Time range selector */}
        <div className="flex gap-2 mt-4">
          {["day", "week", "month", "year"].map((range) => (
            <button
              key={range}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === range
                  ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayWidgets
          .filter((w) => w.type === "metric")
          .map((widget, index) => (
            <MetricWidget key={index} widget={widget} index={index} />
          ))}
      </div>

      {/* Alerts Section */}
      {displayWidgets.some((w) => w.type === "alert") && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Active Alerts
          </h3>
          <div className="space-y-3">
            {displayWidgets
              .filter((w) => w.type === "alert")
              .map((widget, index) => (
                <AlertWidget key={index} widget={widget} index={index} />
              ))}
          </div>
        </div>
      )}

      {/* Achievement Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-8 relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-90" />
        <div className="relative p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Award className="w-12 h-12 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">
                Sustainability Leader
              </h3>
              <p className="text-white/80">
                You&apos;re in the top 10% of organizations for emissions
                reduction
              </p>
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-white/60 animate-pulse" />
        </div>
      </motion.div>
    </motion.div>
  );
}
