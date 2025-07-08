'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { 
  Webhook, 
  Plus, 
  Settings, 
  Play, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  Activity,
  Globe,
  Shield,
  Edit3,
  ExternalLink,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WebhookEndpoint, 
  WebhookEndpointCreate, 
  WebhookEventType, 
  WebhookStats,
  WEBHOOK_EVENT_CATEGORIES 
} from '@/types/webhooks';
import { format } from 'date-fns';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWebhooks();
    loadStats();
  }, []);

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks');
      const data = await response.json();
      
      if (response.ok) {
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/webhooks/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load webhook stats:', error);
    }
  };

  const createWebhook = async (data: WebhookEndpointCreate) => {
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setShowCreateForm(false);
        loadWebhooks();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const updateWebhook = async (id: string, data: Partial<WebhookEndpointCreate>) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setEditingWebhook(null);
        loadWebhooks();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to update webhook:', error);
    }
  };

  const deleteWebhook = async (id: string, url: string) => {
    if (!confirm(`Are you sure you want to delete the webhook for "${url}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadWebhooks();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const testWebhook = async (id: string) => {
    setTestingWebhook(id);
    try {
      const response = await fetch(`/api/webhooks/${id}/test`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Test webhook sent successfully!');
      } else {
        alert(`Test webhook failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to test webhook');
    } finally {
      setTestingWebhook(null);
    }
  };

  const toggleSecretVisibility = (id: string) => {
    const newShowSecrets = new Set(showSecrets);
    if (newShowSecrets.has(id)) {
      newShowSecrets.delete(id);
    } else {
      newShowSecrets.add(id);
    }
    setShowSecrets(newShowSecrets);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'failing':
        return 'text-yellow-500';
      case 'disabled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failing':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'disabled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl">
              <Webhook className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Webhooks</h1>
              <p className="mt-1 text-gray-400">
                Receive real-time notifications about events in your organization
              </p>
            </div>
          </div>
          {!showCreateForm && (
            <GradientButton onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </GradientButton>
          )}
        </div>
      </GlassCard>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Endpoints</p>
                <p className="text-3xl font-bold text-white">{stats.total_endpoints}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.active_endpoints} active, {stats.failing_endpoints} failing
                </p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Globe className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-white">
                  {stats.delivery_success_rate.toFixed(1)}%
                </p>
                <p className="text-sm text-green-500 mt-2">
                  {stats.successful_deliveries} successful
                </p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Deliveries</p>
                <p className="text-3xl font-bold text-white">{stats.total_deliveries}</p>
                <p className="text-sm text-gray-500 mt-2">Last 24 hours</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Avg Response Time</p>
                <p className="text-3xl font-bold text-white">
                  {stats.average_response_time.toFixed(0)}ms
                </p>
                <p className="text-sm text-gray-500 mt-2">Response time</p>
              </div>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Zap className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showCreateForm || editingWebhook) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard>
              <WebhookForm
                webhook={editingWebhook}
                onSubmit={editingWebhook 
                  ? (data) => updateWebhook(editingWebhook.id, data)
                  : createWebhook
                }
                onCancel={() => {
                  setShowCreateForm(false);
                  setEditingWebhook(null);
                }}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <Webhook className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Webhooks</h3>
            <p className="text-gray-400">
              Create your first webhook to start receiving real-time notifications
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <GlassCard key={webhook.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(webhook.status)}
                    <h3 className="text-lg font-medium text-white">{webhook.url}</h3>
                    <span className={`text-xs font-medium ${getStatusColor(webhook.status)}`}>
                      {webhook.status.toUpperCase()}
                    </span>
                    {!webhook.enabled && (
                      <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">
                        DISABLED
                      </span>
                    )}
                  </div>
                  
                  {webhook.description && (
                    <p className="text-sm text-gray-400 mb-3">{webhook.description}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Activity className="h-4 w-4" />
                      <span>{webhook.events.length} events</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-500">
                      <Globe className="h-4 w-4" />
                      <span>API v{webhook.api_version}</span>
                    </div>
                    
                    {webhook.last_delivery_at && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Last: {format(new Date(webhook.last_delivery_at), 'MMM d, HH:mm')}</span>
                      </div>
                    )}
                    
                    {webhook.failure_count > 0 && (
                      <div className="flex items-center gap-2 text-yellow-500">
                        <AlertCircle className="h-4 w-4" />
                        <span>{webhook.failure_count} failures</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Events */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {webhook.events.slice(0, 5).map((event) => (
                      <span
                        key={event}
                        className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-purple-400"
                      >
                        {event}
                      </span>
                    ))}
                    {webhook.events.length > 5 && (
                      <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">
                        +{webhook.events.length - 5} more
                      </span>
                    )}
                  </div>
                  
                  {/* Secret Key */}
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Secret:</span>
                    <code className="font-mono text-xs bg-gray-900/50 px-2 py-1 rounded">
                      {showSecrets.has(webhook.id) 
                        ? webhook.secret_key 
                        : webhook.secret_key.substring(0, 8) + '...'
                      }
                    </code>
                    <button
                      onClick={() => toggleSecretVisibility(webhook.id)}
                      className="p-1 hover:bg-gray-800 rounded"
                    >
                      {showSecrets.has(webhook.id) ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(webhook.secret_key)}
                      className="p-1 hover:bg-gray-800 rounded"
                    >
                      <Copy className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testWebhook(webhook.id)}
                    disabled={testingWebhook === webhook.id}
                    className="p-2 hover:bg-green-500/10 rounded-lg transition-colors group"
                  >
                    {testingWebhook === webhook.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-500"></div>
                    ) : (
                      <Play className="h-4 w-4 text-gray-400 group-hover:text-green-400" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setEditingWebhook(webhook)}
                    className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors group"
                  >
                    <Edit3 className="h-4 w-4 text-gray-400 group-hover:text-blue-400" />
                  </button>
                  
                  <button
                    onClick={() => deleteWebhook(webhook.id, webhook.url)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-400" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// Webhook Form Component
function WebhookForm({
  webhook,
  onSubmit,
  onCancel,
}: {
  webhook?: WebhookEndpoint | null;
  onSubmit: (data: WebhookEndpointCreate) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<WebhookEndpointCreate>({
    url: webhook?.url || '',
    description: webhook?.description || '',
    events: webhook?.events || [WebhookEventType.BUILDING_CREATED],
    api_version: webhook?.api_version || '1.0',
    enabled: webhook?.enabled ?? true,
    headers: webhook?.headers || {},
  });
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEventType>>(
    new Set(webhook?.events || [WebhookEventType.BUILDING_CREATED])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      events: Array.from(selectedEvents),
    });
  };

  const toggleEvent = (event: WebhookEventType) => {
    const newEvents = new Set(selectedEvents);
    if (newEvents.has(event)) {
      newEvents.delete(event);
    } else {
      newEvents.add(event);
    }
    setSelectedEvents(newEvents);
  };

  const toggleCategoryEvents = (events: readonly WebhookEventType[]) => {
    const newEvents = new Set(selectedEvents);
    const allSelected = events.every(event => newEvents.has(event));
    
    if (allSelected) {
      events.forEach(event => newEvents.delete(event));
    } else {
      events.forEach(event => newEvents.add(event));
    }
    setSelectedEvents(newEvents);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">
        {webhook ? 'Edit Webhook' : 'Create New Webhook'}
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Webhook URL *
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          placeholder="https://your-app.com/webhooks"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          rows={3}
          placeholder="Production webhook for emissions tracking..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Event Types *
        </label>
        <div className="space-y-4">
          {Object.entries(WEBHOOK_EVENT_CATEGORIES).map(([category, events]) => (
            <div key={category} className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">{category}</h4>
                <button
                  type="button"
                  onClick={() => toggleCategoryEvents(events)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  {events.every(event => selectedEvents.has(event)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {events.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 p-2 bg-gray-900/30 rounded cursor-pointer hover:bg-gray-900/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event)}
                      onChange={() => toggleEvent(event)}
                      className="text-purple-500"
                    />
                    <span className="text-sm text-gray-300">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            className="text-purple-500"
          />
          <span className="text-sm text-gray-300">Enabled</span>
        </label>
      </div>
      
      <div className="flex gap-4">
        <GradientButton type="submit">
          {webhook ? 'Update Webhook' : 'Create Webhook'}
        </GradientButton>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}