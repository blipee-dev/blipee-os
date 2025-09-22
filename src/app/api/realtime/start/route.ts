import { NextResponse } from 'next/server';
import { websocketServer } from '@/lib/realtime/websocket-server';
import { telemetryStream } from '@/lib/realtime/telemetry-stream';
import { alertManager } from '@/lib/realtime/alert-manager';

export async function POST(request: Request) {
  try {
    // Start WebSocket server
    await websocketServer.start();

    // Get organization ID from request
    const { organizationId } = await request.json();

    if (organizationId) {
      // Start telemetry streaming for the organization
      await telemetryStream.startStreaming(organizationId);

      // Create initial connection alert
      await alertManager.createAlert({
        type: 'system',
        severity: 'info',
        title: 'Real-time Monitoring Started',
        message: 'WebSocket connection established. Live data streaming active.',
        source: 'realtime-system',
        organizationId,
        actionRequired: false
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Real-time monitoring started',
      websocketPort: 3001,
      features: {
        telemetryStreaming: true,
        agentUpdates: true,
        mlPredictions: true,
        alertNotifications: true
      }
    });
  } catch (error) {
    console.error('Error starting real-time monitoring:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start real-time monitoring'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { organizationId } = await request.json();

    if (organizationId) {
      // Stop telemetry streaming
      telemetryStream.stopStreaming(organizationId);
    }

    // Stop WebSocket server
    await websocketServer.stop();

    return NextResponse.json({
      success: true,
      message: 'Real-time monitoring stopped'
    });
  } catch (error) {
    console.error('Error stopping real-time monitoring:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop real-time monitoring'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const streamStatus = telemetryStream.getStatus();

    return NextResponse.json({
      success: true,
      status: {
        websocketServer: 'running',
        telemetryStreaming: streamStatus.isStreaming,
        activeStreams: streamStatus.activeStreams
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      status: {
        websocketServer: 'stopped',
        telemetryStreaming: false,
        activeStreams: 0
      }
    });
  }
}