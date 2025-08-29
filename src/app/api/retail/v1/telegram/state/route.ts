import { NextRequest, NextResponse } from 'next/server';

// Mock bot state storage (in production, this would be in database/Redis)
const botStates = new Map<string, any>();

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chat_id');

    if (!chatId) {
      return NextResponse.json(
        { _error: 'chat_id parameter is required' },
        { status: 400 }
      );
    }

    const state = botStates.get(chatId) || {
      chat_id: chatId,
      state: 'idle',
      context: {},
      last_updated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: state,
    });
  } catch (error) {
    return NextResponse.json(
      { _error: 'Failed to get bot state' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const body = await request.json();
    const { chat_id, state, context = {} } = body;

    if (!chat_id || !state) {
      return NextResponse.json(
        { _error: 'chat_id and state are required' },
        { status: 400 }
      );
    }

    const botState = {
      chat_id,
      state,
      context,
      last_updated: new Date().toISOString(),
    };

    // Store state (mock storage)
    botStates.set(chat_id, botState);

    return NextResponse.json({
      success: true,
      data: botState,
      message: 'Bot state updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { _error: 'Failed to update bot state' },
      { status: 500 }
    );
  }
}