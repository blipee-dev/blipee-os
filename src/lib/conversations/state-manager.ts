/**
 * Conversation State Manager
 *
 * Manages temporary conversation state (wizard steps, form progress, filters, etc.)
 * Part of FASE 2 - Conversation Intelligence
 *
 * Features:
 * - Save/load conversation state
 * - Support for multiple state types (wizard, form, filter, etc.)
 * - Confidence scoring for state validity
 * - Automatic state expiration
 * - State history tracking
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type StateType =
  | 'wizard_step'
  | 'form_progress'
  | 'filter_state'
  | 'multi_step_task'
  | 'custom';

export interface ConversationState {
  id?: string;
  conversation_id: string;
  user_id: string;
  organization_id: string;
  state_type: StateType;
  state_value: Record<string, any>;
  confidence?: number;
  valid_until?: string;
  created_at?: string;
  updated_at?: string;
}

export class ConversationStateManager {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      // Use environment variables
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
  }

  /**
   * Get current state for a conversation and state type
   */
  async getState(
    conversationId: string,
    stateType: StateType
  ): Promise<ConversationState | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_state')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('state_type', stateType)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching conversation state:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getState:', error);
      return null;
    }
  }

  /**
   * Get all states for a conversation
   */
  async getAllStates(conversationId: string): Promise<ConversationState[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_state')
        .select('*')
        .eq('conversation_id', conversationId)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching all conversation states:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllStates:', error);
      return [];
    }
  }

  /**
   * Save or update conversation state
   */
  async setState(
    conversationId: string,
    userId: string,
    organizationId: string,
    stateType: StateType,
    stateValue: Record<string, any>,
    options?: {
      confidence?: number;
      validFor?: number; // milliseconds
    }
  ): Promise<ConversationState | null> {
    try {
      // Check if state already exists
      const existingState = await this.getState(conversationId, stateType);

      const validUntil = options?.validFor
        ? new Date(Date.now() + options.validFor).toISOString()
        : null;

      if (existingState) {
        // Update existing state
        const { data, error } = await this.supabase
          .from('conversation_state')
          .update({
            state_value: stateValue,
            confidence: options?.confidence ?? existingState.confidence,
            valid_until: validUntil,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingState.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating conversation state:', error);
          return null;
        }

        return data;
      } else {
        // Create new state
        const { data, error } = await this.supabase
          .from('conversation_state')
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            organization_id: organizationId,
            state_type: stateType,
            state_value: stateValue,
            confidence: options?.confidence ?? 1.0,
            valid_until: validUntil
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating conversation state:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in setState:', error);
      return null;
    }
  }

  /**
   * Delete a specific state
   */
  async deleteState(
    conversationId: string,
    stateType: StateType
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('conversation_state')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('state_type', stateType);

      if (error) {
        console.error('Error deleting conversation state:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteState:', error);
      return false;
    }
  }

  /**
   * Delete all states for a conversation
   */
  async deleteAllStates(conversationId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_state')
        .delete()
        .eq('conversation_id', conversationId)
        .select();

      if (error) {
        console.error('Error deleting all conversation states:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in deleteAllStates:', error);
      return 0;
    }
  }

  /**
   * Clear expired states (cleanup job)
   */
  async clearExpiredStates(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_state')
        .delete()
        .lt('valid_until', new Date().toISOString())
        .select();

      if (error) {
        console.error('Error clearing expired states:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in clearExpiredStates:', error);
      return 0;
    }
  }

  /**
   * Wizard state helpers
   */
  async getWizardState(conversationId: string) {
    const state = await this.getState(conversationId, 'wizard_step');
    return state?.state_value as {
      current_step: number;
      total_steps: number;
      step_name: string;
      collected_data?: Record<string, any>;
    } | null;
  }

  async setWizardState(
    conversationId: string,
    userId: string,
    organizationId: string,
    wizardState: {
      current_step: number;
      total_steps: number;
      step_name: string;
      collected_data?: Record<string, any>;
    }
  ) {
    return this.setState(
      conversationId,
      userId,
      organizationId,
      'wizard_step',
      wizardState,
      { validFor: 24 * 60 * 60 * 1000 } // 24 hours
    );
  }

  /**
   * Form progress helpers
   */
  async getFormProgress(conversationId: string) {
    const state = await this.getState(conversationId, 'form_progress');
    return state?.state_value as {
      form_id: string;
      fields_completed: string[];
      fields_remaining: string[];
      completion_percentage: number;
      form_data: Record<string, any>;
    } | null;
  }

  async setFormProgress(
    conversationId: string,
    userId: string,
    organizationId: string,
    formProgress: {
      form_id: string;
      fields_completed: string[];
      fields_remaining: string[];
      completion_percentage: number;
      form_data: Record<string, any>;
    }
  ) {
    return this.setState(
      conversationId,
      userId,
      organizationId,
      'form_progress',
      formProgress,
      { validFor: 48 * 60 * 60 * 1000 } // 48 hours
    );
  }

  /**
   * Filter state helpers
   */
  async getFilterState(conversationId: string) {
    const state = await this.getState(conversationId, 'filter_state');
    return state?.state_value as {
      filters: Record<string, any>;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      page?: number;
      page_size?: number;
    } | null;
  }

  async setFilterState(
    conversationId: string,
    userId: string,
    organizationId: string,
    filterState: {
      filters: Record<string, any>;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      page?: number;
      page_size?: number;
    }
  ) {
    return this.setState(
      conversationId,
      userId,
      organizationId,
      'filter_state',
      filterState,
      { validFor: 24 * 60 * 60 * 1000 } // 24 hours
    );
  }

  /**
   * Multi-step task helpers
   */
  async getMultiStepTask(conversationId: string) {
    const state = await this.getState(conversationId, 'multi_step_task');
    return state?.state_value as {
      task_id: string;
      task_name: string;
      current_step: number;
      total_steps: number;
      steps_completed: string[];
      steps_remaining: string[];
      task_data: Record<string, any>;
    } | null;
  }

  async setMultiStepTask(
    conversationId: string,
    userId: string,
    organizationId: string,
    taskState: {
      task_id: string;
      task_name: string;
      current_step: number;
      total_steps: number;
      steps_completed: string[];
      steps_remaining: string[];
      task_data: Record<string, any>;
    }
  ) {
    return this.setState(
      conversationId,
      userId,
      organizationId,
      'multi_step_task',
      taskState,
      { validFor: 72 * 60 * 60 * 1000 } // 72 hours
    );
  }

  /**
   * Get state summary for debugging/logging
   */
  getStateSummary(state: ConversationState | null): string {
    if (!state) return 'No state';

    const parts: string[] = [
      `Type: ${state.state_type}`,
      `Confidence: ${(state.confidence || 1.0).toFixed(2)}`,
    ];

    if (state.valid_until) {
      const expires = new Date(state.valid_until);
      const hoursUntilExpiry = (expires.getTime() - Date.now()) / (1000 * 60 * 60);
      parts.push(`Expires in: ${hoursUntilExpiry.toFixed(1)}h`);
    }

    return parts.join(', ');
  }
}

// Export singleton instance
export const stateManager = new ConversationStateManager();
