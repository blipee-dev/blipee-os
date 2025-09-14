import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const auditEventSchema = z.object({
  event: z.object({
    actor: z.object({
      id: z.string().nullable(),
      type: z.string(),
      email: z.string().optional(),
    }),
    action: z.object({
      type: z.string(),
      category: z.string(),
      timestamp: z.string(),
    }),
    resource: z.object({
      type: z.string(),
      id: z.string(),
      name: z.string().optional(),
    }),
    outcome: z.object({
      status: z.string(),
      error: z.string().optional(),
    }),
    context: z.object({
      user_agent: z.string().optional(),
      session_id: z.string().optional(),
      request_id: z.string().optional(),
      environment: z.string().optional(),
    }).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = auditEventSchema.parse(body);

    // Get Supabase admin client with service role for audit logging
    const supabase = createAdminClient();

    // Store the audit event in audit_events table (JSONB format)
    const eventData = {
      ...validatedData.event,
      context: {
        ...validatedData.event.context,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'unknown',
      },
    };

    const { error } = await supabase
      .from('audit_events')
      .insert({
        event: eventData,
      });

    if (error) {
      console.error('Failed to store audit event:', error);
      return NextResponse.json(
        { error: 'Failed to store audit event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Audit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Support GET for health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'audit' });
}