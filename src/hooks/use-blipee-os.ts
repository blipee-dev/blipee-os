import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  components?: any[];
  actions?: string[];
  timestamp: Date;
  metadata?: {
    agent?: string;
    executionTime?: number;
  };
}

export interface AgentStatus {
  agentId: string;
  name: string;
  status: 'active' | 'paused' | 'error' | 'inactive';
  lastRun?: Date;
  nextRun?: Date;
}

export interface BlipeeOSState {
  messages: Message[];
  agents: AgentStatus[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBlipeeOS() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [state, setState] = useState<BlipeeOSState>({
    messages: [],
    agents: [],
    isConnected: false,
    isLoading: false,
    error: null
  });

  const conversationRef = useRef<string>(crypto.randomUUID());

  /**
   * Send a message to blipee OS
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'Please sign in to use blipee OS' }));
      return;
    }

    // Add user message to state
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null
    }));

    try {
      // Send to orchestrator API
      const response = await fetch('/api/v1/orchestrator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            conversationId: conversationRef.current,
            previousMessages: state.messages.slice(-5) // Last 5 messages for context
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process message');
      }

      const data = await response.json();
      
      // Add assistant response to state
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response.message,
        components: data.response.components,
        actions: data.response.actions,
        timestamp: new Date(),
        metadata: data.response.metadata
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }));

      // Store conversation in local storage for persistence
      localStorage.setItem(
        `blipee-conversation-${conversationRef.current}`,
        JSON.stringify([...state.messages, userMessage, assistantMessage])
      );

      return data.response;

    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to send message'
      }));
    }
  }, [user, state.messages]);

  /**
   * Get agent statuses
   */
  const fetchAgentStatuses = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/v1/orchestrator', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agent statuses');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        agents: data.capabilities.agents.map((agent: any) => ({
          agentId: agent.id,
          name: agent.name,
          status: agent.status
        })),
        isConnected: data.status === 'active'
      }));

    } catch (error) {
      console.error('Error fetching agent statuses:', error);
    }
  }, [user]);

  /**
   * Activate all agents
   */
  const activateAgents = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'Please sign in to activate agents' }));
      return;
    }

    try {
      const response = await fetch('/api/v1/orchestrator', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'activate' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to activate agents');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        agents: data.agentStatuses.map((status: any) => ({
          agentId: status.agentId,
          name: status.agentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          status: status.status,
          lastRun: status.lastRun,
          nextRun: status.nextRun
        }))
      }));

      return data;

    } catch (error) {
      console.error('Error activating agents:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to activate agents'
      }));
    }
  }, [user]);

  /**
   * Execute a specific action
   */
  const executeAction = useCallback(async (action: string) => {
    // Actions could be things like "View detailed report", "Update target", etc.
    // This would trigger specific UI flows or API calls
    console.log('Executing action:', action);
    
    // For now, just send it as a message
    return sendMessage(action);
  }, [sendMessage]);

  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
    conversationRef.current = crypto.randomUUID();
    localStorage.removeItem(`blipee-conversation-${conversationRef.current}`);
  }, []);

  /**
   * Load conversation from storage on mount
   */
  useEffect(() => {
    const savedConversation = localStorage.getItem(
      `blipee-conversation-${conversationRef.current}`
    );
    
    if (savedConversation) {
      try {
        const messages = JSON.parse(savedConversation);
        setState(prev => ({ ...prev, messages }));
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    }

    // Fetch initial agent statuses
    fetchAgentStatuses();

    // Set up periodic status refresh
    const interval = setInterval(fetchAgentStatuses, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [fetchAgentStatuses]);

  /**
   * Subscribe to real-time updates
   */
  useEffect(() => {
    if (!user) return;

    // Subscribe to agent updates
    const agentChannel = supabase
      .channel('agent-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_task_executions',
          filter: `organization_id=eq.${user.user_metadata?.organization_id}`
        },
        (payload) => {
          console.log('Agent update:', payload);
          // Refresh agent statuses
          fetchAgentStatuses();
        }
      )
      .subscribe();

    // Subscribe to critical alerts
    const alertChannel = supabase
      .channel('critical-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'critical_alerts',
          filter: `organization_id=eq.${user.user_metadata?.organization_id}`
        },
        (payload) => {
          console.log('Critical alert:', payload);
          // Add alert message to conversation
          const alertMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `🚨 Critical Alert: ${payload.new.title}\n\n${payload.new.description}`,
            timestamp: new Date(),
            metadata: { agent: payload.new.agent_id }
          };
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, alertMessage]
          }));
        }
      )
      .subscribe();

    return () => {
      agentChannel.unsubscribe();
      alertChannel.unsubscribe();
    };
  }, [user, supabase, fetchAgentStatuses]);

  return {
    // State
    messages: state.messages,
    agents: state.agents,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    sendMessage,
    activateAgents,
    executeAction,
    clearConversation,
    fetchAgentStatuses
  };
}

/**
 * Hook for accessing specific agent capabilities
 */
export function useAgent(agentId: string) {
  const { agents, sendMessage } = useBlipeeOS();
  
  const agent = agents.find(a => a.agentId === agentId);
  
  const executeAgentTask = useCallback(async (taskType: string, parameters?: any) => {
    // Format message to trigger specific agent task
    const message = `@${agentId} ${taskType} ${parameters ? JSON.stringify(parameters) : ''}`;
    return sendMessage(message);
  }, [agentId, sendMessage]);
  
  return {
    agent,
    executeTask: executeAgentTask
  };
}