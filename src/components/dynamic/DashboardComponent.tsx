"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Thermometer,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  DollarSign,
  Lightbulb,
} from "lucide-react";

interface DashboardProps {
  title?: string;
  realTimeMetrics?: {
    energy: {
      currentUsage: number;
      trend: "increasing" | "decreasing" | "stable";
      efficiency: number;
      cost: number;
    };
    comfort: {
      temperature: number;
      humidity: number;
      airQuality: number;
    };
    occupancy: {
      current: number;
      capacity: number;
      zones: Array<{ name: string; occupancy: number }>;
    };
    alerts: Array<{
      type: "warning" | "error" | "info";
      message: string;
      priority: "high" | "medium" | "low";
    }>;
  };
  predictions?: {
    nextHour: number;
    peakToday: number;
    monthlySavings: number;
  };
}

export function DashboardComponent({
  title = "Building Dashboard",
  realTimeMetrics,
  predictions,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Default demo data
  const metrics = realTimeMetrics || {
    energy: {
      currentUsage: 4520,
      trend: "stable" as const,
      efficiency: 87,
      cost: 342.5,
    },
    comfort: {
      temperature: 22.5,
      humidity: 45,
      airQuality: 92,
    },
    occupancy: {
      current: 127,
      capacity: 200,
      zones: [
        { name: "Floor 1", occupancy: 45 },
        { name: "Floor 2", occupancy: 38 },
        { name: "Floor 3", occupancy: 32 },
        { name: "Conference", occupancy: 12 },
      ],
    },
    alerts: [
      {
        type: "warning" as const,
        message: "Chiller #2 efficiency below optimal",
        priority: "medium" as const,
      },
      {
        type: "info" as const,
        message: "Maintenance scheduled for 10:00 AM",
        priority: "low" as const,
      },
    ],
  };

  const defaultPredictions = predictions || {
    nextHour: 4680,
    peakToday: 5200,
    monthlySavings: 2840,
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "energy", label: "Energy", icon: Zap },
    { id: "comfort", label: "Comfort", icon: Thermometer },
    { id: "occupancy", label: "Occupancy", icon: Users },
  ];

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color = "blue",
  }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6 group hover:bg-white/[0.05] transition-all duration-300"
    >
      {/* Gradient accent */}
      <div
        className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent`}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}
            >
              <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            <h3 className="text-sm font-medium text-white/70">{title}</h3>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white">{value}</div>
            {subtitle && (
              <div className="text-xs text-white/50">{subtitle}</div>
            )}
          </div>
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend === "up"
                ? "text-green-400"
                : trend === "down"
                  ? "text-red-400"
                  : "text-yellow-400"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend === "down" ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Activity className="w-3 h-3" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  const AlertCard = ({ alert }: { alert: any }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl border ${
        alert.type === "error"
          ? "bg-red-500/10 border-red-500/20"
          : alert.type === "warning"
            ? "bg-yellow-500/10 border-yellow-500/20"
            : "bg-blue-500/10 border-blue-500/20"
      }`}
    >
      <AlertTriangle
        className={`w-4 h-4 ${
          alert.type === "error"
            ? "text-red-400"
            : alert.type === "warning"
              ? "text-yellow-400"
              : "text-blue-400"
        }`}
      />
      <div className="flex-1">
        <div className="text-sm text-white">{alert.message}</div>
        <div className="text-xs text-white/50 capitalize">
          {alert.priority} priority
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2">
          {title}
        </h2>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Clock className="w-4 h-4" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium ${
              activeTab === tab.id
                ? "bg-white/[0.1] text-white shadow-lg"
                : "text-white/60 hover:text-white/80 hover:bg-white/[0.05]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={Zap}
                title="Energy Usage"
                value={`${metrics.energy.currentUsage.toLocaleString()}W`}
                subtitle={`${metrics.energy.efficiency}% efficiency`}
                trend={
                  metrics.energy.trend === "increasing"
                    ? "up"
                    : metrics.energy.trend === "decreasing"
                      ? "down"
                      : "stable"
                }
                color="blue"
              />
              <MetricCard
                icon={Thermometer}
                title="Temperature"
                value={`${metrics.comfort.temperature}°C`}
                subtitle={`${metrics.comfort.humidity}% humidity`}
                color="green"
              />
              <MetricCard
                icon={Users}
                title="Occupancy"
                value={`${metrics.occupancy.current}/${metrics.occupancy.capacity}`}
                subtitle={`${Math.round((metrics.occupancy.current / metrics.occupancy.capacity) * 100)}% occupied`}
                color="purple"
              />
              <MetricCard
                icon={DollarSign}
                title="Today's Cost"
                value={`$${metrics.energy.cost}`}
                subtitle={`Est. monthly: $${Math.round(metrics.energy.cost * 30)}`}
                color="yellow"
              />
            </div>

            {/* Predictions */}
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                AI Predictions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {defaultPredictions.nextHour.toLocaleString()}W
                  </div>
                  <div className="text-sm text-white/60">Next Hour Usage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {defaultPredictions.peakToday.toLocaleString()}W
                  </div>
                  <div className="text-sm text-white/60">Today&apos;s Peak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    ${defaultPredictions.monthlySavings.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/60">
                    Potential Monthly Savings
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {metrics.alerts.length > 0 && (
              <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Active Alerts
                </h3>
                <div className="space-y-3">
                  {metrics.alerts.map((alert, index) => (
                    <AlertCard key={index} alert={alert} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "energy" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Energy Breakdown
              </h3>
              <div className="space-y-4">
                {[
                  {
                    name: "HVAC",
                    usage: Math.round(metrics.energy.currentUsage * 0.47),
                    color: "blue",
                  },
                  {
                    name: "Lighting",
                    usage: Math.round(metrics.energy.currentUsage * 0.28),
                    color: "purple",
                  },
                  {
                    name: "Equipment",
                    usage: Math.round(metrics.energy.currentUsage * 0.25),
                    color: "green",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full bg-${item.color}-400`}
                      />
                      <span className="text-white">{item.name}</span>
                    </div>
                    <span className="text-white/70 font-mono">
                      {item.usage.toLocaleString()}W
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Cost Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/70">Current Rate</span>
                  <span className="text-white font-mono">$0.12/kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Peak Rate</span>
                  <span className="text-white font-mono">$0.18/kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Today&apos;s Usage</span>
                  <span className="text-white font-mono">
                    {Math.round((metrics.energy.currentUsage * 24) / 1000)}kWh
                  </span>
                </div>
                <div className="border-t border-white/10 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Estimated Daily Cost</span>
                    <span className="text-green-400">
                      ${metrics.energy.cost}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "comfort" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricCard
              icon={Thermometer}
              title="Temperature Control"
              value={`${metrics.comfort.temperature}°C`}
              subtitle="Target: 22.5°C"
              color="green"
            />
            <MetricCard
              icon={Activity}
              title="Air Quality Index"
              value={metrics.comfort.airQuality}
              subtitle="Excellent (>90)"
              color="blue"
            />
          </div>
        )}

        {activeTab === "occupancy" && (
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Zone Occupancy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {metrics.occupancy.zones.map((zone) => (
                <div
                  key={zone.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                >
                  <span className="text-white">{zone.name}</span>
                  <span className="text-white/70 font-mono">
                    {zone.occupancy} people
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
