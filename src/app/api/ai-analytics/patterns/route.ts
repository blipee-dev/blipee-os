/**
 * AI Analytics - Pattern Insights API
 *
 * GET: Retrieve pattern insights and analysis
 * POST: Run pattern analysis and generate insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server-auth';
import {
  analyzeConversationPatterns,
  savePatternInsights,
  getTopActionablePatterns,
} from '@/lib/ai/analytics/pattern-analyzer';

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const patterns = await getTopActionablePatterns(limit);

    return NextResponse.json({
      patterns,
      count: patterns.length,
    });
  } catch (error) {
    console.error('[AI Analytics API] Error fetching patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { daysToAnalyze = 7 } = body;

    // Run pattern analysis
    const analysis = await analyzeConversationPatterns(daysToAnalyze);

    // Save insights to database
    await savePatternInsights(analysis.patterns);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('[AI Analytics API] Error analyzing patterns:', error);
    return NextResponse.json(
      { error: 'Failed to analyze patterns' },
      { status: 500 }
    );
  }
}
