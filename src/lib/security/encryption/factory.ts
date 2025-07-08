import { EncryptionService, EncryptionProvider } from './service';
import { VaultProvider } from './providers/vault';
import { LocalProvider } from './providers/local';

export interface EncryptionConfig {
  provider: 'aws-kms' | 'vault' | 'local';
  aws?: {
    keyId: string;
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  vault?: {
    endpoint: string;
    token: string;
    namespace?: string;
    keyName: string;
  };
  local?: {
    keyStorePath: string;
    masterKeyPath?: string;
    rotationIntervalDays?: number;
  };
}

/**
 * Factory for creating encryption service with appropriate provider
 */
export class EncryptionFactory {
  private static instance: EncryptionService | null = null;

  /**
   * Create or get singleton encryption service
   */
  static async create(config?: EncryptionConfig): Promise<EncryptionService> {
    if (this.instance) {
      return this.instance;
    }

    const finalConfig = config || this.getConfigFromEnvironment();
    const provider = await this.createProvider(finalConfig);
    
    this.instance = new EncryptionService(provider);
    return this.instance;
  }

  /**
   * Create encryption provider based on configuration
   */
  private static async createProvider(config: EncryptionConfig): Promise<EncryptionProvider> {
    switch (config.provider) {
      case 'aws-kms':
        if (!config.aws) {
          throw new Error('AWS KMS configuration required');
        }
        // For now, use local provider when AWS KMS is selected but SDK not available
        console.warn('AWS KMS selected but SDK not available. Using local provider as fallback.');
        return new LocalProvider({
          keyStorePath: config.local?.keyStorePath || '/tmp/keys',
          masterKeyPath: config.local?.masterKeyPath,
          rotationIntervalDays: config.local?.rotationIntervalDays || 90
        });

      case 'vault':
        if (!config.vault) {
          throw new Error('Vault configuration required');
        }
        return new VaultProvider(config.vault);

      case 'local':
        return new LocalProvider({
          keyStorePath: config.local?.keyStorePath || '/tmp/keys',
          masterKeyPath: config.local?.masterKeyPath,
          rotationIntervalDays: config.local?.rotationIntervalDays || 90
        });

      default:
        throw new Error(`Unknown encryption provider: ${config.provider}`);
    }
  }

  /**
   * Get configuration from environment variables
   */
  private static getConfigFromEnvironment(): EncryptionConfig {
    const provider = process.env.ENCRYPTION_PROVIDER || 'local';

    switch (provider) {
      case 'aws-kms':
        return {
          provider: 'aws-kms',
          aws: {
            keyId: process.env.AWS_KMS_KEY_ID!,
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
          }
        };

      case 'vault':
        return {
          provider: 'vault',
          vault: {
            endpoint: process.env.VAULT_ENDPOINT || 'http://localhost:8200',
            token: process.env.VAULT_TOKEN!,
            namespace: process.env.VAULT_NAMESPACE,
            keyName: process.env.VAULT_KEY_NAME || 'blipee-mfa'
          }
        };

      default:
        return {
          provider: 'local',
          local: {
            keyStorePath: process.env.KEY_STORE_PATH || './.keys',
            masterKeyPath: process.env.MASTER_KEY_PATH,
            rotationIntervalDays: parseInt(process.env.KEY_ROTATION_DAYS || '90')
          }
        };
    }
  }

  /**
   * Clear cached instance (useful for testing)
   */
  static clearInstance(): void {
    if (this.instance) {
      this.instance.clearCache();
      this.instance = null;
    }
  }
}

/**
 * Convenience function to get encryption service instance
 */
export async function getEncryptionService(): Promise<EncryptionService> {
  return EncryptionFactory.create();
}