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
      
      // Check for dashboard generation requests
      if (lowerMessage.includes("dashboard") || lowerMessage.includes("create") && lowerMessage.includes("sustain")) {
        response = {
          content: "I've created an interactive sustainability dashboard design for you:",
          artifact: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sustainability Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #212121; color: #fff; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; padding: 20px; }
        .card { background: #111111; border-radius: 12px; padding: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .metric { font-size: 36px; font-weight: bold; margin: 10px 0; }
        .label { color: #757575; font-size: 14px; text-transform: uppercase; }
        .trend { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .trend.up { background: #4caf50; }
        .trend.down { background: #f44336; }
        .chart { height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin-top: 20px; }
        h1 { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    </style>
</head>
<body>
    <h1>Sustainability Performance Dashboard</h1>
    <div class="dashboard">
        <div class="card">
            <div class="label">Carbon Emissions</div>
            <div class="metric">1,247 <small>tCO2e</small> <span class="trend down">-12%</span></div>
            <div class="chart"></div>
        </div>
        <div class="card">
            <div class="label">Energy Efficiency</div>
            <div class="metric">87% <span class="trend up">+5%</span></div>
            <div class="chart"></div>
        </div>
        <div class="card">
            <div class="label">Water Usage</div>
            <div class="metric">2,341 <small>gal</small> <span class="trend down">-8%</span></div>
            <div class="chart"></div>
        </div>
        <div class="card">
            <div class="label">Waste Diverted</div>
            <div class="metric">76% <span class="trend up">+15%</span></div>
            <div class="chart"></div>
        </div>
    </div>
</body>
</html>`,
          artifactType: "document",
          artifactTitle: "Sustainability Dashboard",
          artifactLanguage: "html",
          suggestions: ["Add more metrics", "Connect real data", "Export as PDF", "Schedule reports"]
        };
      } else if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
        response = {
          content: "I'm Blipee AI, your building intelligence assistant. I can help you with:\n\n• **Real-time monitoring** of energy, climate, and operations\n• **Generate reports** for compliance, sustainability, and performance\n• **Optimize** building systems for efficiency and comfort\n• **Track** carbon emissions and ESG metrics\n• **Analyze** costs and identify savings opportunities\n\nUse the menu below to explore specific features:",
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
          content: `I understand you're asking about "${message}". Let me help you find the right feature. What area would you like to explore?`,
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