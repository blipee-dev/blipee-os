import { NextRequest } from "next/server";
import { ChatRequest } from "@/types/conversation";
import { aiService } from "@/lib/ai/service";
import {
  BLIPEE_SYSTEM_PROMPT,
  buildPrompt,
  buildDemoContext,
} from "@/lib/ai/prompt-builder";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message } = body;

    const context = buildDemoContext();
    const prompt = buildPrompt(message, context);

    // Create a ReadableStream for the response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const streamResponse = aiService.stream(prompt, {
            systemPrompt: BLIPEE_SYSTEM_PROMPT,
            temperature: 0.7,
            maxTokens: 1000,
          });

          for await (const token of streamResponse) {
            if (token.content) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ content: token.content })}\n\n`,
                ),
              );
            }

            if (token.isComplete) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
              );
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream API error:", error);
    return new Response("Streaming failed", { status: 500 });
  }
}
