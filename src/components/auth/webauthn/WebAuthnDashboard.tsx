'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Monitor, 
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Fingerprint,
  Usb,
  Nfc,
  Bluetooth,
  Wifi,
} from 'lucide-react';
import { format } from 'date-fns';

interface WebAuthnCredential {
  id: string;
  name: string;
  deviceType: 'platform' | 'cross-platform';
  transports: string[];
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
  aaguid: string;
}

interface WebAuthnStats {
  totalCredentials: number;
  activeCredentials: number;
  platformCredentials: number;
  crossPlatformCredentials: number;
  recentAuthenticationsCount: number;
  topDeviceTypes: Array<{
    type: string;
    count: number;
  }>;
}

// Simple Badge component
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' | 'outline' }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  const variantClasses = {
    default: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    outline: "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

export default function WebAuthnDashboard() {
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [stats, setStats] = useState<WebAuthnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [newCredentialName, setNewCredentialName] = useState('');
  const [selectedAuthenticator, setSelectedAuthenticator] = useState<'platform' | 'cross-platform' | 'any'>('any');

  useEffect(() => {
    fetchCredentials();
    fetchStats();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/auth/webauthn/credentials');
      const data = await response.json();
      
      if (data.success) {
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/auth/webauthn/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRegisterCredential = async () => {
    if (!newCredentialName.trim()) return;

    setRegistering(true);
    try {
      // Get registration options
      const optionsResponse = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialName: newCredentialName,
          authenticatorSelection: selectedAuthenticator !== 'any' ? {
            authenticatorAttachment: selectedAuthenticator,
            userVerification: 'preferred',
          } : undefined,
        }),
      });

      const optionsData = await optionsResponse.json();
      if (!optionsData.success) {
        throw new Error(optionsData.error);
      }

      // Create credential using WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: {
          ...optionsData.options,
          challenge: base64URLToUint8Array(optionsData.options.challenge),
          user: {
            ...optionsData.options.user,
            id: new TextEncoder().encode(optionsData.options.user.id),
          },
          excludeCredentials: optionsData.options.excludeCredentials?.map((cred: any) => ({
            ...cred,
            id: base64URLToUint8Array(cred.id),
          })),
        },
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const registrationResponse = {
        id: credential.id,
        rawId: uint8ArrayToBase64URL(new Uint8Array(credential.rawId)),
        response: {
          clientDataJSON: uint8ArrayToBase64URL(new Uint8Array(response.clientDataJSON)),
          attestationObject: uint8ArrayToBase64URL(new Uint8Array(response.attestationObject)),
          transports: response.getTransports?.() || [],
        },
        type: credential.type,
      };

      // Verify registration
      const verifyResponse = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialName: newCredentialName,
          registrationResponse,
        }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error);
      }

      // Success - refresh credentials
      await fetchCredentials();
      setShowAddModal(false);
      setNewCredentialName('');
      setSelectedAuthenticator('any');
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;

    try {
      const response = await fetch(`/api/auth/webauthn/credentials?id=${credentialId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await fetchCredentials();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to delete credential:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete credential');
    }
  };

  const getDeviceIcon = (deviceType: string, transports: string[]) => {
    if (deviceType === 'platform') {
      return <Fingerprint className="w-4 h-4" />;
    }
    
    if (transports.includes('usb')) {
      return <Usb className="w-4 h-4" />;
    }
    
    if (transports.includes('nfc')) {
      return <Nfc className="w-4 h-4" />;
    }
    
    if (transports.includes('ble')) {
      return <Bluetooth className="w-4 h-4" />;
    }
    
    return <Key className="w-4 h-4" />;
  };

  const getTransportIcon = (transport: string) => {
    switch (transport) {
      case 'usb': return <Usb className="w-3 h-3" />;
      case 'nfc': return <Nfc className="w-3 h-3" />;
      case 'ble': return <Bluetooth className="w-3 h-3" />;
      case 'internal': return <Monitor className="w-3 h-3" />;
      default: return <Key className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard>
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCredentials}</p>
                </div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCredentials}</p>
                </div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Fingerprint className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Biometric</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.platformCredentials}</p>
                </div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hardware</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.crossPlatformCredentials}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Credentials List */}
      <GlassCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>WebAuthn Credentials</span>
            </h3>
            <GradientButton
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Credential</span>
            </GradientButton>
          </div>
          
          <div>
          {credentials.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No WebAuthn credentials configured</p>
              <p className="text-sm text-gray-400">Add a security key or biometric authenticator</p>
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {getDeviceIcon(credential.deviceType, credential.transports)}
                    <div>
                      <h3 className="font-semibold">{credential.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={credential.isActive ? 'default' : 'secondary'}>
                          {credential.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {credential.deviceType === 'platform' ? 'Biometric' : 'Hardware Key'}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          {credential.transports.map((transport, index) => (
                            <div key={index} className="text-gray-400">
                              {getTransportIcon(transport)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {format(new Date(credential.createdAt), 'MMM d, yyyy')}
                        {' • '}
                        Last used: {format(new Date(credential.lastUsed), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCredential(credential.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </GlassCard>

      {/* Add Credential Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add WebAuthn Credential</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Credential Name
                </label>
                <input
                  type="text"
                  value={newCredentialName}
                  onChange={(e) => setNewCredentialName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., YubiKey 5C, Touch ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Authenticator Type
                </label>
                <select
                  value={selectedAuthenticator}
                  onChange={(e) => setSelectedAuthenticator(e.target.value as any)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="any">Any Authenticator</option>
                  <option value="platform">Platform (Biometric)</option>
                  <option value="cross-platform">Cross-Platform (Hardware Key)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={registering}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <GradientButton
                onClick={handleRegisterCredential}
                disabled={registering || !newCredentialName.trim()}
                className="px-4 py-2"
              >
                {registering ? 'Registering...' : 'Register'}
              </GradientButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for base64URL encoding/decoding
function base64URLToUint8Array(base64URL: string): Uint8Array {
  const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64URL(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...Array.from(bytes));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}