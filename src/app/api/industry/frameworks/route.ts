import { NextResponse } from 'next/server';
import { sustainabilityFrameworks } from '@/lib/ai/industry-intelligence/sustainability-frameworks';

export async function POST(request: Request) {
  try {
    const { framework, data } = await request.json();

    // Default test data
    const defaultOrgData = {
      id: 'test-org',
      name: 'Test Organization',
      revenue: 100000000,
      employees: 500,
      area: 50000,
      production: 10000
    };

    const defaultBuildingData = {
      id: 'building-1',
      name: 'Corporate HQ',
      area: 50000,
      type: 'office',
      location: 'New York',
      transitAccess: true,
      bicycleNetwork: true,
      greenVehicles: true
    };

    const defaultPerformanceData = {
      energy: {
        electricity: 5000000, // kWh
        steam: 1000, // GJ
        cooling: 50000 // ton-hours
      },
      activities: {
        'natural-gas': 100000, // m3
        'fleet-diesel': 50000, // liters
        'fleet-gasoline': 30000, // liters
        'refrigerant-leakage': 100, // kg
        'air-travel-km': 500000, // passenger-km
        'hotel-nights': 1000,
        'waste-landfill': 100, // tonnes
        'waste-recycling': 200 // tonnes
      },
      waterReduction: 35,
      energyReduction: 42,
      health: {
        airQuality: 85,
        waterQuality: 90,
        thermalComfort: 78,
        acousticComfort: 72,
        lightingQuality: 88,
        satisfaction: 82,
        ventilation: true,
        filtration: true,
        airQualityMonitoring: true
      }
    };

    const organizationData = data?.organization || defaultOrgData;
    const buildingData = data?.building || defaultBuildingData;
    const performanceData = data?.performance || defaultPerformanceData;

    let result: any = {};

    switch (framework) {
      case 'ghg-protocol':
        result = sustainabilityFrameworks.calculateGHGInventory(
          performanceData.energy,
          performanceData.activities,
          organizationData
        );
        break;

      case 'leed':
        result = sustainabilityFrameworks.assessLEEDProject(
          buildingData,
          performanceData
        );
        break;

      case 'well':
        result = sustainabilityFrameworks.assessWELLProject(
          buildingData,
          performanceData.health
        );
        break;

      case 'breeam':
        result = sustainabilityFrameworks.assessBREEAMProject(
          buildingData,
          performanceData
        );
        break;

      case 'unified':
      default:
        result = sustainabilityFrameworks.performUnifiedAssessment(
          organizationData,
          buildingData,
          performanceData
        );
        break;
    }

    return NextResponse.json({
      success: true,
      framework: framework || 'unified',
      result,
      insights: generateInsights(framework || 'unified', result)
    });
  } catch (error) {
    console.error('Framework assessment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Assessment failed'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    frameworks: {
      'ghg-protocol': {
        name: 'GHG Protocol',
        description: 'Corporate Accounting and Reporting Standard',
        scopes: ['Scope 1: Direct emissions', 'Scope 2: Indirect energy', 'Scope 3: Value chain'],
        categories: 15,
        methodology: 'Activity-based and spend-based calculation'
      },
      'leed': {
        name: 'LEED v4.1',
        description: 'Leadership in Energy and Environmental Design',
        levels: ['Certified (40-49)', 'Silver (50-59)', 'Gold (60-79)', 'Platinum (80+)'],
        categories: 8,
        maxPoints: 110
      },
      'well': {
        name: 'WELL v2',
        description: 'WELL Building Standard for health and wellness',
        levels: ['Bronze (40)', 'Silver (50)', 'Gold (60)', 'Platinum (80)'],
        concepts: 11,
        features: 100
      },
      'breeam': {
        name: 'BREEAM',
        description: 'Building Research Establishment Environmental Assessment Method',
        ratings: ['Pass (≥30%)', 'Good (≥45%)', 'Very Good (≥55%)', 'Excellent (≥70%)', 'Outstanding (≥85%)'],
        categories: 10,
        scheme: 'International New Construction 2016'
      }
    },
    capabilities: [
      'GHG inventory calculation (Scope 1, 2, 3)',
      'LEED certification assessment',
      'WELL certification evaluation',
      'BREEAM rating assessment',
      'Unified sustainability assessment',
      'Gap analysis and recommendations',
      'Benchmarking and comparisons'
    ]
  });
}

function generateInsights(framework: string, result: any): any {
  const insights: any = {
    framework,
    timestamp: new Date().toISOString()
  };

  switch (framework) {
    case 'ghg-protocol':
      insights.totalEmissions = result.totalEmissions;
      insights.largestScope = result.scope3.total > result.scope1.total + result.scope2.total
        ? 'Scope 3 (Value Chain)'
        : 'Scope 1 & 2 (Direct Operations)';
      insights.reductionPotential = 'Focus on ' + (result.scope3.total > 1000 ? 'supply chain' : 'energy efficiency');
      insights.intensity = {
        perRevenue: result.intensity.perRevenue.toFixed(4) + ' tCO2e/$',
        perEmployee: result.intensity.perEmployee.toFixed(2) + ' tCO2e/employee',
        perArea: result.intensity.perSquareMeter.toFixed(4) + ' tCO2e/m²'
      };
      break;

    case 'leed':
      insights.currentLevel = result.projectedLevel;
      insights.totalPoints = result.project.totalPoints;
      insights.gap = result.gapAnalysis.gap;
      insights.strongestCategory = Object.entries(result.categoryScores)
        .sort((a: any, b: any) => b[1] - a[1])[0][0];
      insights.improvementPriority = result.gapAnalysis.recommendations[0]?.creditName || 'Energy optimization';
      break;

    case 'well':
      insights.currentLevel = result.projectedLevel;
      insights.totalPoints = result.project.totalPoints;
      insights.healthScore = Math.round(
        Object.values(result.healthMetrics as any).reduce((a: any, b: any) => a + b, 0) / 6
      );
      insights.strongestConcept = Object.entries(result.conceptScores)
        .sort((a: any, b: any) => b[1] - a[1])[0][0];
      insights.occupantWellbeing = result.healthMetrics.occupantSatisfaction > 75 ? 'Good' : 'Needs Improvement';
      break;

    case 'breeam':
      insights.currentRating = result.projectedRating;
      insights.totalScore = result.assessment.totalScore.toFixed(1) + '%';
      insights.benchmark = result.benchmarks.percentile > 50 ? 'Above Average' : 'Below Average';
      insights.strongestCategory = Object.entries(result.categoryBreakdown)
        .sort((a: any, b: any) => b[1] - a[1])[0][0];
      break;

    case 'unified':
      insights.carbonFootprint = result.ghg.totalEmissions.toFixed(2) + ' tCO2e';
      insights.certifications = result.summary.certifications;
      insights.overallScore = {
        ghg: 'Tracked',
        leed: result.summary.scores.leedPoints + ' points',
        well: result.summary.scores.wellPoints + ' points',
        breeam: result.summary.scores.breeamScore.toFixed(1) + '%'
      };
      insights.topPriority = result.summary.topPriorities[0];
      insights.investmentRequired = result.summary.estimatedCost;
      insights.paybackPeriod = result.summary.roi;
      break;
  }

  return insights;
}