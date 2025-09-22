import { NextResponse } from 'next/server';
import { GRIStandardsMapper } from '@/lib/ai/industry-intelligence/gri-standards-mapper';
import { IndustryClassification } from '@/lib/ai/industry-intelligence/types';

export async function POST(request: Request) {
  try {
    const { naicsCode, revenue, employees, region } = await request.json();

    const mapper = new GRIStandardsMapper();

    // Create industry classification
    const classification: IndustryClassification = {
      naicsCode: naicsCode || '211', // Default to oil & gas for testing
      sicCode: '',
      gicsCode: '',
      industryName: 'Energy',
      subIndustry: 'Oil & Gas'
    };

    // Get applicable GRI standards
    const mapping = await mapper.mapToGRIStandards(classification);

    // Get all available standards for reference
    const allStandards = mapper.getAllStandards();

    // Get details for the primary applicable standard
    const primaryStandard = mapping.applicableStandards[0];
    const standardDetails = primaryStandard ? mapper.getStandardDetails(primaryStandard) : null;

    return NextResponse.json({
      success: true,
      mapping: {
        ...mapping,
        standardDetails,
        totalStandards: allStandards.length,
        totalDisclosures: mapping.disclosures?.length || 0,
        materialTopics: mapping.materialTopics?.length || 0,
        estimatedReportingEffort: 'High',
        complianceLevel: 'Sector-Specific'
      }
    });
  } catch (error) {
    console.error('GRI mapping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to map GRI standards'
      },
      { status: 500 }
    );
  }
}