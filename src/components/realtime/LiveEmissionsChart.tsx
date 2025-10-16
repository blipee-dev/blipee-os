'use client';

import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { io, Socket } from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EmissionsData {
  timestamp: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

interface LiveEmissionsChartProps {
  organizationId: string;
  buildingId?: string;
  maxDataPoints?: number;
}

export function LiveEmissionsChart({
  organizationId,
  buildingId,
  maxDataPoints = 50
}: LiveEmissionsChartProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<EmissionsData[]>([]);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [currentTotal, setCurrentTotal] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const chartRef = useRef<any>(null);
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
        setIsConnected(true);

        // Subscribe to emissions data
        newSocket.emit('subscribe', {
          channel: 'emissions',
          organizationId,
          buildingId
        });
      });

      newSocket.on('emissions:update', (emissionsData: EmissionsData) => {
        setData(prev => {
          const newData = [...prev, emissionsData];
          if (newData.length > maxDataPoints) {
            newData.shift();
          }

          // Calculate trend
          if (prev.length > 0) {
            const lastTotal = prev[prev.length - 1].total;
            if (emissionsData.total > lastTotal * 1.05) {
              setTrend('up');
            } else if (emissionsData.total < lastTotal * 0.95) {
              setTrend('down');
            } else {
              setTrend('stable');
            }
          }

          return newData;
        });

        setCurrentTotal(emissionsData.total);
        setLastUpdate(new Date());
      });

      newSocket.on('disconnect', () => {
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
  }, [organizationId, buildingId, supabase, maxDataPoints]);

  const chartData = {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Scope 1',
        data: data.map(d => d.scope1),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Scope 2',
        data: data.map(d => d.scope2),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Scope 3',
        data: data.map(d => d.scope3),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Total',
        data: data.map(d => d.total),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} tCO2e`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: function(value) {
            return value + ' tCO2e';
          }
        }
      }
    },
    animation: {
      duration: 750
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="p-6 bg-gray-900/50 backdrop-blur-xl border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Live Emissions Monitor</h3>
          <p className="text-sm text-gray-400">Real-time carbon emissions tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Live' : 'Disconnected'}
          </Badge>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-2xl font-bold text-white">
              {currentTotal.toFixed(2)}
            </span>
            <span className="text-sm text-gray-400">tCO2e</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        {data.length > 0 ? (
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Waiting for emissions data...</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
        <span>{data.length} data points</span>
      </div>
    </Card>
  );
}