import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { ExternalAPIManager } from '@/lib/data/apis/external-api-manager';
import { env } from '@/lib/config/env';

// Initialize API manager with available credentials
const apiManager = new ExternalAPIManager({
  weather: env.OPENWEATHERMAP_API_KEY ? {
    apiKey: env.OPENWEATHERMAP_API_KEY,
    rateLimit: { requests: 60, windowMs: 60000 }
  } : undefined,
  electricityMaps: env.ELECTRICITY_MAPS_API_KEY ? {
    apiKey: env.ELECTRICITY_MAPS_API_KEY,
    cache: { enabled: true, ttl: 300 }
  } : undefined,
  carbonInterface: env.CARBON_INTERFACE_API_KEY ? {
    apiKey: env.CARBON_INTERFACE_API_KEY,
    units: 'metric'
  } : undefined,
  regulatory: env.REGULATORY_API_KEY ? {
    apiKey: env.REGULATORY_API_KEY
  } : undefined
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'health':
        const health = await apiManager.healthCheck();
        return NextResponse.json({
          success: true,
          health
        });

      case 'building-intelligence':
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lon = parseFloat(searchParams.get('lon') || '0');
        const zone = searchParams.get('zone') || undefined;
        
        if (!lat || !lon) {
          return NextResponse.json(
            { error: 'Latitude and longitude are required' },
            { status: 400 }
          );
        }

        const intelligence = await apiManager.getBuildingIntelligence({
          location: { lat, lon },
          zone,
          buildingProfile: {
            type: 'office',
            size: 5000,
            occupancy: 100,
            energyUse: 50000
          }
        });

        return NextResponse.json({
          success: true,
          data: intelligence
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: health, building-intelligence' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('External data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch external data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'calculate-emissions':
        if (!params?.activities || !Array.isArray(params.activities)) {
          return NextResponse.json(
            { error: 'Activities array is required' },
            { status: 400 }
          );
        }

        const emissions = await apiManager.calculateEmissions(params.activities);
        return NextResponse.json({
          success: true,
          data: emissions
        });

      case 'compliance-status':
        if (!params?.jurisdiction || !params?.industry || !params?.companySize) {
          return NextResponse.json(
            { error: 'Jurisdiction, industry, and company size are required' },
            { status: 400 }
          );
        }

        const compliance = await apiManager.getComplianceStatus(params);
        return NextResponse.json({
          success: true,
          data: compliance
        });

      case 'energy-optimization':
        if (!params?.location || !params?.currentUsage) {
          return NextResponse.json(
            { error: 'Location and current usage data are required' },
            { status: 400 }
          );
        }

        const optimization = await apiManager.generateEnergyOptimizationPlan(params);
        return NextResponse.json({
          success: true,
          data: optimization
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: calculate-emissions, compliance-status, energy-optimization' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('External data API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}