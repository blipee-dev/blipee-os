"use client";

import { useState } from "react";
import { Power, Thermometer, Lightbulb, Fan } from "lucide-react";

interface ControlComponentProps {
  title?: string;
  type?: "switch" | "slider" | "schedule" | "preset";
  value?: any;
  options?: any;
  onChange?: (value: any) => void;
}

export function ControlComponent({
  title = "Control",
  type = "switch",
  value: initialValue,
  options = {},
  onChange,
}: ControlComponentProps) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (newValue: any) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 text-text-secondary";
    switch (options.icon) {
      case "temperature":
        return <Thermometer className={iconClass} />;
      case "light":
        return <Lightbulb className={iconClass} />;
      case "fan":
        return <Fan className={iconClass} />;
      default:
        return <Power className={iconClass} />;
    }
  };

  return (
    <div
      className="glass-card glass-card-default"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "1rem",
        padding: "1.5rem",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
        {options.status && (
          <span
            className={`text-sm px-2 py-1 rounded-full ${
              options.status === "online"
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {options.status}
          </span>
        )}
      </div>

      {type === "switch" && (
        <button
          onClick={() => handleChange(!value)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
            value
              ? "bg-gradient-to-r from-purple-500 to-pink-500"
              : "bg-gray-700"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              value ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      )}

      {type === "slider" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>
              {options.min || 0}
              {options.unit || ""}
            </span>
            <span className="text-primary font-medium">
              {value}
              {options.unit || ""}
            </span>
            <span>
              {options.max || 100}
              {options.unit || ""}
            </span>
          </div>
          <input
            type="range"
            min={options.min || 0}
            max={options.max || 100}
            step={options.step || 1}
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="w-full h-2 bg-surface-light rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      )}

      {type === "preset" && (
        <div className="grid grid-cols-2 gap-2">
          {options.presets?.map((preset: any) => (
            <button
              key={preset.value}
              onClick={() => handleChange(preset.value)}
              className={`p-3 rounded-lg border transition-colors ${
                value === preset.value
                  ? "bg-primary border-primary text-white"
                  : "bg-surface-light border-surface-light text-text-primary hover:border-primary/50"
              }`}
            >
              <div className="font-medium">{preset.label}</div>
              {preset.description && (
                <div className="text-xs opacity-80 mt-1">
                  {preset.description}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {type === "schedule" && (
        <div className="space-y-3">
          <div className="text-sm text-text-secondary">
            Current Schedule: {value?.mode || "Standard"}
          </div>
          <div className="space-y-2">
            {options.schedules?.map((schedule: any) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-3 bg-surface-light rounded-lg"
              >
                <div>
                  <div className="font-medium text-white">{schedule.time}</div>
                  <div className="text-sm text-text-secondary">
                    {schedule.action}
                  </div>
                </div>
                <div className="text-sm text-primary">{schedule.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
