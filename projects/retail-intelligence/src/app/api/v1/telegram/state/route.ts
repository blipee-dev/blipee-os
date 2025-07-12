import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { telegramBotService } from '@/lib/integrations/telegram-bot-service';
import { logger } from '@/lib/logger';

// Request schemas
const GetStateRequest = z.object({
  chat_id: z.string(),
});

const UpdateStateRequest = z.object({
  chat_id: z.string(),
  state: z.string(),
  context: z.any().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const chatId = request.nextUrl.searchParams.get('chat_id');
    if (!chatId) {
      return NextResponse.json(
        { error: 'chat_id parameter is required' },
        { status: 400 }
      );
    }

    const validated = GetStateRequest.parse({ chat_id: chatId });
    const state = await telegramBotService.getBotState(validated.chat_id);

    return NextResponse.json(state);
  } catch (error) {
    logger.error('Get bot state error', { error });
    return NextResponse.json(
      { error: 'Failed to get bot state' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UpdateStateRequest.parse(body);

    const result = await telegramBotService.updateBotState(
      validated.chat_id,
      validated.state,
      validated.context
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Update bot state error', { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update bot state' },
      { status: 500 }
    );
  }
}