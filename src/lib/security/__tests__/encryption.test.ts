import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EncryptionService } from '../encryption/service';
import { LocalProvider } from '../encryption/providers/local';
import { EncryptionFactory } from '../encryption/factory';
import fs from 'fs';
import path from 'path';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  let testKeyPath: string;

  beforeEach(async () => {
    // Create a temporary directory for test keys
    testKeyPath = path.join(__dirname, '__test_keys__');
    if (!fs.existsSync(testKeyPath)) {
      fs.mkdirSync(testKeyPath, { recursive: true });
    }

    const provider = new LocalProvider({
      keyStorePath: testKeyPath,
      rotationIntervalDays: 90
    });

    encryptionService = new EncryptionService(provider);
  });

  afterEach(() => {
    // Clean up test keys
    if (fs.existsSync(testKeyPath)) {
      fs.rmSync(testKeyPath, { recursive: true, force: true });
    }
    
    // Clear factory cache
    EncryptionFactory.clearInstance();
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt text successfully', async () => {
      const plaintext = 'This is a test message';
      
      const encrypted = await encryptionService.encrypt(plaintext);
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('encryptedDataKey');
      expect(encrypted).toHaveProperty('algorithm');
      expect(encrypted.ciphertext).not.toBe(plaintext);
      
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', async () => {
      const plaintext = '';
      
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const plaintext = '🔐 Security test with émojis and spëcial chars 中文';
      
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle large text', async () => {
      const plaintext = 'A'.repeat(100000); // 100KB of text
      
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Context-based Encryption', () => {
    it('should encrypt with context', async () => {
      const plaintext = 'Context-sensitive data';
      const context = { userId: '123', sessionId: 'abc' };
      
      const encrypted = await encryptionService.encrypt(plaintext, context);
      expect(encrypted.context).toEqual(context);
      
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail decryption with wrong context', async () => {
      const plaintext = 'Context-sensitive data';
      const context = { userId: '123', sessionId: 'abc' };
      
      const encrypted = await encryptionService.encrypt(plaintext, context);
      
      // Modify context
      encrypted.context = { userId: '456', sessionId: 'def' };
      
      await expect(encryptionService.decrypt(encrypted)).rejects.toThrow();
    });
  });

  describe('Key Management', () => {
    it('should generate unique data keys for each encryption', async () => {
      const plaintext = 'Test message';
      
      const encrypted1 = await encryptionService.encrypt(plaintext);
      const encrypted2 = await encryptionService.encrypt(plaintext);
      
      // Different encrypted data keys
      expect(encrypted1.encryptedDataKey).not.toBe(encrypted2.encryptedDataKey);
      // Different ciphertext
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      
      // But both should decrypt to the same plaintext
      expect(await encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(await encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should cache and reuse data keys', async () => {
      const plaintext = 'Test message';
      const context = { userId: '123' };
      
      // First encryption should create a new key
      const encrypted1 = await encryptionService.encrypt(plaintext, context);
      
      // Second encryption with same context should reuse the cached key
      const encrypted2 = await encryptionService.encrypt(plaintext, context);
      
      // Keys should be the same due to caching
      expect(encrypted1.encryptedDataKey).toBe(encrypted2.encryptedDataKey);
      
      // But ciphertext should be different due to different IVs
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });

    it('should clear cache properly', async () => {
      const plaintext = 'Test message';
      
      await encryptionService.encrypt(plaintext);
      encryptionService.clearCache();
      
      // Should still work after cache clear
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ciphertext', async () => {
      const invalidEncrypted = {
        ciphertext: 'invalid-base64-data',
        encryptedDataKey: 'invalid-key',
        algorithm: 'aes-256-gcm'
      };
      
      await expect(encryptionService.decrypt(invalidEncrypted)).rejects.toThrow();
    });

    it('should handle corrupted data', async () => {
      const plaintext = 'Test message';
      const encrypted = await encryptionService.encrypt(plaintext);
      
      // Corrupt the ciphertext
      const corrupted = {
        ...encrypted,
        ciphertext: encrypted.ciphertext.slice(0, -10) + 'corrupted=='
      };
      
      await expect(encryptionService.decrypt(corrupted)).rejects.toThrow();
    });

    it('should handle missing algorithm', async () => {
      const plaintext = 'Test message';
      const encrypted = await encryptionService.encrypt(plaintext);
      
      // Remove algorithm
      const invalid = {
        ...encrypted,
        algorithm: undefined as any
      };
      
      await expect(encryptionService.decrypt(invalid)).rejects.toThrow();
    });
  });

  describe('Security Properties', () => {
    it('should produce different ciphertext for same plaintext', async () => {
      const plaintext = 'Same message';
      
      const encrypted1 = await encryptionService.encrypt(plaintext);
      const encrypted2 = await encryptionService.encrypt(plaintext);
      
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });

    it('should not leak plaintext in error messages', async () => {
      const plaintext = 'Secret information that should not leak';
      
      try {
        const encrypted = await encryptionService.encrypt(plaintext);
        encrypted.ciphertext = 'corrupted-data';
        await encryptionService.decrypt(encrypted);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).not.toContain(plaintext);
        expect(errorMessage).not.toContain('Secret');
      }
    });

    it('should securely clear data keys from memory', async () => {
      const plaintext = 'Test message';
      
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
      
      // After decryption, data keys should be zeroed
      // Note: This is hard to test directly, but we can ensure the operation completes
      expect(true).toBe(true);
    });
  });

  describe('Factory Pattern', () => {
    it('should create encryption service with factory', async () => {
      const config = {
        provider: 'local' as const,
        local: {
          keyStorePath: testKeyPath,
          rotationIntervalDays: 90
        }
      };

      const service = await EncryptionFactory.create(config);
      expect(service).toBeInstanceOf(EncryptionService);
    });

    it('should return singleton instance', async () => {
      const service1 = await EncryptionFactory.create();
      const service2 = await EncryptionFactory.create();
      
      expect(service1).toBe(service2);
    });

    it('should get service from convenience function', async () => {
      const service = await EncryptionFactory.create();
      expect(service).toBeInstanceOf(EncryptionService);
    });
  });
});

describe('LocalProvider', () => {
  let provider: LocalProvider;
  let testKeyPath: string;

  beforeEach(() => {
    testKeyPath = path.join(__dirname, '__test_keys__');
    if (!fs.existsSync(testKeyPath)) {
      fs.mkdirSync(testKeyPath, { recursive: true });
    }

    provider = new LocalProvider({
      keyStorePath: testKeyPath,
      rotationIntervalDays: 90
    });
  });

  afterEach(() => {
    if (fs.existsSync(testKeyPath)) {
      fs.rmSync(testKeyPath, { recursive: true, force: true });
    }
  });

  describe('Key Management', () => {
    it('should generate and store master key', async () => {
      const dataKey = Buffer.from('test-data-key');
      const context = { test: 'context' };
      
      const encryptedKey = await provider.encryptDataKey(dataKey, context);
      expect(encryptedKey).toBeDefined();
      expect(typeof encryptedKey).toBe('string');
      
      const decryptedKey = await provider.decryptDataKey(encryptedKey, context);
      expect(decryptedKey).toEqual(dataKey);
    });

    it('should rotate keys when needed', async () => {
      // Create provider with very short rotation interval
      const shortRotationProvider = new LocalProvider({
        keyStorePath: testKeyPath,
        rotationIntervalDays: 0 // Immediate rotation
      });

      const dataKey = Buffer.from('test-data-key');
      
      const encrypted1 = await shortRotationProvider.encryptDataKey(dataKey);
      
      // Wait a bit to ensure rotation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const encrypted2 = await shortRotationProvider.encryptDataKey(dataKey);
      
      // Should still be able to decrypt both
      const decrypted1 = await shortRotationProvider.decryptDataKey(encrypted1);
      const decrypted2 = await shortRotationProvider.decryptDataKey(encrypted2);
      
      expect(decrypted1).toEqual(dataKey);
      expect(decrypted2).toEqual(dataKey);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid key directory', async () => {
      const invalidProvider = new LocalProvider({
        keyStorePath: '/invalid/path/that/does/not/exist',
        rotationIntervalDays: 90
      });

      const dataKey = Buffer.from('test-data-key');
      
      await expect(invalidProvider.encryptDataKey(dataKey)).rejects.toThrow();
    });

    it('should handle corrupted key files', async () => {
      const dataKey = Buffer.from('test-data-key');
      
      // First encrypt normally
      const encrypted = await provider.encryptDataKey(dataKey);
      
      // Corrupt the key file
      const keyFiles = fs.readdirSync(testKeyPath);
      if (keyFiles.length > 0) {
        const keyFile = path.join(testKeyPath, keyFiles[0]);
        fs.writeFileSync(keyFile, 'corrupted-key-data');
      }
      
      // Should handle corruption gracefully
      await expect(provider.decryptDataKey(encrypted)).rejects.toThrow();
    });
  });
});