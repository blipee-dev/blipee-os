import { NextRequest } from 'next/server'
import { ChatRequest } from '@/types/conversation'
import { aiService } from '@/lib/ai/service'
import { BLIPEE_SYSTEM_PROMPT, buildPrompt, buildDemoContext } from '@/lib/ai/prompt-builder'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message } = body
    
    const context = buildDemoContext()
    const prompt = buildPrompt(message, context)
    
    // Create a TransformStream for streaming response
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    
    // Start streaming in the background
    (async () => {
      try {
        const streamResponse = aiService.stream(prompt, {
          systemPrompt: BLIPEE_SYSTEM_PROMPT,
          temperature: 0.7,
          maxTokens: 1000
        })
        
        for await (const token of streamResponse) {
          if (token.content) {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ content: token.content })}\n\n`)
            )
          }
          
          if (token.isComplete) {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            )
          }
        }
      } catch (error) {
        console.error('Streaming error:', error)
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`)
        )
      } finally {
        await writer.close()
      }
    })()
    
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Stream API error:', error)
    return new Response('Streaming failed', { status: 500 })
  }
}