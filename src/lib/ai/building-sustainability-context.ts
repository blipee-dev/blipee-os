import { BuildingContext } from "./types";
import { SustainabilityContext } from "./sustainability-context";

// Carbon emission factors (kgCO2e per unit)
const EMISSION_FACTORS = {
  electricity: {
    grid: 0.4, // kgCO2e per kWh (US average)
    renewable: 0.02, // Near-zero for solar/wind
  },
  naturalGas: 0.185, // kgCO2e per kWh
  water: 0.344, // kgCO2e per m³
  waste: 0.467, // kgCO2e per kg
};

export interface EnhancedBuildingContext extends BuildingContext {
  sustainability: {
    realTimeEmissions: {
      scope1: number; // Direct emissions (gas heating, generators)
      scope2: number; // Indirect emissions (electricity)
      scope3: number; // Value chain (waste, water, commuting)
      total: number;
      rate: number; // kgCO2e per hour
    };
    carbonIntensity: {
      perSqFt: number;
      perOccupant: number;
      benchmark: number; // Industry average for comparison
    };
    breakdown: Array<{
      source: string;
      emissions: number;
      percentage: number;
      scope: number;
    }>;
    savingsOpportunities: Array<{
      action: string;
      potentialReduction: number; // kgCO2e/month
      costSavings: number;
      implementation: "immediate" | "short-term" | "long-term";
    }>;
    targets: {
      daily: number;
      monthly: number;
      annual: number;
      currentProgress: number; // percentage
    };
  };
}

export function calculateBuildingEmissions(
  context: BuildingContext,
): EnhancedBuildingContext["sustainability"] {
  // Calculate Scope 2 emissions from electricity
  const electricityEmissions =
    (context.currentState.energyUsage / 1000) *
    EMISSION_FACTORS.electricity.grid;

  // Estimate Scope 1 emissions (assuming 30% of HVAC is gas-powered)
  const gasHeatingRatio = 0.3;
  const hvacEnergy = (context.currentState.energyUsage / 1000) * 0.47; // 47% for HVAC
  const gasEmissions =
    hvacEnergy * gasHeatingRatio * EMISSION_FACTORS.naturalGas;

  // Estimate Scope 3 emissions based on occupancy
  const wastePerPerson = 2.3; // kg/day average office waste
  const waterPerPerson = 50; // liters/day
  const wasteEmissions =
    (context.currentState.occupancy * wastePerPerson * EMISSION_FACTORS.waste) /
    24; // hourly
  const waterEmissions =
    (context.currentState.occupancy * waterPerPerson * EMISSION_FACTORS.water) /
    1000 /
    24; // hourly

  const totalEmissions =
    electricityEmissions + gasEmissions + wasteEmissions + waterEmissions;

  // Calculate breakdown
  const breakdown = [
    {
      source: "Electricity",
      emissions: electricityEmissions,
      percentage: 0,
      scope: 2,
    },
    { source: "Natural Gas", emissions: gasEmissions, percentage: 0, scope: 1 },
    { source: "Waste", emissions: wasteEmissions, percentage: 0, scope: 3 },
    { source: "Water", emissions: waterEmissions, percentage: 0, scope: 3 },
  ];

  // Calculate percentages
  breakdown.forEach((item) => {
    item.percentage = (item.emissions / totalEmissions) * 100;
  });

  // Generate savings opportunities based on current state
  const savingsOpportunities = [];

  // High energy usage opportunity
  if (context.currentState.energyUsage > 4000) {
    savingsOpportunities.push({
      action: "Optimize HVAC scheduling based on occupancy",
      potentialReduction: 150,
      costSavings: 1200,
      implementation: "immediate" as const,
    });
  }

  // Low occupancy opportunity
  if (context.currentState.occupancy < 50) {
    savingsOpportunities.push({
      action: "Implement zone-based climate control",
      potentialReduction: 80,
      costSavings: 640,
      implementation: "immediate" as const,
    });
  }

  // Always suggest renewable energy
  savingsOpportunities.push({
    action: "Install rooftop solar panels",
    potentialReduction: electricityEmissions * 0.7 * 720, // 70% reduction, monthly
    costSavings: 3500,
    implementation: "long-term" as const,
  });

  return {
    realTimeEmissions: {
      scope1: gasEmissions,
      scope2: electricityEmissions,
      scope3: wasteEmissions + waterEmissions,
      total: totalEmissions,
      rate: totalEmissions,
    },
    carbonIntensity: {
      perSqFt: (totalEmissions * 8760) / (context.metadata.size || 50000), // Annual per sqft
      perOccupant: totalEmissions / Math.max(context.currentState.occupancy, 1),
      benchmark: 0.005, // Industry average kgCO2e/sqft/hour
    },
    breakdown: breakdown.sort((a, b) => b.emissions - a.emissions),
    savingsOpportunities,
    targets: {
      daily: 2400, // kgCO2e
      monthly: 72000, // kgCO2e
      annual: 876000, // kgCO2e
      currentProgress: Math.min(
        100,
        ((2400 - totalEmissions * 24) / 2400) * 100,
      ),
    },
  };
}

export function buildEnhancedContext(
  building: BuildingContext,
): EnhancedBuildingContext {
  return {
    ...building,
    sustainability: calculateBuildingEmissions(building),
  };
}

// Format emissions for natural language
export function formatEmissions(emissions: number): string {
  if (emissions < 1) {
    return `${(emissions * 1000).toFixed(0)}g CO₂`;
  } else if (emissions < 1000) {
    return `${emissions.toFixed(1)}kg CO₂`;
  } else {
    return `${(emissions / 1000).toFixed(2)} tonnes CO₂`;
  }
}

// Get emission comparison context
export function getEmissionContext(emissions: number): string {
  const dailyEmissions = emissions * 24;

  // Comparisons for context
  const carMiles = dailyEmissions / 0.404; // kg CO2 per mile
  const trees = dailyEmissions / 0.06; // kg CO2 absorbed per tree per day

  if (carMiles > 100) {
    return `equivalent to driving ${Math.round(carMiles)} miles`;
  } else if (trees > 10) {
    return `what ${Math.round(trees)} trees absorb daily`;
  } else {
    return `within optimal range`;
  }
}
