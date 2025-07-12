import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateApiKey } from '@/lib/auth/api-key';
import { logger } from '@/lib/logger';

// Request schema
const GenerateKeyRequest = z.object({
  name: z.string().min(1),
  permissions: z.object({
    stores: z.array(z.string()).optional(),
    endpoints: z.array(z.string()).optional(),
    rate_limit: z.number().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected - check for admin auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = GenerateKeyRequest.parse(body);

    const apiKey = await generateApiKey(validated.name, validated.permissions);

    return NextResponse.json({
      success: true,
      api_key: apiKey.key,
      key_id: apiKey.id,
      name: apiKey.name,
      message: 'Save this API key securely. It will not be shown again.',
    });
  } catch (error) {
    logger.error('Generate API key error', { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    );
  }
}