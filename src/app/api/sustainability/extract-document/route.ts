import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {

    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const siteId = formData.get('siteId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64 for OpenAI Vision API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;

    // Fetch available metrics for context
    const { data: siteMetrics } = await supabase
      .from('site_metrics')
      .select(`
        metric_id,
        metrics_catalog (
          id, name, code, unit, scope, category, subcategory
        )
      `)
      .eq('site_id', siteId)
      .eq('is_active', true);

    const metricsContext = siteMetrics?.map(m => ({
      id: m.metric_id,
      name: m.metrics_catalog?.name,
      unit: m.metrics_catalog?.unit,
      scope: m.metrics_catalog?.scope,
      category: m.metrics_catalog?.category
    })) || [];

    // Use OpenAI Vision API to extract data
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting sustainability and emissions data from documents.
          Extract relevant consumption data that can be mapped to these available metrics:
          ${JSON.stringify(metricsContext, null, 2)}

          Return a JSON array of extracted data points with this structure:
          {
            "extractedData": [
              {
                "metricId": "metric_id that best matches",
                "value": "numeric value",
                "unit": "unit from document",
                "period": {
                  "start": "YYYY-MM-DD",
                  "end": "YYYY-MM-DD"
                },
                "description": "what was extracted",
                "confidence": 0.95,
                "sourceText": "relevant text from document"
              }
            ],
            "documentInfo": {
              "type": "utility_bill|invoice|receipt|report",
              "vendor": "company name if identifiable",
              "date": "document date",
              "accountNumber": "account/reference number if visible"
            }
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all emissions-relevant data from this document. Focus on consumption values, dates, and any sustainability metrics."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1 // Lower temperature for more consistent extraction
    });

    const extractionResult = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and enhance the extracted data
    const validatedData = {
      ...extractionResult,
      extractedData: extractionResult.extractedData?.map((item: any) => {
        // Find the best matching metric
        const matchedMetric = siteMetrics?.find(m => m.metric_id === item.metricId);
        return {
          ...item,
          metricName: matchedMetric?.metrics_catalog?.name,
          metricUnit: matchedMetric?.metrics_catalog?.unit,
          needsReview: item.confidence < 0.8
        };
      }) || []
    };

    return NextResponse.json({
      success: true,
      data: validatedData,
      fileName: file.name,
      fileType: file.type,
      processingTime: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Document extraction error:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract data from document',
        details: error.message
      },
      { status: 500 }
    );
  }
}