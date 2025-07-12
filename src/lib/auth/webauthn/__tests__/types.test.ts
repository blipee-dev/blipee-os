import type { 
  WebAuthnCredential,
  WebAuthnChallenge,
  WebAuthnRegistrationOptions,
  WebAuthnAuthenticationOptions,
  WebAuthnDevice 
} from '../types';

describe('WebAuthn types', () => {
  it('should create valid WebAuthnCredential objects', () => {
    const credential: WebAuthnCredential = {
      id: 'cred-1',
      credentialId: 'base64-credential-id',
      userId: 'user-1',
      publicKey: 'base64-public-key',
      counter: 0,
      deviceType: 'platform',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString()
    };
    
    expect(credential.id).toBe('cred-1');
    expect(credential.deviceType).toBe('platform');
    expect(credential.counter).toBe(0);
  });

  it('should create valid WebAuthnChallenge objects', () => {
    const challenge: WebAuthnChallenge = {
      id: 'challenge-1',
      challenge: 'base64-random-challenge',
      userId: 'user-1',
      type: 'registration',
      verified: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString() // 5 minutes
    };
    
    expect(challenge.type).toBe('registration');
    expect(challenge.verified).toBe(false);
  });

  it('should create valid WebAuthnRegistrationOptions', () => {
    const options: WebAuthnRegistrationOptions = {
      rp: {
        name: 'Blipee OS',
        id: 'blipee.os'
      },
      user: {
        id: 'user-id-bytes',
        name: 'user@example.com',
        displayName: 'Test User'
      },
      challenge: 'random-challenge',
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' }
      ],
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'preferred'
      }
    };
    
    expect(options.rp.name).toBe('Blipee OS');
    expect(options.pubKeyCredParams).toHaveLength(2);
    expect(options.authenticatorSelection?.userVerification).toBe('preferred');
  });

  it('should create valid WebAuthnAuthenticationOptions', () => {
    const options: WebAuthnAuthenticationOptions = {
      challenge: 'auth-challenge',
      timeout: 60000,
      rpId: 'blipee.os',
      allowCredentials: [
        {
          id: 'credential-id-1',
          type: 'public-key',
          transports: ['usb', 'nfc', 'ble']
        }
      ],
      userVerification: 'required'
    };
    
    expect(options.rpId).toBe('blipee.os');
    expect(options.userVerification).toBe('required');
    expect(options.allowCredentials).toHaveLength(1);
  });

  it('should create valid WebAuthnDevice objects', () => {
    const device: WebAuthnDevice = {
      id: 'device-1',
      name: 'MacBook Pro',
      type: 'platform',
      lastUsed: new Date().toISOString(),
      created: new Date().toISOString(),
      os: 'macOS',
      browser: 'Chrome'
    };
    
    expect(device.name).toBe('MacBook Pro');
    expect(device.type).toBe('platform');
    expect(device.os).toBe('macOS');
  });

  it('should handle device types', () => {
    const deviceTypes: Array<'platform' | 'cross-platform'> = ['platform', 'cross-platform'];
    deviceTypes.forEach(type => {
      expect(type).toBeTruthy();
    });
  });
});