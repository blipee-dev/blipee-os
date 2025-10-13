/**
 * Electricity Grid Mix Data
 *
 * Renewable energy percentages by provider and year/month.
 * Used to calculate the renewable vs non-renewable split for Scope 2 emissions.
 *
 * Source: EDP Portugal - https://www.edp.com
 */

export interface GridMixData {
  provider: string;
  country: string;
  year: number;
  month?: number; // Optional: if data is monthly
  renewablePercentage: number;
  nonRenewablePercentage: number;
  source?: string;
  notes?: string;
}

/**
 * EDP Portugal Grid Mix Data
 * Based on actual reported data from EDP
 */
export const EDP_PORTUGAL_GRID_MIX: GridMixData[] = [
  {
    provider: 'EDP',
    country: 'PT',
    year: 2022,
    renewablePercentage: 28.15,
    nonRenewablePercentage: 71.85,
    source: 'https://www.edp.com',
    notes: 'EDP Portugal annual average for 2022'
  },
  {
    provider: 'EDP',
    country: 'PT',
    year: 2023,
    renewablePercentage: 33.30,
    nonRenewablePercentage: 66.70,
    source: 'https://www.edp.com',
    notes: 'EDP Portugal annual average for 2023'
  },
  {
    provider: 'EDP',
    country: 'PT',
    year: 2024,
    renewablePercentage: 62.23,
    nonRenewablePercentage: 37.77,
    source: 'https://www.edp.com',
    notes: 'EDP Portugal annual average for 2024'
  },
  {
    provider: 'EDP',
    country: 'PT',
    year: 2025,
    renewablePercentage: 56.99,
    nonRenewablePercentage: 43.01,
    source: 'https://www.edp.com',
    notes: 'EDP Portugal estimated for 2025'
  }
];

/**
 * Get renewable percentage for a specific provider, country, and date
 */
export function getGridMixForDate(
  provider: string,
  country: string,
  date: Date
): GridMixData | null {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  // For now, only EDP Portugal is supported
  if (provider.toUpperCase() === 'EDP' && country.toUpperCase() === 'PT') {
    // Try to find monthly data first
    const monthlyData = EDP_PORTUGAL_GRID_MIX.find(
      d => d.year === year && d.month === month
    );
    if (monthlyData) return monthlyData;

    // Fall back to annual average
    const annualData = EDP_PORTUGAL_GRID_MIX.find(
      d => d.year === year && !d.month
    );
    if (annualData) return annualData;
  }

  return null;
}

/**
 * Calculate renewable and non-renewable portions of electricity consumption
 */
export function splitElectricityBySource(
  totalKWh: number,
  provider: string,
  country: string,
  date: Date
): { renewable: number; nonRenewable: number } | null {
  const gridMix = getGridMixForDate(provider, country, date);

  if (!gridMix) {
    return null;
  }

  return {
    renewable: totalKWh * (gridMix.renewablePercentage / 100),
    nonRenewable: totalKWh * (gridMix.nonRenewablePercentage / 100)
  };
}
