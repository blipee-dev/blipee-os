/**
 * Electricity Maps API Integration
 *
 * Provides real-time and historical grid mix data for 200+ countries.
 *
 * API Documentation: https://api-portal.electricitymaps.com/
 */

const ELECTRICITY_MAPS_BASE_URL = 'https://api.electricitymap.org/v3';

function getApiKey(): string | undefined {
  return process.env.ELECTRICITY_MAPS_API_KEY;
}

export interface ElectricityMapsZone {
  zone: string; // ISO 3166-1 alpha-2 country code or zone code (e.g., 'PT', 'ES', 'DE')
}

export interface ElectricityMapsPowerBreakdown {
  zone: string;
  datetime: string;
  updatedAt: string;
  powerConsumptionBreakdown: {
    [key: string]: number | null; // kW by source (coal, gas, hydro, nuclear, oil, solar, wind, etc.)
  };
  powerProductionBreakdown: {
    [key: string]: number | null;
  };
  powerImportBreakdown: {
    [key: string]: number | null;
  };
  powerExportBreakdown: {
    [key: string]: number | null;
  };
  fossilFreePercentage: number | null;
  renewablePercentage: number | null;
  powerConsumptionTotal: number | null;
  powerProductionTotal: number | null;
}

export interface ElectricityMapsCarbonIntensity {
  zone: string;
  carbonIntensity: number; // gCO2eq/kWh
  datetime: string;
  updatedAt: string;
  emissionFactorType: 'lifecycle' | 'direct';
}

/**
 * Get latest power breakdown for a zone
 */
export async function getLatestPowerBreakdown(zone: string): Promise<ElectricityMapsPowerBreakdown | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Electricity Maps API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${ELECTRICITY_MAPS_BASE_URL}/power-breakdown/latest?zone=${zone}`,
      {
        headers: {
          'auth-token': apiKey,
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('Electricity Maps API error:', response.status, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching power breakdown:', error);
    return null;
  }
}

/**
 * Get historical power breakdown for a specific date
 */
export async function getHistoricalPowerBreakdown(
  zone: string,
  datetime: string // ISO 8601 format: 2025-01-15T00:00:00Z
): Promise<ElectricityMapsPowerBreakdown | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Electricity Maps API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${ELECTRICITY_MAPS_BASE_URL}/power-breakdown/history?zone=${zone}&datetime=${datetime}`,
      {
        headers: {
          'auth-token': apiKey,
        },
        next: { revalidate: 86400 } // Cache for 24 hours (historical data doesn't change)
      }
    );

    if (!response.ok) {
      console.error('Electricity Maps API error:', response.status, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching historical power breakdown:', error);
    return null;
  }
}

/**
 * Get carbon intensity for a zone
 */
export async function getCarbonIntensity(zone: string): Promise<ElectricityMapsCarbonIntensity | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Electricity Maps API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${ELECTRICITY_MAPS_BASE_URL}/carbon-intensity/latest?zone=${zone}`,
      {
        headers: {
          'auth-token': apiKey,
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('Electricity Maps API error:', response.status, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching carbon intensity:', error);
    return null;
  }
}

/**
 * Get historical carbon intensity for a specific date
 */
export async function getHistoricalCarbonIntensity(
  zone: string,
  datetime: string // ISO 8601 format
): Promise<ElectricityMapsCarbonIntensity | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Electricity Maps API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${ELECTRICITY_MAPS_BASE_URL}/carbon-intensity/history?zone=${zone}&datetime=${datetime}`,
      {
        headers: {
          'auth-token': apiKey,
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) {
      console.error('Electricity Maps API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();

    // API returns {history: [...]} for historical requests
    if (data.history && data.history.length > 0) {
      return data.history[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching historical carbon intensity:', error);
    return null;
  }
}

/**
 * Convert Electricity Maps power breakdown to our energy mix format
 */
export function convertToEnergyMix(breakdown: ElectricityMapsPowerBreakdown): {
  renewable_percentage: number;
  non_renewable_percentage: number;
  sources: Array<{
    name: string;
    percentage: number;
    renewable: boolean;
  }>;
} {
  const consumption = breakdown.powerConsumptionBreakdown || {};
  const total = breakdown.powerConsumptionTotal || 0;

  if (total === 0) {
    return {
      renewable_percentage: 0,
      non_renewable_percentage: 0,
      sources: []
    };
  }

  // Map Electricity Maps source names to display names
  const sourceMapping: { [key: string]: { name: string; renewable: boolean } } = {
    'solar': { name: 'Solar', renewable: true },
    'wind': { name: 'Wind', renewable: true },
    'hydro': { name: 'Hydro', renewable: true },
    'hydro discharge': { name: 'Hydro Storage', renewable: true },
    'biomass': { name: 'Biomass', renewable: true },
    'geothermal': { name: 'Geothermal', renewable: true },
    'nuclear': { name: 'Nuclear', renewable: false },
    'gas': { name: 'Natural Gas', renewable: false },
    'coal': { name: 'Coal', renewable: false },
    'oil': { name: 'Oil', renewable: false },
    'unknown': { name: 'Unknown', renewable: false },
    'battery discharge': { name: 'Battery', renewable: true }
  };

  const sources: Array<{ name: string; percentage: number; renewable: boolean }> = [];
  let renewableTotal = 0;
  let nonRenewableTotal = 0;

  Object.entries(consumption).forEach(([source, value]) => {
    if (value !== null && value > 0) {
      const config = sourceMapping[source] || { name: source, renewable: false };
      const percentage = (value / total) * 100;

      sources.push({
        name: config.name,
        percentage: Math.round(percentage * 100) / 100,
        renewable: config.renewable
      });

      if (config.renewable) {
        renewableTotal += percentage;
      } else {
        nonRenewableTotal += percentage;
      }
    }
  });

  // Use the API's renewable percentage if available (more accurate)
  const renewablePercentage = breakdown.renewablePercentage !== null && breakdown.renewablePercentage !== undefined
    ? breakdown.renewablePercentage
    : renewableTotal;

  return {
    renewable_percentage: Math.round(renewablePercentage * 100) / 100,
    non_renewable_percentage: Math.round((100 - renewablePercentage) * 100) / 100,
    sources: sources.sort((a, b) => b.percentage - a.percentage) // Sort by percentage descending
  };
}

/**
 * Get zone code from country code
 * Electricity Maps uses zone codes that are usually the same as country codes,
 * but can be more granular (e.g., US-CAL-CISO for California)
 */
export function getZoneFromCountryCode(countryCode: string): string {
  // For now, use country code as zone
  // In the future, we can add more granular mappings
  return countryCode.toUpperCase();
}
