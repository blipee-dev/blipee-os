/**
 * RAG (Retrieval-Augmented Generation) Middleware
 *
 * Enriches prompts with relevant context from:
 * - Previous conversations
 * - Organization documents
 * - Sustainability reports
 * - Carbon data
 *
 * Official AI SDK Pattern:
 * https://sdk.vercel.ai/docs/ai-sdk-core/middleware
 */

import { type Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { metrics } from '@/lib/monitoring/metrics';

interface RAGConfig {
  enabled: boolean;
  organizationId: string;
  conversationId: string;
  maxContextMessages: number; // How many previous messages to include
  maxDocuments: number; // How many relevant documents to retrieve
  maxCarbonRecords: number; // How many carbon records to include
  includeConversationHistory: boolean;
  includeDocuments: boolean;
  includeCarbonData: boolean;
}

interface RetrievedContext {
  conversationHistory: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  relevantDocuments: Array<{
    title: string;
    content: string;
    type: string;
  }>;
  carbonData: Array<{
    period: string;
    totalEmissions: number;
    breakdown: any;
  }>;
}

/**
 * Generate embedding for semantic search
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Retrieve conversation history
 */
async function retrieveConversationHistory(
  conversationId: string,
  maxMessages: number
): Promise<RetrievedContext['conversationHistory']> {
  try {
    const supabase = createClient();

    const { data: messages, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(maxMessages);

    if (error || !messages) {
      return [];
    }

    return messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.created_at
    })).reverse(); // Oldest first

  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    return [];
  }
}

/**
 * Retrieve relevant documents using vector similarity search
 */
async function retrieveRelevantDocuments(
  query: string,
  organizationId: string,
  maxDocuments: number
): Promise<RetrievedContext['relevantDocuments']> {
  try {
    const supabase = createClient();

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar documents using vector similarity
    // Assuming you have a documents table with embeddings
    const { data: documents, error } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: maxDocuments,
        org_id: organizationId
      }
    );

    if (error || !documents) {
      return [];
    }

    return documents.map((doc: any) => ({
      title: doc.title,
      content: doc.content,
      type: doc.document_type
    }));

  } catch (error) {
    console.error('Error retrieving documents:', error);
    return [];
  }
}

/**
 * Retrieve recent carbon data
 */
async function retrieveCarbonData(
  organizationId: string,
  maxRecords: number
): Promise<RetrievedContext['carbonData']> {
  try {
    const supabase = createClient();

    const { data: emissions, error } = await supabase
      .from('carbon_emissions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('emission_date', { ascending: false })
      .limit(maxRecords);

    if (error || !emissions) {
      return [];
    }

    return emissions.map(e => ({
      period: e.emission_date,
      totalEmissions: e.total_emissions,
      breakdown: {
        scope1: e.scope1_emissions,
        scope2: e.scope2_emissions,
        scope3: e.scope3_emissions
      }
    }));

  } catch (error) {
    console.error('Error retrieving carbon data:', error);
    return [];
  }
}

/**
 * Format retrieved context into a prompt
 */
function formatContextForPrompt(context: RetrievedContext, config: RAGConfig): string {
  const parts: string[] = [];

  // Add conversation history
  if (config.includeConversationHistory && context.conversationHistory.length > 0) {
    parts.push('## Recent Conversation History:');
    context.conversationHistory.forEach(msg => {
      parts.push(`${msg.role.toUpperCase()}: ${msg.content}`);
    });
    parts.push('');
  }

  // Add relevant documents
  if (config.includeDocuments && context.relevantDocuments.length > 0) {
    parts.push('## Relevant Documents:');
    context.relevantDocuments.forEach((doc, i) => {
      parts.push(`${i + 1}. ${doc.title} (${doc.type})`);
      parts.push(doc.content.substring(0, 500) + '...');
      parts.push('');
    });
  }

  // Add carbon data
  if (config.includeCarbonData && context.carbonData.length > 0) {
    parts.push('## Recent Carbon Emissions Data:');
    context.carbonData.forEach((data, i) => {
      parts.push(`Period ${i + 1} (${data.period}):`);
      parts.push(`- Total: ${data.totalEmissions} tCO2e`);
      parts.push(`- Scope 1: ${data.breakdown.scope1} tCO2e`);
      parts.push(`- Scope 2: ${data.breakdown.scope2} tCO2e`);
      parts.push(`- Scope 3: ${data.breakdown.scope3} tCO2e`);
      parts.push('');
    });
  }

  return parts.join('\n');
}

/**
 * RAG Context Enrichment Middleware
 *
 * Official AI SDK Middleware Pattern
 */
export function createRAGMiddleware(
  config: RAGConfig
): LanguageModelV1Middleware {
  return {
    transformParams: async ({ params }) => {
      if (!config.enabled) {
        return params;
      }

      try {
        const startTime = Date.now();

        // Extract the last user message to use as search query
        const messages = params.prompt;
        const lastUserMessage = messages
          .filter((m: any) => m.role === 'user')
          .pop();

        if (!lastUserMessage || !lastUserMessage.content) {
          return params;
        }

        const queryText = typeof lastUserMessage.content === 'string'
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage.content);

        // Retrieve context in parallel
        const [conversationHistory, relevantDocuments, carbonData] = await Promise.all([
          config.includeConversationHistory
            ? retrieveConversationHistory(config.conversationId, config.maxContextMessages)
            : Promise.resolve([]),
          config.includeDocuments
            ? retrieveRelevantDocuments(queryText, config.organizationId, config.maxDocuments)
            : Promise.resolve([]),
          config.includeCarbonData
            ? retrieveCarbonData(config.organizationId, config.maxCarbonRecords)
            : Promise.resolve([])
        ]);

        const retrievedContext: RetrievedContext = {
          conversationHistory,
          relevantDocuments,
          carbonData
        };

        // Format context into prompt
        const contextPrompt = formatContextForPrompt(retrievedContext, config);

        if (contextPrompt) {
          // Find the system message or create one
          let systemMessageIndex = messages.findIndex((m: any) => m.role === 'system');

          if (systemMessageIndex === -1) {
            // No system message, add one at the beginning
            messages.unshift({
              role: 'system',
              content: `You are a helpful sustainability assistant. Use the following context to answer questions:\n\n${contextPrompt}`
            });
          } else {
            // Append to existing system message
            const existingContent = messages[systemMessageIndex].content;
            messages[systemMessageIndex].content =
              `${existingContent}\n\n## Additional Context:\n${contextPrompt}`;
          }

          console.log('✅ RAG context enriched:', {
            conversationHistory: conversationHistory.length,
            documents: relevantDocuments.length,
            carbonRecords: carbonData.length,
            retrievalTime: Date.now() - startTime
          });

          // Record metrics
          metrics.recordHistogram('rag_retrieval_time_ms', Date.now() - startTime, {
            organization_id: config.organizationId
          });

          metrics.incrementCounter('rag_context_enrichments', 1, {
            organization_id: config.organizationId,
            has_history: conversationHistory.length > 0 ? 'true' : 'false',
            has_documents: relevantDocuments.length > 0 ? 'true' : 'false',
            has_carbon_data: carbonData.length > 0 ? 'true' : 'false'
          });
        }

      } catch (error) {
        console.error('Error in RAG middleware:', error);
        // Don't fail the request if RAG fails
      }

      return params;
    }
  };
}

/**
 * Wrap a language model with RAG context enrichment
 *
 * Usage:
 * ```typescript
 * const ragModel = wrapModelWithRAG(
 *   openai('gpt-4o'),
 *   {
 *     organizationId: 'org-123',
 *     conversationId: 'conv-456',
 *     enabled: true
 *   }
 * );
 *
 * const result = streamText({
 *   model: ragModel,
 *   messages: [...]
 * });
 * ```
 */
export function wrapModelWithRAG(
  model: any,
  config: Partial<RAGConfig> & { organizationId: string; conversationId: string }
) {
  const { experimental_wrapLanguageModel: wrapLanguageModel } = require('ai');

  const fullConfig: RAGConfig = {
    enabled: config.enabled ?? true,
    organizationId: config.organizationId,
    conversationId: config.conversationId,
    maxContextMessages: config.maxContextMessages ?? 10,
    maxDocuments: config.maxDocuments ?? 3,
    maxCarbonRecords: config.maxCarbonRecords ?? 5,
    includeConversationHistory: config.includeConversationHistory ?? true,
    includeDocuments: config.includeDocuments ?? true,
    includeCarbonData: config.includeCarbonData ?? true
  };

  return wrapLanguageModel({
    model,
    middleware: createRAGMiddleware(fullConfig)
  });
}

/**
 * Helper function to create documents embedding table migration
 * Run this migration to enable document search
 */
export const createDocumentsEmbeddingTable = `
-- Documents table with vector embeddings for RAG
CREATE TABLE IF NOT EXISTS documents_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document metadata
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'report', 'policy', 'data', 'email', etc.

  -- Vector embedding
  embedding vector(1536),

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_embeddings_org_id ON documents_embeddings(organization_id);
CREATE INDEX idx_documents_embeddings_type ON documents_embeddings(document_type);
CREATE INDEX idx_documents_embeddings_created_at ON documents_embeddings(created_at DESC);

-- Vector similarity index
CREATE INDEX idx_documents_embeddings_vector
  ON documents_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Function to match documents by vector similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  org_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  document_type TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.title,
    de.content,
    de.document_type,
    1 - (de.embedding <=> query_embedding) as similarity
  FROM documents_embeddings de
  WHERE
    de.organization_id = org_id
    AND 1 - (de.embedding <=> query_embedding) >= match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE documents_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their organization"
  ON documents_embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.user_id = auth.uid()
      AND organization_members.organization_id = documents_embeddings.organization_id
    )
  );

GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
`;
