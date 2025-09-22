import { NextResponse } from 'next/server';
import { PeerBenchmarkingEngine } from '@/lib/ai/industry-intelligence/peer-benchmarking-engine';

export async function POST(request: Request) {
  try {
    const { organizationId, industry, metrics } = await request.json();

    const benchmarkEngine = new PeerBenchmarkingEngine();

    // Join the network
    const profile = {
      organizationId: organizationId || 'test-org',
      industry: industry || 'Oil & Gas',
      size: 'large' as const,
      revenue: 1000000000,
      employees: 5000,
      regions: ['North America', 'Europe'],
      isPublic: true,
      participationLevel: 'premium' as const
    };

    await benchmarkEngine.joinNetwork(profile);

    // Submit sample metrics
    const sampleMetrics = metrics || [
      {
        metricId: 'scope1_emissions',
        value: 150000,
        unit: 'tCO2e',
        reportingPeriod: '2024',
        dataQuality: 'verified' as const,
        lastUpdated: new Date()
      },
      {
        metricId: 'energy_intensity',
        value: 120,
        unit: 'kWh/m2',
        reportingPeriod: '2024',
        dataQuality: 'verified' as const,
        lastUpdated: new Date()
      },
      {
        metricId: 'water_consumption',
        value: 50000,
        unit: 'm3',
        reportingPeriod: '2024',
        dataQuality: 'self_reported' as const,
        lastUpdated: new Date()
      }
    ];

    // Submit metrics for benchmarking
    await benchmarkEngine.submitMetricData(organizationId || 'test-org', sampleMetrics);

    // Get benchmark results
    const results = await benchmarkEngine.getBenchmarkResults(
      organizationId || 'test-org',
      sampleMetrics.map(m => m.metricId)
    );

    // Get network insights
    const networkInsights = await benchmarkEngine.getNetworkInsights(industry || 'Oil & Gas');

    return NextResponse.json({
      success: true,
      profile,
      benchmarks: results,
      networkInsights,
      participantsInNetwork: 50, // Simulated network size
      dataQuality: 0.85 // Simulated quality score
    });
  } catch (error) {
    console.error('Benchmarking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform benchmarking'
      },
      { status: 500 }
    );
  }
}