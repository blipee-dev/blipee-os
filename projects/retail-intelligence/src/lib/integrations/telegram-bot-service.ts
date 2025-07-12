/**
 * Telegram Bot Integration Service
 * Provides API endpoints for the existing Python Telegram bot
 */

import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// Request schemas for Telegram bot
const TelegramAuthSchema = z.object({
  telegram_user_id: z.string(),
  telegram_username: z.string().optional(),
  chat_id: z.string(),
});

const AnalyticsRequestSchema = z.object({
  loja: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  metric_type: z.enum(['sales', 'traffic', 'conversion', 'all']).optional(),
});

export class TelegramBotService {
  /**
   * Authenticate Telegram user and create/update mapping
   */
  async authenticateTelegramUser(data: z.infer<typeof TelegramAuthSchema>) {
    const validated = TelegramAuthSchema.parse(data);

    try {
      // Check if user mapping exists
      const existingUser = await db.query(
        `SELECT * FROM retail.user_mappings WHERE telegram_user_id = $1`,
        [validated.telegram_user_id]
      );

      if (existingUser.rows.length === 0) {
        // Create new user mapping
        await db.query(
          `INSERT INTO retail.user_mappings (telegram_user_id, telegram_username, role)
           VALUES ($1, $2, $3)`,
          [validated.telegram_user_id, validated.telegram_username, 'viewer']
        );
      }

      // Update bot state
      await db.query(
        `INSERT INTO retail.telegram_bot_state (chat_id, user_id, state)
         VALUES ($1, $2, $3)
         ON CONFLICT (chat_id) 
         DO UPDATE SET user_id = $2, last_interaction = NOW()`,
        [validated.chat_id, validated.telegram_user_id, 'authenticated']
      );

      return {
        success: true,
        user_id: validated.telegram_user_id,
        role: existingUser.rows[0]?.role || 'viewer',
      };
    } catch (error) {
      logger.error('Telegram authentication error', { error });
      throw error;
    }
  }

  /**
   * Get analytics data for Telegram bot
   * Maintains compatibility with existing bot queries
   */
  async getAnalytics(userId: string, request: z.infer<typeof AnalyticsRequestSchema>) {
    const validated = AnalyticsRequestSchema.parse(request);

    try {
      // Check user permissions
      const userResult = await db.query(
        `SELECT role, permissions FROM retail.user_mappings WHERE telegram_user_id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      
      // Get analytics data (matching existing Python queries)
      const analyticsResult = await db.query(
        `SELECT * FROM retail.analytics_results 
         WHERE loja = $1 
         AND data_inicio >= $2::timestamp 
         AND data_fim <= $3::timestamp
         ORDER BY data_inicio DESC
         LIMIT 1`,
        [validated.loja, validated.start_date, validated.end_date]
      );

      if (analyticsResult.rows.length === 0) {
        return {
          success: false,
          message: 'No data available for the specified period',
        };
      }

      const data = analyticsResult.rows[0];

      // Format response for Telegram bot
      return {
        success: true,
        data: {
          loja: data.loja,
          periodo: {
            inicio: data.data_inicio,
            fim: data.data_fim,
          },
          vendas: {
            total_com_iva: data.total_vendas_com_iva,
            total_sem_iva: data.total_vendas_sem_iva,
            transacoes: data.transacoes_vendas,
            ticket_medio: data.ticket_medio_com_iva,
          },
          trafego: {
            visitantes: data.visitantes,
            total_passagens: data.total_passagens,
            entry_rate: data.entry_rate,
          },
          conversao: {
            taxa_conversao: data.taxa_conversao,
            tempo_medio_permanencia: data.tempo_medio_permanencia,
            unidades_por_transacao: data.unidades_por_transacao,
          },
          top_performers: {
            vendedores: data.top_vendedores,
            produtos: data.top_produtos,
          },
          regioes: {
            ocupacao: data.ocupacao_regioes,
            top_2: data.top_2_regioes_ocupadas,
            bottom_2: data.menos_2_regioes_ocupadas,
          },
          ultima_atualizacao: data.ultima_coleta,
        },
      };
    } catch (error) {
      logger.error('Error fetching analytics for Telegram', { error, userId });
      throw error;
    }
  }

  /**
   * Get real-time traffic data
   */
  async getRealTimeTraffic(userId: string, loja: string) {
    try {
      // Get latest people counting data
      const trafficResult = await db.query(
        `SELECT * FROM retail.people_counting_data 
         WHERE loja = $1 
         AND start_time >= NOW() - INTERVAL '1 hour'
         ORDER BY start_time DESC
         LIMIT 1`,
        [loja]
      );

      if (trafficResult.rows.length === 0) {
        return {
          success: false,
          message: 'No recent traffic data available',
        };
      }

      const latestData = trafficResult.rows[0];

      // Calculate current occupancy (similar to Python logic)
      const occupancyResult = await db.query(
        `SELECT 
          SUM(total_in) - COALESCE(SUM(line4_out), 0) as current_occupancy
         FROM retail.people_counting_data
         WHERE loja = $1
         AND start_time >= CURRENT_DATE`,
        [loja]
      );

      return {
        success: true,
        data: {
          loja,
          current_occupancy: occupancyResult.rows[0]?.current_occupancy || 0,
          last_update: latestData.start_time,
          last_hour: {
            entries: latestData.total_in,
            exits: latestData.line4_out,
          },
        },
      };
    } catch (error) {
      logger.error('Error fetching real-time traffic', { error, userId, loja });
      throw error;
    }
  }

  /**
   * Get available stores for user
   */
  async getUserStores(userId: string) {
    try {
      // For now, return all stores (you can add permission logic later)
      const storesResult = await db.query(
        `SELECT DISTINCT loja FROM retail.analytics_results 
         ORDER BY loja`
      );

      return {
        success: true,
        stores: storesResult.rows.map(row => ({
          name: row.loja,
          code: this.extractStoreCode(row.loja),
          is_active: true,
        })),
      };
    } catch (error) {
      logger.error('Error fetching user stores', { error, userId });
      throw error;
    }
  }

  /**
   * Update bot state (for conversation flow)
   */
  async updateBotState(chatId: string, state: string, context?: any) {
    try {
      await db.query(
        `UPDATE retail.telegram_bot_state 
         SET state = $1, context = $2, last_interaction = NOW()
         WHERE chat_id = $3`,
        [state, JSON.stringify(context || {}), chatId]
      );

      return { success: true };
    } catch (error) {
      logger.error('Error updating bot state', { error, chatId });
      throw error;
    }
  }

  /**
   * Get bot state
   */
  async getBotState(chatId: string) {
    try {
      const result = await db.query(
        `SELECT state, context, user_id FROM retail.telegram_bot_state 
         WHERE chat_id = $1`,
        [chatId]
      );

      if (result.rows.length === 0) {
        return {
          state: 'start',
          context: {},
          user_id: null,
        };
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching bot state', { error, chatId });
      throw error;
    }
  }

  /**
   * Generate API key for external integrations
   */
  async generateApiKey(name: string, permissions: any = {}) {
    const apiKey = this.generateSecureKey();
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    try {
      const result = await db.query(
        `INSERT INTO retail.api_keys (name, key_hash, permissions)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [name, keyHash, JSON.stringify(permissions)]
      );

      return {
        id: result.rows[0].id,
        key: apiKey, // Return only once, user must save it
        name,
      };
    } catch (error) {
      logger.error('Error generating API key', { error });
      throw error;
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    try {
      const result = await db.query(
        `UPDATE retail.api_keys 
         SET last_used = NOW()
         WHERE key_hash = $1 AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
         RETURNING id, permissions`,
        [keyHash]
      );

      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error validating API key', { error });
      return false;
    }
  }

  /**
   * Helper methods
   */
  private extractStoreCode(lojaName: string): string {
    // Extract store code from name (e.g., "OML01-Omnia GuimarãesShopping" -> "OML01")
    const match = lojaName.match(/^([A-Z]{3}\d{2})/);
    return match ? match[1] : lojaName.substring(0, 5);
  }

  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
}

// Export singleton instance
export const telegramBotService = new TelegramBotService();