import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
      return NextResponse.json(
        { error: 'Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to .env.local' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const postalcode = searchParams.get('postalcode')
    const street = searchParams.get('street')
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const countrycode = searchParams.get('countrycode')
    const q = searchParams.get('q')

    // Build address query for Google Maps
    let address = ''

    if (q) {
      // Free-form query
      address = q
    } else {
      // Build structured address
      const parts = []
      if (street) parts.push(street)
      if (postalcode) parts.push(postalcode)
      if (city) parts.push(city)
      if (country) parts.push(country)
      address = parts.join(', ')
    }

    // Add country component if provided
    const components = countrycode ? `&components=country:${countrycode.toUpperCase()}` : ''

    const googleMapsUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}${components}&key=${GOOGLE_MAPS_API_KEY}`

    console.log('[Geocode API] Requesting Google Maps:', address, components)

    const response = await fetch(googleMapsUrl)

    if (!response.ok) {
      console.error('[Geocode API] Google Maps API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Geocoding service unavailable' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.status !== 'OK') {
      console.log('[Geocode API] Google Maps status:', data.status)
      if (data.status === 'ZERO_RESULTS') {
        return NextResponse.json([])
      }
      return NextResponse.json(
        { error: `Geocoding error: ${data.status}` },
        { status: 400 }
      )
    }

    // Transform Google Maps response to match Nominatim format
    const results = data.results.map((result: any) => {
      const addressComponents: Record<string, string> = {}

      result.address_components.forEach((component: any) => {
        if (component.types.includes('street_number')) {
          addressComponents.house_number = component.long_name
        }
        if (component.types.includes('route')) {
          addressComponents.road = component.long_name
        }
        if (component.types.includes('locality')) {
          addressComponents.city = component.long_name
        }
        if (component.types.includes('administrative_area_level_2')) {
          addressComponents.town = component.long_name
        }
        if (component.types.includes('postal_code')) {
          addressComponents.postcode = component.long_name
        }
        if (component.types.includes('country')) {
          addressComponents.country = component.long_name
          addressComponents.country_code = component.short_name.toLowerCase()
        }
      })

      return {
        lat: result.geometry.location.lat.toString(),
        lon: result.geometry.location.lng.toString(),
        display_name: result.formatted_address,
        address: addressComponents,
      }
    })

    console.log('[Geocode API] Received', results.length, 'results from Google Maps')
    if (results.length > 0) {
      console.log('[Geocode API] First result:', {
        city: results[0].address?.city,
        postcode: results[0].address?.postcode,
        country: results[0].address?.country,
      })
    }

    // Add cache headers to reduce API calls
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    })
  } catch (error) {
    console.error('Geocoding API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
