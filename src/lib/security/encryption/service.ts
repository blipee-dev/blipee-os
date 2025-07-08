import crypto from 'crypto';

/**
 * Enterprise-grade encryption service with support for multiple providers
 * Supports AWS KMS, HashiCorp Vault, and local HSM
 */
export interface EncryptionProvider {
  encrypt(plaintext: string, context?: Record<string, string>): Promise<string>;
  decrypt(ciphertext: string, context?: Record<string, string>): Promise<string>;
  generateDataKey(): Promise<{ plaintext: Buffer; ciphertext: string }>;
  rotateKey(keyId: string): Promise<string>;
}

export class EncryptionService {
  private provider: EncryptionProvider;
  private cache: Map<string, { key: Buffer; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(provider: EncryptionProvider) {
    this.provider = provider;
    
    // Clean up expired cache entries every minute
    setInterval(() => this.cleanupCache(), 60 * 1000);
  }

  /**
   * Encrypt sensitive data with envelope encryption
   */
  async encrypt(
    plaintext: string, 
    context?: Record<string, string>
  ): Promise<{
    ciphertext: string;
    encryptedDataKey: string;
    algorithm: string;
    context?: Record<string, string>;
  }> {
    try {
      // Generate a data encryption key
      const { plaintext: dataKey, ciphertext: encryptedDataKey } = 
        await this.provider.generateDataKey();

      // Use the data key to encrypt the actual data
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted]);
      
      // Clear the data key from memory
      dataKey.fill(0);

      return {
        ciphertext: combined.toString('base64'),
        encryptedDataKey,
        algorithm: 'AES-256-GCM',
        context
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data encrypted with envelope encryption
   */
  async decrypt(
    encryptedData: {
      ciphertext: string;
      encryptedDataKey: string;
      algorithm: string;
      context?: Record<string, string>;
    }
  ): Promise<string> {
    try {
      // Decrypt the data key
      const dataKey = await this.decryptDataKey(
        encryptedData.encryptedDataKey,
        encryptedData.context
      );

      // Parse the combined data
      const combined = Buffer.from(encryptedData.ciphertext, 'base64');
      const iv = combined.slice(0, 16);
      const authTag = combined.slice(16, 32);
      const encrypted = combined.slice(32);

      // Decrypt the data
      const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // Clear the data key from memory
      dataKey.fill(0);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a data key with caching for performance
   */
  private async decryptDataKey(
    encryptedDataKey: string, 
    context?: Record<string, string>
  ): Promise<Buffer> {
    const cacheKey = this.getCacheKey(encryptedDataKey, context);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return Buffer.from(cached.key);
    }

    // Decrypt the data key
    const plaintextKey = await this.provider.decrypt(encryptedDataKey, context);
    const keyBuffer = Buffer.from(plaintextKey, 'base64');

    // Cache the decrypted key
    this.cache.set(cacheKey, {
      key: Buffer.from(keyBuffer),
      expiry: Date.now() + this.CACHE_TTL
    });

    return keyBuffer;
  }

  /**
   * Generate cache key for data key caching
   */
  private getCacheKey(
    encryptedDataKey: string, 
    context?: Record<string, string>
  ): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return crypto
      .createHash('sha256')
      .update(encryptedDataKey + contextStr)
      .digest('hex');
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry <= now) {
        value.key.fill(0); // Clear key from memory
        this.cache.delete(key);
      }
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(keyIds: string[]): Promise<Map<string, string>> {
    const rotationResults = new Map<string, string>();
    
    for (const keyId of keyIds) {
      try {
        const newKeyId = await this.provider.rotateKey(keyId);
        rotationResults.set(keyId, newKeyId);
      } catch (error) {
        console.error(`Failed to rotate key ${keyId}:`, error);
        rotationResults.set(keyId, 'FAILED');
      }
    }
    
    return rotationResults;
  }

  /**
   * Clear all cached keys
   */
  clearCache(): void {
    for (const [, value] of this.cache.entries()) {
      value.key.fill(0);
    }
    this.cache.clear();
  }
}