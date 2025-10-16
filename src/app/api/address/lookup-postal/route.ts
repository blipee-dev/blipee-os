import { NextRequest, NextResponse } from 'next/server';

// Use Serper API for geocoding and address lookup
async function lookupAddressWithSerper(postalCode: string, country: string = '') {
  const serperApiKey = process.env.SERPER_API_KEY;

  if (!serperApiKey) {
    return null;
  }

  try {
    // Search for the postal code with country context
    const query = country ? `${postalCode} ${country} postal code address` : `${postalCode} postal code address`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 5,
        gl: country === 'PT' ? 'pt' : country === 'US' ? 'us' : 'gb',
        hl: country === 'PT' ? 'pt' : 'en'
      }),
    });

    if (response.ok) {
      const data = await response.json();

      // Try to extract address information from search results
      if (data.knowledgeGraph) {
        // Knowledge graph often has structured location data
        return {
          city: data.knowledgeGraph.city || data.knowledgeGraph.location || '',
          country: country || data.knowledgeGraph.country || '',
          description: data.knowledgeGraph.description || ''
        };
      }

      // Parse from organic results
      if (data.organic && data.organic.length > 0) {
        // Look for address patterns in snippets
        const firstResult = data.organic[0];
        const snippet = firstResult.snippet || '';

        // Try to extract city from snippet
        let city = '';

        // Portuguese patterns
        if (country === 'PT' || postalCode.match(/^\d{4}-?\d{3}$/)) {
          const cityMatch = snippet.match(/(?:Lisboa|Porto|Faro|Coimbra|Braga|Évora|Aveiro|Setúbal|Funchal|Ponta Delgada)/i);
          if (cityMatch) city = cityMatch[0];
        }

        // Return extracted data
        if (city) {
          return {
            city,
            country: country || 'PT',
            description: snippet
          };
        }
      }
    }
  } catch (error) {
    console.error('Serper API error:', error);
  }

  return null;
}

// Portuguese postal code lookup using CTT API or similar
async function lookupPortuguesePostalCode(postalCode: string) {
  // First try Serper API
  const serperResult = await lookupAddressWithSerper(postalCode, 'PT');
  if (serperResult) {
    return serperResult;
  }
  // Format: XXXX-XXX
  const formattedCode = postalCode.replace(/\s/g, '');

  // Common Portuguese postal codes (as fallback data)
  const postalCodeData: Record<string, any> = {
    '1069-214': {
      city: 'Lisboa',
      street_prefix: 'Av. Fontes Pereira de Melo',
      country: 'PT'
    },
    '1050-004': {
      city: 'Lisboa',
      street_prefix: 'Avenida da Liberdade',
      country: 'PT'
    },
    '4050-545': {
      city: 'Porto',
      street_prefix: 'Rua do Rosário',
      country: 'PT'
    },
    '4000-322': {
      city: 'Porto',
      street_prefix: 'Praça da Liberdade',
      country: 'PT'
    },
    '8000-205': {
      city: 'Faro',
      street_prefix: 'Rua de Portugal',
      country: 'PT'
    },
    '1250-096': {
      city: 'Lisboa',
      street_prefix: 'Largo do Chiado',
      country: 'PT'
    }
  };

  // Check if we have this postal code in our data
  if (postalCodeData[formattedCode]) {
    return postalCodeData[formattedCode];
  }

  // Try to extract city from postal code pattern
  // Portuguese postal codes: first 4 digits indicate region
  const regionCode = formattedCode.substring(0, 4);

  // Region mapping for Portuguese postal codes
  const regionMap: Record<string, string> = {
    '1000': 'Lisboa', '1050': 'Lisboa', '1069': 'Lisboa', '1100': 'Lisboa',
    '1150': 'Lisboa', '1200': 'Lisboa', '1250': 'Lisboa', '1300': 'Lisboa',
    '2000': 'Santarém', '2100': 'Santarém',
    '3000': 'Coimbra', '3030': 'Coimbra',
    '4000': 'Porto', '4050': 'Porto', '4100': 'Porto', '4150': 'Porto',
    '4200': 'Porto', '4250': 'Porto', '4300': 'Porto', '4350': 'Porto',
    '5000': 'Vila Real',
    '6000': 'Castelo Branco',
    '7000': 'Évora',
    '8000': 'Faro', '8100': 'Loulé', '8200': 'Albufeira', '8500': 'Portimão',
    '9000': 'Funchal', '9500': 'Ponta Delgada'
  };

  // Find matching region
  for (const [prefix, city] of Object.entries(regionMap)) {
    if (regionCode.startsWith(prefix.substring(0, 2))) {
      return {
        city,
        country: 'PT',
        street_prefix: ''
      };
    }
  }

  return null;
}

// Generic postal code lookup for other countries
async function lookupGenericPostalCode(postalCode: string, country?: string) {
  // US ZIP codes
  if (country === 'US' || /^\d{5}(-\d{4})?$/.test(postalCode)) {
    // Basic US ZIP code regions (first 3 digits)
    const zipPrefix = postalCode.substring(0, 3);
    const usRegions: Record<string, { city: string, state: string }> = {
      '100': { city: 'New York', state: 'NY' },
      '200': { city: 'Washington', state: 'DC' },
      '300': { city: 'Atlanta', state: 'GA' },
      '331': { city: 'Miami', state: 'FL' },
      '600': { city: 'Chicago', state: 'IL' },
      '750': { city: 'Dallas', state: 'TX' },
      '900': { city: 'Los Angeles', state: 'CA' },
      '941': { city: 'San Francisco', state: 'CA' },
    };

    for (const [prefix, data] of Object.entries(usRegions)) {
      if (zipPrefix.startsWith(prefix.substring(0, 2))) {
        return {
          city: data.city,
          state: data.state,
          country: 'US'
        };
      }
    }
  }

  // UK postcodes
  if (country === 'GB' || /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i.test(postalCode)) {
    const ukPrefix = postalCode.substring(0, 2).toUpperCase();
    const ukRegions: Record<string, string> = {
      'EC': 'London', 'WC': 'London', 'E': 'London', 'N': 'London',
      'S': 'London', 'W': 'London', 'SW': 'London', 'SE': 'London',
      'M': 'Manchester', 'B': 'Birmingham', 'L': 'Liverpool',
      'EH': 'Edinburgh', 'G': 'Glasgow'
    };

    return {
      city: ukRegions[ukPrefix] || 'Unknown',
      country: 'GB'
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { postalCode, country } = await request.json();

    if (!postalCode) {
      return NextResponse.json(
        { error: 'Postal code is required' },
        { status: 400 }
      );
    }

    // Clean the postal code
    const cleanedCode = postalCode.trim();

    // First, try Serper API for any postal code
    const serperResult = await lookupAddressWithSerper(cleanedCode, country || '');
    if (serperResult) {
      return NextResponse.json({
        success: true,
        data: serperResult,
        source: 'serper'
      });
    }

    // Fallback to local data
    // Try Portuguese format (XXXX-XXX)
    if (/^\d{4}-?\d{3}$/.test(cleanedCode) || country === 'PT') {
      const result = await lookupPortuguesePostalCode(cleanedCode);
      if (result) {
        return NextResponse.json({
          success: true,
          data: result,
          source: 'local'
        });
      }
    }

    // Try generic lookup for other countries
    const genericResult = await lookupGenericPostalCode(cleanedCode, country);
    if (genericResult) {
      return NextResponse.json({
        success: true,
        data: genericResult,
        source: 'local'
      });
    }

    // No match found
    return NextResponse.json({
      success: false,
      message: 'Could not find address for this postal code'
    });

  } catch (error) {
    console.error('Postal code lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup postal code' },
      { status: 500 }
    );
  }
}