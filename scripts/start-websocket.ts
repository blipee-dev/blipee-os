/**
 * WebSocket Server Startup Script
 * Starts the real-time monitoring WebSocket server
 */

import { WebSocketServer } from '../src/lib/realtime/websocket-server';
import { TelemetryStreamService } from '../src/lib/realtime/telemetry-stream';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

async function startWebSocketServer() {
  console.log('🚀 Starting WebSocket Server for Real-time Monitoring');
  console.log('================================================\n');

  try {
    // Initialize WebSocket server on port 3001
    const port = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : 3001;
    const wsServer = new WebSocketServer(port);

    // Start the server
    await wsServer.start();

    console.log(`✅ WebSocket server running on port ${port}`);
    console.log(`📡 Clients can connect to ws://localhost:${port}`);

    // Initialize telemetry streaming service
    const telemetryService = new TelemetryStreamService();

    console.log('\n✅ Telemetry streaming service initialized');
    console.log('📊 Streaming channels available:');
    console.log('   - emissions: Real-time carbon emissions data');
    console.log('   - energy: Live energy consumption monitoring');
    console.log('   - devices: Device health and status updates');
    console.log('   - alerts: System-wide alert notifications');

    // Start demo data generation for testing
    if (process.env.GENERATE_DEMO_DATA === 'true') {
      console.log('\n🎯 Demo mode enabled - generating test data');
      startDemoDataGeneration(wsServer);
    }

    console.log('\n✨ Real-time monitoring system ready!');
    console.log('🌐 Access dashboard at: http://localhost:3000/monitoring/realtime');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n📦 Shutting down WebSocket server...');
      await wsServer.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

/**
 * Generate demo data for testing
 */
function startDemoDataGeneration(wsServer: WebSocketServer) {
  // Emit demo emissions data every 5 seconds
  setInterval(() => {
    const emissionsData = {
      timestamp: new Date().toISOString(),
      scope1: Math.random() * 100 + 50,
      scope2: Math.random() * 150 + 75,
      scope3: Math.random() * 200 + 100,
      total: 0
    };
    emissionsData.total = emissionsData.scope1 + emissionsData.scope2 + emissionsData.scope3;

    wsServer.broadcast('emissions:update', emissionsData);
  }, 5000);

  // Emit demo energy data every 3 seconds
  setInterval(() => {
    const energyData = {
      timestamp: new Date().toISOString(),
      consumption: Math.random() * 500 + 250,
      demand: Math.random() * 400 + 200,
      powerFactor: Math.random() * 0.2 + 0.8,
      voltage: 230 + Math.random() * 10 - 5,
      current: Math.random() * 100 + 50,
      cost: Math.random() * 50 + 25,
      source: {
        renewable: Math.random() * 200 + 50,
        grid: Math.random() * 300 + 100,
        backup: Math.random() * 50
      }
    };

    wsServer.broadcast('energy:update', energyData);
  }, 3000);

  // Emit demo device health data every 10 seconds
  setInterval(() => {
    const deviceHealth = {
      deviceId: `device-${Math.floor(Math.random() * 10) + 1}`,
      name: `Device ${Math.floor(Math.random() * 10) + 1}`,
      type: ['HVAC', 'Lighting', 'Server', 'Sensor'][Math.floor(Math.random() * 4)],
      status: ['online', 'online', 'online', 'warning', 'error'][Math.floor(Math.random() * 5)] as any,
      lastSeen: new Date().toISOString(),
      health: {
        score: Math.floor(Math.random() * 40 + 60),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100,
        temperature: Math.random() * 30 + 50
      },
      metrics: {
        uptime: Math.floor(Math.random() * 1000),
        errors: Math.floor(Math.random() * 10),
        warnings: Math.floor(Math.random() * 20),
        restarts: Math.floor(Math.random() * 5)
      },
      predictions: {
        failureProbability: Math.random(),
        maintenanceRequired: Math.random() > 0.7,
        estimatedTimeToFailure: Math.random() > 0.8 ? Math.floor(Math.random() * 30) : undefined
      }
    };

    wsServer.broadcast('device:health', deviceHealth);
  }, 10000);

  // Emit demo alerts every 15 seconds
  setInterval(() => {
    const alert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: ['error', 'warning', 'info', 'success'][Math.floor(Math.random() * 4)] as any,
      category: ['emissions', 'energy', 'device', 'compliance', 'cost'][Math.floor(Math.random() * 5)] as any,
      severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as any,
      title: [
        'High energy consumption detected',
        'Emissions threshold exceeded',
        'Device maintenance required',
        'Compliance deadline approaching',
        'Cost optimization opportunity'
      ][Math.floor(Math.random() * 5)],
      message: 'This is a demo alert for testing the real-time monitoring system.',
      source: {
        agent: 'Demo Agent',
        system: 'WebSocket Demo'
      },
      data: {
        value: Math.random() * 100,
        threshold: 75
      },
      actionRequired: Math.random() > 0.5,
      acknowledged: false,
      resolved: false
    };

    wsServer.broadcast('alert:new', alert);
  }, 15000);

  console.log('📊 Demo data generation started');
}

// Start the server
startWebSocketServer();