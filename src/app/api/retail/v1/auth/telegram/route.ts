import { NextRequest, NextResponse } from 'next/server';

export async function POST((_request: NextRequest) {
  try {
    const body = await request.json();
    const { telegram_user_id, telegram_username, chat_id } = body;

    if (!telegram_user_id || !chat_id) {
      return NextResponse.json(
        { _error: 'telegram_user_id and chat_id are required' },
        { status: 400 }
      );
    }

    // Mock authentication response
    // TODO: Implement actual user authentication and mapping
    const authResult = {
      success: true,
      user: {
        id: telegram_user_id,
        username: telegram_username,
        chat_id,
        role: 'user',
        stores: ['OML01', 'OML02', 'ONL01'], // Mock store access
      },
      session: {
        token: 'mock-jwt-token',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      message: 'User authenticated successfully',
    };

    return NextResponse.json(authResult);
  } catch (error) {
    return NextResponse.json(
      { _error: 'Authentication failed' },
      { status: 500 }
    );
  }
}