// Map country names to ISO 3166-1 alpha-2 codes
export const countryToISO: Record<string, string> = {
  // Portuguese names
  'Portugal': 'PT',
  'Espanha': 'ES',
  'França': 'FR',
  'Alemanha': 'DE',
  'Itália': 'IT',
  'Reino Unido': 'GB',
  'Estados Unidos': 'US',
  'Brasil': 'BR',
  'Angola': 'AO',
  'Moçambique': 'MZ',
  'Cabo Verde': 'CV',
  'Guiné-Bissau': 'GW',
  'São Tomé e Príncipe': 'ST',
  'Timor-Leste': 'TL',

  // English names
  'Spain': 'ES',
  'France': 'FR',
  'Germany': 'DE',
  'Italy': 'IT',
  'United Kingdom': 'GB',
  'United States': 'US',
  'Brazil': 'BR',
  'Angola': 'AO',
  'Mozambique': 'MZ',
  'Cape Verde': 'CV',
  'Guinea-Bissau': 'GW',
  'Sao Tome and Principe': 'ST',
  'East Timor': 'TL',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Poland': 'PL',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Ireland': 'IE',
  'Greece': 'GR',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Croatia': 'HR',
  'Slovenia': 'SI',
  'Slovakia': 'SK',
  'Lithuania': 'LT',
  'Latvia': 'LV',
  'Estonia': 'EE',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Cyprus': 'CY',
}

/**
 * Converts a country name to its ISO 3166-1 alpha-2 code
 * Falls back to the first 2 characters if no mapping is found
 */
export function getCountryCode(country: string): string {
  if (!country) return ''

  // Try exact match first
  const exactMatch = countryToISO[country]
  if (exactMatch) return exactMatch

  // Try case-insensitive match
  const lowerCountry = country.toLowerCase()
  for (const [name, code] of Object.entries(countryToISO)) {
    if (name.toLowerCase() === lowerCountry) {
      return code
    }
  }

  // If already looks like a 2-letter code, use it
  if (country.length === 2 && /^[A-Z]{2}$/i.test(country)) {
    return country.toUpperCase()
  }

  // Fallback: take first 2 characters
  return country.substring(0, 2).toUpperCase()
}
