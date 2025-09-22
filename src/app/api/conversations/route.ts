import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { withMiddleware, middlewareConfigs } from "@/lib/middleware";
import { conversationCreateSchema } from "@/lib/validation/schemas";

// GET /api/conversations - Get user's conversations
async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ conversations: data || [] });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use parsed body from middleware if available, otherwise parse JSON
    const body = (request as any).parsedBody || await request.json();
    const { buildingId } = body;

    const insertData: any = {
      user_id: user.id,
      messages: [],
      context: {}
    };

    // Only add building_id if provided
    if (buildingId) {
      insertData.building_id = buildingId;
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Update conversation
async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.pathname.split('/').pop();
    // Use parsed body from middleware if available, otherwise parse JSON
    const body = (request as any).parsedBody || await request.json();
    const { messages, context } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (messages) updateData.messages = messages;
    if (context) updateData.context = context;

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .eq('user_id', user.id) // Ensure user owns the conversation
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete conversation
async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.pathname.split('/').pop();

    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}

// Export with middleware
export const GETWithMiddleware = withMiddleware(GET, middlewareConfigs.api);
export const POSTWithMiddleware = withMiddleware(POST, {
  ...middlewareConfigs.api,
  validation: {
    body: conversationCreateSchema,
  },
});
export const PATCHWithMiddleware = withMiddleware(PATCH, middlewareConfigs.api);
export const DELETEWithMiddleware = withMiddleware(DELETE, middlewareConfigs.api);

export {
  GETWithMiddleware as GET,
  POSTWithMiddleware as POST,
  PATCHWithMiddleware as PATCH,
  DELETEWithMiddleware as DELETE
};