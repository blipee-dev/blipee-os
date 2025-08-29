import { NextRequest, NextResponse } from "next/server";
import {
  handleDocumentInChat,
  handleBatchDocuments,
} from "@/lib/ai/document-handler";
import { conversationalEngine } from "@/lib/ai/conversational-engine";
import { createClient } from "@supabase/supabase-js";

// Lazy initialization to avoid build errors
let supabase: any;

function getSupabase() {
  if (!supabase && process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );
  }
  return supabase;
}

export async function POST(_request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let message: string;
    let conversationId: string;
    let organizationId: string;
    let _userId: string;
    let files: File[] = [];

    // Handle different content types
    if (contentType.includes("multipart/form-data")) {
      // File upload with message
      const formData = await request.formData();
      message = (formData.get("message") as string) || "";
      conversationId = formData.get("conversationId") as string;
      organizationId = formData.get("organizationId") as string;
      userId = formData.get("userId") as string;

      // Collect all uploaded files
      const entries = Array.from(formData.entries());
      for (const [, value] of entries) {
        if (value instanceof File) {
          files.push(value);
        }
      }
    } else {
      // Regular JSON message
      const body = await request.json();
      message = body.message;
      conversationId = body.conversationId;
      organizationId = body.organizationId;
      userId = body.userId;
    }

    // Initialize response
    let aiResponse = "";
    let extractedData = null;
    let components = [];

    // Process uploaded files if any
    if (files.length > 0) {
      console.log(`📄 Processing ${files.length} uploaded file(s)...`);

      if (files.length === 1 && files[0]) {
        // Single file - detailed response
        aiResponse = await handleDocumentInChat(
          files[0],
          organizationId,
          userId,
          "openai", // Can be switched to 'deepseek' or 'anthropic'
        );
      } else {
        // Multiple files - batch processing
        aiResponse = await handleBatchDocuments(files, organizationId, userId);
      }

      // Add context about files to the message
      if (message) {
        message += `\n\nContext: I just uploaded ${files.length} document(s) and you processed them.`;
      }
    }

    // Process the message with AI (if there's a message beyond just file upload)
    if (message && message.trim() !== "") {
      const contextualResponse = await conversationalEngine.chat(message);

      // Combine file processing response with conversational response
      if (aiResponse) {
        aiResponse = `${aiResponse}\n\n${contextualResponse.response}`;
      } else {
        aiResponse = contextualResponse.response;
      }

      // Add any UI components from the conversational engine
      if (contextualResponse.visualizations) {
        components.push(...contextualResponse.visualizations);
      }
    }

    // Store the conversation
    if (conversationId && getSupabase()) {
      await getSupabase().from("conversations").insert({
        id: conversationId,
        user_message: message || `Uploaded ${files.length} file(s)`,
        assistant_message: aiResponse,
        organization_id: organizationId,
        user_id: userId,
        metadata: {
          files_processed: files.length,
          file_names: files.map((f) => f.name),
        },
      });
    }

    // Generate smart suggestions based on what was processed
    const suggestions = generateSmartSuggestions(files, extractedData);

    return NextResponse.json({
      message: aiResponse,
      components,
      suggestions,
      metadata: {
        filesProcessed: files.length,
        processingTime: Date.now() - Date.now(),
      },
    });
  } catch (_error: any) {
    console.error("Enhanced chat API _error:", error);
    return NextResponse.json(
      { _error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

/**
 * Generate smart suggestions based on uploaded documents
 */
function generateSmartSuggestions(files: File[], _extractedData: any): string[] {
  const suggestions: string[] = [];

  if (files.length === 0) {
    return [
      "Upload a sustainability report to analyze",
      "Show me our emissions trend",
      "What are our sustainability targets?",
      "How can we reduce emissions?",
    ];
  }

  // Suggestions based on file types
  const fileTypes = files.map((f) => f.name.toLowerCase());

  if (
    fileTypes.some(
      (name) => name.includes("sustainability") || name.includes("esg"),
    )
  ) {
    suggestions.push(
      "Compare this report with last year",
      "Show me the emissions breakdown",
      "What are the key improvements?",
      "Generate a CSRD-compliant summary",
    );
  }

  if (
    fileTypes.some((name) => name.includes("utility") || name.includes("bill"))
  ) {
    suggestions.push(
      "How does this compare to last month?",
      "Calculate the emissions from this bill",
      "Show me energy usage trends",
      "Suggest ways to reduce consumption",
    );
  }

  if (fileTypes.some((name) => name.includes("invoice"))) {
    suggestions.push(
      "Which items have the highest carbon impact?",
      "Track these expenses",
      "Find sustainable alternatives",
      "Calculate total emissions from purchases",
    );
  }

  // Always include some general suggestions
  suggestions.push(
    "Show me a sustainability dashboard",
    "What's our progress toward net zero?",
  );

  return suggestions.slice(0, 4);
}
