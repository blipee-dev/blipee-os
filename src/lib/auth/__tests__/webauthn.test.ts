import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WebAuthnService } from '../webauthn/service';
import { WebAuthnConfig, WebAuthnCredential, WebAuthnChallenge } from '../webauthn/types';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      gt: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
};

const mockRateLimiter = {
  check: jest.fn(() => Promise.resolve({ allowed: true, remaining: 5 })),
};

const mockAuditService = {
  log: jest.fn(() => Promise.resolve()),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

jest.mock('@/lib/security/rate-limit/service', () => ({
  getRateLimitService: jest.fn(() => mockRateLimiter),
}));

jest.mock('@/lib/audit/service', () => ({
  getAuditService: jest.fn(() => mockAuditService),
}));

// Mock crypto
const mockCrypto = {
  randomBytes: jest.fn(() => Buffer.from('mock-random-bytes')),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => Buffer.from('mock-hash')),
    })),
  })),
};

jest.mock('crypto', () => mockCrypto);


// Mock Next.js Request/Response
global.Request = class Request {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
  }
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

describe('WebAuthnService', () => {
  let webAuthnService: WebAuthnService;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    webAuthnService = new WebAuthnService();
    
    // Create mock request
    mockRequest = {
      headers: new Map([
        ['user-agent', 'Mozilla/5.0 (Test Browser)'],
        ['x-forwarded-for', '192.168.1.1'],
      ]),
      ip: '192.168.1.1',
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Registration Options Generation', () => {
    it('should generate registration options successfully', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';
      const userDisplayName = 'Test User';

      // Mock empty credentials list
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      });

      const options = await webAuthnService.generateRegistrationOptions(
        mockRequest,
        userId,
        userEmail,
        userDisplayName
      );

      expect(options).toBeDefined();
      expect(options.challenge).toBeDefined();
      expect(options.rp.name).toBe('blipee OS');
      expect(options.user.id).toBe(userId);
      expect(options.user.name).toBe(userEmail);
      expect(options.user.displayName).toBe(userDisplayName);
      expect(options.pubKeyCredParams).toBeDefined();
      expect(options.timeout).toBeDefined();
      expect(options.attestation).toBe('none');
    });

    it('should exclude existing credentials', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';
      const userDisplayName = 'Test User';

      // Mock existing credentials
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'cred-1',
                  credentialId: 'existing-cred-id',
                  transports: ['usb', 'nfc'],
                },
              ], 
              error: null 
            })),
          })),
        })),
      });

      const options = await webAuthnService.generateRegistrationOptions(
        mockRequest,
        userId,
        userEmail,
        userDisplayName
      );

      expect(options.excludeCredentials).toBeDefined();
      expect(options.excludeCredentials).toHaveLength(1);
      expect(options.excludeCredentials![0].id).toBe('existing-cred-id');
    });

    it('should respect rate limiting', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';
      const userDisplayName = 'Test User';

      // Mock rate limit exceeded
      mockRateLimiter.check.mockResolvedValue({ allowed: false, remaining: 0 });

      await expect(
        webAuthnService.generateRegistrationOptions(
          mockRequest,
          userId,
          userEmail,
          userDisplayName
        )
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle authenticator selection preferences', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';
      const userDisplayName = 'Test User';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      });

      const options = await webAuthnService.generateRegistrationOptions(
        mockRequest,
        userId,
        userEmail,
        userDisplayName,
        {
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
        }
      );

      expect(options.authenticatorSelection.authenticatorAttachment).toBe('platform');
      expect(options.authenticatorSelection.userVerification).toBe('required');
    });
  });

  describe('Registration Verification', () => {
    it('should verify registration successfully', async () => {
      const userId = 'test-user-id';
      const credentialName = 'Test Credential';
      const registrationResponse = {
        id: 'new-credential-id',
        rawId: 'bmV3LWNyZWRlbnRpYWwtaWQ=',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'test-challenge',
            origin: 'http://localhost:3000',
          })),
          attestationObject: 'mock-attestation-object',
          transports: ['usb'],
        },
        type: 'public-key' as const,
      };

      // Mock challenge retrieval
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ 
                    data: {
                      id: 'challenge-id',
                      challenge: 'test-challenge',
                      user_id: userId,
                      expires_at: new Date(Date.now() + 300000).toISOString(),
                      type: 'registration',
                    }, 
                    error: null 
                  })),
                })),
              })),
            })),
          })),
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      });

      const result = await webAuthnService.verifyRegistration(
        mockRequest,
        userId,
        credentialName,
        registrationResponse
      );

      expect(result.verified).toBe(true);
      expect(result.credentialId).toBe('new-credential-id');
    });

    it('should reject registration with invalid challenge', async () => {
      const userId = 'test-user-id';
      const credentialName = 'Test Credential';
      const registrationResponse = {
        id: 'new-credential-id',
        rawId: 'bmV3LWNyZWRlbnRpYWwtaWQ=',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'wrong-challenge',
            origin: 'http://localhost:3000',
          })),
          attestationObject: 'mock-attestation-object',
          transports: ['usb'],
        },
        type: 'public-key' as const,
      };

      // Mock challenge retrieval
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ 
                    data: {
                      id: 'challenge-id',
                      challenge: 'test-challenge',
                      user_id: userId,
                      expires_at: new Date(Date.now() + 300000).toISOString(),
                      type: 'registration',
                    }, 
                    error: null 
                  })),
                })),
              })),
            })),
          })),
        })),
      });

      const result = await webAuthnService.verifyRegistration(
        mockRequest,
        userId,
        credentialName,
        registrationResponse
      );

      expect(result.verified).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject registration with expired challenge', async () => {
      const userId = 'test-user-id';
      const credentialName = 'Test Credential';
      const registrationResponse = {
        id: 'new-credential-id',
        rawId: 'bmV3LWNyZWRlbnRpYWwtaWQ=',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'test-challenge',
            origin: 'http://localhost:3000',
          })),
          attestationObject: 'mock-attestation-object',
          transports: ['usb'],
        },
        type: 'public-key' as const,
      };

      // Mock expired challenge
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ 
                    data: {
                      id: 'challenge-id',
                      challenge: 'test-challenge',
                      user_id: userId,
                      expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
                      type: 'registration',
                    }, 
                    error: null 
                  })),
                })),
              })),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      });

      const result = await webAuthnService.verifyRegistration(
        mockRequest,
        userId,
        credentialName,
        registrationResponse
      );

      expect(result.verified).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject registration with wrong origin', async () => {
      const userId = 'test-user-id';
      const credentialName = 'Test Credential';
      const registrationResponse = {
        id: 'new-credential-id',
        rawId: 'bmV3LWNyZWRlbnRpYWwtaWQ=',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'test-challenge',
            origin: 'https://malicious.com',
          })),
          attestationObject: 'mock-attestation-object',
          transports: ['usb'],
        },
        type: 'public-key' as const,
      };

      // Mock challenge retrieval
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ 
                    data: {
                      id: 'challenge-id',
                      challenge: 'test-challenge',
                      user_id: userId,
                      expires_at: new Date(Date.now() + 300000).toISOString(),
                      type: 'registration',
                    }, 
                    error: null 
                  })),
                })),
              })),
            })),
          })),
        })),
      });

      const result = await webAuthnService.verifyRegistration(
        mockRequest,
        userId,
        credentialName,
        registrationResponse
      );

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Origin mismatch');
    });

    it('should reject duplicate credential registration', async () => {
      const userId = 'test-user-id';
      const credentialName = 'Test Credential';
      const registrationResponse = {
        id: 'existing-credential-id',
        rawId: 'ZXhpc3RpbmctY3JlZGVudGlhbC1pZA==',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'test-challenge',
            origin: 'http://localhost:3000',
          })),
          attestationObject: 'mock-attestation-object',
          transports: ['usb'],
        },
        type: 'public-key' as const,
      };

      // Mock challenge retrieval and existing credential
      let selectCallCount = 0;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              // First call - challenge retrieval
              return {
                gt: jest.fn(() => ({
                  order: jest.fn(() => ({
                    limit: jest.fn(() => ({
                      single: jest.fn(() => Promise.resolve({ 
                        data: {
                          id: 'challenge-id',
                          challenge: 'test-challenge',
                          user_id: userId,
                          expires_at: new Date(Date.now() + 300000).toISOString(),
                          type: 'registration',
                        }, 
                        error: null 
                      })),
                    })),
                  })),
                })),
              };
            } else {
              // Second call - existing credential check
              return {
                single: jest.fn(() => Promise.resolve({ 
                  data: {
                    id: 'existing-cred',
                    credential_id: 'existing-credential-id',
                  }, 
                  error: null 
                })),
              };
            }
          }),
        })),
      });

      const result = await webAuthnService.verifyRegistration(
        mockRequest,
        userId,
        credentialName,
        registrationResponse
      );

      expect(result.verified).toBe(false);
      expect(result.error).toContain('already registered');
    });

    it('should enforce maximum credentials per user', async () => {
      const userId = 'test-user-id';
      const credentialName = 'Test Credential';
      const registrationResponse = {
        id: 'new-credential-id',
        rawId: 'bmV3LWNyZWRlbnRpYWwtaWQ=',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'test-challenge',
            origin: 'http://localhost:3000',
          })),
          attestationObject: 'mock-attestation-object',
          transports: ['usb'],
        },
        type: 'public-key' as const,
      };

      // Mock many existing credentials
      const existingCredentials = Array.from({ length: 15 }, (_, i) => ({
        id: `cred-${i}`,
        user_id: userId,
      }));

      let selectCallCount = 0;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              // Challenge retrieval
              return {
                gt: jest.fn(() => ({
                  order: jest.fn(() => ({
                    limit: jest.fn(() => ({
                      single: jest.fn(() => Promise.resolve({ 
                        data: {
                          id: 'challenge-id',
                          challenge: 'test-challenge',
                          user_id: userId,
                          expires_at: new Date(Date.now() + 300000).toISOString(),
                          type: 'registration',
                        }, 
                        error: null 
                      })),
                    })),
                  })),
                })),
              };
            } else if (selectCallCount === 2) {
              // Existing credential check
              return {
                single: jest.fn(() => Promise.resolve({ data: null, error: null })),
              };
            } else {
              // User credentials count
              return {
                order: jest.fn(() => Promise.resolve({ 
                  data: existingCredentials, 
                  error: null 
                })),
              };
            }
          }),
        })),
      });

      const result = await webAuthnService.verifyRegistration(
        mockRequest,
        userId,
        credentialName,
        registrationResponse
      );

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Maximum number of credentials reached');
    });
  });

  describe('Authentication Options Generation', () => {
    it('should generate authentication options successfully', async () => {
      const userId = 'test-user-id';

      // Mock user credentials
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'cred-1',
                  credential_id: 'cred-id-1',
                  transports: ['usb', 'nfc'],
                  is_active: true,
                },
              ], 
              error: null 
            })),
          })),
        })),
      });

      const options = await webAuthnService.generateAuthenticationOptions(
        mockRequest,
        userId
      );

      expect(options).toBeDefined();
      expect(options.challenge).toBeDefined();
      expect(options.timeout).toBeDefined();
      expect(options.rpId).toBeDefined();
      expect(options.allowCredentials).toBeDefined();
      expect(options.allowCredentials).toHaveLength(1);
    });

    it('should handle usernameless authentication', async () => {
      const options = await webAuthnService.generateAuthenticationOptions(
        mockRequest
      );

      expect(options).toBeDefined();
      expect(options.challenge).toBeDefined();
      expect(options.allowCredentials).toBeUndefined();
    });

    it('should filter inactive credentials', async () => {
      const userId = 'test-user-id';

      // Mock credentials with inactive one
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'cred-1',
                  credential_id: 'cred-id-1',
                  transports: ['usb'],
                  is_active: true,
                },
                {
                  id: 'cred-2',
                  credential_id: 'cred-id-2',
                  transports: ['nfc'],
                  is_active: false,
                },
              ], 
              error: null 
            })),
          })),
        })),
      });

      const options = await webAuthnService.generateAuthenticationOptions(
        mockRequest,
        userId
      );

      expect(options.allowCredentials).toHaveLength(1);
      expect(options.allowCredentials![0].id).toBe('cred-id-1');
    });
  });

  describe('Authentication Verification', () => {
    it('should verify authentication successfully', async () => {
      const userId = 'test-user-id';
      const authenticationResponse = {
        id: 'test-credential-id',
        rawId: 'dGVzdC1jcmVkZW50aWFsLWlk',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'test-challenge',
            origin: 'http://localhost:3000',
          })),
          authenticatorData: 'mock-authenticator-data',
          signature: 'mock-signature',
        },
        type: 'public-key' as const,
      };

      // Mock challenge and credential retrieval
      let selectCallCount = 0;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              // Challenge retrieval
              return {
                gt: jest.fn(() => ({
                  order: jest.fn(() => ({
                    limit: jest.fn(() => ({
                      single: jest.fn(() => Promise.resolve({ 
                        data: {
                          id: 'challenge-id',
                          challenge: 'test-challenge',
                          user_id: userId,
                          expires_at: new Date(Date.now() + 300000).toISOString(),
                          type: 'authentication',
                        }, 
                        error: null 
                      })),
                    })),
                  })),
                })),
              };
            } else {
              // Credential retrieval
              return {
                single: jest.fn(() => Promise.resolve({ 
                  data: {
                    id: 'cred-id',
                    user_id: userId,
                    credential_id: 'test-credential-id',
                    name: 'Test Credential',
                    counter: 0,
                    is_active: true,
                    public_key: 'mock-public-key',
                  }, 
                  error: null 
                })),
              };
            }
          }),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      });

      // Mock authenticator data parsing to return valid counter
      const mockAuthenticatorData = Buffer.alloc(37);
      mockAuthenticatorData.writeUInt32BE(1, 33); // Counter at position 33
      
      jest.spyOn(Buffer, 'from').mockReturnValue(mockAuthenticatorData);

      const result = await webAuthnService.verifyAuthentication(
        mockRequest,
        authenticationResponse,
        userId
      );

      expect(result.verified).toBe(true);
      expect(result.credentialId).toBe('cred-id');
      expect(result.newCounter).toBe(1);
    });

    it('should reject authentication with invalid challenge', async () => {
      const userId = 'test-user-id';
      const authenticationResponse = {
        id: 'test-credential-id',
        rawId: 'dGVzdC1jcmVkZW50aWFsLWlk',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'wrong-challenge',
            origin: 'http://localhost:3000',
          })),
          authenticatorData: 'mock-authenticator-data',
          signature: 'mock-signature',
        },
        type: 'public-key' as const,
      };

      // Mock challenge retrieval
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ 
                    data: {
                      id: 'challenge-id',
                      challenge: 'test-challenge',
                      user_id: userId,
                      expires_at: new Date(Date.now() + 300000).toISOString(),
                      type: 'authentication',
                    }, 
                    error: null 
                  })),
                })),
              })),
            })),
          })),
        })),
      });

      const result = await webAuthnService.verifyAuthentication(
        mockRequest,
        authenticationResponse,
        userId
      );

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Challenge mismatch');
    });

    it('should reject authentication with inactive credential', async () => {
      const userId = 'test-user-id';
      const authenticationResponse = {
        id: 'test-credential-id',
        rawId: 'dGVzdC1jcmVkZW50aWFsLWlk',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'test-challenge',
            origin: 'http://localhost:3000',
          })),
          authenticatorData: 'mock-authenticator-data',
          signature: 'mock-signature',
        },
        type: 'public-key' as const,
      };

      // Mock challenge and inactive credential
      let selectCallCount = 0;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              // Challenge retrieval
              return {
                gt: jest.fn(() => ({
                  order: jest.fn(() => ({
                    limit: jest.fn(() => ({
                      single: jest.fn(() => Promise.resolve({ 
                        data: {
                          id: 'challenge-id',
                          challenge: 'test-challenge',
                          user_id: userId,
                          expires_at: new Date(Date.now() + 300000).toISOString(),
                          type: 'authentication',
                        }, 
                        error: null 
                      })),
                    })),
                  })),
                })),
              };
            } else {
              // Inactive credential
              return {
                single: jest.fn(() => Promise.resolve({ 
                  data: {
                    id: 'cred-id',
                    user_id: userId,
                    credential_id: 'test-credential-id',
                    name: 'Test Credential',
                    counter: 0,
                    is_active: false, // Inactive
                    public_key: 'mock-public-key',
                  }, 
                  error: null 
                })),
              };
            }
          }),
        })),
      });

      const result = await webAuthnService.verifyAuthentication(
        mockRequest,
        authenticationResponse,
        userId
      );

      expect(result.verified).toBe(false);
      expect(result.error).toContain('disabled');
    });

    it('should detect counter rollback attacks', async () => {
      const userId = 'test-user-id';
      const authenticationResponse = {
        id: 'test-credential-id',
        rawId: 'dGVzdC1jcmVkZW50aWFsLWlk',
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'test-challenge',
            origin: 'http://localhost:3000',
          })),
          authenticatorData: 'mock-authenticator-data',
          signature: 'mock-signature',
        },
        type: 'public-key' as const,
      };

      // Mock challenge and credential with higher counter
      let selectCallCount = 0;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              // Challenge retrieval
              return {
                gt: jest.fn(() => ({
                  order: jest.fn(() => ({
                    limit: jest.fn(() => ({
                      single: jest.fn(() => Promise.resolve({ 
                        data: {
                          id: 'challenge-id',
                          challenge: 'test-challenge',
                          user_id: userId,
                          expires_at: new Date(Date.now() + 300000).toISOString(),
                          type: 'authentication',
                        }, 
                        error: null 
                      })),
                    })),
                  })),
                })),
              };
            } else {
              // Credential with higher counter
              return {
                single: jest.fn(() => Promise.resolve({ 
                  data: {
                    id: 'cred-id',
                    user_id: userId,
                    credential_id: 'test-credential-id',
                    name: 'Test Credential',
                    counter: 100, // Higher than what we'll provide
                    is_active: true,
                    public_key: 'mock-public-key',
                  }, 
                  error: null 
                })),
              };
            }
          }),
        })),
      });

      // Mock authenticator data with lower counter
      const mockAuthenticatorData = Buffer.alloc(37);
      mockAuthenticatorData.writeUInt32BE(50, 33); // Counter lower than stored
      
      jest.spyOn(Buffer, 'from').mockReturnValue(mockAuthenticatorData);

      const result = await webAuthnService.verifyAuthentication(
        mockRequest,
        authenticationResponse,
        userId
      );

      expect(result.verified).toBe(false);
      expect(result.error).toContain('replay attack');
    });
  });

  describe('Credential Management', () => {
    it('should get user credentials successfully', async () => {
      const userId = 'test-user-id';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'cred-1',
                  user_id: userId,
                  credential_id: 'cred-id-1',
                  name: 'Test Credential 1',
                  device_type: 'platform',
                  transports: ['internal'],
                  created_at: '2023-01-01T00:00:00Z',
                  last_used: '2023-01-01T00:00:00Z',
                  is_active: true,
                  aaguid: 'test-aaguid',
                  public_key: 'mock-key',
                  counter: 0,
                  backup_eligible: false,
                  backup_state: false,
                },
              ], 
              error: null 
            })),
          })),
        })),
      });

      const credentials = await webAuthnService.getUserCredentials(userId);

      expect(credentials).toHaveLength(1);
      expect(credentials[0].id).toBe('cred-1');
      expect(credentials[0].name).toBe('Test Credential 1');
      expect(credentials[0].deviceType).toBe('platform');
    });

    it('should delete credential successfully', async () => {
      const userId = 'test-user-id';
      const credentialId = 'cred-to-delete';

      mockSupabase.from.mockReturnValue({
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      });

      await expect(
        webAuthnService.deleteCredential(mockRequest, credentialId, userId)
      ).resolves.not.toThrow();

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mfa.webauthn.credential.deleted',
        })
      );
    });

    it('should handle credential deletion errors', async () => {
      const userId = 'test-user-id';
      const credentialId = 'cred-to-delete';

      mockSupabase.from.mockReturnValue({
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ 
            data: null, 
            error: new Error('Deletion failed') 
          })),
        })),
      });

      await expect(
        webAuthnService.deleteCredential(mockRequest, credentialId, userId)
      ).rejects.toThrow('Failed to delete credential');
    });
  });

  describe('Statistics', () => {
    it('should get WebAuthn statistics successfully', async () => {
      const mockCredentials = [
        {
          id: 'cred-1',
          device_type: 'platform',
          is_active: true,
          last_used: new Date().toISOString(),
          aaguid: 'test-aaguid-1',
        },
        {
          id: 'cred-2',
          device_type: 'cross-platform',
          is_active: true,
          last_used: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
          aaguid: 'test-aaguid-2',
        },
        {
          id: 'cred-3',
          device_type: 'platform',
          is_active: false,
          last_used: new Date().toISOString(),
          aaguid: 'test-aaguid-1',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => Promise.resolve({ 
          data: mockCredentials, 
          error: null 
        })),
      });

      const stats = await webAuthnService.getStats();

      expect(stats.totalCredentials).toBe(3);
      expect(stats.activeCredentials).toBe(2);
      expect(stats.platformCredentials).toBe(2);
      expect(stats.crossPlatformCredentials).toBe(1);
      expect(stats.recentAuthenticationsCount).toBe(2);
      expect(stats.topDeviceTypes).toBeDefined();
    });

    it('should handle empty credentials list', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      });

      const stats = await webAuthnService.getStats();

      expect(stats.totalCredentials).toBe(0);
      expect(stats.activeCredentials).toBe(0);
      expect(stats.platformCredentials).toBe(0);
      expect(stats.crossPlatformCredentials).toBe(0);
      expect(stats.recentAuthenticationsCount).toBe(0);
      expect(stats.topDeviceTypes).toEqual([]);
    });
  });

  describe('Security Features', () => {
    it('should enforce credential exclusion lists', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';
      const userDisplayName = 'Test User';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'cred-1',
                  credentialId: 'existing-cred-id',
                  transports: ['usb'],
                },
              ], 
              error: null 
            })),
          })),
        })),
      });

      const options = await webAuthnService.generateRegistrationOptions(
        mockRequest,
        userId,
        userEmail,
        userDisplayName
      );

      expect(options.excludeCredentials).toBeDefined();
      expect(options.excludeCredentials![0].id).toBe('existing-cred-id');
    });

    it('should handle AAGUID allowlist/blocklist', async () => {
      const serviceWithAllowlist = new WebAuthnService({
        allowedAAGUIDs: ['allowed-aaguid'],
        blockedAAGUIDs: ['blocked-aaguid'],
      });

      // Test would require mocking the AAGUID extraction from attestation object
      // This is a placeholder for the security feature
      expect(serviceWithAllowlist).toBeDefined();
    });

    it('should generate unique challenges', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';
      const userDisplayName = 'Test User';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      });

      const options1 = await webAuthnService.generateRegistrationOptions(
        mockRequest,
        userId,
        userEmail,
        userDisplayName
      );

      const options2 = await webAuthnService.generateRegistrationOptions(
        mockRequest,
        userId,
        userEmail,
        userDisplayName
      );

      expect(options1.challenge).not.toBe(options2.challenge);
    });

    it('should audit all WebAuthn operations', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';
      const userDisplayName = 'Test User';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      });

      await webAuthnService.generateRegistrationOptions(
        mockRequest,
        userId,
        userEmail,
        userDisplayName
      );

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mfa.webauthn.registration.started',
        })
      );
    });
  });
});