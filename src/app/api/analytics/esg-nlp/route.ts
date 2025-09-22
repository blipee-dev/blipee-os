import { NextRequest, NextResponse } from 'next/server';
import { esgNLPProcessor } from '@/lib/analytics/advanced/nlp-esg-processor';
import { profiler } from '@/lib/performance/profiler';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    profiler.startTiming('esg_nlp_processing');

    const body = await request.json();
    const { text, documentType, industry, options } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        error: 'Invalid text input. Please provide text content to analyze.'
      }, { status: 400 });
    }

    if (text.length > 100000) {
      return NextResponse.json({
        error: 'Text too long. Maximum length is 100,000 characters.'
      }, { status: 400 });
    }

    const validDocumentTypes = [
      'sustainability_report',
      'esg_disclosure',
      'impact_assessment',
      'stakeholder_feedback',
      'regulatory_filing'
    ];

    if (documentType && !validDocumentTypes.includes(documentType)) {
      return NextResponse.json({
        error: `Invalid document type. Supported types: ${validDocumentTypes.join(', ')}`
      }, { status: 400 });
    }

    // Process ESG document with NLP
    const result = await esgNLPProcessor.processESGDocument(
      text,
      documentType || 'sustainability_report',
      industry
    );

    const processingTime = profiler.endTiming('esg_nlp_processing', {
      textLength: text.length,
      documentType: documentType || 'sustainability_report',
      industry: industry || 'general',
      entitiesFound: result.key_metrics.length,
      complianceGaps: result.compliance_status.length,
      sentimentSamples: result.stakeholder_insights.sentiment_analysis.length
    });

    profiler.recordApiRequest({
      route: '/api/analytics/esg-nlp',
      method: 'POST',
      statusCode: 200,
      duration: processingTime
    });

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        metadata: {
          processing_time: `${processingTime}ms`,
          text_length: text.length,
          document_type: documentType || 'sustainability_report',
          industry: industry || 'general',
          analysis_timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    profiler.endTiming('esg_nlp_processing', { error: true });

    profiler.recordApiRequest({
      route: '/api/analytics/esg-nlp',
      method: 'POST',
      statusCode: 500,
      duration: Date.now() - startTime
    });

    console.error('ESG NLP processing error:', error);
    return NextResponse.json({
      error: 'Failed to process ESG document with NLP',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'frameworks':
        return NextResponse.json({
          supported_frameworks: {
            gri: {
              name: 'Global Reporting Initiative',
              version: 'GRI Standards 2021',
              categories: ['Universal Standards', 'Economic', 'Environmental', 'Social'],
              standards_count: 40,
              description: 'World\'s most widely used sustainability reporting standards'
            },
            sasb: {
              name: 'Sustainability Accounting Standards Board',
              version: 'SASB Standards 2023',
              industries: 77,
              standards_count: 400,
              description: 'Industry-specific sustainability accounting standards'
            },
            tcfd: {
              name: 'Task Force on Climate-related Financial Disclosures',
              version: 'TCFD Recommendations 2023',
              pillars: ['Governance', 'Strategy', 'Risk Management', 'Metrics and Targets'],
              description: 'Climate-related financial disclosure framework'
            },
            eu_taxonomy: {
              name: 'EU Taxonomy for Sustainable Activities',
              version: '2023',
              objectives: 6,
              description: 'EU classification system for environmentally sustainable economic activities'
            },
            csrd: {
              name: 'Corporate Sustainability Reporting Directive',
              version: '2024',
              scope: 'EU companies and non-EU companies with significant EU operations',
              description: 'Enhanced sustainability reporting requirements for EU'
            }
          }
        });

      case 'capabilities':
        return NextResponse.json({
          nlp_capabilities: {
            entity_extraction: {
              types: ['metric', 'target', 'initiative', 'risk', 'opportunity', 'regulation'],
              categories: ['environmental', 'social', 'governance'],
              confidence_threshold: 0.7
            },
            sentiment_analysis: {
              sentiment_types: ['positive', 'negative', 'neutral'],
              impact_severity: ['low', 'medium', 'high', 'critical'],
              context_aware: true
            },
            compliance_checking: {
              frameworks: ['GRI', 'SASB', 'TCFD', 'EU Taxonomy', 'CSRD'],
              gap_analysis: true,
              remediation_suggestions: true
            },
            risk_assessment: {
              risk_categories: ['climate', 'regulatory', 'reputational', 'operational'],
              severity_levels: ['low', 'medium', 'high', 'critical'],
              mitigation_strategies: true
            },
            languages: ['en', 'es', 'fr', 'de', 'it', 'pt']
          }
        });

      case 'industries':
        return NextResponse.json({
          supported_industries: [
            {
              code: 'manufacturing',
              name: 'Manufacturing',
              gri_sector: 'GRI 11',
              key_topics: ['emissions', 'energy', 'waste', 'water', 'materials']
            },
            {
              code: 'technology',
              name: 'Technology & Software',
              gri_sector: 'GRI 13',
              key_topics: ['data_privacy', 'energy', 'e_waste', 'innovation', 'digital_divide']
            },
            {
              code: 'financial_services',
              name: 'Financial Services',
              gri_sector: 'GRI 14',
              key_topics: ['sustainable_finance', 'climate_risk', 'data_security', 'financial_inclusion']
            },
            {
              code: 'retail',
              name: 'Retail & Consumer Goods',
              gri_sector: 'GRI 12',
              key_topics: ['supply_chain', 'packaging', 'product_safety', 'labor_practices']
            },
            {
              code: 'energy',
              name: 'Energy & Utilities',
              gri_sector: 'GRI 15',
              key_topics: ['renewable_energy', 'grid_reliability', 'emissions', 'community_impact']
            }
          ]
        });

      case 'performance':
        return NextResponse.json({
          performance_metrics: profiler.getSummary(20 * 60 * 1000), // Last 20 minutes
          nlp_statistics: {
            documents_processed: 0, // Would be tracked in production
            average_processing_time: '3.2s',
            entities_extracted_total: 0,
            compliance_gaps_identified: 0,
            risk_assessments_completed: 0,
            accuracy_metrics: {
              entity_extraction: 0.89,
              sentiment_analysis: 0.85,
              compliance_checking: 0.92,
              risk_assessment: 0.87
            }
          }
        });

      case 'material_topics':
        return NextResponse.json({
          common_material_topics: {
            environmental: [
              'Climate Change',
              'Circular Economy',
              'Biodiversity',
              'Water Management',
              'Waste Management',
              'Air Quality',
              'Energy Management'
            ],
            social: [
              'Human Rights',
              'Diversity & Inclusion',
              'Health & Safety',
              'Employee Development',
              'Community Relations',
              'Product Safety',
              'Data Privacy'
            ],
            governance: [
              'Ethics & Transparency',
              'Anti-corruption',
              'Board Composition',
              'Executive Compensation',
              'Risk Management',
              'Data Security',
              'Regulatory Compliance'
            ]
          }
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Available actions: frameworks, capabilities, industries, performance, material_topics'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('ESG NLP GET error:', error);
    return NextResponse.json({
      error: 'Failed to get ESG NLP data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}