import { EncryptionProvider } from '../service';
import crypto from 'crypto';

interface VaultConfig {
  endpoint: string;
  token: string;
  namespace?: string;
  transitMount?: string;
  keyName: string;
}

/**
 * HashiCorp Vault encryption provider using Transit secrets engine
 */
export class VaultProvider implements EncryptionProvider {
  private config: VaultConfig;
  private headers: Record<string, string>;

  constructor(config: VaultConfig) {
    this.config = {
      ...config,
      transitMount: config.transitMount || 'transit'
    };
    
    this.headers = {
      'X-Vault-Token': this.config.token,
      'Content-Type': 'application/json'
    };
    
    if (this.config.namespace) {
      this.headers['X-Vault-Namespace'] = this.config.namespace;
    }
  }

  async encrypt(plaintext: string, context?: Record<string, string>): Promise<string> {
    const endpoint = `${this.config.endpoint}/v1/${this.config.transitMount}/encrypt/${this.config.keyName}`;
    
    const payload = {
      plaintext: Buffer.from(plaintext).toString('base64'),
      context: context ? Buffer.from(JSON.stringify(context)).toString('base64') : undefined
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Vault encryption failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.ciphertext;
    } catch (error) {
      throw new Error(`Vault encryption error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async decrypt(ciphertext: string, context?: Record<string, string>): Promise<string> {
    const endpoint = `${this.config.endpoint}/v1/${this.config.transitMount}/decrypt/${this.config.keyName}`;
    
    const payload = {
      ciphertext,
      context: context ? Buffer.from(JSON.stringify(context)).toString('base64') : undefined
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Vault decryption failed: ${response.statusText}`);
      }

      const data = await response.json();
      const plaintext = Buffer.from(data.data.plaintext, 'base64').toString('utf8');
      return plaintext;
    } catch (error) {
      throw new Error(`Vault decryption error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateDataKey(): Promise<{ plaintext: Buffer; ciphertext: string }> {
    // Generate a random data key
    const dataKey = crypto.randomBytes(32);
    
    // Encrypt it using Vault
    const encryptedKey = await this.encrypt(dataKey.toString('base64'));
    
    return {
      plaintext: dataKey,
      ciphertext: encryptedKey
    };
  }

  async rotateKey(keyName: string): Promise<string> {
    const endpoint = `${this.config.endpoint}/v1/${this.config.transitMount}/keys/${keyName}/rotate`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Vault key rotation failed: ${response.statusText}`);
      }

      // Get the new key version
      const configEndpoint = `${this.config.endpoint}/v1/${this.config.transitMount}/keys/${keyName}`;
      const configResponse = await fetch(configEndpoint, {
        headers: this.headers
      });

      const configData = await configResponse.json();
      const latestVersion = configData.data.latest_version;
      
      return `${keyName}-v${latestVersion}`;
    } catch (error) {
      throw new Error(`Vault key rotation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rewrap data encrypted with old key version to use latest version
   */
  async rewrap(ciphertext: string): Promise<string> {
    const endpoint = `${this.config.endpoint}/v1/${this.config.transitMount}/rewrap/${this.config.keyName}`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ ciphertext })
      });

      if (!response.ok) {
        throw new Error(`Vault rewrap failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.ciphertext;
    } catch (error) {
      throw new Error(`Vault rewrap error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Configure automatic key rotation
   */
  async configureAutoRotation(intervalDays: number): Promise<void> {
    const endpoint = `${this.config.endpoint}/v1/${this.config.transitMount}/keys/${this.config.keyName}/config`;
    
    const payload = {
      auto_rotate_period: `${intervalDays * 24}h`
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Vault auto-rotation configuration failed: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Vault auto-rotation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}