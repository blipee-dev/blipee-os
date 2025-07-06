import { ChatResponse, UIComponent, Action } from '@/types/conversation'

export function parseAIResponse(content: string): Partial<ChatResponse> {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content)
    
    // Validate and extract fields
    const response: Partial<ChatResponse> = {
      message: parsed.message || content,
      components: validateComponents(parsed.components),
      actions: validateActions(parsed.actions),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : undefined
    }
    
    return response
  } catch (error) {
    // If not valid JSON, treat as plain text response
    console.log('Failed to parse as JSON, treating as plain text')
    return {
      message: content,
      components: undefined,
      actions: undefined,
      suggestions: undefined
    }
  }
}

function validateComponents(components: any): UIComponent[] | undefined {
  if (!Array.isArray(components)) return undefined
  
  return components
    .filter(comp => comp && typeof comp === 'object' && comp.type)
    .map(comp => ({
      type: comp.type,
      props: comp.props || {},
      layout: comp.layout
    }))
}

function validateActions(actions: any): Action[] | undefined {
  if (!Array.isArray(actions)) return undefined
  
  return actions
    .filter(action => action && typeof action === 'object' && action.type)
    .map(action => ({
      type: action.type,
      description: action.description || '',
      data: action.data
    }))
}

// Helper to extract text from streaming response
export function extractStreamContent(chunks: string[]): string {
  return chunks.join('')
}