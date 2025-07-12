import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { telegramBotService } from '@/lib/integrations/telegram-bot-service';
import { logger } from '@/lib/logger';

// Request schema
const TelegramAuthRequest = z.object({
  telegram_user_id: z.string(),
  telegram_username: z.string().optional(),
  chat_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = TelegramAuthRequest.parse(body);

    const result = await telegramBotService.authenticateTelegramUser(validated);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Telegram auth error', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}