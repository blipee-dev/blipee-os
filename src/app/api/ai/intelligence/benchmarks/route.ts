import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, searchType, filters } = await request.json();

    // Use AI to search for real-time benchmarks
    // This would integrate with external data sources, research databases, etc.
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `${query}

          Provide benchmarks in JSON format:
          {
            "benchmarks": [
              {
                "metric": "string",
                "scope": number,
                "industry": "string",
                "region": "string",
                "averageValue": number,
                "unit": "string",
                "topPerformers": number,
                "year": number,
                "source": "string",
                "confidence": number
              }
            ]
          }

          Use current data from reputable sources like CDP, SBTi, EPA, industry reports.
          If exact data isn't available, provide reasonable estimates based on patterns.`
        }]
      })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.content[0].text;

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const benchmarks = JSON.parse(jsonMatch[0]);
          return NextResponse.json(benchmarks);
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    }

    // Fallback to database-driven benchmarks
    const { data: historicalData } = await supabase
      .from('industry_benchmarks')
      .select('*')
      .eq('industry', filters.industry)
      .in('metric', filters.metrics);

    const benchmarks = (historicalData || []).map((item: any) => ({
      metric: item.metric,
      scope: item.scope,
      industry: item.industry,
      region: item.region || 'Global',
      averageValue: item.average_value,
      unit: item.unit,
      topPerformers: item.top_performers_value,
      year: new Date(item.updated_at).getFullYear(),
      source: item.source || 'Industry database',
      confidence: 0.8
    }));

    return NextResponse.json({ benchmarks });

  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    );
  }
}