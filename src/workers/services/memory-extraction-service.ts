/**
 * Memory Extraction Service
 *
 * Extracts important memories from conversations using AI.
 * Runs daily to process new conversations with 5+ messages.
 *
 * FASE 2 - Week 1: Conversation Memories
 */

import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExtractedMemory {
  title: string;
  summary: string;
  key_topics: string[];
  entities: {
    type: string;
    name: string;
    context?: string;
  }[];
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
  };
  preferences: {
    [key: string]: any;
  };
}

export class MemoryExtractionService {
  private stats = {
    conversationsProcessed: 0,
    memoriesExtracted: 0,
    errors: 0,
    lastRunAt: null as Date | null,
    lastRunDuration: 0,
  };

  /**
   * Main execution method - processes all eligible conversations
   */
  async run(): Promise<void> {
    const startTime = Date.now();
    console.log('🧠 [Memory Extraction] Starting memory extraction job...');

    try {
      // Get conversations that need memory extraction
      const conversations = await this.getEligibleConversations();
      console.log(`📊 Found ${conversations.length} conversations eligible for memory extraction`);

      for (const conv of conversations) {
        try {
          await this.processConversation(conv.id, conv.user_id, conv.organization_id);
          this.stats.conversationsProcessed++;
        } catch (error) {
          console.error(`❌ Error processing conversation ${conv.id}:`, error);
          this.stats.errors++;
        }
      }

      this.stats.lastRunAt = new Date();
      this.stats.lastRunDuration = Date.now() - startTime;

      console.log('✅ [Memory Extraction] Job complete');
      console.log(`   • Conversations processed: ${this.stats.conversationsProcessed}`);
      console.log(`   • Memories extracted: ${this.stats.memoriesExtracted}`);
      console.log(`   • Errors: ${this.stats.errors}`);
      console.log(`   • Duration: ${(this.stats.lastRunDuration / 1000).toFixed(2)}s`);

    } catch (error) {
      console.error('❌ [Memory Extraction] Fatal error:', error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Get conversations eligible for memory extraction
   * Criteria:
   * - At least 5 messages
   * - Not yet processed (no existing memories)
   * - Created in last 30 days
   */
  private async getEligibleConversations() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get conversations with 5+ messages
    const { data: conversations, error } = await supabase
      .rpc('get_conversations_for_memory_extraction', {
        min_message_count: 5,
        since_date: thirtyDaysAgo.toISOString()
      })
      .select('id, user_id, organization_id, message_count');

    if (error) {
      console.error('Error fetching eligible conversations:', error);
      return [];
    }

    if (!conversations || !Array.isArray(conversations) || conversations.length === 0) {
      return [];
    }

    // Filter out conversations that already have memories
    const conversationsWithoutMemories = [];
    for (const conv of conversations) {
      const { data: existingMemories } = await supabase
        .from('conversation_memories')
        .select('id')
        .eq('metadata->>conversation_id', conv.id)
        .maybeSingle();

      if (!existingMemories) {
        conversationsWithoutMemories.push(conv);
      }
    }

    return conversationsWithoutMemories;
  }

  /**
   * Process a single conversation to extract memories
   */
  private async processConversation(
    conversationId: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    console.log(`🔍 Processing conversation ${conversationId}...`);

    // 1. Get all messages from the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError || !messages || messages.length < 5) {
      console.log(`⏭️  Skipping conversation ${conversationId} (insufficient messages)`);
      return;
    }

    // 2. Format conversation for AI
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    // 3. Use AI to extract memories
    const memory = await this.extractMemoryWithAI(conversationText);

    if (!memory) {
      console.log(`⏭️  No significant memories found in conversation ${conversationId}`);
      return;
    }

    // 4. Save memory to database
    const { error: insertError } = await supabase
      .from('conversation_memories')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        title: memory.title,
        summary: memory.summary,
        key_topics: memory.key_topics,
        entities: memory.entities,
        sentiment: memory.sentiment,
        preferences: memory.preferences,
        metadata: {
          conversation_id: conversationId,
          message_count: messages.length,
          extracted_at: new Date().toISOString(),
          extraction_model: 'gpt-4o-mini'
        }
      });

    if (insertError) {
      console.error(`❌ Error saving memory for conversation ${conversationId}:`, insertError);
      throw insertError;
    }

    this.stats.memoriesExtracted++;
    console.log(`✅ Memory extracted and saved for conversation ${conversationId}`);
  }

  /**
   * Use AI to extract structured memory from conversation
   */
  private async extractMemoryWithAI(conversationText: string): Promise<ExtractedMemory | null> {
    try {
      const prompt = `You are a memory extraction system. Analyze the following conversation and extract key information.

CONVERSATION:
${conversationText}

Extract the following information:
1. A concise title (max 60 chars) that summarizes what this conversation was about
2. A summary (2-3 sentences) of the main points discussed
3. Key topics discussed (array of 3-5 keywords)
4. Entities mentioned (people, companies, places, products - max 5)
5. Overall sentiment (positive/neutral/negative with confidence score 0-1)
6. User preferences or requirements learned

Return ONLY a valid JSON object with this structure:
{
  "title": "string",
  "summary": "string",
  "key_topics": ["topic1", "topic2"],
  "entities": [
    {"type": "person|company|place|product", "name": "string", "context": "optional context"}
  ],
  "sentiment": {
    "overall": "positive|neutral|negative",
    "score": 0.0-1.0
  },
  "preferences": {
    "key": "value"
  }
}

If the conversation contains no meaningful information worth remembering, return null.`;

      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt,
        temperature: 0.3,
        maxTokens: 1000,
      });

      // Parse AI response
      const cleanText = text.trim();
      if (cleanText === 'null' || cleanText === '') {
        return null;
      }

      // Remove markdown code blocks if present
      const jsonText = cleanText
        .replace(/^```json?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      const memory = JSON.parse(jsonText) as ExtractedMemory;

      // Validate required fields
      if (!memory.title || !memory.summary) {
        console.warn('⚠️  AI returned incomplete memory, skipping');
        return null;
      }

      return memory;

    } catch (error) {
      console.error('❌ Error extracting memory with AI:', error);
      return null;
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton instance
export const memoryExtractionService = new MemoryExtractionService();
