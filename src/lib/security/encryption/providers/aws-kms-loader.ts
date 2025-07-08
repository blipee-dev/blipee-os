// Wrapper to conditionally load AWS KMS provider
// This prevents build errors when AWS SDK is not installed

import { EncryptionProvider } from '../service';
import { LocalProvider } from './local';

export async function loadAWSKMSProvider() {
  console.warn('AWS KMS provider not available. Install @aws-sdk/client-kms to use AWS KMS encryption. Using local provider as fallback.');
  // Return local provider as fallback for now
  return LocalProvider;
}