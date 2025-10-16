'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  BellOff,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Zap,
  Cpu,
  TrendingUp,
  Shield,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  timestamp: string;
  type: 'error' | 'warning' | 'info' | 'success';
  category: 'emissions' | 'energy' | 'device' | 'compliance' | 'cost' | 'prediction';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  source: {
    agent?: string;
    device?: string;
    system?: string;
  };
  data?: Record<string, any>;
  actionRequired: boolean;
  acknowledged: boolean;
  resolved: boolean;
}

interface AlertsFeedProps {
  organizationId: string;
  buildingId?: string;
  maxAlerts?: number;
  autoAcknowledge?: boolean;
  showFilters?: boolean;
}

export function AlertsFeed({
  organizationId,
  buildingId,
  maxAlerts = 100,
  autoAcknowledge = false,
  showFilters = true
}: AlertsFeedProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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

        // Subscribe to alerts
        newSocket.emit('subscribe', {
          channel: 'alerts',
          organizationId,
          buildingId
        });
      });

      newSocket.on('alert:new', (alert: Alert) => {
        setAlerts(prev => {
          const newAlerts = [alert, ...prev];
          if (newAlerts.length > maxAlerts) {
            newAlerts.pop();
          }
          return newAlerts;
        });

        if (!alert.acknowledged && !autoAcknowledge) {
          setUnreadCount(prev => prev + 1);
        }

        // Play sound for critical alerts if not muted
        if (!isMuted && alert.severity === 'critical') {
          playAlertSound();
        }

        // Auto scroll to top for new alerts
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
        }
      });

      newSocket.on('alert:update', (updatedAlert: Alert) => {
        setAlerts(prev => prev.map(alert =>
          alert.id === updatedAlert.id ? updatedAlert : alert
        ));
      });

      newSocket.on('alert:batch', (alertBatch: Alert[]) => {
        setAlerts(alertBatch);
        const unread = alertBatch.filter(a => !a.acknowledged).length;
        setUnreadCount(unread);
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
  }, [organizationId, buildingId, supabase, maxAlerts, autoAcknowledge, isMuted]);

  const playAlertSound = () => {
    const audio = new Audio('/sounds/alert.mp3');
    audio.play().catch(() => {});
  };

  const acknowledgeAlert = (alertId: string) => {
    if (socket) {
      socket.emit('alert:acknowledge', { alertId, organizationId });
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const resolveAlert = (alertId: string) => {
    if (socket) {
      socket.emit('alert:resolve', { alertId, organizationId });
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true, acknowledged: true } : alert
      ));
    }
  };

  const acknowledgeAll = () => {
    if (socket) {
      socket.emit('alert:acknowledge-all', { organizationId });
      setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })));
      setUnreadCount(0);
    }
  };

  const getAlertIcon = (alert: Alert) => {
    switch (alert.type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: Alert['category']) => {
    switch (category) {
      case 'emissions':
        return <TrendingUp className="h-3 w-3" />;
      case 'energy':
        return <Zap className="h-3 w-3" />;
      case 'device':
        return <Cpu className="h-3 w-3" />;
      case 'compliance':
        return <Shield className="h-3 w-3" />;
      case 'cost':
        return <DollarSign className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (selectedCategory !== 'all' && alert.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
    return true;
  });

  const categories = ['all', 'emissions', 'energy', 'device', 'compliance', 'cost', 'prediction'];
  const severities = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Alerts Feed</h3>
              <p className="text-sm text-gray-400">
                {filteredAlerts.length} alerts · {unreadCount} unread
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
              className="text-gray-400"
            >
              {isMuted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={acknowledgeAll}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-2 mt-4">
            <Filter className="h-4 w-4 text-gray-400" />
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-1 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
              >
                {severities.map(sev => (
                  <option key={sev} value={sev}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Alerts List */}
      <Card className="p-4 bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <ScrollArea className="h-[500px]" ref={scrollRef}>
          <div className="space-y-2">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  alert.resolved ? 'bg-gray-800/30 opacity-50' :
                  alert.acknowledged ? 'bg-gray-800/50 border-gray-700' :
                  'bg-gray-800/70 border-gray-600',
                  !alert.acknowledged && 'animate-pulse-subtle'
                )}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white">
                            {alert.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getSeverityColor(alert.severity))}
                          >
                            {alert.severity}
                          </Badge>
                          <div className="flex items-center gap-1 text-gray-400">
                            {getCategoryIcon(alert.category)}
                            <span className="text-xs">{alert.category}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{alert.message}</p>

                        {/* Alert Source */}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                          </div>
                          {alert.source.agent && (
                            <span>Agent: {alert.source.agent}</span>
                          )}
                          {alert.source.device && (
                            <span>Device: {alert.source.device}</span>
                          )}
                        </div>

                        {/* Alert Data */}
                        {alert.data && Object.keys(alert.data).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs">
                            {Object.entries(alert.data).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-400">{key}:</span>
                                <span className="text-gray-300 font-mono">
                                  {typeof value === 'object' ? JSON.stringify(value) : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {!alert.resolved && (
                        <div className="flex flex-col gap-1">
                          {!alert.acknowledged && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="text-xs h-7"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ack
                            </Button>
                          )}
                          {alert.actionRequired && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resolveAlert(alert.id)}
                              className="text-xs h-7"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      )}
                      {alert.resolved && (
                        <Badge variant="outline" className="text-xs">
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredAlerts.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No alerts to display</p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCategory !== 'all' || selectedSeverity !== 'all'
                    ? 'Try adjusting your filters'
                    : 'All systems operational'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}