import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentParser } from "@/lib/data/document-parser";
import { withAuth } from "@/middleware/auth-new";
import { withErrorHandler } from "@/lib/api/error-handler";
import { rateLimit, RateLimitConfigs } from "@/lib/api/rate-limit";
import { z } from "zod";
import path from "path";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

// Allowed file types and extensions
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.csv', '.png', '.jpg', '.jpeg', '.xlsx', '.xls'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Validation schema
const uploadSchema = z.object({
  conversationId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
});

const limiter = rateLimit(RateLimitConfigs.files.upload);

export const POST = withAuth(withErrorHandler(async (req: NextRequest, _userId: string) => {
  // Check rate limit
  await limiter.check(req, RateLimitConfigs.files.upload.limit, userId);

  const formData = await req.formData();
    const file = formData.get("file") as File;
    const conversationId = formData.get("conversationId") as string;
    const organizationId = formData.get("organizationId") as string;

    // Validate form data
    const validated = uploadSchema.parse({ conversationId, organizationId });

    if (!file) {
      return NextResponse.json({ _error: "No file provided" }, { status: 400 });
    }

    // Security: Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { _error: "Invalid file type. Allowed types: PDF, CSV, PNG, JPG, XLSX" },
        { status: 400 }
      );
    }

    // Security: Validate file extension
    const fileExt = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { _error: "Invalid file extension" },
        { status: 400 }
      );
    }

    // Security: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { _error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Security: Sanitize filename
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Security: Generate secure file path with UUID
    const fileId = crypto.randomUUID();
    const timestamp = Date.now();
    const securePath = `uploads/${userId}/${fileId}/${timestamp}_${sanitizedFileName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Security: Basic file content validation (magic bytes)
    if (!validateFileContent(buffer, file.type)) {
      return NextResponse.json(
        { _error: "File content does not match file type" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Upload to Supabase Storage with secure path
    const { data: _uploadData, _error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(securePath, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error("Upload _error:", uploadError);
      return NextResponse.json(
        { _error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Process file with document parser
    let extractedData = null;
    try {
      const parser = new DocumentParser();

      if (file.type === "application/pdf") {
        extractedData = await parser.parsePDF(buffer);
      } else if (file.type.startsWith("image/")) {
        extractedData = await parser.parseImage(buffer);
      } else if (
        file.type.includes("spreadsheet") ||
        file.type.includes("excel") ||
        file.type === "text/csv"
      ) {
        extractedData = await parser.parseSpreadsheet(buffer);
      }
    } catch (parseError) {
      console.error("Parse _error:", parseError);
      // Continue even if parsing fails
    }

    // Store file metadata in database with user association
    const { data: fileRecord, _error: dbError } = await (supabase as any)
      .from("uploaded_files")
      .insert({
        id: fileId,
        user_id: userId,
        conversation_id: validated.conversationId,
        organization_id: validated.organizationId,
        file_name: sanitizedFileName,
        original_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: securePath,
        extracted_data: extractedData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database _error:", dbError);
      // Clean up uploaded file
      await supabase.storage.from("uploads").remove([securePath]);
      return NextResponse.json(
        { _error: "Failed to save file metadata" },
        { status: 500 }
      );
    }

    // Don't return direct public URL for security
    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        name: fileRecord.file_name,
        type: fileRecord.file_type,
        size: fileRecord.file_size,
        uploadedAt: fileRecord.created_at,
      },
      extractedData: extractedData ? {
        summary: extractedData.summary || "Data extracted successfully",
        dataPoints: extractedData.dataPoints || 0,
      } : null,
    });
}));

/**
 * Validate file content by checking magic bytes
 */
function validateFileContent(buffer: Buffer, mimeType: string): boolean {
  const magicBytes: Record<string, number[]> = {
    'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
    'image/png': [0x89, 0x50, 0x4E, 0x47], // PNG
    'image/jpeg': [0xFF, 0xD8, 0xFF], // JPEG
  };

  const expectedBytes = magicBytes[mimeType];
  if (!expectedBytes) {
    // Skip validation for types without magic bytes check
    return true;
  }

  for (let i = 0; i < expectedBytes.length; i++) {
    if (buffer[i] !== expectedBytes[i]) {
      return false;
    }
  }

  return true;
}

/**
 * GET endpoint to retrieve file metadata (not the file itself)
 */
export const GET = withAuth(withErrorHandler(async (req: NextRequest, _userId: string) => {
  const fileId = req.nextUrl.searchParams.get('id');
    
    if (!fileId || !z.string().uuid().safeParse(fileId).success) {
      return NextResponse.json(
        { _error: "Valid file ID required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get file metadata with access control
    const { data: file, error } = await (supabase as any)
      .from("uploaded_files")
      .select("id, file_name, file_type, file_size, created_at, extracted_data")
      .eq("id", fileId)
      .eq("user_id", userId) // Ensure user owns the file
      .single();

    if (error || !file) {
      return NextResponse.json(
        { _error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ file });
}));