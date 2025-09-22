import { NextResponse } from 'next/server';
import { RegulatoryMapper } from '@/lib/ai/industry-intelligence/regulatory-mapper';
import { IndustryClassification } from '@/lib/ai/industry-intelligence/types';

export async function POST(request: Request) {
  try {
    const { organizationId, regions, industry, size } = await request.json();

    const regulatoryMapper = new RegulatoryMapper();

    // Create industry classification
    const classification: IndustryClassification = {
      naicsCode: industry === 'Oil & Gas' ? '211' : industry === 'Technology' ? '54' : '33',
      sicCode: '',
      gicsCode: '',
      industryName: industry || 'Manufacturing',
      subIndustry: ''
    };

    // Get applicable regulations
    const jurisdictions = regions || ['United States', 'European Union'];
    const applicableRegulations = await regulatoryMapper.getApplicableRegulations(
      jurisdictions,
      classification
    );

    // Get upcoming changes
    const upcomingChanges = await regulatoryMapper.getUpcomingChanges(
      jurisdictions,
      'next_year'
    );

    // Get implementation guidance for primary regulation
    const guidance = applicableRegulations.length > 0 && applicableRegulations[0].regulation?.id
      ? await regulatoryMapper.getImplementationGuidance(
          applicableRegulations[0].regulation.id,
          classification
        )
      : null;

    return NextResponse.json({
      success: true,
      profile: {
        organizationId: organizationId || 'test-org',
        regions: jurisdictions,
        industry: industry || 'Manufacturing',
        size: size || 'large'
      },
      regulations: {
        applicable: applicableRegulations,
        totalRegulations: applicableRegulations.length,
        byJurisdiction: groupByJurisdiction(applicableRegulations),
        criticalRegulations: applicableRegulations.filter(r => r.priority === 'high')
      },
      compliance: {
        upcomingChanges,
        implementationGuidance: guidance
      },
      insights: {
        highestRiskArea: 'Climate Disclosure',
        recommendedActions: [
          'Implement TCFD-aligned reporting',
          'Establish Science-Based Targets',
          'Enhance supply chain due diligence',
          'Prepare for CSRD compliance'
        ],
        estimatedComplianceEffort: 'High'
      }
    });
  } catch (error) {
    console.error('Regulatory mapping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to map regulations'
      },
      { status: 500 }
    );
  }
}

function groupByJurisdiction(regulations: any[]): Record<string, number> {
  const grouped: Record<string, number> = {};
  for (const reg of regulations) {
    const jurisdiction = reg.regulation?.jurisdiction || 'Global';
    grouped[jurisdiction] = (grouped[jurisdiction] || 0) + 1;
  }
  return grouped;
}