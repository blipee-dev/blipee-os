'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Settings,
  RefreshCw,
  Power
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceHealth {
  deviceId: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  lastSeen: string;
  health: {
    score: number;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    temperature: number;
  };
  metrics: {
    uptime: number;
    errors: number;
    warnings: number;
    restarts: number;
  };
  predictions: {
    failureProbability: number;
    maintenanceRequired: boolean;
    estimatedTimeToFailure?: number;
  };
}

interface DeviceStatusPanelProps {
  organizationId: string;
  buildingId?: string;
  showPredictions?: boolean;
}

export function DeviceStatusPanel({
  organizationId,
  buildingId,
  showPredictions = true
}: DeviceStatusPanelProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [devices, setDevices] = useState<Map<string, DeviceHealth>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const initSocket = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
        auth: {
          token: session.access_token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to device monitor');
        setIsConnected(true);

        // Subscribe to device health data
        newSocket.emit('subscribe', {
          channel: 'devices',
          organizationId,
          buildingId
        });
      });

      newSocket.on('device:health', (health: DeviceHealth) => {
        setDevices(prev => {
          const newDevices = new Map(prev);
          newDevices.set(health.deviceId, health);
          return newDevices;
        });
      });

      newSocket.on('device:batch', (deviceList: DeviceHealth[]) => {
        const newDevices = new Map<string, DeviceHealth>();
        deviceList.forEach(device => {
          newDevices.set(device.deviceId, device);
        });
        setDevices(newDevices);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from device monitor');
        setIsConnected(false);
      });

      setSocket(newSocket);
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [organizationId, buildingId, supabase]);

  const getStatusIcon = (status: DeviceHealth['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const handleRestartDevice = (deviceId: string) => {
    if (socket) {
      socket.emit('device:command', {
        deviceId,
        command: 'restart',
        organizationId
      });
    }
  };

  const devicesArray = Array.from(devices.values());
  const onlineDevices = devicesArray.filter(d => d.status === 'online').length;
  const warningDevices = devicesArray.filter(d => d.status === 'warning').length;
  const errorDevices = devicesArray.filter(d => d.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Device Status Panel</h3>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{devicesArray.length}</p>
            <p className="text-xs text-gray-400">Total Devices</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{onlineDevices}</p>
            <p className="text-xs text-gray-400">Online</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{warningDevices}</p>
            <p className="text-xs text-gray-400">Warnings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{errorDevices}</p>
            <p className="text-xs text-gray-400">Errors</p>
          </div>
        </div>
      </Card>

      {/* Device List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devicesArray.map(device => (
          <Card
            key={device.deviceId}
            className={cn(
              "p-4 bg-gray-900/50 backdrop-blur-xl border-gray-800 cursor-pointer transition-all",
              selectedDevice === device.deviceId && "ring-2 ring-blue-500"
            )}
            onClick={() => setSelectedDevice(
              selectedDevice === device.deviceId ? null : device.deviceId
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(device.status)}
                <div>
                  <p className="text-sm font-medium text-white">{device.name}</p>
                  <p className="text-xs text-gray-400">{device.type}</p>
                </div>
              </div>
              {device.status === 'online' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>

            {/* Health Score */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Health Score</span>
                <span className={cn('text-sm font-bold', getHealthColor(device.health.score))}>
                  {device.health.score}%
                </span>
              </div>
              <Progress value={device.health.score} className="h-2 bg-gray-700" />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">CPU: {device.health.cpu}%</span>
              </div>
              <div className="flex items-center gap-1">
                <HardDrive className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">Disk: {device.health.disk}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">{formatUptime(device.metrics.uptime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">{device.metrics.errors} errors</span>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedDevice === device.deviceId && (
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                {/* Detailed Health */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-300">System Resources</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Memory</span>
                      <span className="text-gray-300">{device.health.memory}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Network</span>
                      <span className="text-gray-300">{device.health.network}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Temperature</span>
                      <span className="text-gray-300">{device.health.temperature}°C</span>
                    </div>
                  </div>
                </div>

                {/* Predictions */}
                {showPredictions && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-300">Predictive Analysis</p>
                    <div className="p-2 bg-gray-800/50 rounded-lg">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Failure Risk</span>
                        <span className={cn(
                          'font-medium',
                          device.predictions.failureProbability < 0.3 ? 'text-green-500' :
                          device.predictions.failureProbability < 0.6 ? 'text-yellow-500' :
                          'text-red-500'
                        )}>
                          {(device.predictions.failureProbability * 100).toFixed(1)}%
                        </span>
                      </div>
                      {device.predictions.maintenanceRequired && (
                        <Badge variant="secondary" className="text-xs">
                          Maintenance Recommended
                        </Badge>
                      )}
                      {device.predictions.estimatedTimeToFailure && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Est. failure in {device.predictions.estimatedTimeToFailure} days
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestartDevice(device.deviceId);
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Restart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {devicesArray.length === 0 && (
        <Card className="p-8 bg-gray-900/50 backdrop-blur-xl border-gray-800">
          <div className="text-center">
            <Power className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No devices connected</p>
            <p className="text-sm text-gray-500 mt-1">Waiting for device data...</p>
          </div>
        </Card>
      )}
    </div>
  );
}