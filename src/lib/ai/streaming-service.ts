/**
 * Real-time AI Streaming Service with Server-Sent Events
 * 
 * Features:
 * - Server-Sent Events (SSE) for real-time streaming
 * - Connection pooling and management
 * - Backpressure handling and flow control
 * - Streaming analytics and monitoring
 * - Multi-client broadcasting
 */

import { aiOrchestrator, TaskType } from './orchestrator';
import { enhancedAIService, ConversationContext } from './enhanced-service';
import { conversationMemoryManager } from './conversation-memory';
import { metrics } from '@/lib/monitoring/metrics';

export interface StreamingClient {
  id: string;
  userId: string;
  organizationId: string;
  conversationId: string;
  controller: ReadableStreamDefaultController;
  connectedAt: Date;
  lastActivity: Date;
  messageCount: number;
}

export interface StreamingMessage {
  type: 'token' | 'metadata' | 'error' | 'complete' | 'context' | 'typing' | 'system';
  content?: string;
  data?: any;
  timestamp: Date;
  messageId?: string;
}

export interface StreamingSession {
  sessionId: string;
  conversationId: string;
  context: ConversationContext;
  clients: Map<string, StreamingClient>;
  isActive: boolean;
  startTime: Date;
  lastMessage: Date;
}

export class StreamingService {
  private sessions: Map<string, StreamingSession> = new Map();
  private clients: Map<string, StreamingClient> = new Map();
  private readonly maxClients = 1000;
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private readonly heartbeatInterval = 30000; // 30 seconds

  constructor() {
    this.startHeartbeat();
    this.startSessionCleanup();
  }

  /**
   * Create a new streaming session
   */
  async createStreamingSession(
    conversationId: string,
    context: ConversationContext
  ): Promise<{ sessionId: string; stream: ReadableStream }> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: StreamingSession = {
      sessionId,
      conversationId,
      context,
      clients: new Map(),
      isActive: true,
      startTime: new Date(),
      lastMessage: new Date()
    };

    this.sessions.set(sessionId, session);

    const stream = new ReadableStream({
      start: (controller) => {
        // Initial connection message
        this.sendToController(controller, {
          type: 'system',
          content: 'Connected to AI streaming service',
          data: {
            sessionId,
            conversationId,
            serverTime: new Date().toISOString()
          },
          timestamp: new Date()
        });
      },
      cancel: () => {
        this.cleanupSession(sessionId);
      }
    });

    metrics.incrementCounter('streaming_sessions_created', 1, {
      organization_id: context.organizationId
    });

    return { sessionId, stream };
  }

  /**
   * Add a client to a streaming session
   */
  async addClientToSession(
    sessionId: string,
    userId: string,
    controller: ReadableStreamDefaultController
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (this.clients.size >= this.maxClients) {
      throw new Error('Maximum clients reached');
    }

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const client: StreamingClient = {
      id: clientId,
      userId,
      organizationId: session.context.organizationId,
      conversationId: session.conversationId,
      controller,
      connectedAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0
    };

    session.clients.set(clientId, client);
    this.clients.set(clientId, client);

    // Send welcome message to new client
    this.sendToClient(clientId, {
      type: 'system',
      content: 'Client connected to session',
      data: {
        clientId,
        sessionId,
        clientCount: session.clients.size
      },
      timestamp: new Date()
    });

    metrics.incrementCounter('streaming_clients_connected', 1, {
      organization_id: session.context.organizationId,
      session_id: sessionId
    });

    return clientId;
  }

  /**
   * Stream AI response to session
   */
  async streamAIResponse(
    sessionId: string,
    query: string,
    options?: {
      includeContext?: boolean;
      includeTyping?: boolean;
      maxTokens?: number;
    }
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      throw new Error('Session not found or inactive');
    }

    const startTime = Date.now();
    let tokenCount = 0;
    let completeResponse = '';

    try {
      // Send typing indicator
      if (options?.includeTyping) {
        this.broadcastToSession(sessionId, {
          type: 'typing',
          content: 'AI is thinking...',
          timestamp: new Date()
        });
      }

      // Send context if requested
      if (options?.includeContext) {
        this.broadcastToSession(sessionId, {
          type: 'context',
          data: {
            conversation: session.context.conversationId,
            messageHistory: session.context.messageHistory.length,
            organization: session.context.organizationId
          },
          timestamp: new Date()
        });
      }

      // Start streaming from AI service
      const streamGenerator = enhancedAIService.streamSustainabilityQuery(
        query,
        session.context,
        {
          maxTokens: options?.maxTokens || 2000,
          onToken: (token) => {
            // Optional callback for token-level processing
          }
        }
      );

      for await (const chunk of streamGenerator) {
        if (chunk.content) {
          tokenCount++;
          completeResponse += chunk.content;
          
          // Send token to all clients in session
          this.broadcastToSession(sessionId, {
            type: 'token',
            content: chunk.content,
            data: {
              tokenCount,
              streaming: true
            },
            timestamp: new Date()
          });
          
          // Update session activity
          session.lastMessage = new Date();
        }

        if (chunk.metadata?.complete) {
          // Send final metadata
          this.broadcastToSession(sessionId, {
            type: 'metadata',
            data: {
              ...chunk.metadata,
              totalTokens: tokenCount,
              responseTime: Date.now() - startTime,
              wordCount: completeResponse.split(' ').length
            },
            timestamp: new Date()
          });
          
          // Send completion message
          this.broadcastToSession(sessionId, {
            type: 'complete',
            content: 'Response completed',
            data: {
              totalTokens: tokenCount,
              responseTime: Date.now() - startTime,
              sessionId
            },
            timestamp: new Date()
          });
          
          // Store in conversation memory
          await this.updateConversationMemory(session, query, completeResponse);
          
          break;
        }

        if (chunk.metadata?.error) {
          this.broadcastToSession(sessionId, {
            type: 'error',
            content: chunk.metadata.error,
            timestamp: new Date()
          });
          break;
        }
      }

      // Record metrics
      metrics.incrementCounter('streaming_responses_completed', 1, {
        organization_id: session.context.organizationId,
        session_id: sessionId
      });

      metrics.recordHistogram('streaming_response_time', Date.now() - startTime, {
        organization_id: session.context.organizationId
      });

      metrics.recordHistogram('streaming_token_count', tokenCount, {
        organization_id: session.context.organizationId
      });

    } catch (error) {
      console.error('Streaming error:', error);
      
      this.broadcastToSession(sessionId, {
        type: 'error',
        content: error instanceof Error ? error.message : 'Streaming failed',
        data: { sessionId },
        timestamp: new Date()
      });

      metrics.incrementCounter('streaming_errors', 1, {
        organization_id: session.context.organizationId,
        error_type: 'streaming_failed'
      });
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: StreamingMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.sendToController(client.controller, message);
    client.lastActivity = new Date();
    client.messageCount++;
  }

  /**
   * Broadcast message to all clients in a session
   */
  private broadcastToSession(sessionId: string, message: StreamingMessage): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.clients.forEach((client) => {
      this.sendToClient(client.id, message);
    });
  }

  /**
   * Send message to controller with proper error handling
   */
  private sendToController(controller: ReadableStreamDefaultController, message: StreamingMessage): void {
    try {
      const data = `data: ${JSON.stringify(message)}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      console.error('Error sending to controller:', error);
    }
  }

  /**
   * Remove client from session and cleanup
   */
  async removeClient(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from session
    const session = this.sessions.get(client.conversationId);
    if (session) {
      session.clients.delete(clientId);
      
      // If session has no more clients, mark as inactive
      if (session.clients.size === 0) {
        session.isActive = false;
      }
    }

    // Remove from global clients map
    this.clients.delete(clientId);

    metrics.incrementCounter('streaming_clients_disconnected', 1, {
      organization_id: client.organizationId
    });
  }

  /**
   * Get session information
   */
  getSessionInfo(sessionId: string): {
    session?: StreamingSession;
    clientCount: number;
    isActive: boolean;
    uptime: number;
  } {
    const session = this.sessions.get(sessionId);
    
    return {
      session,
      clientCount: session?.clients.size || 0,
      isActive: session?.isActive || false,
      uptime: session ? Date.now() - session.startTime.getTime() : 0
    };
  }

  /**
   * Get streaming service statistics
   */
  getServiceStats(): {
    activeSessions: number;
    totalClients: number;
    averageClientsPerSession: number;
    uptime: number;
    memoryUsage: any;
  } {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive).length;
    
    return {
      activeSessions,
      totalClients: this.clients.size,
      averageClientsPerSession: activeSessions > 0 ? this.clients.size / activeSessions : 0,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Send system message to session
   */
  async sendSystemMessage(sessionId: string, content: string, data?: any): Promise<void> {
    this.broadcastToSession(sessionId, {
      type: 'system',
      content,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Update conversation memory with new messages
   */
  private async updateConversationMemory(
    session: StreamingSession,
    query: string,
    response: string
  ): Promise<void> {
    try {
      const newMessages = [
        {
          id: `msg_${Date.now()}_user`,
          role: 'user' as const,
          content: query,
          timestamp: new Date(),
          metadata: { streaming: true }
        },
        {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant' as const,
          content: response,
          timestamp: new Date(),
          metadata: { streaming: true }
        }
      ];

      await conversationMemoryManager.updateConversationMemory(
        session.conversationId,
        newMessages
      );

    } catch (error) {
      console.error('Error updating conversation memory:', error);
    }
  }

  /**
   * Cleanup inactive session
   */
  private cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Remove all clients from session
    session.clients.forEach((client) => {
      this.clients.delete(client.id);
    });

    // Remove session
    this.sessions.delete(sessionId);

    metrics.incrementCounter('streaming_sessions_cleaned_up', 1, {
      organization_id: session.context.organizationId
    });
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        try {
          this.sendToClient(clientId, {
            type: 'system',
            content: 'heartbeat',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date()
          });
        } catch (error) {
          console.error(`Heartbeat failed for client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      });
    }, this.heartbeatInterval);
  }

  /**
   * Start session cleanup routine
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      this.sessions.forEach((session, sessionId) => {
        const timeSinceLastMessage = now - session.lastMessage.getTime();
        
        if (timeSinceLastMessage > this.sessionTimeout) {
          this.cleanupSession(sessionId);
        }
      });
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    
    // Send shutdown message to all clients
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, {
        type: 'system',
        content: 'Server shutting down',
        timestamp: new Date()
      });
    });

    // Clean up all sessions
    this.sessions.forEach((_, sessionId) => {
      this.cleanupSession(sessionId);
    });

  }
}

// Export singleton instance
export const streamingService = new StreamingService();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  streamingService.shutdown();
});

process.on('SIGINT', () => {
  streamingService.shutdown();
});