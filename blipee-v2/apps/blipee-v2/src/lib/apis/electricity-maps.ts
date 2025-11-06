/**
 * Electricity Maps API Integration
 * https://api.electricitymap.org/
 */

const API_KEY = process.env.ELECTRICITY_MAPS_API_KEY!
const BASE_URL = 'https://api.electricitymap.org/v3'

export interface CarbonIntensityData {
  zone: string
  carbonIntensity: number // gCO2eq/kWh
  datetime: string
  updatedAt: string
  emissionFactorType: string
  isEstimated: boolean
  estimationMethod: string | null
}

export interface PowerBreakdownData {
  zone: string
  datetime: string
  updatedAt: string
  powerConsumptionBreakdown: {
    [key: string]: number | null
  }
  powerProductionBreakdown: {
    [key: string]: number | null
  }
  powerImportBreakdown: {
    [key: string]: number | null
  }
  powerExportBreakdown: {
    [key: string]: number | null
  }
  fossilFreePercentage: number | null
  renewablePercentage: number | null
  powerConsumptionTotal: number | null
  powerProductionTotal: number | null
  powerImportTotal: number | null
  powerExportTotal: number | null
  isEstimated: boolean
  estimationMethod: string | null
}

/**
 * Get latest carbon intensity for a zone
 * @param zone - ISO 2-letter country code or zone code (e.g., 'PT', 'ES', 'FR')
 */
export async function getCarbonIntensity(zone: string): Promise<CarbonIntensityData | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/carbon-intensity/latest?zone=${zone}`,
      {
        headers: {
          'auth-token': API_KEY,
        },
        cache: 'no-store', // Disable cache to avoid hydration issues
      }
    )

    if (!response.ok) {
      console.error(`Electricity Maps API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching carbon intensity:', error)
    return null
  }
}

/**
 * Get latest power breakdown for a zone
 * @param zone - ISO 2-letter country code or zone code (e.g., 'PT', 'ES', 'FR')
 */
export async function getPowerBreakdown(zone: string): Promise<PowerBreakdownData | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/power-breakdown/latest?zone=${zone}`,
      {
        headers: {
          'auth-token': API_KEY,
        },
        cache: 'no-store', // Disable cache to avoid hydration issues
      }
    )

    if (!response.ok) {
      console.error(`Electricity Maps API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching power breakdown:', error)
    return null
  }
}

/**
 * Get historical carbon intensity for a zone and datetime
 * @param zone - ISO 2-letter country code or zone code (e.g., 'PT', 'ES', 'FR')
 * @param datetime - ISO 8601 datetime string
 */
export async function getCarbonIntensityPast(zone: string, datetime: string): Promise<CarbonIntensityData | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/carbon-intensity/past?zone=${zone}&datetime=${datetime}`,
      {
        headers: {
          'auth-token': API_KEY,
        },
      }
    )

    if (!response.ok) {
      console.error(`Electricity Maps API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching historical carbon intensity:', error)
    return null
  }
}

/**
 * Get historical power breakdown for a zone and datetime
 * @param zone - ISO 2-letter country code or zone code (e.g., 'PT', 'ES', 'FR')
 * @param datetime - ISO 8601 datetime string
 */
export async function getPowerBreakdownPast(zone: string, datetime: string): Promise<PowerBreakdownData | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/power-breakdown/past?zone=${zone}&datetime=${datetime}`,
      {
        headers: {
          'auth-token': API_KEY,
        },
      }
    )

    if (!response.ok) {
      console.error(`Electricity Maps API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching historical power breakdown:', error)
    return null
  }
}

/**
 * Map country name to ISO 2-letter zone code
 * Electricity Maps uses ISO 3166-1 alpha-2 codes
 */
export function getZoneFromCountry(country: string | null): string | null {
  if (!country) return null

  // Normalize country name
  const normalized = country.toLowerCase().trim()

  // Common mappings
  const countryToZone: Record<string, string> = {
    'portugal': 'PT',
    'spain': 'ES',
    'france': 'FR',
    'germany': 'DE',
    'united kingdom': 'GB',
    'italy': 'IT',
    'netherlands': 'NL',
    'belgium': 'BE',
    'poland': 'PL',
    'czech republic': 'CZ',
    'austria': 'AT',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'finland': 'FI',
    'ireland': 'IE',
    'greece': 'GR',
    'romania': 'RO',
    'bulgaria': 'BG',
    'hungary': 'HU',
    'slovakia': 'SK',
    'croatia': 'HR',
    'slovenia': 'SI',
    'lithuania': 'LT',
    'latvia': 'LV',
    'estonia': 'EE',
    'luxembourg': 'LU',
    // Add more as needed
  }

  return countryToZone[normalized] || null
}
