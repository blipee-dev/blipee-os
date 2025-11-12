/**
 * SBTi Sector Mapping
 * Maps organization industries to SBTi pathway sectors
 */

export type SBTiSector =
  | 'cross_sector'
  | 'buildings'
  | 'flag' // Forest, Land and Agriculture
  | 'power_generation'
  | 'cement'
  | 'iron_steel'
  | 'aluminum'
  | 'pulp_paper'
  | 'transport'
  | 'maritime'
  | 'aviation'
  | 'chemicals'
  | 'oil_gas'

/**
 * Map GRI Sector Code to SBTi Sector
 */
const GRI_TO_SBTI_MAPPING: Record<string, SBTiSector> = {
  'GRI 11': 'oil_gas', // Oil and Gas → Oil & Gas
  'GRI 12': 'cross_sector', // Coal → Cross-sector (not specific pathway)
  'GRI 13': 'flag', // Agriculture, Aquaculture and Fishing → FLAG
  'GRI 14': 'cross_sector', // Mining → Cross-sector
  'GRI 15': 'cross_sector', // Food and Beverage → Cross-sector (or FLAG if heavy ag)
  'GRI 16': 'cross_sector', // Textiles and Apparel → Cross-sector
  'GRI 17': 'cross_sector', // Tobacco → Cross-sector
}

/**
 * Map NAICS Code to SBTi Sector
 */
const NAICS_TO_SBTI_MAPPING: Record<string, SBTiSector> = {
  '111': 'flag', // Crop Production → FLAG
  '211': 'oil_gas', // Oil and Gas Extraction → Oil & Gas
  '2121': 'cross_sector', // Coal Mining → Cross-sector
  '31-33': 'cross_sector', // Manufacturing → Cross-sector (generic)
  '51': 'cross_sector', // Information → Cross-sector
  '52': 'cross_sector', // Finance and Insurance → Cross-sector
  '2361': 'buildings', // Residential Building Construction → Buildings
  '2362': 'buildings', // Nonresidential Building Construction → Buildings
  '3241': 'cement', // Cement and Concrete Product Manufacturing → Cement
  '3311': 'iron_steel', // Iron and Steel Mills → Iron & Steel
  '3313': 'aluminum', // Alumina and Aluminum Production → Aluminum
  '3221': 'pulp_paper', // Pulp, Paper, and Paperboard Mills → Pulp & Paper
  '2211': 'power_generation', // Electric Power Generation → Power
  '481': 'aviation', // Air Transportation → Aviation
  '483': 'maritime', // Water Transportation → Maritime
  '484': 'transport', // Truck Transportation → Transport
  '485': 'transport', // Transit and Ground Passenger Transportation → Transport
}

/**
 * Map free-form industry text to SBTi Sector
 * (used when no formal classification exists)
 */
const INDUSTRY_KEYWORD_MAPPING: Array<{
  keywords: string[]
  sector: SBTiSector
}> = [
  // Power & Energy
  {
    keywords: ['power', 'electricity', 'renewable energy', 'solar', 'wind', 'hydro', 'utility'],
    sector: 'power_generation',
  },
  // Oil & Gas
  {
    keywords: ['oil', 'gas', 'petroleum', 'refinery', 'drilling', 'extraction'],
    sector: 'oil_gas',
  },
  // Cement
  {
    keywords: ['cement', 'concrete', 'clinker'],
    sector: 'cement',
  },
  // Iron & Steel
  {
    keywords: ['steel', 'iron', 'metallurgy', 'foundry', 'smelting'],
    sector: 'iron_steel',
  },
  // Aluminum
  {
    keywords: ['aluminum', 'aluminium', 'bauxite', 'alumina'],
    sector: 'aluminum',
  },
  // Pulp & Paper
  {
    keywords: ['paper', 'pulp', 'cardboard', 'packaging'],
    sector: 'pulp_paper',
  },
  // Buildings
  {
    keywords: [
      'construction',
      'building',
      'real estate',
      'property',
      'residential',
      'commercial building',
    ],
    sector: 'buildings',
  },
  // FLAG (Forest, Land, Agriculture)
  {
    keywords: [
      'agriculture',
      'farming',
      'forestry',
      'crop',
      'livestock',
      'food production',
      'aquaculture',
      'fishing',
    ],
    sector: 'flag',
  },
  // Aviation
  {
    keywords: ['aviation', 'airline', 'aircraft', 'airport', 'air transport'],
    sector: 'aviation',
  },
  // Maritime
  {
    keywords: ['shipping', 'maritime', 'vessel', 'port', 'cargo ship', 'freight'],
    sector: 'maritime',
  },
  // Transport (general)
  {
    keywords: ['transport', 'logistics', 'trucking', 'delivery', 'fleet'],
    sector: 'transport',
  },
  // Chemicals
  {
    keywords: ['chemical', 'petrochemical', 'pharmaceutical', 'fertilizer'],
    sector: 'chemicals',
  },
]

/**
 * Interface for organization sector information
 */
export interface OrganizationSectorInfo {
  industry?: string | null
  industry_primary?: string | null
  industry_secondary?: string | null
  industry_sector?: string | null
  sector_category?: string | null
  gri_sector_code?: string | null
  naics_code?: string | null
}

/**
 * Determine the best SBTi sector for an organization
 *
 * Priority order:
 * 1. GRI Sector Code (most specific for sustainability)
 * 2. NAICS Code (standardized industry classification)
 * 3. Industry keyword matching (free-form text)
 * 4. Default to 'cross_sector' (universal pathway)
 */
export function mapOrganizationToSBTiSector(org: OrganizationSectorInfo): {
  sector: SBTiSector
  confidence: 'high' | 'medium' | 'low'
  method: 'gri' | 'naics' | 'keyword' | 'default'
} {
  // Try GRI sector code first (highest priority)
  if (org.gri_sector_code && GRI_TO_SBTI_MAPPING[org.gri_sector_code]) {
    return {
      sector: GRI_TO_SBTI_MAPPING[org.gri_sector_code],
      confidence: 'high',
      method: 'gri',
    }
  }

  // Try NAICS code second
  if (org.naics_code && NAICS_TO_SBTI_MAPPING[org.naics_code]) {
    return {
      sector: NAICS_TO_SBTI_MAPPING[org.naics_code],
      confidence: 'high',
      method: 'naics',
    }
  }

  // Try keyword matching on various industry fields
  const industryTexts = [
    org.industry,
    org.industry_primary,
    org.industry_secondary,
    org.industry_sector,
    org.sector_category,
  ].filter(Boolean) as string[]

  for (const text of industryTexts) {
    const lowerText = text.toLowerCase()

    for (const mapping of INDUSTRY_KEYWORD_MAPPING) {
      if (mapping.keywords.some((keyword) => lowerText.includes(keyword))) {
        return {
          sector: mapping.sector,
          confidence: 'medium',
          method: 'keyword',
        }
      }
    }
  }

  // Default to cross-sector (universal pathway)
  return {
    sector: 'cross_sector',
    confidence: 'low',
    method: 'default',
  }
}

/**
 * Get available pathways for a sector
 */
export async function getAvailablePathways(sector: SBTiSector): Promise<{
  scenarios: string[]
  yearRange: { from: number; to: number }
}> {
  // This would query the database in a real implementation
  // For now, return based on what we know exists
  const pathwayAvailability: Record<
    SBTiSector,
    { scenarios: string[]; yearRange: { from: number; to: number } }
  > = {
    cross_sector: {
      scenarios: ['ETP_B2DS', 'SBTi_1.5C'],
      yearRange: { from: 2014, to: 2050 },
    },
    cement: {
      scenarios: ['ETP_B2DS', 'SBTi_1.5C'],
      yearRange: { from: 2014, to: 2050 },
    },
    iron_steel: {
      scenarios: ['ETP_B2DS', 'SBTi_1.5C'],
      yearRange: { from: 2014, to: 2050 },
    },
    aluminum: {
      scenarios: ['ETP_B2DS'],
      yearRange: { from: 2014, to: 2050 },
    },
    pulp_paper: {
      scenarios: ['ETP_B2DS'],
      yearRange: { from: 2014, to: 2050 },
    },
    buildings: {
      scenarios: ['ETP_B2DS', 'SBTi_1.5C'],
      yearRange: { from: 2014, to: 2050 },
    },
    power_generation: {
      scenarios: ['ETP_B2DS', 'SBTi_1.5C'],
      yearRange: { from: 2014, to: 2050 },
    },
    // Default for sectors without specific pathways
    transport: {
      scenarios: ['ETP_B2DS'],
      yearRange: { from: 2014, to: 2050 },
    },
    flag: {
      scenarios: ['ETP_B2DS'],
      yearRange: { from: 2014, to: 2050 },
    },
    maritime: {
      scenarios: ['ETP_B2DS'],
      yearRange: { from: 2014, to: 2050 },
    },
    aviation: {
      scenarios: ['ETP_B2DS'],
      yearRange: { from: 2014, to: 2050 },
    },
    chemicals: {
      scenarios: ['ETP_B2DS'],
      yearRange: { from: 2014, to: 2050 },
    },
    oil_gas: {
      scenarios: ['ETP_B2DS'],
      yearRange: { from: 2014, to: 2050 },
    },
  }

  return (
    pathwayAvailability[sector] || {
      scenarios: ['ETP_B2DS'],
      yearRange: { from: 2014, to: 2050 },
    }
  )
}

/**
 * Get human-readable sector name
 */
export function getSectorDisplayName(sector: SBTiSector): string {
  const displayNames: Record<SBTiSector, string> = {
    cross_sector: 'Cross-Sector (Universal)',
    buildings: 'Buildings & Construction',
    flag: 'FLAG (Forest, Land & Agriculture)',
    power_generation: 'Power Generation',
    cement: 'Cement',
    iron_steel: 'Iron & Steel',
    aluminum: 'Aluminum',
    pulp_paper: 'Pulp & Paper',
    transport: 'Transport',
    maritime: 'Maritime Shipping',
    aviation: 'Aviation',
    chemicals: 'Chemicals',
    oil_gas: 'Oil & Gas',
  }

  return displayNames[sector] || sector
}

/**
 * Suggest better sector classification
 * Returns alternative sectors if the default mapping might not be optimal
 */
export function suggestAlternativeSectors(
  org: OrganizationSectorInfo
): Array<{ sector: SBTiSector; reason: string }> {
  const suggestions: Array<{ sector: SBTiSector; reason: string }> = []

  // If using cross_sector, suggest more specific sectors
  const currentMapping = mapOrganizationToSBTiSector(org)
  if (currentMapping.sector === 'cross_sector' && currentMapping.confidence === 'low') {
    suggestions.push({
      sector: 'buildings',
      reason: 'Se a sua organização opera edifícios comerciais ou residenciais',
    })
    suggestions.push({
      sector: 'power_generation',
      reason: 'Se a sua organização gera ou distribui eletricidade',
    })
    suggestions.push({
      sector: 'flag',
      reason: 'Se a sua organização trabalha com agricultura, floresta ou uso de terras',
    })
  }

  return suggestions
}
