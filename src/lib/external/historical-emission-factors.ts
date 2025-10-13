/**
 * Historical Emission Factors Database
 *
 * Since Electricity Maps free tier doesn't provide true historical data,
 * we use official historical emission factors from:
 * - IEA (International Energy Agency)
 * - EEA (European Environment Agency)
 * - National grid operators
 * - Academic research
 *
 * Factors are lifecycle (Scope 2 + Scope 3 Category 3)
 */

export interface HistoricalEmissionFactor {
  year: number;
  lifecycle_gco2_kwh: number; // Total lifecycle emissions
  renewable_percentage: number;
  source: string;
  notes?: string;
}

/**
 * Portugal (PT) - Data from Electricity Maps open-source repository
 * Source: https://github.com/electricitymaps/electricitymaps-contrib/blob/master/config/zones/PT.yaml
 *
 * These are actual yearly averages calculated from real grid data.
 * Renewable percentage calculated from power mix ratios.
 */
const PORTUGAL_FACTORS: HistoricalEmissionFactor[] = [
  {
    year: 2019,
    lifecycle_gco2_kwh: 307.45,
    renewable_percentage: 49.6, // wind 26.4% + solar 2.8% + hydro 18.4%
    source: 'Electricity Maps 2019 average',
    notes: 'High gas usage (32.9%), moderate coal (10.1%)'
  },
  {
    year: 2020,
    lifecycle_gco2_kwh: 241.18,
    renewable_percentage: 53.3, // wind 24.0% + solar 3.6% + hydro 25.8%
    source: 'Electricity Maps 2020 average',
    notes: 'COVID-19 reduced demand, coal reduced to 4.1%'
  },
  {
    year: 2021,
    lifecycle_gco2_kwh: 204.32,
    renewable_percentage: 56.9, // wind 26.7% + solar 5.4% + hydro 24.6%
    source: 'Electricity Maps 2021 average',
    notes: 'Coal further reduced to 1.7%, high renewables'
  },
  {
    year: 2022,
    lifecycle_gco2_kwh: 225.7,
    renewable_percentage: 52.3, // wind 27.3% + solar 7.9% + hydro 16.4%
    source: 'Electricity Maps 2022 average',
    notes: 'Energy crisis increased gas to 36.2%, low hydro year'
  },
  {
    year: 2023,
    lifecycle_gco2_kwh: 152.04,
    renewable_percentage: 65.7, // wind 27.6% + solar 11.3% + hydro 26.9%
    source: 'Electricity Maps 2023 average',
    notes: 'Exceptional year: record renewables, gas reduced to 22.5%, coal only 0.4%'
  },
  {
    year: 2024,
    lifecycle_gco2_kwh: 104.91,
    renewable_percentage: 72.0, // wind 29.0% + solar 13.8% + hydro 32.9%
    source: 'Electricity Maps 2024 average',
    notes: 'Record low emissions: gas only 12.2%, coal 0.3%, highest renewable share ever'
  },
  {
    year: 2025,
    lifecycle_gco2_kwh: 128,
    renewable_percentage: 74,
    source: 'Electricity Maps API (current)',
    notes: 'Current data from live API'
  }
];

/**
 * Spain (ES) - Data from Red Eléctrica de España (REE) and EEA
 */
const SPAIN_FACTORS: HistoricalEmissionFactor[] = [
  { year: 2019, lifecycle_gco2_kwh: 207, renewable_percentage: 37, source: 'EEA, REE' },
  { year: 2020, lifecycle_gco2_kwh: 180, renewable_percentage: 43, source: 'EEA, REE' },
  { year: 2021, lifecycle_gco2_kwh: 195, renewable_percentage: 40, source: 'EEA, REE' },
  { year: 2022, lifecycle_gco2_kwh: 175, renewable_percentage: 42, source: 'EEA, REE' },
  { year: 2023, lifecycle_gco2_kwh: 160, renewable_percentage: 50, source: 'REE 2023' },
  { year: 2024, lifecycle_gco2_kwh: 155, renewable_percentage: 52, source: 'REE 2024 (est)' },
  { year: 2025, lifecycle_gco2_kwh: 158, renewable_percentage: 51, source: 'Current API' }
];

/**
 * Germany (DE) - Data from Umweltbundesamt and EEA
 */
const GERMANY_FACTORS: HistoricalEmissionFactor[] = [
  { year: 2019, lifecycle_gco2_kwh: 401, renewable_percentage: 42, source: 'EEA, UBA' },
  { year: 2020, lifecycle_gco2_kwh: 375, renewable_percentage: 45, source: 'EEA, UBA' },
  { year: 2021, lifecycle_gco2_kwh: 385, renewable_percentage: 41, source: 'EEA, UBA' },
  { year: 2022, lifecycle_gco2_kwh: 420, renewable_percentage: 46, source: 'EEA, UBA', notes: 'Increased coal due to gas crisis' },
  { year: 2023, lifecycle_gco2_kwh: 380, renewable_percentage: 52, source: 'UBA 2023' },
  { year: 2024, lifecycle_gco2_kwh: 360, renewable_percentage: 55, source: 'UBA 2024 (est)' },
  { year: 2025, lifecycle_gco2_kwh: 355, renewable_percentage: 56, source: 'Current API' }
];

/**
 * France (FR) - Data from RTE and EEA
 * France has very low emissions due to nuclear
 */
const FRANCE_FACTORS: HistoricalEmissionFactor[] = [
  { year: 2019, lifecycle_gco2_kwh: 57, renewable_percentage: 21, source: 'EEA, RTE' },
  { year: 2020, lifecycle_gco2_kwh: 54, renewable_percentage: 25, source: 'EEA, RTE' },
  { year: 2021, lifecycle_gco2_kwh: 58, renewable_percentage: 24, source: 'EEA, RTE' },
  { year: 2022, lifecycle_gco2_kwh: 72, renewable_percentage: 26, source: 'EEA, RTE', notes: 'Nuclear maintenance outages' },
  { year: 2023, lifecycle_gco2_kwh: 55, renewable_percentage: 27, source: 'RTE 2023' },
  { year: 2024, lifecycle_gco2_kwh: 53, renewable_percentage: 28, source: 'RTE 2024 (est)' },
  { year: 2025, lifecycle_gco2_kwh: 52, renewable_percentage: 29, source: 'Current API' }
];

/**
 * UK (GB) - Data from National Grid ESO and EEA
 */
const UK_FACTORS: HistoricalEmissionFactor[] = [
  { year: 2019, lifecycle_gco2_kwh: 254, renewable_percentage: 37, source: 'EEA, National Grid ESO' },
  { year: 2020, lifecycle_gco2_kwh: 230, renewable_percentage: 42, source: 'EEA, National Grid ESO' },
  { year: 2021, lifecycle_gco2_kwh: 241, renewable_percentage: 40, source: 'EEA, National Grid ESO' },
  { year: 2022, lifecycle_gco2_kwh: 235, renewable_percentage: 41, source: 'EEA, National Grid ESO' },
  { year: 2023, lifecycle_gco2_kwh: 220, renewable_percentage: 45, source: 'National Grid ESO 2023' },
  { year: 2024, lifecycle_gco2_kwh: 210, renewable_percentage: 48, source: 'National Grid ESO 2024 (est)' },
  { year: 2025, lifecycle_gco2_kwh: 205, renewable_percentage: 50, source: 'Current API' }
];

/**
 * EU Average - Data from EEA
 */
const EU_AVERAGE_FACTORS: HistoricalEmissionFactor[] = [
  { year: 2019, lifecycle_gco2_kwh: 275, renewable_percentage: 34, source: 'EEA' },
  { year: 2020, lifecycle_gco2_kwh: 255, renewable_percentage: 37, source: 'EEA' },
  { year: 2021, lifecycle_gco2_kwh: 265, renewable_percentage: 36, source: 'EEA' },
  { year: 2022, lifecycle_gco2_kwh: 280, renewable_percentage: 37, source: 'EEA', notes: 'Energy crisis impacts' },
  { year: 2023, lifecycle_gco2_kwh: 260, renewable_percentage: 42, source: 'EEA 2023' },
  { year: 2024, lifecycle_gco2_kwh: 250, renewable_percentage: 44, source: 'EEA 2024 (est)' },
  { year: 2025, lifecycle_gco2_kwh: 245, renewable_percentage: 45, source: 'Current API' }
];

/**
 * Database of all countries
 */
const EMISSION_FACTORS_DB: { [countryCode: string]: HistoricalEmissionFactor[] } = {
  'PT': PORTUGAL_FACTORS,
  'ES': SPAIN_FACTORS,
  'DE': GERMANY_FACTORS,
  'FR': FRANCE_FACTORS,
  'GB': UK_FACTORS,
  'UK': UK_FACTORS, // Alias
  'EU': EU_AVERAGE_FACTORS
};

/**
 * Get historical emission factor for a specific country and year
 */
export function getHistoricalEmissionFactor(
  countryCode: string,
  year: number
): HistoricalEmissionFactor | null {
  const factors = EMISSION_FACTORS_DB[countryCode.toUpperCase()];

  if (!factors) {
    console.warn(`No historical emission factors for country: ${countryCode}`);
    return null;
  }

  // Find exact year match
  const exactMatch = factors.find(f => f.year === year);
  if (exactMatch) {
    return exactMatch;
  }

  // If year is older than our data, use oldest available
  const oldestYear = Math.min(...factors.map(f => f.year));
  if (year < oldestYear) {
    console.warn(`Year ${year} is older than available data for ${countryCode}, using ${oldestYear}`);
    return factors.find(f => f.year === oldestYear) || null;
  }

  // If year is newer than our data, use newest available
  const newestYear = Math.max(...factors.map(f => f.year));
  if (year > newestYear) {
    console.warn(`Year ${year} is newer than available data for ${countryCode}, using ${newestYear}`);
    return factors.find(f => f.year === newestYear) || null;
  }

  // Interpolate between years
  const sortedFactors = [...factors].sort((a, b) => a.year - b.year);
  for (let i = 0; i < sortedFactors.length - 1; i++) {
    const current = sortedFactors[i];
    const next = sortedFactors[i + 1];

    if (year > current.year && year < next.year) {
      // Linear interpolation
      const ratio = (year - current.year) / (next.year - current.year);
      const interpolatedLifecycle = current.lifecycle_gco2_kwh +
        (next.lifecycle_gco2_kwh - current.lifecycle_gco2_kwh) * ratio;
      const interpolatedRenewable = current.renewable_percentage +
        (next.renewable_percentage - current.renewable_percentage) * ratio;

      return {
        year,
        lifecycle_gco2_kwh: Math.round(interpolatedLifecycle),
        renewable_percentage: Math.round(interpolatedRenewable * 10) / 10,
        source: `Interpolated between ${current.year} and ${next.year}`,
        notes: `Estimated value based on historical trend`
      };
    }
  }

  return null;
}

/**
 * Get all supported countries
 */
export function getSupportedCountries(): string[] {
  return Object.keys(EMISSION_FACTORS_DB);
}

/**
 * Calculate Scope 2 and Scope 3 from lifecycle
 * Using industry standard 85/15 split
 */
export function splitEmissionFactors(lifecycleGco2Kwh: number) {
  return {
    lifecycle: lifecycleGco2Kwh,
    scope2: lifecycleGco2Kwh * 0.85,
    scope3_cat3: lifecycleGco2Kwh * 0.15
  };
}
