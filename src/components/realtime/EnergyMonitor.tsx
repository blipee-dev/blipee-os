'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnergyData {
  timestamp: string;
  consumption: number;
  demand: number;
  powerFactor: number;
  voltage: number;
  current: number;
  cost: number;
  source: {
    renewable: number;
    grid: number;
    backup: number;
  };
}

interface EnergyAlert {
  type: 'peak' | 'anomaly' | 'efficiency';
  severity: 'low' | 'medium' | 'high';
  message: string;
  value: number;
}

interface EnergyMonitorProps {
  organizationId: string;
  buildingId?: string;
  deviceId?: string;
}

export function EnergyMonitor({
  organizationId,
  buildingId,
  deviceId
}: EnergyMonitorProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentEnergy, setCurrentEnergy] = useState<EnergyData | null>(null);
  const [historicalData, setHistoricalData] = useState<EnergyData[]>([]);
  const [alerts, setAlerts] = useState<EnergyAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [peakDemand, setPeakDemand] = useState(0);
  const [averageConsumption, setAverageConsumption] = useState(0);
  const supabase = createClientComponentClient();

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
        console.log('Connected to energy monitor');
        setIsConnected(true);

        // Subscribe to energy data
        newSocket.emit('subscribe', {
          channel: 'energy',
          organizationId,
          buildingId,
          deviceId
        });
      });

      newSocket.on('energy:update', (energyData: EnergyData) => {
        setCurrentEnergy(energyData);

        setHistoricalData(prev => {
          const newData = [...prev, energyData];
          if (newData.length > 100) newData.shift();

          // Calculate metrics
          const consumptions = newData.map(d => d.consumption);
          const demands = newData.map(d => d.demand);

          setAverageConsumption(
            consumptions.reduce((a, b) => a + b, 0) / consumptions.length
          );

          setPeakDemand(Math.max(...demands));

          return newData;
        });

        // Check for alerts
        const newAlerts: EnergyAlert[] = [];

        if (energyData.demand > peakDemand * 0.9) {
          newAlerts.push({
            type: 'peak',
            severity: 'high',
            message: 'Approaching peak demand',
            value: energyData.demand
          });
        }

        if (energyData.powerFactor < 0.85) {
          newAlerts.push({
            type: 'efficiency',
            severity: 'medium',
            message: 'Low power factor detected',
            value: energyData.powerFactor
          });
        }

        if (energyData.consumption > averageConsumption * 1.5) {
          newAlerts.push({
            type: 'anomaly',
            severity: 'medium',
            message: 'Unusual consumption spike',
            value: energyData.consumption
          });
        }

        setAlerts(newAlerts);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from energy monitor');
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
  }, [organizationId, buildingId, deviceId, supabase, peakDemand, averageConsumption]);

  if (!currentEnergy) {
    return (
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500">Connecting to energy monitor...</p>
        </div>
      </Card>
    );
  }

  const renewablePercentage = (currentEnergy.source.renewable /
    (currentEnergy.source.renewable + currentEnergy.source.grid + currentEnergy.source.backup)) * 100;

  const efficiencyScore = currentEnergy.powerFactor * 100;

  const getAlertIcon = (severity: EnergyAlert['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Energy Card */}
      <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">Energy Monitor</h3>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Current Consumption */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Consumption</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {currentEnergy.consumption.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">kW</span>
              {currentEnergy.consumption > averageConsumption ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Demand */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Demand</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {currentEnergy.demand.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">kW</span>
            </div>
          </div>

          {/* Power Factor */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Power Factor</p>
            <div className="flex items-center gap-2">
              <Gauge className={cn(
                "h-4 w-4",
                currentEnergy.powerFactor > 0.9 ? "text-green-500" :
                currentEnergy.powerFactor > 0.8 ? "text-yellow-500" : "text-red-500"
              )} />
              <span className="text-2xl font-bold text-white">
                {(currentEnergy.powerFactor * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Cost Rate */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Cost Rate</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                ${currentEnergy.cost.toFixed(2)}
              </span>
              <span className="text-sm text-gray-400">/hr</span>
            </div>
          </div>
        </div>

        {/* Energy Source Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Energy Sources</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Renewable</span>
              <span className="text-sm text-green-500 font-medium">
                {currentEnergy.source.renewable.toFixed(1)} kW
              </span>
            </div>
            <Progress value={renewablePercentage} className="h-2 bg-gray-700" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Grid</span>
              <span className="text-sm text-blue-500 font-medium">
                {currentEnergy.source.grid.toFixed(1)} kW
              </span>
            </div>
            <Progress
              value={(currentEnergy.source.grid / (currentEnergy.source.renewable + currentEnergy.source.grid + currentEnergy.source.backup)) * 100}
              className="h-2 bg-gray-700"
            />
          </div>

          {currentEnergy.source.backup > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Backup</span>
                <span className="text-sm text-orange-500 font-medium">
                  {currentEnergy.source.backup.toFixed(1)} kW
                </span>
              </div>
              <Progress
                value={(currentEnergy.source.backup / (currentEnergy.source.renewable + currentEnergy.source.grid + currentEnergy.source.backup)) * 100}
                className="h-2 bg-gray-700"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="p-4 bg-gray-900/50 backdrop-blur-xl border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-yellow-500" />
            <h4 className="text-sm font-medium text-gray-300">Active Alerts</h4>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.severity)}
                  <span className="text-sm text-gray-300">{alert.message}</span>
                </div>
                <Badge variant={
                  alert.severity === 'high' ? 'destructive' :
                  alert.severity === 'medium' ? 'secondary' : 'default'
                }>
                  {alert.value.toFixed(2)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Metrics Summary */}
      <Card className="p-4 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Peak Demand</p>
            <p className="text-lg font-bold text-white">{peakDemand.toFixed(1)} kW</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Avg Consumption</p>
            <p className="text-lg font-bold text-white">{averageConsumption.toFixed(1)} kW</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Efficiency</p>
            <p className="text-lg font-bold text-white">{efficiencyScore.toFixed(1)}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}