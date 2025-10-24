/**
 * Server Actions for Conversation Memory System
 *
 * This wrapper provides Next.js 14 Server Actions for the ConversationMemorySystem
 * to work around webpack/RSC bundling limitations with ES6 class instances.
 *
 * Issue: Next.js 14 App Router webpack bundler doesn't properly preserve class
 * prototypes when bundling for React Server Components, causing "is not a function"
 * errors on class methods.
 *
 * Solution: Expose all ConversationMemorySystem methods as standalone server actions
 * that internally manage the singleton instance.
 */

'use server';

import { ConversationMemorySystem, VectorMemory, ConsolidatedMemory, MemoryRetrievalOptions } from './index';

// Private singleton instance - only accessible within this module
let _instance: ConversationMemorySystem | null = null;

/**
 * Get or create the singleton instance
 * This ensures only one instance exists across all server action calls
 */
function getInstance(): ConversationMemorySystem {
  if (!_instance) {
    _instance = new ConversationMemorySystem();
  }
  return _instance;
}

/**
 * Store new memory with vector embeddings
 */
export async function storeMemory(
  content: string,
  conversationId: string,
  userId: string,
  organizationId: string,
  metadata: Partial<VectorMemory['metadata']> = {}
): Promise<VectorMemory> {
  const manager = getInstance();
  return await manager.storeMemory(content, conversationId, userId, organizationId, metadata);
}

/**
 * Retrieve relevant memories using semantic search
 */
export async function retrieveMemories(
  query: string,
  userId: string,
  organizationId: string,
  options: MemoryRetrievalOptions = {}
): Promise<VectorMemory[]> {
  const manager = getInstance();
  return await manager.retrieveMemories(query, userId, organizationId, options);
}

/**
 * Consolidate memories for a conversation
 */
export async function consolidateMemories(
  conversationId: string,
  userId: string
): Promise<ConsolidatedMemory[]> {
  const manager = getInstance();
  return await manager.consolidateMemories(conversationId, userId);
}

/**
 * Update memory importance/relevance
 */
export async function updateMemoryImportance(
  memoryId: string,
  importance: number
): Promise<void> {
  const manager = getInstance();
  return await manager.updateMemoryImportance(memoryId, importance);
}

/**
 * Delete old or irrelevant memories
 */
export async function pruneMemories(
  userId: string,
  organizationId: string,
  olderThan?: Date
): Promise<number> {
  const manager = getInstance();
  return await manager.pruneMemories(userId, organizationId, olderThan);
}

/**
 * Get memory statistics
 */
export async function getMemoryStats(
  userId: string,
  organizationId: string
): Promise<{
  totalMemories: number;
  episodicMemories: number;
  semanticMemories: number;
  avgImportance: number;
  oldestMemory: Date | null;
  newestMemory: Date | null;
}> {
  const manager = getInstance();
  return await manager.getMemoryStats(userId, organizationId);
}

/**
 * Search memories by time range
 */
export async function searchMemoriesByTimeRange(
  userId: string,
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<VectorMemory[]> {
  const manager = getInstance();
  return await manager.searchMemoriesByTimeRange(userId, organizationId, startDate, endDate);
}

/**
 * Get conversation summary
 */
export async function getConversationSummary(
  conversationId: string,
  userId: string
): Promise<string | null> {
  const manager = getInstance();
  return await manager.getConversationSummary(conversationId, userId);
}

/**
 * Generate embeddings for text (utility function)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const manager = getInstance();
  return await manager.generateEmbedding(text);
}
