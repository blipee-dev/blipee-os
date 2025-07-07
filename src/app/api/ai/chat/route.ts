import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse } from "@/types/conversation";
import { aiService } from "@/lib/ai/service";
import {
  BLIPEE_SYSTEM_PROMPT,
  buildPrompt,
  buildDemoContext,
} from "@/lib/ai/prompt-builder";
import { parseAIResponse } from "@/lib/ai/response-parser";
import { intelligentActionPlanner } from "@/lib/ai/action-planner";
import { conversationalEngine } from "@/lib/ai/conversational-engine";
import { predictiveIntelligence } from "@/lib/ai/predictive-intelligence";
import { recommendationEngine } from "@/lib/ai/recommendation-engine";
import { visualIntelligence } from "@/lib/ai/visual-intelligence";
import { reportIntelligence } from "@/lib/ai/report-intelligence";
import {
  handleDocumentInChat,
  handleBatchDocuments,
} from "@/lib/ai/document-handler";

// Demo responses for fallback when AI is not available
const demoResponses: Record<string, Partial<ChatResponse>> = {
  "building-report": {
    message:
      "Here's your comprehensive building report for today. Everything is running smoothly with 87% energy efficiency and optimal comfort levels maintained across all zones.",
    components: [
      {
        type: "building-dashboard",
        props: {
          title: "Today's Building Report",
          realTimeMetrics: {
            energy: {
              currentUsage: 4520,
              trend: "stable" as const,
              efficiency: 87,
              cost: 342.5,
            },
            comfort: {
              temperature: 22.5,
              humidity: 45,
              airQuality: 92,
            },
            occupancy: {
              current: 127,
              capacity: 200,
              zones: [
                { name: "Floor 1", occupancy: 45 },
                { name: "Floor 2", occupancy: 38 },
                { name: "Floor 3", occupancy: 32 },
                { name: "Conference", occupancy: 12 },
              ],
            },
            alerts: [
              {
                type: "warning" as const,
                message: "Chiller #2 efficiency below optimal",
                priority: "medium" as const,
              },
              {
                type: "info" as const,
                message: "Maintenance scheduled for 10:00 AM",
                priority: "low" as const,
              },
            ],
          },
          predictions: {
            nextHour: 4680,
            peakToday: 5200,
            monthlySavings: 2840,
          },
        },
      },
    ],
    suggestions: [
      "Show me energy optimization opportunities",
      "What equipment needs attention?",
      "How can I improve efficiency?",
      "Show me cost breakdown",
    ],
  },
  energy: {
    message:
      "Your building is currently using 4,520 kW of energy. This is 15% below your average for this time of day. HVAC systems are consuming 47% of total energy, lighting 28%, and equipment 25%.",
    components: [
      {
        type: "chart",
        props: {
          title: "Current Energy Usage by System",
          chartType: "pie",
          data: [
            { name: "HVAC", value: 47, color: "#0EA5E9" },
            { name: "Lighting", value: 28, color: "#8B5CF6" },
            { name: "Equipment", value: 25, color: "#10B981" },
          ],
        },
      },
    ],
    suggestions: [
      "Show me energy trends for the past week",
      "What's causing the HVAC usage?",
      "How can I reduce energy consumption?",
    ],
  },
  temperature: {
    message:
      "The main office temperature is currently 22.5°C (72.5°F), which is within the comfort zone. The building average is 22.1°C. All zones are maintaining their setpoints effectively.",
    components: [
      {
        type: "table",
        props: {
          title: "Zone Temperatures",
          data: [
            { zone: "Main Office", temp: "22.5°C", status: "Normal" },
            { zone: "Conference Room A", temp: "21.8°C", status: "Normal" },
            { zone: "Lobby", temp: "23.1°C", status: "Slightly Warm" },
            { zone: "Server Room", temp: "18.5°C", status: "Normal" },
          ],
        },
      },
    ],
  },
  report: {
    message: `I'll generate your sustainability report for last month. The report shows a 12% reduction in energy consumption compared to the previous month, with total emissions of 45.2 tonnes CO₂. You're on track to meet your quarterly sustainability targets.`,
    components: [
      {
        type: "report",
        props: {
          title: "Monthly Sustainability Report",
          period: "November 2024",
          metrics: {
            energySaved: "12%",
            emissions: "45.2 tonnes CO₂",
            cost: "$24,500",
            trend: "improving",
          },
        },
      },
    ],
  },
  savings: {
    message: `I've identified several energy saving opportunities. The biggest impact would come from optimizing your HVAC scheduling - you could save approximately $1,200/month by implementing occupancy-based controls. Additionally, upgrading to LED lighting in the parking garage could save another $400/month.`,
    suggestions: [
      "Show me the HVAC optimization plan",
      "Calculate ROI for LED upgrade",
      "What other savings are possible?",
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, attachments, organizationId, buildingId } = body;

    const startTime = Date.now();

    // Try to use REVOLUTIONARY SUSTAINABILITY AI
    try {
      console.log("🌍 Processing with Blipee Sustainability Intelligence...");

      // Process attachments if any - EXTRACT DATA FROM SUSTAINABILITY REPORTS!
      let fileContext = "";
      let documentResponses: string[] = [];

      if (attachments && attachments.length > 0) {
        console.log(
          `📄 Processing ${attachments.length} uploaded document(s)...`,
        );

        // For each uploaded file, process it with our AI document handler
        for (const attachment of attachments) {
          try {
            let file: File;

            // Handle different attachment formats
            if (attachment.publicUrl) {
              // File was uploaded to Supabase storage
              const response = await fetch(attachment.publicUrl);
              const blob = await response.blob();
              file = new File([blob], attachment.fileName || attachment.name, {
                type: attachment.fileType || attachment.type,
              });
            } else if (attachment.extractedData) {
              // File was already processed, just use the extracted data
              const extractedDataResponse =
                `I've already processed your ${attachment.fileName} and extracted the sustainability data. ` +
                `The data has been stored in your database.`;
              documentResponses.push(extractedDataResponse);
              continue;
            } else {
              // Skip if we can't process
              console.warn(
                `Skipping attachment ${attachment.name}: no publicUrl or extractedData`,
              );
              continue;
            }

            // Process the document and extract sustainability data
            const docResponse = await handleDocumentInChat(
              file,
              organizationId || "demo-org",
              body.userId || "demo-user",
              "openai", // Use OpenAI for document extraction as requested
            );

            documentResponses.push(docResponse);
          } catch (error) {
            console.error(
              `Error processing attachment ${attachment.name || "unknown"}:`,
              error,
            );
            documentResponses.push(
              `I encountered an error processing ${attachment.name || "your file"}. Please try uploading it again.`,
            );
          }
        }

        // Add document processing results to context
        if (documentResponses.length > 0) {
          fileContext = "\n\n" + documentResponses.join("\n\n");
        }
      }

      // Use the conversational engine to understand and respond
      const aiResponse = await conversationalEngine.chat(message + fileContext);

      // Check if user wants predictions
      if (
        message.toLowerCase().includes("predict") ||
        message.toLowerCase().includes("forecast")
      ) {
        const predictions = await predictiveIntelligence.predictEmissions(
          "demo-org",
          "month",
        );
        aiResponse.response += `\n\n${predictions.recommendations.join("\n")}`;
      }

      // Check if user wants recommendations
      if (
        message.toLowerCase().includes("recommend") ||
        message.toLowerCase().includes("suggest")
      ) {
        const recommendations =
          await recommendationEngine.generateRecommendations({
            organizationId: "demo-org",
            currentEmissions: { total: 2847 },
            targets: [{ name: "Net Zero 2027", value: 0 }],
          });
        aiResponse.response += `\n\nTop recommendations:\n${recommendations.quickWins
          .slice(0, 3)
          .map((r) => `• ${r.title}`)
          .join("\n")}`;
      }

      // Check if user wants a report
      if (message.toLowerCase().includes("report")) {
        const report = await reportIntelligence.generateReport(message, {
          period: "Q4 2024",
        });
        aiResponse.response = `I've generated your ${report.format} report. ${report.report.executiveSummary.content}`;
        aiResponse.visualizations =
          report.report.sections[0]?.content?.visualizations;
      }

      // Build comprehensive response
      let finalMessage = aiResponse.response;

      // If we processed documents, prepend the document responses
      if (documentResponses.length > 0) {
        finalMessage =
          documentResponses.join("\n\n") + "\n\n" + aiResponse.response;
      }

      const response: ChatResponse = {
        message: finalMessage,
        components: aiResponse.visualizations as ChatResponse["components"],
        actions: aiResponse.actions,
        suggestions:
          documentResponses.length > 0
            ? [
                "Compare this report with previous years",
                "Show me the emissions breakdown",
                "What are our biggest improvement areas?",
                "Generate a CSRD-compliant summary",
              ]
            : [
                "Show me emission trends",
                "What can I do to reduce emissions?",
                "Generate sustainability report",
                "Compare us to industry benchmarks",
              ],
        metadata: {
          tokensUsed: 2000,
          responseTime: Date.now() - startTime,
          model: "blipee-sustainability-ai",
          confidence: 0.95,
        },
      };

      return NextResponse.json(response);
    } catch (aiError) {
      console.log(
        "Sustainability AI processing failed, falling back:",
        aiError,
      );
    }

    // Fallback to demo responses if AI fails
    const lowerMessage = message.toLowerCase();
    let response: Partial<ChatResponse> = {
      message: `I understand you're asking about your building. Let me help you with that.`,
      metadata: {
        tokensUsed: 150,
        responseTime: Date.now() - startTime,
        model: "demo",
      },
    };

    // Match keywords to provide relevant demo responses
    if (
      lowerMessage.includes("building report") ||
      lowerMessage.includes("today's report") ||
      lowerMessage.includes("dashboard")
    ) {
      response = { ...response, ...demoResponses["building-report"] };
    } else if (
      lowerMessage.includes("energy") ||
      lowerMessage.includes("usage") ||
      lowerMessage.includes("consumption")
    ) {
      response = { ...response, ...demoResponses.energy };
    } else if (
      lowerMessage.includes("temperature") ||
      lowerMessage.includes("temp") ||
      lowerMessage.includes("climate")
    ) {
      response = { ...response, ...demoResponses.temperature };
    } else if (
      lowerMessage.includes("report") ||
      lowerMessage.includes("sustainability")
    ) {
      response = { ...response, ...demoResponses.report };
    } else if (
      lowerMessage.includes("save") ||
      lowerMessage.includes("saving") ||
      lowerMessage.includes("optimize")
    ) {
      response = { ...response, ...demoResponses.savings };
    } else {
      response.message = `I understand you're asking about "${message}". In the full version, I'll be able to help with:\n\n• Real-time energy monitoring\n• Device control\n• Predictive maintenance\n• Sustainability reporting\n• Cost optimization\n\nFor now, try asking about energy usage, temperature, reports, or savings opportunities!`;
      response.suggestions = [
        "Show me current energy usage",
        "What's the temperature?",
        "Generate sustainability report",
        "Find energy savings",
      ];
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

// Helper function to generate intelligent suggestions
function generateIntelligentSuggestions(intelligentResponse: any): string[] {
  const suggestions: string[] = [];

  // Suggest related actions based on the action plan
  if (intelligentResponse.actionPlan.intent.includes("energy")) {
    suggestions.push(
      "Show me the detailed energy breakdown",
      "What would happen if I implement all optimizations?",
      "Create an energy reduction plan for next month",
    );
  }

  // Add predictions as suggestions
  intelligentResponse.predictions.forEach((prediction: any) => {
    if (prediction.recommended_action) {
      suggestions.push(prediction.recommended_action);
    }
  });

  // Add automation suggestions
  intelligentResponse.automations.forEach((automation: any) => {
    suggestions.push(`Tell me more about ${automation.name}`);
  });

  // Default intelligent suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      "What can you predict about my building?",
      "Show me optimization opportunities",
      "How can I reduce costs this month?",
    );
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
}
