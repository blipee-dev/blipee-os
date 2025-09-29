import { NextRequest, NextResponse } from 'next/server';

async function searchAddressWithSerper(query: string, country?: string) {
  const serperApiKey = process.env.SERPER_API_KEY;

  if (!serperApiKey) {
    return [];
  }

  try {
    // Build search query with location context
    let searchQuery = query;

    // Add country context if provided
    if (country) {
      searchQuery = `${query} ${country}`;
    }

    // Add "address" to help with geocoding
    if (!query.toLowerCase().includes('address')) {
      searchQuery = `${searchQuery} address`;
    }

    const response = await fetch('https://google.serper.dev/places', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        gl: country === 'PT' ? 'pt' : country === 'US' ? 'us' : null,
        autocomplete: true
      }),
    });

    if (response.ok) {
      const data = await response.json();

      // Process places results
      if (data.places && Array.isArray(data.places)) {
        return data.places.slice(0, 5).map((place: any) => ({
          name: place.title || '',
          address: place.address || '',
          city: place.city || extractCityFromAddress(place.address),
          postalCode: place.postalCode || extractPostalCode(place.address),
          country: place.countryCode || country || '',
          placeId: place.placeId || '',
          type: place.category || 'address'
        }));
      }
    }

    // Fallback to regular search if places API doesn't return results
    const searchResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 5,
        gl: country === 'PT' ? 'pt' : country === 'US' ? 'us' : null,
      }),
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const suggestions: any[] = [];

      // Extract from knowledge graph
      if (searchData.knowledgeGraph) {
        const kg = searchData.knowledgeGraph;
        if (kg.title && (kg.type?.includes('Place') || kg.type?.includes('Building'))) {
          suggestions.push({
            name: kg.title,
            address: kg.description || '',
            city: kg.attributes?.city || '',
            postalCode: '',
            country: country || '',
            type: 'place'
          });
        }
      }

      // Extract from organic results
      if (searchData.organic) {
        searchData.organic.slice(0, 3).forEach((result: any) => {
          if (result.title && result.snippet) {
            // Look for address patterns in snippet
            const addressMatch = result.snippet.match(/[\d\w\s]+,\s*[\w\s]+,?\s*[\d-]+/);
            if (addressMatch || result.snippet.toLowerCase().includes('address')) {
              suggestions.push({
                name: result.title,
                address: addressMatch ? addressMatch[0] : '',
                city: extractCityFromText(result.snippet),
                postalCode: extractPostalCode(result.snippet),
                country: country || '',
                type: 'search'
              });
            }
          }
        });
      }

      return suggestions.slice(0, 5);
    }

  } catch (error) {
    console.error('Serper API error:', error);
  }

  return [];
}

// Helper function to extract city from address string
function extractCityFromAddress(address: string): string {
  if (!address) return '';

  // Common Portuguese cities
  const ptCities = ['Lisboa', 'Porto', 'Faro', 'Coimbra', 'Braga', 'Aveiro', 'Setúbal', 'Évora'];
  for (const city of ptCities) {
    if (address.includes(city)) return city;
  }

  // Try to extract from comma-separated address
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }

  return '';
}

// Helper function to extract postal code
function extractPostalCode(text: string): string {
  if (!text) return '';

  // Portuguese postal code pattern
  const ptPattern = /\b\d{4}-\d{3}\b/;
  const ptMatch = text.match(ptPattern);
  if (ptMatch) return ptMatch[0];

  // US ZIP code pattern
  const usPattern = /\b\d{5}(?:-\d{4})?\b/;
  const usMatch = text.match(usPattern);
  if (usMatch) return usMatch[0];

  // UK postcode pattern
  const ukPattern = /\b[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\b/i;
  const ukMatch = text.match(ukPattern);
  if (ukMatch) return ukMatch[0];

  return '';
}

// Helper function to extract city from text
function extractCityFromText(text: string): string {
  // Portuguese cities
  const cities = [
    'Lisboa', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga',
    'Setúbal', 'Coimbra', 'Queluz', 'Funchal', 'Cacém',
    'Aveiro', 'Faro', 'Évora', 'Viseu', 'Guimarães'
  ];

  for (const city of cities) {
    if (text.includes(city)) return city;
  }

  return '';
}

// Local suggestions for common Portuguese buildings/addresses
function getLocalSuggestions(query: string): any[] {
  const suggestions = [
    {
      name: 'Av. Fontes Pereira de Melo 41',
      address: 'Av. Fontes Pereira de Melo 41, 1069-214 Lisboa',
      city: 'Lisboa',
      postalCode: '1069-214',
      country: 'PT',
      type: 'local'
    },
    {
      name: 'Torre das Amoreiras',
      address: 'Av. Eng. Duarte Pacheco, 1070-102 Lisboa',
      city: 'Lisboa',
      postalCode: '1070-102',
      country: 'PT',
      type: 'local'
    },
    {
      name: 'Centro Empresarial Torres de Lisboa',
      address: 'Rua Tomás da Fonseca, 1600-209 Lisboa',
      city: 'Lisboa',
      postalCode: '1600-209',
      country: 'PT',
      type: 'local'
    },
    {
      name: 'Edifício Transparente',
      address: 'Praça do Bom Sucesso 61, 4150-146 Porto',
      city: 'Porto',
      postalCode: '4150-146',
      country: 'PT',
      type: 'local'
    },
    {
      name: 'Porto Office Park',
      address: 'Via Norte, 4470-177 Maia',
      city: 'Maia',
      postalCode: '4470-177',
      country: 'PT',
      type: 'local'
    }
  ];

  // Filter based on query
  const lowerQuery = query.toLowerCase();
  return suggestions.filter(s =>
    s.name.toLowerCase().includes(lowerQuery) ||
    s.address.toLowerCase().includes(lowerQuery) ||
    s.city.toLowerCase().includes(lowerQuery)
  ).slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const { query, country } = await request.json();

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        message: 'Query must be at least 2 characters',
        suggestions: []
      });
    }

    // Get suggestions from multiple sources
    const [serperSuggestions, localSuggestions] = await Promise.all([
      searchAddressWithSerper(query, country),
      Promise.resolve(getLocalSuggestions(query))
    ]);

    // Combine and deduplicate suggestions
    const allSuggestions = [...serperSuggestions, ...localSuggestions];

    // Remove duplicates based on address
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.address === suggestion.address)
    );

    return NextResponse.json({
      success: true,
      suggestions: uniqueSuggestions.slice(0, 5)
    });

  } catch (error) {
    console.error('Address autocomplete error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get address suggestions',
      suggestions: []
    });
  }
}