'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Calendar, Shield, Globe, Hash, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APIKey, APIKeyCreate, APIVersion, API_SCOPES } from '@/types/api-gateway';
import { format } from 'date-fns';
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function APIKeysPage() {
  useAuthRedirect('/settings/api-keys');
  
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ key: APIKey & { key: string } } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const response = await fetch('/api/gateway/keys');
      const data = await response.json();
      
      if (response.ok) {
        setApiKeys(data.keys);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async (data: APIKeyCreate) => {
    try {
      const response = await fetch('/api/gateway/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setNewKeyData(result);
        setShowCreateForm(false);
        loadAPIKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const revokeAPIKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/gateway/keys/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Revoked by user' }),
      });
      
      if (response.ok) {
        loadAPIKeys();
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'revoked':
        return 'text-red-500';
      case 'expired':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl">
                <Key className="h-8 w-8 accent-text" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-white">API Keys</h1>
                <p className="mt-1 text-gray-400">
                  Manage API keys for programmatic access to your data
                </p>
              </div>
            </div>
            {!showCreateForm && !newKeyData && (
              <GradientButton onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </GradientButton>
            )}
          </div>
        </GlassCard>

        {/* New Key Display */}
        <AnimatePresence>
          {newKeyData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard className="border-green-500/50">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Shield className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        API Key Created Successfully
                      </h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Make sure to copy your API key now. You won{"'"}t be able to see it again!
                      </p>
                      
                      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                        <div className="flex items-center justify-between">
                          <code className="text-sm text-green-400 font-mono">
                            {newKeyData.key.key}
                          </code>
                          <button
                            onClick={() => copyToClipboard(newKeyData.key.key, 'new')}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            {copiedKey === 'new' ? (
                              <span className="text-xs text-green-400">Copied!</span>
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setNewKeyData(null)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <GlassCard>
                <CreateAPIKeyForm
                  onSubmit={createAPIKey}
                  onCancel={() => setShowCreateForm(false)}
                />
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* API Keys List */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 accent-border"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <GlassCard>
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No API Keys</h3>
              <p className="text-gray-400">
                Create your first API key to get started with the API
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <GlassCard key={key.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-white">{key.name}</h3>
                      <span className={`text-xs font-medium ${getStatusColor(key.status)}`}>
                        {key.status.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">
                        {key.version}
                      </span>
                    </div>
                    
                    {key.description && (
                      <p className="text-sm text-gray-400 mb-3">{key.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Hash className="h-4 w-4" />
                        <span className="font-mono">
                          {key.key_prefix}...{key.last_four}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>Created {format(new Date(key.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      
                      {key.last_used_at && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Globe className="h-4 w-4" />
                          <span>Last used {format(new Date(key.last_used_at), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                    
                    {key.scopes && key.scopes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {key.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded accent-text"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {key.status === 'active' && (
                    <button
                      onClick={() => revokeAPIKey(key.id, key.name)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-400" />
                    </button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Create API Key Form Component
function CreateAPIKeyForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: APIKeyCreate) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<APIKeyCreate>({
    name: '',
    description: '',
    version: APIVersion.V1,
    scopes: ['read:organizations', 'read:buildings'],
  });
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    new Set(['read:organizations', 'read:buildings'])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      scopes: Array.from(selectedScopes),
    });
  };

  const toggleScope = (scope: string) => {
    const newScopes = new Set(selectedScopes);
    if (newScopes.has(scope)) {
      newScopes.delete(scope);
    } else {
      newScopes.add(scope);
    }
    setSelectedScopes(newScopes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Create New API Key</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:accent-border focus:outline-none"
          placeholder="Production API Key"
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
          className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:accent-border focus:outline-none"
          rows={3}
          placeholder="Used for production data ingestion..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          API Version
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value={APIVersion.V1}
              checked={formData.version === APIVersion.V1}
              onChange={(e) => setFormData({ ...formData, version: e.target.value as APIVersion })}
              className="accent-text"
            />
            <span className="text-white">v1 (Stable)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value={APIVersion.V2}
              checked={formData.version === APIVersion.V2}
              onChange={(e) => setFormData({ ...formData, version: e.target.value as APIVersion })}
              className="accent-text"
            />
            <span className="text-white">v2 (Beta)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Permissions
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(API_SCOPES).map(([scope, description]) => (
            <label
              key={scope}
              className="flex items-start gap-3 p-3 bg-gray-900/30 rounded-lg cursor-pointer hover:bg-gray-900/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedScopes.has(scope)}
                onChange={() => toggleScope(scope)}
                className="mt-1 accent-text"
              />
              <div>
                <div className="text-sm font-medium text-white">{scope}</div>
                <div className="text-xs text-gray-400">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      <div className="flex gap-4">
        <GradientButton type="submit">
          Create API Key
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