import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/monitoring/health-check';

export async function GET() {
  try {
    const { alive, message } = await healthCheck.checkLiveness();
    
    return NextResponse.json(
      { alive, message, timestamp: new Date().toISOString() },
      { status: alive ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        alive: false, 
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}