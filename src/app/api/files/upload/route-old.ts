import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DocumentParser } from "@/lib/data/document-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const conversationId = formData.get("conversationId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique file name
    const timestamp = Date.now();
    const fileName = `${conversationId}/${timestamp}_${file.name}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(fileName);

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
      console.error("Parse error:", parseError);
      // Continue even if parsing fails
    }

    // Store file metadata in database
    const { data: fileRecord, error: dbError } = await supabase
      .from("uploaded_files")
      .insert({
        conversation_id: conversationId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        public_url: publicUrl,
        extracted_data: extractedData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Continue even if database insert fails
    }

    return NextResponse.json({
      fileId: fileRecord?.id || timestamp.toString(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      publicUrl,
      extractedData,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
