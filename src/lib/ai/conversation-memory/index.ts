/**
 * Advanced Conversation Memory System for BLIPEE OS
 *
 * Features:
 * - Vector database integration with semantic search
 * - Episodic memory (short-term conversation context)
 * - Semantic memory (long-term knowledge graphs)
 * - Memory consolidation using transformer models
 * - Conversation summarization with GPT-4/Claude
 * - Context window management with sliding attention
 * - Memory retrieval using cosine similarity
 * - Forgetting curve implementation
 * - Cross-session memory persistence
 * - Real-time memory updates
 */

import { createClient } from '@/lib/supabase/server';
import { aiService } from '../service';
import { redisClient } from '@/lib/cache/redis-client';
import OpenAI from 'openai';

// Types for memory system
export interface VectorMemory {
  id: string;
  conversationId: string;
  userId: string;
  organizationId: string;
  content: string;
  embedding: number[];
  metadata: {
    timestamp: Date;
    messageIndex: number;
    importance: number;
    entities: string[];
    topics: string[];
    sentiment: number;
    urgency: number;
    contextType: 'episodic' | 'semantic' | 'procedural';
  };
  accessCount: number;
  lastAccessed: Date;
  decayFactor: number;
}

export interface EpisodicMemory {
  id: string;
  conversationId: string;
  userId: string;
  timeframe: 'immediate' | 'recent' | 'session';
  events: ConversationEvent[];
  contextWindow: string[];
  activeTopics: string[];
  currentFocus: string;
  emotionalState: EmotionalContext;
  workingMemorySize: number;
}

export interface SemanticMemory {
  id: string;
  userId: string;
  organizationId: string;
  knowledgeGraph: KnowledgeNode[];
  conceptualMappings: ConceptMapping[];
  domainExpertise: DomainKnowledge[];
  userModel: UserCognitiveModel;
  lastUpdated: Date;
}

export interface ConversationEvent {
  id: string;
  timestamp: Date;
  type: 'message' | 'action' | 'decision' | 'insight' | 'emotion';
  content: string;
  participants: string[];
  importance: number;
  consequences: string[];
  relatedEvents: string[];
}

export interface EmotionalContext {
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0 to 1 (calm to excited)
  dominance: number; // 0 to 1 (submissive to dominant)
  emotions: Array<{
    emotion: string;
    intensity: number;
    confidence: number;
  }>;
  emotionalTrend: Array<{
    timestamp: Date;
    valence: number;
    arousal: number;
  }>;
}

export interface KnowledgeNode {
  id: string;
  concept: string;
  type: 'entity' | 'relationship' | 'process' | 'goal' | 'constraint';
  attributes: Record<string, any>;
  connections: Array<{
    nodeId: string;
    relationship: string;
    strength: number;
  }>;
  confidence: number;
  lastUpdated: Date;
}

export interface ConceptMapping {
  sourceId: string;
  targetId: string;
  mappingType: 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'holonym';
  strength: number;
  context: string[];
}

export interface DomainKnowledge {
  domain: string;
  expertise: Array<{
    topic: string;
    level: number; // 0-1 (novice to expert)
    confidence: number;
    evidence: string[];
  }>;
  vocabulary: Array<{
    term: string;
    frequency: number;
    context: string[];
  }>;
  mentalModels: Array<{
    name: string;
    structure: any;
    accuracy: number;
  }>;
}

export interface UserCognitiveModel {
  workingMemoryCapacity: number;
  attentionSpan: number;
  processingSpeed: number;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  cognitiveLoad: number;
  expertiseAreas: string[];
  cognitivePreferences: {
    detailLevel: 'high' | 'medium' | 'low';
    structurePreference: 'linear' | 'hierarchical' | 'network';
    feedbackFrequency: 'immediate' | 'periodic' | 'summary';
  };
}

export interface MemoryConsolidation {
  id: string;
  conversationId: string;
  originalMemories: string[];
  consolidatedMemory: VectorMemory;
  consolidationType: 'compression' | 'abstraction' | 'integration' | 'forgetting';
  consolidationReason: string;
  qualityScore: number;
  timestamp: Date;
}

export class ConversationMemorySystem {
  private openai: OpenAI;
  private readonly EMBEDDING_MODEL = 'text-embedding-3-large';
  private readonly EMBEDDING_DIMENSIONS = 3072;
  private readonly MAX_WORKING_MEMORY = 7; // Miller's rule
  private readonly DECAY_RATE = 0.9;
  private readonly CONSOLIDATION_THRESHOLD = 0.8;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Store new memory with vector embeddings
   */
  async storeMemory(
    content: string,
    conversationId: string,
    userId: string,
    organizationId: string,
    metadata: Partial<VectorMemory['metadata']> = {}
  ): Promise<VectorMemory> {
    try {
      // Generate embedding
      const embedding = await this.generateEmbedding(content);

      // Extract entities and topics
      const entities = await this.extractEntities(content);
      const topics = await this.extractTopics(content);
      const sentiment = await this.analyzeSentiment(content);
      const importance = await this.calculateImportance(content, entities, topics);

      const memory: VectorMemory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        userId,
        organizationId,
        content,
        embedding,
        metadata: {
          timestamp: new Date(),
          messageIndex: metadata.messageIndex || 0,
          importance,
          entities,
          topics,
          sentiment,
          urgency: metadata.urgency || 0,
          contextType: metadata.contextType || 'episodic',
          ...metadata
        },
        accessCount: 0,
        lastAccessed: new Date(),
        decayFactor: 1.0
      };

      // Store in database
      const supabase = createClient();
      await supabase.from('conversation_memories').insert({
        id: memory.id,
        conversation_id: conversationId,
        user_id: userId,
        organization_id: organizationId,
        content: memory.content,
        embedding: memory.embedding,
        metadata: memory.metadata,
        access_count: memory.accessCount,
        last_accessed: memory.lastAccessed,
        decay_factor: memory.decayFactor,
        created_at: new Date().toISOString()
      });

      // Store in Redis for fast access
      await redisClient.setex(
        `memory:${memory.id}`,
        3600 * 24, // 24 hours
        JSON.stringify(memory)
      );

      // Update episodic memory
      await this.updateEpisodicMemory(conversationId, userId, memory);

      return memory;
    } catch (error) {
      console.error('Error storing memory:', error);
      throw new Error('Failed to store memory');
    }
  }

  /**
   * Retrieve memories using semantic search
   */
  async retrieveMemories(
    query: string,
    userId: string,
    organizationId: string,
    options: {
      limit?: number;
      contextType?: 'episodic' | 'semantic' | 'procedural';
      timeframe?: 'recent' | 'session' | 'all';
      minRelevance?: number;
    } = {}
  ): Promise<VectorMemory[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);

      // Retrieve from vector database with similarity search
      const memories = await this.semanticSearch(
        queryEmbedding,
        userId,
        organizationId,
        options
      );

      // Update access patterns and decay factors
      const updatedMemories = await Promise.all(
        memories.map(async (memory) => {
          memory.accessCount += 1;
          memory.lastAccessed = new Date();
          memory.decayFactor = this.calculateDecayFactor(memory);

          // Update in database
          const supabase = createClient();
          await supabase
            .from('conversation_memories')
            .update({
              access_count: memory.accessCount,
              last_accessed: memory.lastAccessed,
              decay_factor: memory.decayFactor
            })
            .eq('id', memory.id);

          return memory;
        })
      );

      return updatedMemories;
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
  }

  /**
   * Consolidate memories using transformer models
   */
  async consolidateMemories(
    conversationId: string,
    userId: string
  ): Promise<MemoryConsolidation[]> {
    try {
      const supabase = createClient();

      // Get all memories for this conversation
      const { data: memories } = await supabase
        .from('conversation_memories')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!memories || memories.length < 3) {
        return []; // Need at least 3 memories to consolidate
      }

      const consolidations: MemoryConsolidation[] = [];

      // Group similar memories for consolidation
      const memoryGroups = await this.groupSimilarMemories(memories);

      for (const group of memoryGroups) {
        if (group.length >= 2) {
          const consolidation = await this.performConsolidation(group);
          consolidations.push(consolidation);
        }
      }

      return consolidations;
    } catch (error) {
      console.error('Error consolidating memories:', error);
      return [];
    }
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text,
        dimensions: this.EMBEDDING_DIMENSIONS
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return zero vector as fallback
      return new Array(this.EMBEDDING_DIMENSIONS).fill(0);
    }
  }

  /**
   * Perform semantic search using cosine similarity
   */
  private async semanticSearch(
    queryEmbedding: number[],
    userId: string,
    organizationId: string,
    options: any
  ): Promise<VectorMemory[]> {
    const supabase = createClient();

    // Use pgvector for similarity search
    const { data: results } = await supabase.rpc('semantic_search_memories', {
      query_embedding: queryEmbedding,
      user_id: userId,
      organization_id: organizationId,
      match_threshold: options.minRelevance || 0.7,
      match_count: options.limit || 10
    });

    return results || [];
  }

  /**
   * Calculate importance score for memory
   */
  private async calculateImportance(
    content: string,
    entities: string[],
    topics: string[]
  ): Promise<number> {
    let importance = 0.5; // Base importance

    // Increase importance based on entities
    importance += entities.length * 0.1;

    // Increase importance based on topics
    importance += topics.length * 0.05;

    // Increase importance for sustainability-specific content
    const sustainabilityTerms = [
      'carbon', 'emissions', 'sustainability', 'ESG', 'compliance',
      'target', 'goal', 'reduction', 'renewable', 'efficiency'
    ];

    const sustainabilityMatches = sustainabilityTerms.filter(term =>
      content.toLowerCase().includes(term)
    ).length;

    importance += sustainabilityMatches * 0.15;

    // Increase importance for questions and decisions
    if (content.includes('?')) importance += 0.1;
    if (content.toLowerCase().includes('decide') || content.toLowerCase().includes('choose')) {
      importance += 0.2;
    }

    return Math.min(importance, 1.0);
  }

  /**
   * Calculate decay factor based on recency and access patterns
   */
  private calculateDecayFactor(memory: VectorMemory): number {
    const now = new Date();
    const age = now.getTime() - memory.metadata.timestamp.getTime();
    const daysSinceCreation = age / (1000 * 60 * 60 * 24);

    // Base decay based on time
    let decay = Math.pow(this.DECAY_RATE, daysSinceCreation);

    // Adjust based on access patterns (more accessed = less decay)
    const accessFactor = Math.min(memory.accessCount / 10, 1);
    decay = decay + (accessFactor * (1 - decay));

    // Adjust based on importance
    decay = decay + (memory.metadata.importance * (1 - decay) * 0.3);

    return Math.max(decay, 0.1); // Minimum decay factor
  }

  /**
   * Update episodic memory
   */
  private async updateEpisodicMemory(
    conversationId: string,
    userId: string,
    newMemory: VectorMemory
  ): Promise<void> {
    try {
      const episodicKey = `episodic:${conversationId}:${userId}`;
      const existingData = await redisClient.get(episodicKey);

      let episodic: EpisodicMemory;

      if (existingData) {
        // Handle case where Redis returns an object instead of string
        if (typeof existingData === 'string') {
          try {
            episodic = JSON.parse(existingData);
          } catch (parseError) {
            console.error('Error parsing episodic memory from Redis, creating new:', parseError);
            // If parsing fails, create new episodic memory
            episodic = this.createEmptyEpisodicMemory(conversationId, userId);
          }
        } else if (typeof existingData === 'object' && existingData !== null) {
          // Redis client might return parsed object
          episodic = existingData as EpisodicMemory;
        } else {
          // Invalid data type, create new
          console.warn('Invalid data type from Redis for episodic memory, creating new');
          episodic = this.createEmptyEpisodicMemory(conversationId, userId);
        }
      } else {
        episodic = this.createEmptyEpisodicMemory(conversationId, userId);
      }

      // Add new event
      const event: ConversationEvent = {
        id: `event_${Date.now()}`,
        timestamp: newMemory.metadata.timestamp,
        type: 'message',
        content: newMemory.content,
        participants: [userId],
        importance: newMemory.metadata.importance,
        consequences: [],
        relatedEvents: []
      };

      episodic.events.push(event);
      episodic.activeTopics = Array.from(new Set([
        ...episodic.activeTopics,
        ...newMemory.metadata.topics
      ]));

      // Maintain working memory size limit
      if (episodic.contextWindow.length >= this.MAX_WORKING_MEMORY) {
        episodic.contextWindow.shift();
      }
      episodic.contextWindow.push(newMemory.content);
      episodic.workingMemorySize = episodic.contextWindow.length;

      // Update current focus
      episodic.currentFocus = newMemory.metadata.topics[0] || '';

      // Store updated episodic memory
      await redisClient.setex(
        episodicKey,
        3600 * 2, // 2 hours
        JSON.stringify(episodic)
      );
    } catch (error) {
      console.error('Error updating episodic memory:', error);
    }
  }

  /**
   * Create empty episodic memory structure
   */
  private createEmptyEpisodicMemory(
    conversationId: string,
    userId: string
  ): EpisodicMemory {
    return {
      id: `episodic_${conversationId}`,
      conversationId,
      userId,
      timeframe: 'session',
      events: [],
      contextWindow: [],
      activeTopics: [],
      currentFocus: '',
      emotionalState: {
        valence: 0,
        arousal: 0,
        dominance: 0,
        emotions: [],
        emotionalTrend: []
      },
      workingMemorySize: 0
    };
  }

  /**
   * Extract entities from text
   */
  private async extractEntities(text: string): Promise<string[]> {
    try {
      const prompt = `Extract key entities from this text. Focus on sustainability, business, and technical entities. Return ONLY a valid JSON array of strings, nothing else:

Text: "${text}"

Return format: ["entity1", "entity2", "entity3"]`;

      const response = await aiService.complete(prompt, {
        temperature: 0.1,
        maxTokens: 200,
        jsonMode: true
      });

      // Try to extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }

      // Try to extract JSON array if wrapped in text
      const arrayMatch = jsonStr.match(/\[[\s\S]*?\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }

      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed.filter(e => typeof e === 'string') : [];
    } catch (error) {
      console.error('Error extracting entities:', error);
      // Return empty array as fallback - memory still works without entities
      return [];
    }
  }

  /**
   * Extract topics from text
   */
  private async extractTopics(text: string): Promise<string[]> {
    try {
      const prompt = `Identify key topics and themes in this text. Focus on sustainability, ESG, and business topics. Return as JSON array:

Text: "${text}"

Return format: ["topic1", "topic2", "topic3"]`;

      const response = await aiService.complete(prompt, {
        temperature: 0.1,
        maxTokens: 150,
        jsonMode: true
      });

      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error extracting topics:', error);
      return [];
    }
  }

  /**
   * Analyze sentiment of text
   */
  private async analyzeSentiment(text: string): Promise<number> {
    try {
      const prompt = `Analyze the sentiment of this text and return a score from -1 (very negative) to 1 (very positive):

Text: "${text}"

Return only a number between -1 and 1.`;

      const response = await aiService.complete(prompt, {
        temperature: 0.1,
        maxTokens: 10
      });

      const score = parseFloat(response.trim());
      return isNaN(score) ? 0 : Math.max(-1, Math.min(1, score));
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 0;
    }
  }

  /**
   * Group similar memories for consolidation
   */
  private async groupSimilarMemories(memories: any[]): Promise<any[][]> {
    const groups: any[][] = [];
    const processed = new Set<string>();

    for (const memory of memories) {
      if (processed.has(memory.id)) continue;

      const group = [memory];
      processed.add(memory.id);

      for (const otherMemory of memories) {
        if (processed.has(otherMemory.id)) continue;

        const similarity = this.calculateCosineSimilarity(
          memory.embedding,
          otherMemory.embedding
        );

        if (similarity > this.CONSOLIDATION_THRESHOLD) {
          group.push(otherMemory);
          processed.add(otherMemory.id);
        }
      }

      groups.push(group);
    }

    return groups.filter(group => group.length > 1);
  }

  /**
   * Perform memory consolidation
   */
  private async performConsolidation(
    memoryGroup: any[]
  ): Promise<MemoryConsolidation> {
    try {
      const combinedContent = memoryGroup.map(m => m.content).join(' ');

      const prompt = `Consolidate these related memories into a single, coherent summary that preserves the key information:

Memories:
${memoryGroup.map((m, i) => `${i + 1}. ${m.content}`).join('\n')}

Provide a consolidated summary that captures the essential information while reducing redundancy.`;

      const consolidatedText = await aiService.complete(prompt, {
        temperature: 0.2,
        maxTokens: 300
      });

      const consolidatedEmbedding = await this.generateEmbedding(consolidatedText);

      const consolidatedMemory: VectorMemory = {
        id: `consolidated_${Date.now()}`,
        conversationId: memoryGroup[0].conversation_id,
        userId: memoryGroup[0].user_id,
        organizationId: memoryGroup[0].organization_id,
        content: consolidatedText,
        embedding: consolidatedEmbedding,
        metadata: {
          timestamp: new Date(),
          messageIndex: -1,
          importance: Math.max(...memoryGroup.map(m => m.metadata.importance)),
          entities: Array.from(new Set(memoryGroup.flatMap(m => m.metadata.entities))),
          topics: Array.from(new Set(memoryGroup.flatMap(m => m.metadata.topics))),
          sentiment: memoryGroup.reduce((sum, m) => sum + m.metadata.sentiment, 0) / memoryGroup.length,
          urgency: Math.max(...memoryGroup.map(m => m.metadata.urgency)),
          contextType: 'semantic'
        },
        accessCount: 0,
        lastAccessed: new Date(),
        decayFactor: 1.0
      };

      const consolidation: MemoryConsolidation = {
        id: `consolidation_${Date.now()}`,
        conversationId: memoryGroup[0].conversation_id,
        originalMemories: memoryGroup.map(m => m.id),
        consolidatedMemory,
        consolidationType: 'compression',
        consolidationReason: 'High similarity between memories',
        qualityScore: 0.8,
        timestamp: new Date()
      };

      // Store consolidation
      const supabase = createClient();
      await supabase.from('memory_consolidations').insert({
        id: consolidation.id,
        conversation_id: consolidation.conversationId,
        original_memories: consolidation.originalMemories,
        consolidated_memory: consolidation.consolidatedMemory,
        consolidation_type: consolidation.consolidationType,
        consolidation_reason: consolidation.consolidationReason,
        quality_score: consolidation.qualityScore,
        created_at: consolidation.timestamp.toISOString()
      });

      return consolidation;
    } catch (error) {
      console.error('Error performing consolidation:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get episodic memory for conversation
   */
  async getEpisodicMemory(conversationId: string, userId: string): Promise<EpisodicMemory | null> {
    try {
      const episodicKey = `episodic:${conversationId}:${userId}`;
      const data = await redisClient.get(episodicKey);

      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting episodic memory:', error);
      return null;
    }
  }

  /**
   * Update semantic memory based on conversation patterns
   */
  async updateSemanticMemory(userId: string, organizationId: string): Promise<void> {
    try {
      // This would involve complex knowledge graph updates
      // For now, we'll implement a simplified version

      const memories = await this.retrieveMemories(
        '',
        userId,
        organizationId,
        { limit: 100, contextType: 'semantic' }
      );

      // Build knowledge graph from memories
      const knowledgeGraph = await this.buildKnowledgeGraph(memories);

      // Store semantic memory
      const supabase = createClient();
      await supabase.from('semantic_memories').upsert({
        id: `semantic_${userId}_${organizationId}`,
        user_id: userId,
        organization_id: organizationId,
        knowledge_graph: knowledgeGraph,
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating semantic memory:', error);
    }
  }

  /**
   * Build knowledge graph from memories
   */
  private async buildKnowledgeGraph(memories: VectorMemory[]): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = [];
    const entityCounts = new Map<string, number>();

    // Extract all entities and count occurrences
    memories.forEach(memory => {
      memory.metadata.entities.forEach(entity => {
        entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1);
      });
    });

    // Create nodes for frequently mentioned entities
    entityCounts.forEach((count, entity) => {
      if (count >= 2) { // Only include entities mentioned multiple times
        const node: KnowledgeNode = {
          id: `node_${entity.replace(/\s+/g, '_')}`,
          concept: entity,
          type: 'entity',
          attributes: {
            mentionCount: count,
            contexts: memories
              .filter(m => m.metadata.entities.includes(entity))
              .map(m => m.content.substring(0, 100))
          },
          connections: [],
          confidence: Math.min(count / 10, 1),
          lastUpdated: new Date()
        };
        nodes.push(node);
      }
    });

    return nodes;
  }

  /**
   * Forget old or irrelevant memories
   */
  async forgetMemories(userId: string, organizationId: string): Promise<number> {
    try {
      const supabase = createClient();

      // Delete memories with very low decay factors
      const { data: forgottenMemories } = await supabase
        .from('conversation_memories')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .lt('decay_factor', 0.1)
        .select('id');

      return forgottenMemories?.length || 0;
    } catch (error) {
      console.error('Error forgetting memories:', error);
      return 0;
    }
  }

  /**
   * Generate memory summary for context
   */
  async generateMemorySummary(
    conversationId: string,
    userId: string,
    maxTokens: number = 500
  ): Promise<string> {
    try {
      const memories = await this.retrieveMemories(
        '',
        userId,
        '',
        { limit: 10, timeframe: 'recent' }
      );

      if (memories.length === 0) return '';

      const memoryTexts = memories
        .sort((a, b) => b.metadata.importance - a.metadata.importance)
        .slice(0, 5)
        .map(m => m.content)
        .join('\n');

      const prompt = `Summarize the key points from these conversation memories in ${maxTokens} characters or less:

${memoryTexts}

Focus on the most important information that would be relevant for continuing the conversation.`;

      const summary = await aiService.complete(prompt, {
        temperature: 0.3,
        maxTokens: Math.ceil(maxTokens / 4) // Rough token estimation
      });

      return summary;
    } catch (error) {
      console.error('Error generating memory summary:', error);
      return '';
    }
  }
}

// Direct singleton instantiation after class definition
// This ensures class methods are attached to prototype before instance creation
export const conversationMemorySystem = new ConversationMemorySystem();

// Export alias for backwards compatibility
export const conversationMemoryManager = conversationMemorySystem;