import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { telegramBotService } from '@/lib/integrations/telegram-bot-service';
import { validateApiKey } from '@/lib/auth/api-key';
import { logger } from '@/lib/logger';

// Request schema matching existing Python API
const AnalyticsRequest = z.object({
  loja: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  metric_type: z.enum(['sales', 'traffic', 'conversion', 'all']).optional().default('all'),
});

export async function GET(request: NextRequest) {
  try {
    // Check for API key or session auth
    const apiKey = request.headers.get('x-api-key');
    const userId = request.headers.get('x-user-id');

    if (!apiKey && !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate API key if provided
    if (apiKey) {
      const isValid = await validateApiKey(apiKey);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      loja: searchParams.get('loja') || '',
      start_date: searchParams.get('start_date') || '',
      end_date: searchParams.get('end_date') || '',
      metric_type: searchParams.get('metric_type') || 'all',
    };

    const validated = AnalyticsRequest.parse(params);

    // Get analytics data
    const result = await telegramBotService.getAnalytics(
      userId || 'api-user',
      validated
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Analytics API error', { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Support POST for compatibility with some existing integrations
    const body = await request.json();
    const validated = AnalyticsRequest.parse(body);

    // Check authentication
    const apiKey = request.headers.get('x-api-key');
    const userId = request.headers.get('x-user-id');

    if (!apiKey && !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await telegramBotService.getAnalytics(
      userId || 'api-user',
      validated
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Analytics API error', { error });
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}