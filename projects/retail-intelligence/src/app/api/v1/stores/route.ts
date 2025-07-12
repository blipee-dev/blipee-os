import { NextRequest, NextResponse } from 'next/server';
import { telegramBotService } from '@/lib/integrations/telegram-bot-service';
import { validateApiKey } from '@/lib/auth/api-key';
import { logger } from '@/lib/logger';

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

    // Get available stores for user
    const result = await telegramBotService.getUserStores(userId || 'api-user');

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Stores API error', { error });
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}