import OpenAI from 'openai'
import { AIProvider, CompletionOptions, CompletionResponse, StreamOptions, StreamToken } from '../types'

export class DeepSeekProvider implements AIProvider {
  name = 'DeepSeek'
  private client: OpenAI

  constructor(apiKey: string) {
    // DeepSeek uses OpenAI-compatible API
    this.client = new OpenAI({ 
      apiKey,
      baseURL: 'https://api.deepseek.com/v1'
    })
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse> {
    const completion = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000
    })

    return {
      content: completion.choices[0].message.content || '',
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      } : undefined,
      model: completion.model
    }
  }

  async *stream(prompt: string, options?: StreamOptions): AsyncGenerator<StreamToken, void, unknown> {
    const stream = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      stream: true
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        options?.onToken?.(content)
        yield { content, isComplete: false }
      }
    }

    yield { content: '', isComplete: true }
  }
}