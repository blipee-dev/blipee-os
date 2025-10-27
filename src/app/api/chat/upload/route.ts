/**
 * File Upload API for Chat Attachments
 *
 * Handles file uploads for chat conversations:
 * - PDF documents
 * - CSV/Excel files
 * - Images (JPG, PNG)
 * - Utility bills and invoices
 *
 * Files are:
 * 1. Uploaded to Supabase Storage
 * 2. Stored in chat_attachments table
 * 3. Processed for text extraction
 * 4. Converted to embeddings for RAG
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { aiOrchestrator, TaskType } from '@/lib/ai/orchestrator';
import { metrics } from '@/lib/monitoring/metrics';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

/**
 * POST /api/chat/upload
 * Upload files for chat conversations
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = createClient();

    // Authenticate user
    const user = await getAPIUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;
    const messageId = formData.get('messageId') as string | null;

    if (!file || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, conversationId' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: PDF, CSV, Excel, JPG, PNG' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Get conversation to verify access
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id, organization_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation || conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 403 }
      );
    }

    // Generate unique file name
    const timestamp = Date.now();
    const fileName = `${conversation.organization_id}/${conversationId}/${timestamp}-${file.name}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Create attachment record
    const { data: attachment, error: attachmentError } = await supabase
      .from('chat_attachments')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size_bytes: file.size,
        storage_path: uploadData.path,
        processing_status: 'pending',
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        }
      })
      .select()
      .single();

    if (attachmentError || !attachment) {
      console.error('Attachment record error:', attachmentError);
      return NextResponse.json(
        { error: 'Failed to create attachment record' },
        { status: 500 }
      );
    }

    // Process file asynchronously
    processFileAsync(
      attachment.id,
      uploadData.path,
      file.type,
      conversation.organization_id,
      supabase
    );

    // Record metrics
    metrics.incrementCounter('chat_file_uploads', 1, {
      organization_id: conversation.organization_id,
      file_type: file.type,
      file_size_kb: Math.round(file.size / 1024).toString()
    });

    metrics.recordHistogram('chat_upload_time_ms', Date.now() - startTime, {
      organization_id: conversation.organization_id
    });

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: 'pending',
        message: 'File uploaded successfully. Processing...'
      }
    });

  } catch (error) {
    console.error('Upload API error:', error);

    metrics.incrementCounter('chat_upload_errors', 1, {
      error_type: 'upload_failed'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process uploaded file asynchronously
 * - Extract text from PDFs
 * - Parse CSVs
 * - OCR images
 * - Generate embeddings
 */
async function processFileAsync(
  attachmentId: string,
  storagePath: string,
  fileType: string,
  organizationId: string,
  supabase: any
): Promise<void> {
  try {
    // Update status to processing
    await supabase
      .from('chat_attachments')
      .update({ processing_status: 'processing' })
      .eq('id', attachmentId);

    let extractedText = '';
    let analysisType = 'general';

    // Determine analysis type based on file type
    if (fileType === 'application/pdf') {
      analysisType = 'document';
    } else if (fileType.includes('image')) {
      analysisType = 'image';
    } else if (fileType.includes('csv') || fileType.includes('excel')) {
      analysisType = 'data';
    }

    // Use AI orchestrator for document processing
    const result = await aiOrchestrator.executeTask({
      type: TaskType.MULTIMODAL,
      input: `Extract and analyze the content of this ${fileType} file. Focus on sustainability data, emissions, energy consumption, and compliance information.`,
      context: {
        filePath: storagePath,
        fileType,
        analysisType,
        organizationId
      }
    });

    extractedText = result.result || '';

    // Generate embedding for the extracted text
    let embedding: number[] | null = null;
    if (extractedText && extractedText.length > 10) {
      try {
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: extractedText.substring(0, 8000) // Limit to first 8000 chars
          })
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          embedding = embeddingData.data[0].embedding;
        }
      } catch (error) {
        console.error('Error generating embedding:', error);
      }
    }

    // Update attachment with extracted text
    await supabase
      .from('chat_attachments')
      .update({
        processing_status: 'completed',
        extracted_text: extractedText,
        metadata: {
          processingCompletedAt: new Date().toISOString(),
          extractedLength: extractedText.length,
          hasEmbedding: !!embedding
        }
      })
      .eq('id', attachmentId);

    // Store in documents_embeddings for RAG
    if (embedding && extractedText) {
      await supabase
        .from('documents_embeddings')
        .insert({
          organization_id: organizationId,
          title: `Chat Attachment ${attachmentId}`,
          content: extractedText,
          document_type: 'chat_attachment',
          embedding,
          metadata: {
            attachmentId,
            storagePath,
            fileType
          }
        });
    }

    metrics.incrementCounter('chat_file_processing_completed', 1, {
      organization_id: organizationId,
      file_type: fileType,
      has_embedding: embedding ? 'true' : 'false'
    });

  } catch (error) {
    console.error('File processing error:', error);

    // Update status to failed
    await supabase
      .from('chat_attachments')
      .update({
        processing_status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Processing failed',
          failedAt: new Date().toISOString()
        }
      })
      .eq('id', attachmentId);

    metrics.incrementCounter('chat_file_processing_errors', 1, {
      organization_id: organizationId,
      error_type: 'processing_failed'
    });
  }
}

/**
 * GET /api/chat/upload?attachmentId=xxx
 * Get upload/processing status
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // Authenticate user
    const user = await getAPIUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Missing attachmentId parameter' },
        { status: 400 }
      );
    }

    // Get attachment status
    const { data: attachment, error } = await supabase
      .from('chat_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('user_id', user.id)
      .single();

    if (error || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: attachment.id,
      fileName: attachment.file_name,
      fileType: attachment.file_type,
      fileSize: attachment.file_size_bytes,
      status: attachment.processing_status,
      extractedText: attachment.extracted_text,
      metadata: attachment.metadata,
      createdAt: attachment.created_at
    });

  } catch (error) {
    console.error('Get attachment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
