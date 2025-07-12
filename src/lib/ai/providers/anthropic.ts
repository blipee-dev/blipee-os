import Anthropic from "@anthropic-ai/sdk";
import {
  AIProvider,
  CompletionOptions,
  CompletionResponse,
  StreamOptions,
  StreamToken,
} from "../types";

export class AnthropicProvider implements AIProvider {
  name = "Anthropic";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(
    prompt: string,
    options?: CompletionOptions,
  ): Promise<CompletionResponse> {
    const message = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "user", content: prompt }],
      system: options?.systemPrompt,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    });

    const content =
      message.content[0].type === "text" ? message.content[0].text : "";

    return {
      content,
      usage: message.usage
        ? {
            promptTokens: message.usage.input_tokens,
            completionTokens: message.usage.output_tokens,
            totalTokens:
              message.usage.input_tokens + message.usage.output_tokens,
          }
        : undefined,
      model: message.model,
    };
  }

  async *stream(
    prompt: string,
    options?: StreamOptions,
  ): AsyncGenerator<StreamToken, void, unknown> {
    const stream = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "user", content: prompt }],
      system: options?.systemPrompt,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      stream: true,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        const content = chunk.delta.text;
        if (content) {
          options?.onToken?.(content);
          yield { content, isComplete: false };
        }
      }
    }

    yield { content: "", isComplete: true };
  }
}
