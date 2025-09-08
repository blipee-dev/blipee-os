import { NextRequest, NextResponse } from "next/server";
import { getMenuResponse, generateDynamicContent, menuTree } from "@/lib/chat/menu-navigation";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Use the menu navigation system
    let response = getMenuResponse(message);
    
    // If menu navigation found a response, use it
    if (response) {
      // Add dynamic content for terminal actions
      if (response.action) {
        const dynamicContent = generateDynamicContent(response.action);
        response = { ...response, ...dynamicContent };
      }
    } 
    // Natural language fallback
    else {
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
        response = {
          message: "I'm Blipee AI, your building intelligence assistant. I can help you with:\n\n• **Real-time monitoring** of energy, climate, and operations\n• **Generate reports** for compliance, sustainability, and performance\n• **Optimize** building systems for efficiency and comfort\n• **Track** carbon emissions and ESG metrics\n• **Analyze** costs and identify savings opportunities\n\nUse the menu below to explore specific features:",
          suggestions: menuTree.main.suggestions
        };
      } else if (lowerMessage.includes("energy") || lowerMessage.includes("power")) {
        response = menuTree.energy;
      } else if (lowerMessage.includes("report") || lowerMessage.includes("analytics")) {
        response = menuTree.analytics;
      } else if (lowerMessage.includes("sustain") || lowerMessage.includes("esg") || lowerMessage.includes("carbon")) {
        response = menuTree.sustainability;
      } else if (lowerMessage.includes("building") || lowerMessage.includes("operations") || lowerMessage.includes("maintenance")) {
        response = menuTree.operations;
      } else {
        // Default to main menu
        response = {
          message: `I understand you're asking about "${message}". Let me help you find the right feature. What area would you like to explore?`,
          suggestions: menuTree.main.suggestions
        };
      }
    }

    // Add timestamp and return
    const finalResponse = {
      ...response,
      timestamp: new Date().toISOString(),
      cached: false
    };

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat request',
        message: "I'm having trouble processing your request. Please try again."
      },
      { status: 500 }
    );
  }
}