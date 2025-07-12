import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { telegramBotService } from '@/lib/integrations/telegram-bot-service';
import { validateApiKey } from '@/lib/auth/api-key';
import { logger } from '@/lib/logger';

const RealTimeTrafficRequest = z.object({
  loja: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const apiKey = request.headers.get('x-api-key');
    const userId = request.headers.get('x-user-id');

    if (!apiKey && !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
    const loja = request.nextUrl.searchParams.get('loja');
    if (!loja) {
      return NextResponse.json(
        { error: 'Store (loja) parameter is required' },
        { status: 400 }
      );
    }

    const validated = RealTimeTrafficRequest.parse({ loja });

    // Get real-time traffic data
    const result = await telegramBotService.getRealTimeTraffic(
      userId || 'api-user',
      validated.loja
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Real-time traffic API error', { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch real-time traffic' },
      { status: 500 }
    );
  }
}