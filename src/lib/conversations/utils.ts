import { Message } from '@/types/conversation'
import type { Json } from '@/types/supabase'

/**
 * Convert stored JSON messages to Message type
 */
export function jsonToMessages(json: Json): Message[] {
  if (!Array.isArray(json)) return []
  
  return json.map((item: any) => ({
    id: item.id || '',
    role: item.role || 'assistant',
    content: item.content || '',
    components: item.components,
    suggestions: item.suggestions,
    timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
  }))
}

/**
 * Convert Message objects to JSON for storage
 */
export function messagesToJson(messages: Message[]): Json {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    components: msg.components as any, // Cast to any for JSON compatibility
    suggestions: msg.suggestions,
    timestamp: msg.timestamp.toISOString()
  })) as Json
}