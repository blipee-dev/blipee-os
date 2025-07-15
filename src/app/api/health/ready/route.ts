import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/monitoring/health-check';

export async function GET() {
  try {
    const { ready, message } = await healthCheck.checkReadiness();
    
    return NextResponse.json(
      { ready, message, timestamp: new Date().toISOString() },
      { status: ready ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        ready: false, 
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}