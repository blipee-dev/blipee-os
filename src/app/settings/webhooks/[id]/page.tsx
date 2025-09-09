'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  PlayCircle,
  Activity,
  Hash,
  Globe,
  Shield,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  WebhookEndpoint, 
  WebhookDelivery, 
  WebhookEventType 
} from '@/types/webhooks';
import { format } from 'date-fns';
import Link from 'next/link';

export default function WebhookDetailPage() {
  const params = useParams();
  const webhookId = params['id'] as string;
  
  const [webhook, setWebhook] = useState<WebhookEndpoint | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadWebhook();
    loadDeliveries();
  }, [webhookId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadDeliveries();
  }, [filterStatus, searchTerm, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWebhook = async () => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`);
      const data = await response.json();
      
      if (response.ok) {
        setWebhook(data.webhook);
      }
    } catch (error) {
      console.error('Failed to load webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async () => {
    setDeliveriesLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '25',
      });
      
      const response = await fetch(`/api/webhooks/${webhookId}/deliveries?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        let filteredDeliveries = data.deliveries;
        
        // Apply status filter
        if (filterStatus !== 'all') {
          filteredDeliveries = filteredDeliveries.filter(
            (d: WebhookDelivery) => d.status === filterStatus
          );
        }
        
        // Apply search filter
        if (searchTerm) {
          filteredDeliveries = filteredDeliveries.filter(
            (d: WebhookDelivery) => 
              d.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
              d.event_id.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setDeliveries(filteredDeliveries);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const retryDelivery = async (deliveryId: string) => {
    try {
      const response = await fetch(`/api/webhooks/deliveries/${deliveryId}/retry`, {
        method: 'POST',
      });
      
      if (response.ok) {
        loadDeliveries();
        alert('Delivery retry scheduled successfully');
      }
    } catch (error) {
      console.error('Failed to retry delivery:', error);
      alert('Failed to retry delivery');
    }
  };

  const testWebhook = async () => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Test webhook sent successfully!');
        loadDeliveries();
      } else {
        alert(`Test webhook failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to test webhook');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const exportDeliveries = () => {
    const csvContent = [
      ['Event Type', 'Event ID', 'Status', 'Response Time', 'Delivered At', 'Error Message'].join(','),
      ...deliveries.map(d => [
        d.event_type,
        d.event_id,
        d.status,
        d.response_time_ms ? `${d.response_time_ms}ms` : '',
        d.delivered_at ? format(new Date(d.delivered_at), 'yyyy-MM-dd HH:mm:ss') : '',
        d.error_message || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-deliveries-${webhookId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-white mb-2">Webhook Not Found</h3>
        <p className="text-gray-400">The webhook you{"'"}re looking for doesn{"'"}t exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/settings/webhooks" className="p-2 hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold text-white">Webhook Details</h1>
              <p className="text-gray-400 mt-1">{webhook.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GradientButton onClick={testWebhook}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Test Webhook
            </GradientButton>
          </div>
        </div>
      </GlassCard>

      {/* Webhook Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard>
            <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-gray-900/50 rounded text-sm text-gray-300">
                    {webhook.url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(webhook.url)}
                    className="p-2 hover:bg-gray-800 rounded"
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                  <a
                    href={webhook.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-800 rounded"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <p className="text-sm text-gray-300">{webhook.description || 'No description'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Secret Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-gray-900/50 rounded text-sm text-gray-300">
                    {showSecretKey ? webhook.secret_key : '••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="p-2 hover:bg-gray-800 rounded"
                  >
                    {showSecretKey ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(webhook.secret_key)}
                    className="p-2 hover:bg-gray-800 rounded"
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Event Types</label>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map((event: any) => (
                    <span
                      key={event}
                      className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-purple-400"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          {/* Status Card */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Status</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  webhook.status === 'active' ? 'bg-green-500' :
                  webhook.status === 'failing' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  webhook.status === 'active' ? 'text-green-500' :
                  webhook.status === 'failing' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {webhook.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Enabled</span>
                <span className="text-sm text-white">{webhook.enabled ? 'Yes' : 'No'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Failures</span>
                <span className="text-sm text-white">{webhook.failure_count}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">API Version</span>
                <span className="text-sm text-white">v{webhook.api_version}</span>
              </div>
              
              {webhook.last_delivery_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Last Delivery</span>
                  <span className="text-sm text-white">
                    {format(new Date(webhook.last_delivery_at), 'MMM d, HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={testWebhook}
                className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-800 rounded-lg transition-colors"
              >
                <PlayCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">Test Webhook</span>
              </button>
              
              <button
                onClick={exportDeliveries}
                className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-300">Export Deliveries</span>
              </button>
              
              <Link
                href={`/settings/webhooks/${webhookId}/edit`}
                className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-300">Edit Configuration</span>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Delivery Logs */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Delivery Logs</h3>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deliveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'success' | 'failed')}
              className="px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:border-purple-500 focus:outline-none text-sm"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            
            <button
              onClick={loadDeliveries}
              disabled={deliveriesLoading}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {deliveriesLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
              ) : (
                <RefreshCw className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {deliveriesLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Deliveries Found</h3>
            <p className="text-gray-400">
              {searchTerm || filterStatus !== 'all' 
                ? 'No deliveries match your current filters'
                : 'No webhook deliveries have been made yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="p-4 bg-gray-900/30 rounded-lg hover:bg-gray-900/50 transition-colors cursor-pointer"
                onClick={() => setSelectedDelivery(delivery)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(delivery.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{delivery.event_type}</span>
                        <span className="text-xs text-gray-500">#{delivery.attempt_number}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>ID: {delivery.event_id.substring(0, 8)}</span>
                        {delivery.response_time_ms && (
                          <span>{delivery.response_time_ms}ms</span>
                        )}
                        {delivery.delivered_at && (
                          <span>{format(new Date(delivery.delivered_at), 'MMM d, HH:mm')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {delivery.status === 'failed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          retryDelivery(delivery.id);
                        }}
                        className="p-1 hover:bg-gray-800 rounded text-yellow-400 hover:text-yellow-300"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    
                    <span className={`text-xs px-2 py-1 rounded ${
                      delivery.status === 'success' ? 'bg-green-500/20 text-green-400' :
                      delivery.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {delivery.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {delivery.error_message && (
                  <div className="mt-2 text-sm text-red-400 bg-red-500/10 p-2 rounded">
                    {delivery.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Delivery Detail Modal */}
      {selectedDelivery && (
        <DeliveryDetailModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
        />
      )}
    </div>
  );
}

// Delivery Detail Modal Component
function DeliveryDetailModal({
  delivery,
  onClose,
}: {
  delivery: WebhookDelivery;
  onClose: () => void;
}) {
  const [showPayload, setShowPayload] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 rounded-xl border border-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Delivery Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <XCircle className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-white mb-3">Delivery Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Event Type</span>
                  <span className="text-white">{delivery.event_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Event ID</span>
                  <span className="text-white font-mono">{delivery.event_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Attempt</span>
                  <span className="text-white">#{delivery.attempt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-medium ${
                    delivery.status === 'success' ? 'text-green-400' :
                    delivery.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {delivery.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-white mb-3">Response Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status Code</span>
                  <span className="text-white">{delivery.response_status_code || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Response Time</span>
                  <span className="text-white">{delivery.response_time_ms ? `${delivery.response_time_ms}ms` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Delivered At</span>
                  <span className="text-white">
                    {delivery.delivered_at ? format(new Date(delivery.delivered_at), 'MMM d, yyyy HH:mm:ss') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {delivery.error_message && (
            <div className="mb-6">
              <h4 className="font-medium text-white mb-2">Error Message</h4>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {delivery.error_message}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <button
                onClick={() => setShowPayload(!showPayload)}
                className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
              >
                {showPayload ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPayload ? 'Hide' : 'Show'} Payload
              </button>
              {showPayload && (
                <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    {JSON.stringify(delivery.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {delivery.response_body && (
              <div>
                <button
                  onClick={() => setShowResponse(!showResponse)}
                  className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
                >
                  {showResponse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showResponse ? 'Hide' : 'Show'} Response
                </button>
                {showResponse && (
                  <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      {delivery.response_body}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}