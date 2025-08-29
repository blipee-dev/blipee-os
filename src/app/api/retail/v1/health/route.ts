import { NextRequest, NextResponse } from 'next/server';

export async function GET(_(_request: NextRequest) {
  try {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      module: 'retail-intelligence',
      checks: {
        api: true,
        database: true, // We'll update this when we connect to actual DB
      },
      version: '1.0.0',
    };

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        module: 'retail-intelligence',
        message: 'Health check failed',
      },
      { status: 500 }
    );
  }
}