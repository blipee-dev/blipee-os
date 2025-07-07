"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronDown, Check, Plus, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import type { Building } from "@/types/auth";

interface BuildingSelectorProps {
  currentBuilding?: Building | null;
  onBuildingChange: (building: Building) => void;
  compact?: boolean;
}

export function BuildingSelector({
  currentBuilding,
  onBuildingChange,
  compact = false,
}: BuildingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const loadBuildings = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/organizations/${session?.current_organization.id}/buildings`,
      );
      if (response.ok) {
        const data = await response.json();
        setBuildings(data.data);

        // If no current building, select the first one
        if (!currentBuilding && data.data.length > 0) {
          onBuildingChange(data.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load buildings:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.current_organization, currentBuilding, onBuildingChange]);

  useEffect(() => {
    if (session?.current_organization) {
      loadBuildings();
    }
  }, [session?.current_organization, loadBuildings]);

  function handleBuildingSelect(building: Building) {
    onBuildingChange(building);
    setIsOpen(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
      </div>
    );
  }

  if (buildings.length === 0) {
    return (
      <button className="flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
        <Plus className="w-4 h-4 mr-2" />
        Add Building
      </button>
    );
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Building2 className="w-4 h-4 mr-2 text-gray-500" />
          <span className="truncate max-w-[150px]">
            {currentBuilding?.name || "Select Building"}
          </span>
          <ChevronDown
            className={`w-4 h-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              <div className="py-2">
                {buildings.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => handleBuildingSelect(building)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {building.name}
                        </p>
                        {building.city && (
                          <p className="text-xs text-gray-500">
                            {building.city}
                          </p>
                        )}
                      </div>
                    </div>
                    {currentBuilding?.id === building.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full size version
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Current Building</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Change
        </button>
      </div>

      {currentBuilding && (
        <div className="flex items-start">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {currentBuilding.name}
            </h4>
            {currentBuilding.address && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                {currentBuilding.address}
              </p>
            )}
            {currentBuilding.size_sqft && (
              <p className="text-sm text-gray-500 mt-1">
                {currentBuilding.size_sqft.toLocaleString()} sq ft
              </p>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              All Buildings
            </h4>
            <div className="space-y-2">
              {buildings.map((building) => (
                <button
                  key={building.id}
                  onClick={() => handleBuildingSelect(building)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    currentBuilding?.id === building.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {building.name}
                      </p>
                      <p className="text-sm text-gray-500">{building.city}</p>
                    </div>
                    {currentBuilding?.id === building.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
