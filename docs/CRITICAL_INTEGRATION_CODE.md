# Critical Integration Code Needed

## 🚨 The 5 Missing Files That Connect Everything

### 1. Unified Orchestrator (THE BRAIN)
**File**: `/src/lib/orchestration/unified-orchestrator.ts`
```typescript
import { ConversationEngine } from '../ai/conversational-engine';
import { AgentManager } from '../ai/autonomous-agents/agent-manager';
import { MLModelServer } from '../ai/ml-models/serving/model-server';
import { ExternalAPIManager } from '../data/external-api-manager';

export class UnifiedOrchestrator {
  private conversation: ConversationEngine;
  private agents: AgentManager;
  private mlServer: MLModelServer;
  private apis: ExternalAPIManager;
  
  constructor() {
    // THIS IS WHAT CONNECTS EVERYTHING
    this.conversation = new ConversationEngine();
    this.agents = AgentManager.getInstance();
    this.mlServer = new MLModelServer();
    this.apis = new ExternalAPIManager();
  }
  
  async processUserMessage(message: string, userId: string) {
    // 1. Understand what the user wants
    const intent = await this.conversation.analyzeIntent(message);
    
    // 2. Get context from all systems
    const context = {
      agentInsights: await this.agents.getRelevantInsights(intent),
      predictions: await this.mlServer.getPredictions(intent),
      externalData: await this.apis.getRelevantData(intent),
      historicalData: await this.getHistoricalContext(userId, intent)
    };
    
    // 3. Route to appropriate handler
    let response;
    switch (intent.category) {
      case 'ESG_ANALYSIS':
        response = await this.handleESGAnalysis(intent, context);
        break;
      case 'COMPLIANCE_CHECK':
        response = await this.handleComplianceCheck(intent, context);
        break;
      case 'PREDICTION_REQUEST':
        response = await this.handlePrediction(intent, context);
        break;
      default:
        response = await this.conversation.generateResponse(message, context);
    }
    
    // 4. Return unified response with UI components
    return {
      message: response.text,
      components: response.uiComponents, // Charts, tables, etc.
      actions: response.suggestedActions,
      data: response.data
    };
  }
  
  private async handleESGAnalysis(intent: any, context: any) {
    // Use ESG Chief agent
    const agent = await this.agents.getAgent('esg-chief-of-staff');
    const analysis = await agent.executeTask({
      type: 'comprehensive-analysis',
      context
    });
    
    // Get ML predictions
    const predictions = await this.mlServer.predict('esg-trends', {
      historical: context.historicalData,
      current: analysis.metrics
    });
    
    // Format response with dynamic UI
    return {
      text: `Here's your ESG analysis: ${analysis.summary}`,
      uiComponents: [
        { type: 'MetricsCard', data: analysis.metrics },
        { type: 'TrendChart', data: predictions.trends },
        { type: 'ComplianceGauge', data: analysis.compliance }
      ],
      suggestedActions: analysis.recommendations,
      data: { analysis, predictions }
    };
  }
}
```

### 2. Agent Activation Service (THE HEART)
**File**: `/src/lib/agents/agent-activation-service.ts`
```typescript
import cron from 'node-cron';
import { AgentManager } from '../ai/autonomous-agents/agent-manager';

export class AgentActivationService {
  private agentManager: AgentManager;
  private activeJobs: Map<string, cron.ScheduledTask> = new Map();
  
  async activateAllAgents(organizationId: string) {
    // ESG Chief of Staff - Daily comprehensive analysis
    this.scheduleAgent('esg-chief', '0 8 * * *', async () => {
      console.log('🤖 ESG Chief starting daily analysis...');
      const agent = await this.agentManager.getAgent('esg-chief-of-staff');
      const results = await agent.executeTask({
        type: 'daily-comprehensive-analysis',
        organizationId
      });
      
      // Store results for dashboard
      await this.storeAgentResults('esg-daily', results);
      
      // Send notifications if critical issues
      if (results.criticalIssues.length > 0) {
        await this.sendNotification('critical-esg', results.criticalIssues);
      }
    });
    
    // Compliance Guardian - Continuous monitoring
    this.scheduleAgent('compliance-guardian', '0 */4 * * *', async () => {
      console.log('🛡️ Compliance Guardian checking regulations...');
      const agent = await this.agentManager.getAgent('compliance-guardian');
      const compliance = await agent.executeTask({
        type: 'compliance-check',
        organizationId
      });
      
      // Update compliance status
      await this.updateComplianceStatus(compliance);
      
      // Alert on new requirements
      if (compliance.newRequirements.length > 0) {
        await this.alertNewRequirements(compliance.newRequirements);
      }
    });
    
    // Carbon Hunter - Real-time monitoring
    this.scheduleAgent('carbon-hunter', '*/15 * * * *', async () => {
      console.log('🌍 Carbon Hunter scanning for reductions...');
      const agent = await this.agentManager.getAgent('carbon-hunter');
      const opportunities = await agent.executeTask({
        type: 'find-reduction-opportunities',
        organizationId
      });
      
      // Auto-implement approved reductions
      for (const opp of opportunities) {
        if (opp.autoApproved && opp.savings > 1000) {
          await this.implementReduction(opp);
        }
      }
    });
    
    // Supply Chain Investigator - Weekly deep dive
    this.scheduleAgent('supply-chain', '0 9 * * 1', async () => {
      console.log('🔍 Supply Chain Investigator analyzing suppliers...');
      const agent = await this.agentManager.getAgent('supply-chain-investigator');
      const assessment = await agent.executeTask({
        type: 'weekly-supplier-assessment',
        organizationId
      });
      
      // Update supplier scores
      await this.updateSupplierScores(assessment);
    });
  }
  
  private scheduleAgent(name: string, schedule: string, task: () => Promise<void>) {
    const job = cron.schedule(schedule, task, { scheduled: true });
    this.activeJobs.set(name, job);
    console.log(`✅ Agent ${name} activated with schedule: ${schedule}`);
  }
}
```

### 3. External Data Pipeline (THE NERVOUS SYSTEM)
**File**: `/src/lib/data-pipeline/real-time-data-pipeline.ts`
```typescript
import { WeatherAPI } from '../data/weather-api';
import { CarbonIntensityAPI } from '../data/carbon-api';
import { RegulatoryAPI } from '../data/regulatory-api';
import { createClient } from '@supabase/supabase-js';

export class RealTimeDataPipeline {
  private weatherAPI: WeatherAPI;
  private carbonAPI: CarbonIntensityAPI;
  private regulatoryAPI: RegulatoryAPI;
  private supabase: any;
  private activeConnections: Set<string> = new Set();
  
  async startAllPipelines(organizationId: string) {
    console.log('🚀 Starting real-time data pipelines...');
    
    // 1. Weather data - Updates every hour
    this.startWeatherPipeline(organizationId);
    
    // 2. Carbon intensity - Real-time WebSocket
    this.startCarbonPipeline(organizationId);
    
    // 3. Regulatory updates - Daily check
    this.startRegulatoryPipeline(organizationId);
    
    // 4. Document processing - On-demand queue
    this.startDocumentPipeline(organizationId);
  }
  
  private async startWeatherPipeline(orgId: string) {
    // Get building locations
    const { data: buildings } = await this.supabase
      .from('buildings')
      .select('id, latitude, longitude')
      .eq('organization_id', orgId);
    
    // Update weather every hour
    setInterval(async () => {
      for (const building of buildings) {
        const weather = await this.weatherAPI.getCurrentWeather(
          building.latitude,
          building.longitude
        );
        
        // Store in database
        await this.supabase.from('weather_data').insert({
          building_id: building.id,
          temperature: weather.temperature,
          conditions: weather.conditions,
          timestamp: new Date().toISOString()
        });
        
        // Trigger HVAC optimization if needed
        if (weather.temperature > 30 || weather.temperature < 10) {
          await this.triggerHVACOptimization(building.id, weather);
        }
      }
    }, 3600000); // 1 hour
    
    this.activeConnections.add('weather');
    console.log('✅ Weather pipeline active');
  }
  
  private async startCarbonPipeline(orgId: string) {
    // Connect to real-time carbon intensity WebSocket
    this.carbonAPI.connectWebSocket({
      onData: async (data) => {
        // Store carbon intensity
        await this.supabase.from('carbon_intensity').insert({
          organization_id: orgId,
          grid_intensity: data.carbonIntensity,
          renewable_percentage: data.renewablePercentage,
          timestamp: new Date().toISOString()
        });
        
        // Alert if high carbon period
        if (data.carbonIntensity > 400) {
          await this.alertHighCarbonIntensity(orgId, data);
        }
      },
      onError: (error) => {
        console.error('Carbon WebSocket error:', error);
        // Attempt reconnection
        setTimeout(() => this.startCarbonPipeline(orgId), 5000);
      }
    });
    
    this.activeConnections.add('carbon');
    console.log('✅ Carbon intensity pipeline active');
  }
}
```

### 4. Production API Routes (THE INTERFACE)
**File**: `/src/app/api/v1/orchestrator/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { UnifiedOrchestrator } from '@/lib/orchestration/unified-orchestrator';
import { authenticateRequest } from '@/lib/auth/middleware';
import { rateLimiter } from '@/lib/security/rate-limiter';

const orchestrator = new UnifiedOrchestrator();

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Rate limiting
    const rateLimitOk = await rateLimiter.checkLimit(user.id);
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    // 3. Parse request
    const { message, context } = await request.json();
    
    // 4. Process through orchestrator
    const response = await orchestrator.processUserMessage(
      message,
      user.id,
      context
    );
    
    // 5. Log for analytics
    await logUserInteraction(user.id, message, response);
    
    // 6. Return response
    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Orchestrator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// WebSocket endpoint for real-time updates
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Upgrade to WebSocket
  const { socket, response } = await upgradeToWebSocket(request);
  
  socket.on('message', async (data) => {
    const { type, payload } = JSON.parse(data);
    
    switch (type) {
      case 'subscribe':
        await orchestrator.subscribeToUpdates(user.id, payload.channels);
        break;
      case 'query':
        const result = await orchestrator.processQuery(payload);
        socket.send(JSON.stringify({ type: 'response', data: result }));
        break;
    }
  });
  
  return response;
}
```

### 5. Frontend Integration Hook (THE UI CONNECTION)
**File**: `/src/hooks/use-blipee-os.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './use-websocket';

export function useBlipeeOS() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const { sendMessage, subscribe } = useWebSocket('/api/v1/orchestrator');
  
  // Send message to blipee OS
  const sendToBlipee = useCallback(async (message: string) => {
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: message,
      timestamp: new Date()
    }]);
    
    try {
      const response = await fetch('/api/v1/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response.message,
        components: data.response.components,
        actions: data.response.actions,
        timestamp: new Date()
      }]);
      
      return data.response;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);
  
  // Subscribe to real-time updates
  useEffect(() => {
    subscribe('agent-updates', (update) => {
      setAgents(update.agents);
    });
    
    subscribe('esg-metrics', (metrics) => {
      // Update dashboard in real-time
      window.dispatchEvent(new CustomEvent('esg-update', { detail: metrics }));
    });
    
    setIsConnected(true);
  }, [subscribe]);
  
  // Get agent statuses
  const getAgentStatuses = useCallback(async () => {
    const response = await fetch('/api/agents/status');
    const data = await response.json();
    setAgents(data.agents);
    return data.agents;
  }, []);
  
  return {
    sendMessage: sendToBlipee,
    messages,
    isConnected,
    agents,
    getAgentStatuses
  };
}

// Use in components
export function ChatInterface() {
  const { sendMessage, messages, agents } = useBlipeeOS();
  
  return (
    <div className="flex flex-col h-full">
      <AgentStatusBar agents={agents} />
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  );
}
```

## 🚀 Implementation Priority

1. **Unified Orchestrator** (Day 1-2)
   - Central brain that connects everything
   - Without this, nothing talks to anything

2. **Agent Activation** (Day 3)
   - Makes agents run autonomously
   - Critical for 24/7 operation promise

3. **API Routes** (Day 4)
   - Exposes functionality to frontend
   - Enables user interaction

4. **Data Pipeline** (Day 5)
   - Brings in real-world data
   - Makes insights accurate

5. **Frontend Hook** (Day 6-7)
   - Connects UI to backend
   - Makes it usable

## ✅ With These 5 Files, You Have a Complete System

**Before**: Powerful components in isolation
**After**: Integrated, autonomous, real-time ESG platform

**Total New Code**: ~1,500 lines
**Time to Implement**: 1 week with focused effort
**Impact**: Transforms prototype into production system