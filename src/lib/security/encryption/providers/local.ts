import { EncryptionProvider } from '../service';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

interface LocalProviderConfig {
  keyStorePath: string;
  masterKeyPath?: string;
  rotationIntervalDays?: number;
}

interface KeyMetadata {
  id: string;
  version: number;
  created: string;
  algorithm: string;
  status: 'active' | 'rotated' | 'disabled';
  rotatedFrom?: string;
}

/**
 * Local encryption provider with key rotation support
 * For development and on-premise deployments
 */
export class LocalProvider implements EncryptionProvider {
  private config: LocalProviderConfig;
  private masterKey: Buffer | null = null;
  private keyCache: Map<string, { key: Buffer; metadata: KeyMetadata }> = new Map();

  constructor(config: LocalProviderConfig) {
    this.config = config;
    this.initializeKeyStore();
  }

  private async initializeKeyStore() {
    try {
      // Ensure key store directory exists
      await fs.mkdir(this.config.keyStorePath, { recursive: true });
      
      // Load or generate master key
      if (this.config.masterKeyPath) {
        try {
          const masterKeyData = await fs.readFile(this.config.masterKeyPath);
          this.masterKey = Buffer.from(masterKeyData.toString(), 'base64');
        } catch (error) {
          // Generate new master key if not found
          this.masterKey = crypto.randomBytes(32);
          await fs.writeFile(
            this.config.masterKeyPath,
            this.masterKey.toString('base64'),
            { mode: 0o600 }
          );
        }
      } else {
        // Use environment variable or generate
        const envKey = process.env.MASTER_ENCRYPTION_KEY;
        this.masterKey = envKey 
          ? Buffer.from(envKey, 'base64')
          : crypto.randomBytes(32);
      }

      // Load existing keys
      await this.loadKeys();
      
      // Schedule key rotation checks
      if (this.config.rotationIntervalDays) {
        setInterval(
          () => this.checkKeyRotation(),
          24 * 60 * 60 * 1000 // Daily check
        );
      }
    } catch (error) {
      throw new Error(`Failed to initialize key store: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadKeys() {
    try {
      const files = await fs.readdir(this.config.keyStorePath);
      
      for (const file of files) {
        if (file.endsWith('.key')) {
          const keyPath = path.join(this.config.keyStorePath, file);
          const encryptedData = await fs.readFile(keyPath, 'utf8');
          const keyData = await this.decryptKeyFile(encryptedData);
          
          this.keyCache.set(keyData.metadata.id, keyData);
        }
      }
    } catch (error) {
      console.error('Failed to load keys:', error);
    }
  }

  private async decryptKeyFile(encryptedData: string): Promise<{ key: Buffer; metadata: KeyMetadata }> {
    if (!this.masterKey) throw new Error('Master key not initialized');
    
    const data = JSON.parse(encryptedData);
    const iv = Buffer.from(data.iv, 'base64');
    const authTag = Buffer.from(data.authTag, 'base64');
    const encrypted = Buffer.from(data.encrypted, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    const keyData = JSON.parse(decrypted.toString('utf8'));
    
    return {
      key: Buffer.from(keyData.key, 'base64'),
      metadata: keyData.metadata
    };
  }

  private async saveKey(key: Buffer, metadata: KeyMetadata) {
    if (!this.masterKey) throw new Error('Master key not initialized');
    
    const keyData = {
      key: key.toString('base64'),
      metadata
    };
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    let encrypted = cipher.update(JSON.stringify(keyData), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    const encryptedData = {
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encrypted: encrypted.toString('base64')
    };
    
    const keyPath = path.join(this.config.keyStorePath, `${metadata.id}.key`);
    await fs.writeFile(keyPath, JSON.stringify(encryptedData, null, 2), { mode: 0o600 });
    
    this.keyCache.set(metadata.id, { key, metadata });
  }

  async encrypt(plaintext: string, context?: Record<string, string>): Promise<string> {
    // Get or create active key
    const activeKey = await this.getActiveKey();
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', activeKey.key, iv);
    
    // Add context to AAD if provided
    if (context) {
      cipher.setAAD(Buffer.from(JSON.stringify(context)));
    }
    
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    // Package encrypted data with metadata
    const result = {
      v: 1, // Version
      kid: activeKey.metadata.id,
      iv: iv.toString('base64'),
      at: authTag.toString('base64'),
      ct: encrypted.toString('base64'),
      ctx: context
    };
    
    return Buffer.from(JSON.stringify(result)).toString('base64');
  }

  async decrypt(ciphertext: string, context?: Record<string, string>): Promise<string> {
    const data = JSON.parse(Buffer.from(ciphertext, 'base64').toString('utf8'));
    
    // Get the key used for encryption
    const keyData = this.keyCache.get(data.kid);
    if (!keyData) {
      throw new Error(`Key ${data.kid} not found`);
    }
    
    const iv = Buffer.from(data.iv, 'base64');
    const authTag = Buffer.from(data.at, 'base64');
    const encrypted = Buffer.from(data.ct, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyData.key, iv);
    decipher.setAuthTag(authTag);
    
    // Verify context matches if provided
    if (data.ctx || context) {
      if (JSON.stringify(data.ctx) !== JSON.stringify(context)) {
        throw new Error('Context mismatch');
      }
      decipher.setAAD(Buffer.from(JSON.stringify(context)));
    }
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  async generateDataKey(): Promise<{ plaintext: Buffer; ciphertext: string }> {
    const dataKey = crypto.randomBytes(32);
    const encrypted = await this.encrypt(dataKey.toString('base64'));
    
    return {
      plaintext: dataKey,
      ciphertext: encrypted
    };
  }

  async rotateKey(keyId: string): Promise<string> {
    const oldKey = this.keyCache.get(keyId);
    if (!oldKey) {
      throw new Error(`Key ${keyId} not found`);
    }
    
    // Generate new key
    const newKey = crypto.randomBytes(32);
    const newMetadata: KeyMetadata = {
      id: `${keyId}-v${oldKey.metadata.version + 1}`,
      version: oldKey.metadata.version + 1,
      created: new Date().toISOString(),
      algorithm: 'AES-256-GCM',
      status: 'active',
      rotatedFrom: keyId
    };
    
    // Save new key
    await this.saveKey(newKey, newMetadata);
    
    // Mark old key as rotated
    oldKey.metadata.status = 'rotated';
    await this.saveKey(oldKey.key, oldKey.metadata);
    
    return newMetadata.id;
  }

  private async getActiveKey(): Promise<{ key: Buffer; metadata: KeyMetadata }> {
    // Find active key
    const entries = Array.from(this.keyCache.entries());
    for (const [, keyData] of entries) {
      if (keyData.metadata.status === 'active') {
        return keyData;
      }
    }
    
    // Create new key if none found
    const key = crypto.randomBytes(32);
    const metadata: KeyMetadata = {
      id: `key-${Date.now()}`,
      version: 1,
      created: new Date().toISOString(),
      algorithm: 'AES-256-GCM',
      status: 'active'
    };
    
    await this.saveKey(key, metadata);
    return { key, metadata };
  }

  private async checkKeyRotation() {
    if (!this.config.rotationIntervalDays) return;
    
    const rotationThreshold = Date.now() - (this.config.rotationIntervalDays * 24 * 60 * 60 * 1000);
    
    const entries = Array.from(this.keyCache.entries());
    for (const [keyId, keyData] of entries) {
      if (keyData.metadata.status === 'active') {
        const created = new Date(keyData.metadata.created).getTime();
        if (created < rotationThreshold) {
          await this.rotateKey(keyId);
        }
      }
    }
  }

  /**
   * Export keys for backup (encrypted)
   */
  async exportKeys(password: string): Promise<string> {
    const keys: any[] = [];
    
    const entries = Array.from(this.keyCache.entries());
    for (const [, keyData] of entries) {
      keys.push({
        key: keyData.key.toString('base64'),
        metadata: keyData.metadata
      });
    }
    
    // Derive key from password
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    // Encrypt keys
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(keys), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      version: 1,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      data: encrypted.toString('base64')
    });
  }
}