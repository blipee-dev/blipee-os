/**
 * Complete hierarchical menu navigation system for Blipee AI
 * Each path leads to a concrete action or data display
 */

export const menuTree = {
  // MAIN MENU
  main: {
    message: "👋 **Welcome to Blipee AI**\n\nI'm your building intelligence assistant. What would you like to explore?",
    suggestions: [
      "📊 Analytics & Reports",
      "⚡ Energy Management",
      "🌱 Sustainability & ESG",
      "🏢 Building Operations",
      "💼 Quick Actions"
    ]
  },

  // LEVEL 1: ANALYTICS & REPORTS
  analytics: {
    message: "📊 **Analytics & Reports**\n\nSelect the type of analysis or report you need:",
    suggestions: [
      "📈 Performance Reports",
      "💰 Financial Analytics",
      "📋 Compliance Reports",
      "🔍 Custom Analytics",
      "⬅️ Back to Main Menu"
    ]
  },

  // LEVEL 2: Performance Reports
  performanceReports: {
    message: "📈 **Performance Reports**\n\nChoose your report type:",
    suggestions: [
      "📊 Daily Performance Summary",
      "📅 Weekly Trends Report",
      "📆 Monthly Dashboard",
      "📈 Year-to-Date Analysis",
      "⬅️ Back to Analytics"
    ]
  },

  // LEVEL 2: Financial Analytics
  financialAnalytics: {
    message: "💰 **Financial Analytics**\n\nSelect financial analysis:",
    suggestions: [
      "💵 Cost Breakdown Today",
      "📉 Utility Bill Analysis",
      "💡 ROI on Improvements",
      "📊 Budget vs Actual",
      "⬅️ Back to Analytics"
    ]
  },

  // LEVEL 2: Compliance Reports
  complianceReports: {
    message: "📋 **Compliance Reports**\n\nGenerate compliance documentation:",
    suggestions: [
      "🌍 GRI Standards Report",
      "📜 TCFD Disclosure",
      "✅ ISO 14001 Audit",
      "📊 Local Regulations",
      "⬅️ Back to Analytics"
    ]
  },

  // LEVEL 1: ENERGY MANAGEMENT
  energy: {
    message: "⚡ **Energy Management**\n\nMonitor and optimize energy systems:",
    suggestions: [
      "📊 Real-Time Monitoring",
      "⚙️ System Control",
      "📈 Optimization Tools",
      "⏰ Scheduling",
      "⬅️ Back to Main Menu"
    ]
  },

  // LEVEL 2: Real-Time Monitoring
  energyMonitoring: {
    message: "📊 **Real-Time Energy Monitoring**\n\nView current energy metrics:",
    suggestions: [
      "⚡ Current Load (Live)",
      "📊 Zone-by-Zone Usage",
      "🔌 Equipment Status",
      "📈 Demand Curve",
      "⬅️ Back to Energy"
    ]
  },

  // LEVEL 2: System Control
  systemControl: {
    message: "⚙️ **System Control**\n\nAdjust building systems:",
    suggestions: [
      "🌡️ HVAC Settings",
      "💡 Lighting Control",
      "🔌 Equipment Scheduling",
      "🚨 Emergency Shutdown",
      "⬅️ Back to Energy"
    ]
  },

  // LEVEL 1: SUSTAINABILITY & ESG
  sustainability: {
    message: "🌱 **Sustainability & ESG**\n\nTrack environmental impact:",
    suggestions: [
      "🎯 Carbon Management",
      "♻️ Waste & Recycling",
      "💧 Water Conservation",
      "📊 ESG Reporting",
      "⬅️ Back to Main Menu"
    ]
  },

  // LEVEL 2: Carbon Management
  carbonManagement: {
    message: "🎯 **Carbon Management**\n\nTrack and reduce emissions:",
    suggestions: [
      "📊 Current Emissions",
      "📈 Reduction Progress",
      "🎯 Set New Targets",
      "💹 Carbon Credits",
      "⬅️ Back to Sustainability"
    ]
  },

  // LEVEL 2: Waste & Recycling
  wasteManagement: {
    message: "♻️ **Waste & Recycling**\n\nManage waste streams:",
    suggestions: [
      "📊 Diversion Rate",
      "🗑️ Waste Audit",
      "♻️ Recycling Metrics",
      "📈 Reduction Plan",
      "⬅️ Back to Sustainability"
    ]
  },

  // LEVEL 1: BUILDING OPERATIONS
  operations: {
    message: "🏢 **Building Operations**\n\nManage facility operations:",
    suggestions: [
      "🔧 Maintenance",
      "🚨 Alerts & Issues",
      "👥 Occupancy",
      "🔒 Security",
      "⬅️ Back to Main Menu"
    ]
  },

  // LEVEL 2: Maintenance
  maintenance: {
    message: "🔧 **Maintenance Management**\n\nView maintenance activities:",
    suggestions: [
      "📋 Today's Schedule",
      "⚠️ Pending Tasks",
      "✅ Completed Work",
      "📅 Plan Maintenance",
      "⬅️ Back to Operations"
    ]
  },

  // LEVEL 1: QUICK ACTIONS
  quickActions: {
    message: "💼 **Quick Actions**\n\nFrequently used features:",
    suggestions: [
      "📧 Email Report",
      "📥 Download Data",
      "🔔 Set Alert",
      "📸 Take Snapshot",
      "⬅️ Back to Main Menu"
    ]
  }
};

// TERMINAL ACTIONS - These return actual data/actions
export const terminalActions = {
  // Energy Actions
  "⚡ Current Load (Live)": {
    message: "⚡ **Live Energy Load**\n\n🔴 **Real-Time**: 4,523 kW\n\n**By System:**\n• HVAC: 2,100 kW (46%)\n• Lighting: 890 kW (20%)\n• Equipment: 1,233 kW (27%)\n• Other: 300 kW (7%)\n\n**Status**: Operating normally\n**Efficiency**: 87%\n**Projected Daily**: 92.4 MWh",
    suggestions: [
      "🔄 Refresh Data",
      "📊 Show Graph",
      "⚙️ Optimize Now",
      "📧 Send Alert",
      "⬅️ Back"
    ],
    action: "display_data"
  },

  "📊 Daily Performance Summary": {
    message: "📊 **Today's Performance Summary**\n\n**Date**: ${new Date().toLocaleDateString()}\n\n✅ **Achievements:**\n• Energy efficiency: 87% (↑ 3%)\n• Cost savings: $420 vs baseline\n• Carbon reduced: 0.8 tons CO2e\n\n⚠️ **Issues:**\n• HVAC Zone 3 inefficiency\n• Peak demand exceeded at 2 PM\n\n📈 **Recommendations:**\n• Schedule HVAC maintenance\n• Implement demand response",
    suggestions: [
      "📥 Download PDF",
      "📧 Email Team",
      "📈 View Details",
      "🔄 Previous Day",
      "⬅️ Back"
    ],
    action: "generate_report"
  },

  "🌡️ HVAC Settings": {
    message: "🌡️ **HVAC Control Panel**\n\n**Current Settings:**\n• Mode: Auto\n• Temp: 22°C (72°F)\n• Humidity: 45%\n• Fan: Medium\n\n**Zones:**\n• Zone 1: 21°C ✅\n• Zone 2: 22°C ✅\n• Zone 3: 23°C ⚠️\n• Zone 4: 22°C ✅",
    suggestions: [
      "⬆️ Increase Temp",
      "⬇️ Decrease Temp",
      "🔄 Change Mode",
      "📊 Zone Details",
      "⬅️ Back"
    ],
    action: "control_system"
  },

  "📊 Current Emissions": {
    message: "📊 **Current Carbon Emissions**\n\n**Today**: 2.4 tons CO2e\n**This Week**: 14.8 tons CO2e\n**This Month**: 68.5 tons CO2e\n\n**By Scope:**\n• Scope 1: 0.84 tons (35%)\n• Scope 2: 1.32 tons (55%)\n• Scope 3: 0.24 tons (10%)\n\n**Trend**: 📉 -15% vs last month\n**Target**: 2.0 tons/day",
    suggestions: [
      "📈 View Trends",
      "🎯 Reduction Options",
      "📥 Export Data",
      "🔄 Refresh",
      "⬅️ Back"
    ],
    action: "display_metrics"
  },

  "📋 Today's Schedule": {
    message: "📋 **Maintenance Schedule - Today**\n\n**08:00** - HVAC Filter Replacement (Zone 1-2)\n✅ Completed\n\n**10:00** - Emergency Lighting Test\n✅ Completed\n\n**14:00** - Elevator Inspection\n🔄 In Progress\n\n**16:00** - Cooling Tower Cleaning\n⏰ Scheduled\n\n**On-Demand:**\n• Zone 3 thermostat calibration\n• Parking lot light repair",
    suggestions: [
      "✅ Mark Complete",
      "➕ Add Task",
      "👷 Assign Tech",
      "📅 Tomorrow",
      "⬅️ Back"
    ],
    action: "manage_schedule"
  },

  "📧 Email Report": {
    message: "📧 **Email Report Setup**\n\nSelect report type to email:",
    suggestions: [
      "📊 Daily Summary",
      "⚡ Energy Report",
      "🌱 Sustainability Report",
      "💰 Cost Analysis",
      "⬅️ Cancel"
    ],
    action: "email_setup"
  }
};

// Helper function to navigate the menu
export function getMenuResponse(message: string): any {
  // Check main menu items
  if (message === "📊 Analytics & Reports") return menuTree.analytics;
  if (message === "⚡ Energy Management") return menuTree.energy;
  if (message === "🌱 Sustainability & ESG") return menuTree.sustainability;
  if (message === "🏢 Building Operations") return menuTree.operations;
  if (message === "💼 Quick Actions") return menuTree.quickActions;
  
  // Check second level items
  if (message === "📈 Performance Reports") return menuTree.performanceReports;
  if (message === "💰 Financial Analytics") return menuTree.financialAnalytics;
  if (message === "📋 Compliance Reports") return menuTree.complianceReports;
  if (message === "📊 Real-Time Monitoring") return menuTree.energyMonitoring;
  if (message === "⚙️ System Control") return menuTree.systemControl;
  if (message === "🎯 Carbon Management") return menuTree.carbonManagement;
  if (message === "♻️ Waste & Recycling") return menuTree.wasteManagement;
  if (message === "🔧 Maintenance") return menuTree.maintenance;
  
  // Check terminal actions
  if (terminalActions[message]) {
    return terminalActions[message];
  }
  
  // Back navigation
  if (message === "⬅️ Back to Main Menu") return menuTree.main;
  if (message === "⬅️ Back to Analytics") return menuTree.analytics;
  if (message === "⬅️ Back to Energy") return menuTree.energy;
  if (message === "⬅️ Back to Sustainability") return menuTree.sustainability;
  if (message === "⬅️ Back to Operations") return menuTree.operations;
  if (message === "⬅️ Back" || message === "⬅️ Cancel") {
    return menuTree.main; // Default back to main
  }
  
  return null;
}

// Generate dynamic data for terminal actions
export function generateDynamicContent(action: string): any {
  const now = new Date();
  
  switch(action) {
    case "display_data":
      return {
        timestamp: now.toISOString(),
        refreshRate: 5000,
        dataPoints: generateRandomDataPoints()
      };
    
    case "generate_report":
      return {
        reportId: `RPT-${Date.now()}`,
        generatedAt: now.toISOString(),
        format: "PDF",
        size: "2.4 MB"
      };
    
    case "control_system":
      return {
        controlId: `CTL-${Date.now()}`,
        permissions: ["view", "modify"],
        lastModified: now.toISOString()
      };
    
    default:
      return {};
  }
}

function generateRandomDataPoints() {
  const points = [];
  for (let i = 0; i < 24; i++) {
    points.push({
      hour: i,
      value: 3000 + Math.random() * 2000
    });
  }
  return points;
}