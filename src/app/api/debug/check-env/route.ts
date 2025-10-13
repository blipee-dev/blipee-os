import { NextResponse } from 'next/server';

export async function GET() {
  // Return which environment variables are present (without exposing values)
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    supabase: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...' || 'missing'
    },
    app: {
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'missing',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'missing'
    },
    email: {
      hasSmtpServer: !!process.env.SMTP_SERVER,
      hasSmtpUser: !!process.env.SMTP_USER,
      hasSmtpPassword: !!process.env.SMTP_PASSWORD,
      hasFromEmail: !!process.env.FROM_EMAIL
    },
    ai: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
      hasDeepSeek: !!process.env.DEEPSEEK_API_KEY
    }
  });
}
