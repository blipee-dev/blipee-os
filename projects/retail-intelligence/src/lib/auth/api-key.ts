import { telegramBotService } from '@/lib/integrations/telegram-bot-service';

/**
 * Validate API key
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  return telegramBotService.validateApiKey(apiKey);
}

/**
 * Generate new API key
 */
export async function generateApiKey(name: string, permissions: any = {}) {
  return telegramBotService.generateApiKey(name, permissions);
}