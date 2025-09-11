"use client";

import React from "react";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
  size?: "small" | "medium" | "large";
}

export function ToggleSwitch({ 
  enabled, 
  onChange, 
  size = "medium" 
}: ToggleSwitchProps) {
  const sizeClasses = {
    small: { container: "h-5 w-9", toggle: "h-3 w-3", translateOn: "translate-x-5", translateOff: "translate-x-1" },
    medium: { container: "h-6 w-11", toggle: "h-4 w-4", translateOn: "translate-x-6", translateOff: "translate-x-1" },
    large: { container: "h-7 w-14", toggle: "h-5 w-5", translateOn: "translate-x-8", translateOff: "translate-x-1" },
  };

  const { container, toggle, translateOn, translateOff } = sizeClasses[size];

  return (
    <button
      onClick={onChange}
      className={`relative inline-flex ${container} items-center rounded-full transition-all ${
        enabled 
          ? "accent-gradient" 
          : "bg-gray-200 dark:bg-gray-700"
      }`}
      style={{
        background: enabled 
          ? `linear-gradient(to right, rgb(var(--accent-primary-rgb)), rgb(var(--accent-secondary-rgb)))`
          : undefined
      }}
    >
      <span
        className={`inline-block ${toggle} transform rounded-full bg-white transition-transform shadow-sm ${
          enabled ? translateOn : translateOff
        }`}
      />
    </button>
  );
}