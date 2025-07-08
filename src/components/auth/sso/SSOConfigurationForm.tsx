'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GradientButton } from '@/components/premium/GradientButton';
import { SSOConfiguration, SSOProvider } from '@/types/sso';
import { Key, Globe, Save, X, AlertCircle } from 'lucide-react';

interface SSOConfigurationFormProps {
  configuration?: SSOConfiguration | null;
  onComplete: () => void;
  onCancel: () => void;
}

export function SSOConfigurationForm({ configuration, onComplete, onCancel }: SSOConfigurationFormProps) {
  const [formData, setFormData] = useState({
    name: configuration?.name || '',
    domain: configuration?.domain || '',
    protocol: configuration?.protocol || SSOProvider.SAML,
    enabled: configuration?.enabled ?? true,
    autoProvision: configuration?.autoProvision ?? true,
    defaultRole: configuration?.defaultRole || 'viewer',
    samlConfig: {
      entityId: configuration?.samlConfig?.sp_entity_id || configuration?.samlConfig?.issuer || '',
      ssoUrl: configuration?.samlConfig?.sso_url || '',
      certificate: configuration?.samlConfig?.certificate || '',
      signatureAlgorithm: 'RSA-SHA256',
      assertionEncrypted: false,
    },
    oidcConfig: {
      clientId: configuration?.oidcConfig?.client_id || '',
      clientSecret: configuration?.oidcConfig?.client_secret || '',
      issuer: configuration?.oidcConfig?.issuer_url || '',
      authorizationUrl: configuration?.oidcConfig?.authorization_endpoint || '',
      tokenUrl: configuration?.oidcConfig?.token_endpoint || '',
      userInfoUrl: configuration?.oidcConfig?.userinfo_endpoint || '',
      scopes: configuration?.oidcConfig?.scopes || ['openid', 'profile', 'email'],
    },
    attributeMapping: configuration?.attributeMapping || {
      email: 'email',
      firstName: 'given_name',
      lastName: 'family_name',
      displayName: 'name',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = configuration
        ? `/api/auth/sso/configurations/${configuration.id}`
        : '/api/auth/sso/configurations';
      
      const method = configuration ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolChange = (protocol: typeof SSOProvider[keyof typeof SSOProvider]) => {
    setFormData(prev => ({ ...prev, protocol }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {configuration ? 'Edit SSO Configuration' : 'Add SSO Configuration'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-900 dark:text-red-100">Error</p>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Basic Configuration */}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Configuration Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Okta Production"
            required
          />
        </div>

        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Domain
          </label>
          <input
            type="text"
            id="domain"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., company.com"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Users with this email domain will be redirected to SSO
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Protocol
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleProtocolChange(SSOProvider.SAML)}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                formData.protocol === SSOProvider.SAML
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Key className="h-4 w-4 inline mr-2" />
              SAML 2.0
            </button>
            <button
              type="button"
              onClick={() => handleProtocolChange(SSOProvider.OIDC)}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                formData.protocol === SSOProvider.OIDC
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Globe className="h-4 w-4 inline mr-2" />
              OpenID Connect
            </button>
          </div>
        </div>
      </div>

      {/* Protocol-specific Configuration */}
      {formData.protocol === SSOProvider.SAML && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white">SAML Configuration</h4>
          
          <div>
            <label htmlFor="entityId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Identity Provider Entity ID
            </label>
            <input
              type="text"
              id="entityId"
              value={formData.samlConfig.entityId}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                samlConfig: { ...prev.samlConfig, entityId: e.target.value }
              }))}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://idp.example.com/saml"
              required
            />
          </div>

          <div>
            <label htmlFor="ssoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SSO URL
            </label>
            <input
              type="url"
              id="ssoUrl"
              value={formData.samlConfig.ssoUrl}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                samlConfig: { ...prev.samlConfig, ssoUrl: e.target.value }
              }))}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://idp.example.com/sso/saml"
              required
            />
          </div>

          <div>
            <label htmlFor="certificate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              X.509 Certificate
            </label>
            <textarea
              id="certificate"
              value={formData.samlConfig.certificate}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                samlConfig: { ...prev.samlConfig, certificate: e.target.value }
              }))}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-xs"
              rows={6}
              placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDxT...&#10;-----END CERTIFICATE-----"
              required
            />
          </div>
        </div>
      )}

      {formData.protocol === SSOProvider.OIDC && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white">OpenID Connect Configuration</h4>
          
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client ID
            </label>
            <input
              type="text"
              id="clientId"
              value={formData.oidcConfig.clientId}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                oidcConfig: { ...prev.oidcConfig, clientId: e.target.value }
              }))}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Secret
            </label>
            <input
              type="password"
              id="clientSecret"
              value={formData.oidcConfig.clientSecret}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                oidcConfig: { ...prev.oidcConfig, clientSecret: e.target.value }
              }))}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required={!configuration}
            />
            {configuration && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave blank to keep existing secret
              </p>
            )}
          </div>

          <div>
            <label htmlFor="issuer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Issuer URL
            </label>
            <input
              type="url"
              id="issuer"
              value={formData.oidcConfig.issuer}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                oidcConfig: { ...prev.oidcConfig, issuer: e.target.value }
              }))}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://idp.example.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              We&apos;ll automatically discover endpoints from the issuer
            </p>
          </div>
        </div>
      )}

      {/* Additional Settings */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white">Additional Settings</h4>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable this SSO configuration
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.autoProvision}
              onChange={(e) => setFormData(prev => ({ ...prev, autoProvision: e.target.checked }))}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Automatically create users on first login
            </span>
          </label>
        </div>

        <div>
          <label htmlFor="defaultRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Default Role for New Users
          </label>
          <select
            id="defaultRole"
            value={formData.defaultRole}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultRole: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="viewer">Viewer</option>
            <option value="analyst">Analyst</option>
            <option value="facility_manager">Facility Manager</option>
            <option value="sustainability_manager">Sustainability Manager</option>
            <option value="account_owner">Account Owner</option>
          </select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <GradientButton type="submit" disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {configuration ? 'Update Configuration' : 'Create Configuration'}
            </>
          )}
        </GradientButton>
      </div>
    </form>
  );
}