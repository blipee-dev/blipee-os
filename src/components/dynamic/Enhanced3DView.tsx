"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Layers,
  Eye,
  EyeOff,
  Activity,
  Zap,
  Droplets,
  Wind,
  Thermometer,
  Users,
  AlertTriangle,
  Play,
  Pause,
  SkipForward,
  Sparkles,
} from "lucide-react";

interface Enhanced3DViewProps {
  title?: string;
  subtitle?: string;
  buildingData?: {
    floors: number;
    zones: Array<{
      id: string;
      name: string;
      floor: number;
      type: string;
      metrics: {
        temperature?: number;
        occupancy?: number;
        energy?: number;
        co2?: number;
      };
      status: "optimal" | "warning" | "critical";
    }>;
  };
  viewMode?: "energy" | "comfort" | "occupancy" | "emissions";
  showRealTime?: boolean;
  interactive?: boolean;
  setViewMode?: (
    mode: "energy" | "comfort" | "occupancy" | "emissions",
  ) => void;
}

export function Enhanced3DView({
  title = "Building Intelligence View",
  subtitle = "Real-time 3D visualization of your facilities",
  buildingData,
  viewMode: propViewMode = "energy",
  showRealTime = true,
  interactive = true,
  setViewMode: propSetViewMode,
}: Enhanced3DViewProps) {
  const [currentFloor, setCurrentFloor] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [viewAngle, setViewAngle] = useState({ x: 45, y: 45 });
  const [zoom, setZoom] = useState(1);
  const [showLayers, setShowLayers] = useState({
    energy: true,
    comfort: true,
    occupancy: true,
    alerts: true,
  });
  const [timeOfDay, setTimeOfDay] = useState(new Date().getHours());
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState(propViewMode);

  const handleSetViewMode = propSetViewMode || setViewMode;

  // No default building data - require real data from API
  const building = buildingData;

  // Show message if no building data provided
  if (!building) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-400 mb-2">No building data available</div>
          <div className="text-sm text-gray-500">Configure building zones to enable 3D view</div>
        </div>
      </div>
    );
  }

  // Simulate time progression
  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setTimeOfDay((prev) => (prev + 1) % 24);
      }, 5000); // Progress 1 hour every 5 seconds
      return () => clearInterval(timer);
    }
  }, [isPlaying]);

  // 3D rotation animation
  useEffect(() => {
    if (isRotating && interactive) {
      const timer = setInterval(() => {
        setViewAngle((prev) => ({
          x: prev.x,
          y: (prev.y + 1) % 360,
        }));
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isRotating, interactive]);

  const getZoneColor = (zone: any) => {
    if (viewMode === "energy") {
      const intensity = zone.metrics.energy / 4000;
      return `rgba(236, 72, 153, ${0.3 + intensity * 0.7})`;
    } else if (viewMode === "comfort") {
      const temp = zone.metrics.temperature;
      if (temp < 20 || temp > 24) return "rgba(239, 68, 68, 0.7)";
      if (temp < 21 || temp > 23) return "rgba(251, 191, 36, 0.7)";
      return "rgba(16, 185, 129, 0.7)";
    } else if (viewMode === "occupancy") {
      const density = zone.metrics.occupancy / 50;
      return `rgba(168, 85, 247, ${0.3 + density * 0.7})`;
    }
    return "rgba(255, 255, 255, 0.3)";
  };

  const FloorVisualization = ({ floor }: { floor: number }) => {
    const zones = building.zones.filter((z) => z.floor === floor);
    const isActive = currentFloor === null || currentFloor === floor;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isActive ? 1 : 0.3,
          y: 0,
          scale: isActive ? 1 : 0.95,
        }}
        transition={{ duration: 0.5 }}
        className="relative"
        style={{
          transform: `perspective(1000px) rotateX(${viewAngle.x}deg) rotateY(${viewAngle.y}deg) scale(${zoom})`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Floor plate */}
        <div
          className="absolute inset-0 backdrop-blur-xl border-2 border-white/20 rounded-lg"
          style={{
            background: `linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)`,
            boxShadow: "0 10px 40px rgba(168, 85, 247, 0.2)",
            transform: `translateZ(${floor * 50}px)`,
          }}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />

          {/* Floor label */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded-md">
            <span className="text-xs text-white/80">Floor {floor}</span>
          </div>

          {/* Zones */}
          {zones.map((zone) => (
            <motion.div
              key={zone.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedZone(zone.id)}
              className="absolute w-1/3 h-1/3 rounded-lg cursor-pointer overflow-hidden"
              style={{
                top: `${Math.random() * 50 + 10}%`,
                left: `${Math.random() * 50 + 10}%`,
                background: getZoneColor(zone),
                border:
                  selectedZone === zone.id
                    ? "2px solid white"
                    : "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {/* Zone content */}
              <div className="p-2 h-full flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {zone.name}
                  </h4>
                  {zone.status !== "optimal" && (
                    <AlertTriangle
                      className={`w-3 h-3 mt-1 ${
                        zone.status === "critical"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    />
                  )}
                </div>

                {showRealTime && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-white/60" />
                    <span className="text-xs text-white/80">
                      {zone.metrics.energy}W
                    </span>
                  </div>
                )}
              </div>

              {/* Animated particles for active zones */}
              {zone.metrics.occupancy && zone.metrics.occupancy > 10 && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      animate={{
                        y: [0, -50],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.7,
                      }}
                      style={{
                        left: `${Math.random() * 100}%`,
                        bottom: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.05]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {title}
              </h3>
              <p className="text-sm text-white/50 mt-1">{subtitle}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Time display */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/70">
                  {timeOfDay.toString().padStart(2, "0")}:00
                </span>
              </div>

              {/* View controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <ZoomIn className="w-4 h-4 text-white/60" />
                </button>
                <button
                  onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <ZoomOut className="w-4 h-4 text-white/60" />
                </button>
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <RotateCw
                    className={`w-4 h-4 text-white/60 ${isRotating ? "animate-spin" : ""}`}
                  />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <Maximize2 className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>
          </div>

          {/* View mode selector */}
          <div className="flex gap-2 mt-4">
            {[
              { mode: "energy", icon: Zap, label: "Energy Flow" },
              { mode: "comfort", icon: Thermometer, label: "Comfort" },
              { mode: "occupancy", icon: Users, label: "Occupancy" },
              { mode: "emissions", icon: Wind, label: "Air Quality" },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => handleSetViewMode(mode as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === mode
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Visualization Area */}
        <div className="relative h-[600px] bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20 p-8">
          {/* Building floors */}
          <div className="relative h-full flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              {[...Array(building.floors)].map((_, i) => (
                <FloorVisualization key={i} floor={building.floors - i} />
              ))}
            </div>
          </div>

          {/* Layer toggles */}
          <div className="absolute top-4 left-4 space-y-2">
            {Object.entries(showLayers).map(([layer, enabled]) => (
              <button
                key={layer}
                onClick={() =>
                  setShowLayers({ ...showLayers, [layer]: !enabled })
                }
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  enabled
                    ? "bg-white/10 text-white"
                    : "bg-white/5 text-white/40"
                }`}
              >
                {enabled ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
                {layer.charAt(0).toUpperCase() + layer.slice(1)}
              </button>
            ))}
          </div>

          {/* Time controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <SkipForward className="w-4 h-4 text-white" />
            </button>
            <span className="text-xs text-white/60 ml-2">
              Simulating 24h cycle
            </span>
          </div>

          {/* Selected zone details */}
          <AnimatePresence>
            {selectedZone && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-4 right-4 w-64 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4"
              >
                {(() => {
                  const zone = building.zones.find(
                    (z) => z.id === selectedZone,
                  );
                  if (!zone) return null;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white">
                          {zone.name}
                        </h4>
                        <button
                          onClick={() => setSelectedZone(null)}
                          className="text-white/60 hover:text-white"
                        >
                          ×
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Temperature</span>
                          <span className="text-white">
                            {zone.metrics.temperature}°C
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Occupancy</span>
                          <span className="text-white">
                            {zone.metrics.occupancy} people
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Energy Use</span>
                          <span className="text-white">
                            {zone.metrics.energy}W
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">CO₂ Level</span>
                          <span className="text-white">
                            {zone.metrics.co2} ppm
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60">Status</span>
                          <span
                            className={`text-xs font-medium ${
                              zone.status === "optimal"
                                ? "text-green-400"
                                : zone.status === "warning"
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {zone.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sparkle effect */}
          <Sparkles className="absolute bottom-4 right-4 w-6 h-6 text-purple-400 animate-pulse" />
        </div>

        {/* Bottom stats bar */}
        <div className="p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-t border-white/[0.05]">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {building.zones
                  .reduce((sum, z) => sum + (z.metrics.energy || 0), 0)
                  .toLocaleString()}
                W
              </div>
              <div className="text-xs text-white/60">Total Energy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {building.zones.filter((z) => z.status === "optimal").length}/
                {building.zones.length}
              </div>
              <div className="text-xs text-white/60">Optimal Zones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {building.zones.reduce(
                  (sum, z) => sum + (z.metrics.occupancy || 0),
                  0,
                )}
              </div>
              <div className="text-xs text-white/60">Total Occupancy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {(
                  building.zones.reduce(
                    (sum, z) => sum + (z.metrics.temperature || 0),
                    0,
                  ) / building.zones.length
                ).toFixed(1)}
                °C
              </div>
              <div className="text-xs text-white/60">Avg Temperature</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
