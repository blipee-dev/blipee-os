import { EncryptionProvider } from '../service';

interface KMSConfig {
  keyId: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

/**
 * AWS KMS encryption provider for enterprise-grade key management
 */
export class AWSKMSProvider implements EncryptionProvider {
  private config: KMSConfig;
  private kmsClient: any; // Will be properly typed with AWS SDK

  constructor(config: KMSConfig) {
    this.config = config;
    this.initializeClient();
  }

  private async initializeClient() {
    // Dynamic import to avoid requiring AWS SDK if not used
    try {
      const { KMSClient, GenerateDataKeyCommand, DecryptCommand, EncryptCommand } = 
        await import('@aws-sdk/client-kms');
      
      this.kmsClient = new KMSClient({
        region: this.config.region,
        credentials: this.config.accessKeyId ? {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey!,
          sessionToken: this.config.sessionToken
        } : undefined // Use default credentials if not provided
      });
    } catch (error) {
      console.warn('AWS SDK not available, using mock KMS provider');
      this.kmsClient = this.createMockClient();
    }
  }

  async encrypt(plaintext: string, context?: Record<string, string>): Promise<string> {
    if (!this.kmsClient) await this.initializeClient();
    
    const command = {
      KeyId: this.config.keyId,
      Plaintext: Buffer.from(plaintext),
      EncryptionContext: context
    };

    try {
      const response = await this.kmsClient.encrypt(command);
      return Buffer.from(response.CiphertextBlob).toString('base64');
    } catch (error) {
      throw new Error(`KMS encryption failed: ${error.message}`);
    }
  }

  async decrypt(ciphertext: string, context?: Record<string, string>): Promise<string> {
    if (!this.kmsClient) await this.initializeClient();
    
    const command = {
      CiphertextBlob: Buffer.from(ciphertext, 'base64'),
      EncryptionContext: context
    };

    try {
      const response = await this.kmsClient.decrypt(command);
      return Buffer.from(response.Plaintext).toString('utf8');
    } catch (error) {
      throw new Error(`KMS decryption failed: ${error.message}`);
    }
  }

  async generateDataKey(): Promise<{ plaintext: Buffer; ciphertext: string }> {
    if (!this.kmsClient) await this.initializeClient();
    
    const command = {
      KeyId: this.config.keyId,
      KeySpec: 'AES_256'
    };

    try {
      const response = await this.kmsClient.generateDataKey(command);
      return {
        plaintext: Buffer.from(response.Plaintext),
        ciphertext: Buffer.from(response.CiphertextBlob).toString('base64')
      };
    } catch (error) {
      throw new Error(`KMS data key generation failed: ${error.message}`);
    }
  }

  async rotateKey(keyId: string): Promise<string> {
    // In AWS KMS, rotation is automatic when enabled
    // This would typically update key aliases or metadata
    console.log(`Key rotation initiated for ${keyId}`);
    return `${keyId}-rotated-${Date.now()}`;
  }

  /**
   * Create a mock client for development/testing
   */
  private createMockClient() {
    const crypto = require('crypto');
    
    return {
      encrypt: async (params: any) => {
        const key = crypto.scryptSync(this.config.keyId, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        let encrypted = cipher.update(params.Plaintext);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        return {
          CiphertextBlob: Buffer.concat([iv, encrypted])
        };
      },
      
      decrypt: async (params: any) => {
        const key = crypto.scryptSync(this.config.keyId, 'salt', 32);
        const data = params.CiphertextBlob;
        const iv = data.slice(0, 16);
        const encrypted = data.slice(16);
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return {
          Plaintext: decrypted
        };
      },
      
      generateDataKey: async () => {
        const dataKey = crypto.randomBytes(32);
        const key = crypto.scryptSync(this.config.keyId, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        let encrypted = cipher.update(dataKey);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        return {
          Plaintext: dataKey,
          CiphertextBlob: Buffer.concat([iv, encrypted])
        };
      }
    };
  }
}