'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { Shield, Plus, Edit, Trash2, ExternalLink, CheckCircle, XCircle, Users, Key, Globe, Settings, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { SSOConfiguration, SSOProvider } from '@/types/sso';
import { SSOConfigurationForm } from '@/components/auth/sso/SSOConfigurationForm';
import { SSOTestInterface } from '@/components/auth/sso/SSOTestInterface';

export default function SSOSettingsPage() {
  const [configurations, setConfigurations] = useState<SSOConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SSOConfiguration | null>(null);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const { user: _user } = useAuth();

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/sso/configurations');
      if (response.ok) {
        const data = await response.json();
        setConfigurations(data.configurations);
      }
    } catch (error) {
      console.error('Failed to load SSO configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SSO configuration?')) return;

    try {
      const response = await fetch(`/api/auth/sso/configurations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadConfigurations();
      }
    } catch (error) {
      console.error('Failed to delete configuration:', error);
    }
  };

  const handleFormComplete = () => {
    setShowForm(false);
    setEditingConfig(null);
    loadConfigurations();
  };

  const getProtocolIcon = (protocol: typeof SSOProvider[keyof typeof SSOProvider]) => {
    switch (protocol) {
      case 'saml':
        return <Key className="h-5 w-5" />;
      case 'oidc':
        return <Globe className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getProtocolColor = (protocol: typeof SSOProvider[keyof typeof SSOProvider]) => {
    switch (protocol) {
      case 'saml':
        return 'text-blue-500';
      case 'oidc':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Single Sign-On (SSO)</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure enterprise SSO providers for your organization
        </p>
      </motion.div>

      {/* SSO Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  SSO Configurations
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Manage SAML 2.0 and OpenID Connect providers
                </p>
              </div>
              {!showForm && !editingConfig && (
                <GradientButton
                  onClick={() => setShowForm(true)}
                  size="small"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </GradientButton>
              )}
            </div>

            {/* Configuration Form */}
            <AnimatePresence>
              {(showForm || editingConfig) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <SSOConfigurationForm
                    configuration={editingConfig}
                    onComplete={handleFormComplete}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingConfig(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : configurations.length === 0 && !showForm ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No SSO providers configured
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get started by adding your first SSO provider
                </p>
                <GradientButton onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Provider
                </GradientButton>
              </div>
            ) : (
              <div className="space-y-4">
                {configurations.map((config) => (
                  <motion.div
                    key={config.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                  >
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={getProtocolColor(config.protocol || config.provider)}>
                              {getProtocolIcon(config.protocol || config.provider)}
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {config.name}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              {(config.protocol || config.provider).toUpperCase()}
                            </span>
                            {config.enabled ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <XCircle className="h-3 w-3" />
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Domain:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{config.domain}</span>
                            </div>
                            {config.protocol === 'saml' && config.samlConfig && (
                              <>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Entity ID:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white truncate">
                                    {config.samlConfig.sp_entity_id || config.samlConfig.issuer}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">SSO URL:</span>
                                  <a
                                    href={config.samlConfig.sso_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    View
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </>
                            )}
                            {config.protocol === 'oidc' && config.oidcConfig && (
                              <>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Client ID:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white truncate">
                                    {config.oidcConfig.client_id}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Issuer:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white truncate">
                                    {config.oidcConfig.issuer_url}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {testingConfig === config.id ? (
                            <SSOTestInterface
                              configurationId={config.id}
                              onClose={() => setTestingConfig(null)}
                            />
                          ) : (
                            <>
                              <button
                                onClick={() => setTestingConfig(config.id)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                title="Test configuration"
                              >
                                <Settings className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingConfig(config)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                title="Edit configuration"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(config.id)}
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                title="Delete configuration"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* SSO Information */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              SSO Configuration Guide
            </h2>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">SAML 2.0</h3>
                <ul className="space-y-1 list-disc list-inside ml-4">
                  <li>Assertion Consumer Service URL: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{process.env['NEXT_PUBLIC_APP_URL']}/api/auth/sso/saml/callback</code></li>
                  <li>Entity ID: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{process.env['NEXT_PUBLIC_APP_URL']}</code></li>
                  <li>Name ID Format: Email Address</li>
                  <li>Signature Algorithm: RSA-SHA256</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">OpenID Connect</h3>
                <ul className="space-y-1 list-disc list-inside ml-4">
                  <li>Redirect URI: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{process.env['NEXT_PUBLIC_APP_URL']}/api/auth/sso/oidc/callback</code></li>
                  <li>Scopes: openid, profile, email</li>
                  <li>Response Type: code</li>
                  <li>Grant Type: authorization_code</li>
                </ul>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Important Security Note</p>
                <p className="text-amber-800 dark:text-amber-200">
                  Always use HTTPS in production. Ensure your identity provider is configured to only accept requests from your verified domain.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}