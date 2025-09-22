import { NextResponse } from 'next/server';
import { sdgMapper } from '@/lib/ai/industry-intelligence/sdg-mapper';

export async function POST(request: Request) {
  try {
    const { industry, activities, organizationData } = await request.json();

    // Default activities if none provided
    const defaultActivities = [
      'renewable energy adoption',
      'employee training programs',
      'waste reduction initiatives',
      'water conservation',
      'diversity and inclusion',
      'supply chain management',
      'community investment',
      'innovation and R&D'
    ];

    // Map to SDGs
    const mapping = sdgMapper.mapToSDGs(
      industry || 'Manufacturing',
      activities || defaultActivities,
      organizationData || {}
    );

    // Generate comprehensive report
    const report = sdgMapper.generateSDGReport(
      mapping,
      industry || 'Manufacturing'
    );

    // Get all SDGs for reference
    const allSDGs = sdgMapper.getAllSDGs();

    // Get industry priorities
    const industryPriorities = sdgMapper.getIndustryPrioritySDGs(industry || 'Manufacturing');

    // Get detailed info for primary SDGs
    const primarySDGDetails = mapping.primarySDGs.map(num => ({
      ...sdgMapper.getSDGDetails(num),
      alignment: 'primary'
    }));

    const secondarySDGDetails = mapping.secondarySDGs.map(num => ({
      ...sdgMapper.getSDGDetails(num),
      alignment: 'secondary'
    }));

    return NextResponse.json({
      success: true,
      mapping,
      report,
      details: {
        primarySDGs: primarySDGDetails,
        secondarySDGs: secondarySDGDetails,
        industryPriorities,
        totalSDGsCovered: mapping.primarySDGs.length + mapping.secondarySDGs.length,
        coveragePercentage: ((mapping.primarySDGs.length + mapping.secondarySDGs.length) / 17) * 100
      },
      insights: {
        strongestAlignment: primarySDGDetails[0]?.title || 'SDG 8: Decent Work',
        biggestGap: `SDG ${report.opportunitySDGs[0] || 13}`,
        industryComparison: report.industryBenchmark.percentile > 50 ? 'Above Average' : 'Below Average',
        recommendedFocus: report.priorityActions[0]?.action || 'Set science-based targets'
      }
    });
  } catch (error) {
    console.error('SDG mapping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to map SDGs'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return all SDG information
    const allSDGs = sdgMapper.getAllSDGs();
    const industries = [
      'Oil & Gas',
      'Manufacturing',
      'Technology',
      'Financial Services',
      'Agriculture',
      'Healthcare',
      'Retail',
      'Real Estate',
      'Transportation'
    ];

    const industryPriorities: Record<string, any> = {};
    for (const industry of industries) {
      const priorities = sdgMapper.getIndustryPrioritySDGs(industry);
      industryPriorities[industry] = {
        priorities,
        primarySDGs: priorities.slice(0, 5),
        details: priorities.slice(0, 3).map(num => sdgMapper.getSDGDetails(num))
      };
    }

    return NextResponse.json({
      success: true,
      sdgs: allSDGs,
      totalSDGs: 17,
      categories: {
        people: [1, 2, 3, 4, 5],
        planet: [6, 13, 14, 15],
        prosperity: [7, 8, 9, 10, 11],
        peace: [16],
        partnership: [17]
      },
      industryPriorities
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get SDG data'
      },
      { status: 500 }
    );
  }
}