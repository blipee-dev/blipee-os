/**
 * Chat Attachments API
 *
 * Handles file uploads and attachment management for conversations.
 * Part of FASE 2 - Conversation Intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversation_id') as string;
    const messageId = formData.get('message_id') as string | null;

    if (!file || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, conversation_id' },
        { status: 400 }
      );
    }

    // Verify conversation ownership
    const { data: conversation } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Generate unique storage path
    const fileExt = file.name.split('.').pop();
    const fileName = `${randomBytes(16).toString('hex')}.${fileExt}`;
    const storagePath = `chat-attachments/${user.id}/${conversationId}/${fileName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(storagePath);

    // Create attachment record
    const { data: attachment, error: dbError } = await supabase
      .from('chat_attachments')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        file_name: file.name,
        file_type: file.type,
        file_size_bytes: file.size,
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        processing_status: 'pending',
        uploaded_by_user_id: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('attachments').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to create attachment record' },
        { status: 500 }
      );
    }

    // TODO: Trigger background processing for text extraction
    // This would be handled by a background worker

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Attachment upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const messageId = searchParams.get('message_id');

    let query = supabase
      .from('chat_attachments')
      .select('*')
      .eq('uploaded_by_user_id', user.id)
      .order('created_at', { ascending: false });

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    if (messageId) {
      query = query.eq('message_id', messageId);
    }

    const { data: attachments, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attachments' },
        { status: 500 }
      );
    }

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Attachments fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Missing attachment ID' },
        { status: 400 }
      );
    }

    // Get attachment to verify ownership and get storage path
    const { data: attachment, error: fetchError } = await supabase
      .from('chat_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('uploaded_by_user_id', user.id)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([attachment.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('chat_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete attachment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attachment deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
