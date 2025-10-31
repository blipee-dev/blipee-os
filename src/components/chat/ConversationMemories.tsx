'use client';

/**
 * Conversation Memories Component
 *
 * Displays AI-extracted memories from conversations
 * Part of FASE 2 - Conversation Intelligence
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Brain, Sparkles, TrendingUp, User, Building, MapPin, Package, X, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Memory {
  id: string;
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
  preferences: Record<string, any>;
  created_at: string;
  metadata?: {
    conversation_id?: string;
    message_count?: number;
    extracted_at?: string;
  };
}

interface ConversationMemoriesProps {
  conversationId?: string;
  className?: string;
  compact?: boolean;
}

export function ConversationMemories({ conversationId, className, compact = false }: ConversationMemoriesProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true);
      const supabase = createClient();

      try {
        let query = supabase
          .from('conversation_memories')
          .select('*')
          .order('created_at', { ascending: false });

        // If conversationId provided, filter by it
        if (conversationId) {
          query = query.eq('metadata->>conversation_id', conversationId);
        }

        const { data, error } = await query.limit(compact ? 3 : 10);

        if (error) {
          console.error('Error fetching memories:', error);
          return;
        }

        setMemories(data || []);
      } catch (error) {
        console.error('Error fetching memories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [conversationId, compact]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😟';
      default:
        return '😐';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'person':
        return <User className="w-3 h-3" />;
      case 'company':
        return <Building className="w-3 h-3" />;
      case 'place':
        return <MapPin className="w-3 h-3" />;
      case 'product':
        return <Package className="w-3 h-3" />;
      default:
        return <Sparkles className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className={cn("animate-pulse space-y-3", className)}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className={cn("text-center py-8 text-gray-500 dark:text-gray-400", className)}>
        <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No memories extracted yet</p>
        <p className="text-xs mt-1">Conversations with 5+ messages will be analyzed daily</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Brain className="w-4 h-4" />
        <span>Conversation Memories</span>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
        </span>
      </div>

      {/* Memories List */}
      <div className="space-y-3">
        {memories.map((memory) => {
          const isExpanded = expandedMemoryId === memory.id;

          return (
            <div
              key={memory.id}
              className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-all"
            >
              {/* Header */}
              <button
                onClick={() => setExpandedMemoryId(isExpanded ? null : memory.id)}
                className="w-full flex items-start gap-2 text-left"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                    {memory.title}
                  </h4>
                  {!isExpanded && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                      {memory.summary}
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 text-lg" title={memory.sentiment.overall}>
                  {getSentimentEmoji(memory.sentiment.overall)}
                </span>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-3 space-y-3 text-sm">
                  {/* Summary */}
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {memory.summary}
                    </p>
                  </div>

                  {/* Key Topics */}
                  {memory.key_topics && memory.key_topics.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        <TrendingUp className="w-3 h-3" />
                        <span>Topics</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {memory.key_topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities */}
                  {memory.entities && memory.entities.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Mentioned</span>
                      </div>
                      <div className="space-y-1">
                        {memory.entities.slice(0, 5).map((entity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-xs"
                          >
                            <span className="text-gray-400 dark:text-gray-500">
                              {getEntityIcon(entity.type)}
                            </span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {entity.name}
                            </span>
                            {entity.context && (
                              <span className="text-gray-500 dark:text-gray-400 truncate">
                                - {entity.context}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentiment */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Sentiment:</span>
                      <span className={cn("font-medium capitalize", getSentimentColor(memory.sentiment.overall))}>
                        {memory.sentiment.overall}
                      </span>
                    </div>
                    {memory.metadata?.message_count && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {memory.metadata.message_count} messages
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Extracted {new Date(memory.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* View All Link (if compact) */}
      {compact && memories.length >= 3 && (
        <button
          className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all memories →
        </button>
      )}
    </div>
  );
}
