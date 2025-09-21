import { NextRequest } from "next/server";
import { aiService } from "@/lib/ai/service";
import { chatMessageSchema, validateAndSanitize } from "@/lib/validation/schemas";
import { withMiddleware, middlewareConfigs } from "@/lib/middleware";
import { aiCache } from "@/lib/cache/ai-cache";
import { weatherService } from "@/lib/external-apis/weather";

export const dynamic = 'force-dynamic';

// Streaming POST handler for real-time AI responses
async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = validateAndSanitize(chatMessageSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid message data' }),
        { status: 400 }
      );
    }

    const { message, conversationId, buildingContext } = validation.data;

    // Check cache first
    const cachedResponse = await aiCache.getCachedResponse(message, 'stream');
    if (cachedResponse && !body.noCache) {
      return new Response(
        JSON.stringify({ ...cachedResponse, cached: true }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create a TransformStream for streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming in background
    (async () => {
      try {
        let fullResponse = '';

        // Send initial metadata
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'start',
            conversationId,
            timestamp: new Date().toISOString()
          })}\n\n`)
        );

        // Fetch real-time data if building context provided
        let weatherData = null;
        if (buildingContext?.metadata?.latitude && buildingContext?.metadata?.longitude) {
          weatherData = await weatherService.getOptimizationInsights(
            buildingContext.metadata.latitude,
            buildingContext.metadata.longitude
          );

          // Send weather data
          if (weatherData) {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({
                type: 'context',
                weather: weatherData.current,
                recommendations: weatherData.recommendations
              })}\n\n`)
            );
          }
        }

        // Build enhanced prompt with weather context
        const systemPrompt = `You are Blipee AI, an intelligent sustainability assistant with real-time data access.
${buildingContext ? `\nBuilding: ${buildingContext.name}` : ''}
${weatherData ? `\nCurrent Weather: ${JSON.stringify(weatherData.current)}` : ''}
${weatherData?.recommendations ? `\nWeather-based recommendations: ${JSON.stringify(weatherData.recommendations)}` : ''}

Provide actionable insights and be specific about energy optimization opportunities.`;

        // Stream AI response
        const aiStream = aiService.stream(message, {
          systemPrompt,
          temperature: 0.7,
          maxTokens: 1000,
        });

        for await (const token of aiStream) {
          if (token.content) {
            fullResponse += token.content;

            // Send token
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({
                type: 'token',
                content: token.content
              })}\n\n`)
            );
          }

          if (token.isComplete) {
            // Generate suggestions based on response
            const suggestions = generateContextualSuggestions(fullResponse, weatherData);

            // Send completion with metadata
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({
                type: 'complete',
                suggestions,
                weatherInsights: weatherData?.recommendations,
                timestamp: new Date().toISOString()
              })}\n\n`)
            );

            // Cache the complete response
            await aiCache.cacheResponse(message, {
              content: fullResponse,
              provider: 'stream',
              model: 'default',
              timestamp: new Date().toISOString(),
              suggestions,
            }, 'stream');
          }
        }

        // Send done signal
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Streaming error:', error);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: 'Stream interrupted'
          })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    // Return the readable stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat stream error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start stream' }),
      { status: 500 }
    );
  }
}

// Generate contextual suggestions
function generateContextualSuggestions(response: string, weatherData: any): string[] {
  const suggestions = [];

  // Weather-based suggestions
  if (weatherData?.current) {
    if (weatherData.current.temp > 25) {
      suggestions.push('Analyze cooling efficiency');
    }
    if (weatherData.current.humidity > 70) {
      suggestions.push('Check dehumidification systems');
    }
  }

  // Response-based suggestions
  if (response.toLowerCase().includes('energy')) {
    suggestions.push('Show energy trends', 'Generate efficiency report');
  }
  if (response.toLowerCase().includes('carbon') || response.toLowerCase().includes('emissions')) {
    suggestions.push('Calculate carbon footprint', 'Set reduction targets');
  }

  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      'View dashboard',
      'Generate report',
      'Show optimizations',
      'What else can you help with?'
    );
  }

  return suggestions.slice(0, 4);
}

export const POSTWithMiddleware = withMiddleware(POST, middlewareConfigs.ai);
export { POSTWithMiddleware as POST };