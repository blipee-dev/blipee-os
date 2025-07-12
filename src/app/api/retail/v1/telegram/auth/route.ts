import { NextRequest, NextResponse } from 'next/server';

// Mock Telegram authentication
// In production, this would validate against your actual user database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegram_user_id');
    const chatId = searchParams.get('chat_id');

    if (!telegramUserId || !chatId) {
      return NextResponse.json(
        { error: 'Missing required parameters: telegram_user_id, chat_id' },
        { status: 400 }
      );
    }

    // Mock user data - in production, fetch from database
    const userData = {
      telegram_user_id: telegramUserId,
      chat_id: chatId,
      name: 'Telegram User',
      permissions: ['retail:read', 'retail:analytics'],
      stores: ['OML01', 'OML02', 'ONL01'],
      created_at: new Date().toISOString(),
    };

    // Mock session token
    const sessionToken = `mock-session-${telegramUserId}-${Date.now()}`;

    return NextResponse.json({
      success: true,
      user: userData,
      session_token: sessionToken,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}