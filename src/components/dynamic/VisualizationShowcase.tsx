"use client";

import React from "react";
import { motion } from "framer-motion";
import { EnhancedChartComponent } from "./EnhancedChartComponent";
import { TableComponent } from "./TableComponent";
import { SustainabilityDashboard } from "./SustainabilityDashboard";
import { Enhanced3DView } from "./Enhanced3DView";
import { EnhancedReportComponent } from "./EnhancedReportComponent";

// Sample data for different visualization types
const emissionsTrendData = [
  { name: "Jan", value: 450 },
  { name: "Feb", value: 420 },
  { name: "Mar", value: 400 },
  { name: "Apr", value: 380 },
  { name: "May", value: 350 },
  { name: "Jun", value: 330 },
];

const scopeBreakdownData = [
  { name: "Direct Operations", scope1: 120, scope2: 180, scope3: 450 },
  { name: "Supply Chain", scope1: 50, scope2: 100, scope3: 800 },
  { name: "Transportation", scope1: 200, scope2: 50, scope3: 300 },
  { name: "Facilities", scope1: 80, scope2: 250, scope3: 150 },
];

const targetProgressData = [
  { name: "Progress", value: 68, fill: "#a855f7" },
];

const buildingEfficiencyData = [
  { x: 100, y: 45, z: 200, name: "Building A" },
  { x: 120, y: 50, z: 180, name: "Building B" },
  { x: 170, y: 65, z: 250, name: "Building C" },
  { x: 140, y: 55, z: 220, name: "Building D" },
  { x: 180, y: 70, z: 300, name: "Building E" },
];

const energySourceData = [
  { name: "Solar", value: 35, color: "#f59e0b" },
  { name: "Wind", value: 25, color: "#3b82f6" },
  { name: "Grid", value: 30, color: "#6b7280" },
  { name: "Natural Gas", value: 10, color: "#ef4444" },
];

const monthlyReductionData = [
  { name: "Energy", value: 25 },
  { name: "Water", value: 18 },
  { name: "Waste", value: 32 },
  { name: "Transport", value: 15 },
  { name: "Supply Chain", value: 20 },
];

export function VisualizationShowcase() {
  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">
          Dynamic Data Visualizations
        </h2>
        <p className="text-gray-400">
          AI-generated visualizations that adapt to your sustainability data
        </p>
      </motion.div>

      {/* Grid Layout for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emissions Trend */}
        <EnhancedChartComponent
          title="CO₂ Emissions Trend"
          subtitle="6-month reduction trajectory"
          chartType="emissions-trend"
          data={emissionsTrendData}
          target={300}
          showTrend={true}
          unit="tons"
        />

        {/* Scope Breakdown */}
        <EnhancedChartComponent
          title="Emissions by Scope"
          subtitle="Scope 1, 2, and 3 breakdown"
          chartType="scope-breakdown"
          data={scopeBreakdownData}
          unit="tons CO₂e"
        />

        {/* Target Progress */}
        <EnhancedChartComponent
          title="2030 Target Progress"
          subtitle="Net-zero achievement status"
          chartType="target-progress"
          data={targetProgressData}
        />

        {/* Energy Sources */}
        <EnhancedChartComponent
          title="Energy Mix"
          subtitle="Renewable vs non-renewable sources"
          chartType="pie"
          data={energySourceData}
          unit="%"
        />

        {/* Building Efficiency Scatter */}
        <EnhancedChartComponent
          title="Building Efficiency Analysis"
          subtitle="Energy use vs emissions correlation"
          chartType="scatter"
          data={buildingEfficiencyData}
        />

        {/* Monthly Reductions */}
        <EnhancedChartComponent
          title="Monthly Reduction by Category"
          subtitle="Performance across sustainability metrics"
          chartType="bar"
          data={monthlyReductionData}
          unit="%"
        />
      </div>

      {/* Full Width Components */}
      <div className="space-y-6">
        {/* Interactive Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SustainabilityDashboard
            title="Sustainability Command Center"
            widgets={[
              {
                type: "metric",
                title: "Total Emissions",
                value: 2450,
                unit: "tons CO₂e",
                change: -12.5,
                trend: "down",
                color: "green",
                subtitle: "Scope 1, 2 & 3 combined",
              },
              {
                type: "metric",
                title: "Energy Saved",
                value: 45,
                unit: "% vs baseline",
                change: 5.2,
                trend: "up",
                color: "blue",
                target: 60,
              },
              {
                type: "metric",
                title: "Water Reduced",
                value: 1.2,
                unit: "M gallons",
                change: -8.7,
                trend: "down",
                color: "blue",
              },
              {
                type: "metric",
                title: "Waste Diverted",
                value: 78,
                unit: "% from landfill",
                change: 3.4,
                trend: "up",
                color: "yellow",
                target: 90,
              },
            ]}
            timeRange="month"
            realTime={true}
          />
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <TableComponent
            title="Facility Performance Metrics"
            subtitle="Real-time sustainability data across all locations"
            headers={["Facility", "Energy (kWh)", "Emissions (kg)", "Efficiency", "Status"]}
            rows={[
              ["Headquarters", "45,230", "12,450", "92%", "🟢 Optimal"],
              ["Manufacturing A", "125,640", "45,230", "78%", "🟡 Good"],
              ["Warehouse B", "32,100", "8,900", "85%", "🟢 Optimal"],
              ["Office Complex", "28,450", "7,230", "71%", "🟡 Good"],
              ["Distribution Center", "67,890", "23,450", "65%", "🔴 Needs Attention"],
            ]}
            showTrends={true}
            highlightColumn={3}
            sortable={true}
          />
        </motion.div>

        {/* 3D Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Enhanced3DView
            title="Campus Energy Flow Visualization"
            subtitle="Real-time energy distribution across facilities"
            viewMode="energy"
            showRealTime={true}
            interactive={true}
          />
        </motion.div>

        {/* Report Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <EnhancedReportComponent
            title="Q4 2024 Sustainability Report"
            subtitle="Your comprehensive impact analysis with AI-powered insights"
            metadata={{
              period: "Q4 2024",
              generated: new Date(),
              author: "blipee AI",
              status: "final",
            }}
            interactive={true}
          />
        </motion.div>
      </div>
    </div>
  );
}