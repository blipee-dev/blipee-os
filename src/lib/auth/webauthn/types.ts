export interface WebAuthnCredential {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  aaguid: string;
  name: string;
  deviceType: 'platform' | 'cross-platform';
  backupEligible: boolean;
  backupState: boolean;
  transports: AuthenticatorTransport[];
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

export interface WebAuthnChallenge {
  id: string;
  challenge: string;
  userId: string;
  expiresAt: Date;
  type: 'registration' | 'authentication';
  metadata?: Record<string, any>;
}

export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: 'public-key';
  }>;
  timeout: number;
  attestation: 'none' | 'indirect' | 'direct';
  authenticatorSelection: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    requireResidentKey?: boolean;
    residentKey?: 'discouraged' | 'preferred' | 'required';
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
  excludeCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransport[];
  }>;
}

export interface WebAuthnAuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransport[];
  }>;
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

export interface WebAuthnRegistrationResponse {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: AuthenticatorTransport[];
  };
  clientExtensionResults?: any;
  type: 'public-key';
}

export interface WebAuthnAuthenticationResponse {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
  clientExtensionResults?: any;
  type: 'public-key';
}

export interface WebAuthnVerificationResult {
  verified: boolean;
  credentialId?: string;
  newCounter?: number;
  error?: string;
}

export interface WebAuthnStats {
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

export interface WebAuthnConfig {
  rpName: string;
  rpId: string;
  origin: string;
  timeout: number;
  challengeTTL: number;
  maxCredentialsPerUser: number;
  requireUserVerification: boolean;
  allowedAAGUIDs?: string[];
  blockedAAGUIDs?: string[];
}

export const WEBAUTHN_ALGORITHMS = [
  -7,  // ES256
  -35, // ES384
  -36, // ES512
  -257, // RS256
  -258, // RS384
  -259, // RS512
  -37,  // PS256
  -38,  // PS384
  -39,  // PS512
  -8,   // EdDSA
];

export const KNOWN_AAGUIDS = {
  'yubikey-5': 'f8a011f3-8c0a-4d15-8006-17111f9edc7d',
  'yubikey-5c': 'c5ef55ff-ad9a-4b9f-b580-adebafe026d0',
  'yubikey-5-nfc': 'fa2b99dc-9e39-4257-8f92-4a30d23c4118',
  'solokeys-solo': '8876631b-d4a0-427f-5773-0ec71c9e0279',
  'google-titan': 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4',
  'windows-hello': '08987058-cadc-4b81-b6e1-30de50dcbe96',
  'touch-id': '39a5647e-1853-446c-a1f6-a79bae9f5bc7',
  'face-id': '39a5647e-1853-446c-a1f6-a79bae9f5bc7',
} as const;