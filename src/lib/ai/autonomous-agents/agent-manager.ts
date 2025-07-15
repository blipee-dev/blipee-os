import { createClient } from '@supabase/supabase-js';
import { AutonomousAgent, AgentConfig, AgentCapability } from './agent-framework';

export interface ManagedAgent {
  agent: AutonomousAgent;
  status: 'running' | 'stopped' | 'error';
  startedAt?: Date;
  lastHealthCheck?: Date;
}

export class AgentManager {
  private static instance: AgentManager;
  private agents: Map<string, ManagedAgent> = new Map();
  private supabase: ReturnType<typeof createClient>;
  private healthCheckInterval?: NodeJS.Timeout;
  
  private constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_KEY']!
    );
  }
  
  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }
  
  // Start an agent for an organization
  async startAgent(
    agentClass: new (organizationId: string) => AutonomousAgent,
    organizationId: string
  ): Promise<string> {
    const agent = new agentClass(organizationId);
    const agentId = `${agent['agentId']}-${organizationId}`;
    
    // Check if agent is already running
    if (this.agents.has(agentId)) {
      const existing = this.agents.get(agentId)!;
      if (existing.status === 'running') {
        console.log(`Agent ${agentId} is already running`);
        return agentId;
      }
    }
    
    try {
      // Start the agent
      await agent.start();
      
      // Register in manager
      this.agents.set(agentId, {
        agent,
        status: 'running',
        startedAt: new Date(),
        lastHealthCheck: new Date()
      });
      
      // Update database
      await this.updateAgentStatus(agentId, 'running');
      
      console.log(`✅ Agent ${agentId} started successfully`);
      return agentId;
    } catch (error) {
      console.error(`Failed to start agent ${agentId}:`, error);
      this.agents.set(agentId, {
        agent,
        status: 'error'
      });
      throw error;
    }
  }
  
  // Stop an agent
  async stopAgent(agentId: string): Promise<void> {
    const managed = this.agents.get(agentId);
    if (!managed) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    try {
      await managed.agent.stop();
      managed.status = 'stopped';
      await this.updateAgentStatus(agentId, 'stopped');
      this.agents.delete(agentId);
      console.log(`✅ Agent ${agentId} stopped successfully`);
    } catch (error) {
      console.error(`Failed to stop agent ${agentId}:`, error);
      managed.status = 'error';
      throw error;
    }
  }
  
  // Stop all agents for an organization
  async stopOrganizationAgents(organizationId: string): Promise<void> {
    const agentIds = Array.from(this.agents.keys()).filter(id => 
      id.endsWith(`-${organizationId}`)
    );
    
    await Promise.all(agentIds.map(id => this.stopAgent(id)));
  }
  
  // Get agent status
  getAgentStatus(agentId: string): ManagedAgent | undefined {
    return this.agents.get(agentId);
  }
  
  // Get all agents for an organization
  getOrganizationAgents(organizationId: string): Map<string, ManagedAgent> {
    const orgAgents = new Map<string, ManagedAgent>();
    
    this.agents.forEach((managed, agentId) => {
      if (agentId.endsWith(`-${organizationId}`)) {
        orgAgents.set(agentId, managed);
      }
    });
    
    return orgAgents;
  }
  
  // Start health monitoring
  startHealthMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);
    
    console.log(`🏥 Health monitoring started (interval: ${intervalMs}ms)`);
  }
  
  // Stop health monitoring
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined as any;
      console.log('🏥 Health monitoring stopped');
    }
  }
  
  // Perform health checks on all agents
  private async performHealthChecks(): Promise<void> {
    const checks = Array.from(this.agents.entries()).map(async ([agentId, managed]) => {
      try {
        const health = await managed.agent.getHealth();
        managed.lastHealthCheck = new Date();
        
        // Restart if not running but should be
        if (!health.isRunning && managed.status === 'running') {
          console.warn(`Agent ${agentId} is not running, attempting restart...`);
          await this.restartAgent(agentId);
        }
      } catch (error) {
        console.error(`Health check failed for ${agentId}:`, error);
        managed.status = 'error';
      }
    });
    
    await Promise.all(checks);
  }
  
  // Restart an agent
  private async restartAgent(agentId: string): Promise<void> {
    const managed = this.agents.get(agentId);
    if (!managed) return;
    
    try {
      await managed.agent.stop();
      await managed.agent.start();
      managed.status = 'running';
      managed.startedAt = new Date();
      await this.updateAgentStatus(agentId, 'running');
      console.log(`🔄 Agent ${agentId} restarted successfully`);
    } catch (error) {
      console.error(`Failed to restart agent ${agentId}:`, error);
      managed.status = 'error';
      await this.updateAgentStatus(agentId, 'error');
    }
  }
  
  // Update agent status in database
  private async updateAgentStatus(agentId: string, status: string): Promise<void> {
    const [agentType, organizationId] = agentId.split('-');
    
    await this.supabase
      .from('agent_events')
      .insert({
        agent_id: agentType,
        organization_id: organizationId,
        event: 'status_change',
        details: { status, timestamp: new Date().toISOString() }
      });
  }
  
  // Load agent configurations from database
  async loadAgentConfigs(organizationId: string): Promise<AgentConfig[]> {
    const { data, error } = await this.supabase
      .from('agent_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('enabled', true);
      
    if (error || !data) {
      console.error('Failed to load agent configs:', error);
      return [];
    }
    
    return data.map(config => ({
      agentId: config['agent_id'] as string,
      capabilities: config['capabilities'] as AgentCapability[],
      maxAutonomyLevel: config['max_autonomy_level'] as number,
      executionInterval: config['execution_interval'] as number
    }));
  }
  
  // Save agent configuration
  async saveAgentConfig(
    organizationId: string,
    config: AgentConfig,
    agentType: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('agent_configs')
      .upsert({
        organization_id: organizationId,
        agent_id: config.agentId,
        agent_type: agentType,
        capabilities: config['capabilities'],
        max_autonomy_level: config.maxAutonomyLevel,
        execution_interval: config.executionInterval,
        enabled: true
      });
      
    if (error) {
      console.error('Failed to save agent config:', error);
      throw error;
    }
  }
  
  // Get agent metrics
  async getAgentMetrics(agentId: string, timeRange: { start: Date; end: Date }) {
    const [agentType, organizationId] = agentId.split('-');
    
    if (!agentType || !organizationId) {
      throw new Error('Invalid agent ID format');
    }
    
    // Get task results
    const { data: results } = await this.supabase
      .from('agent_results')
      .select('*')
      .eq('agent_id', agentType)
      .eq('organization_id', organizationId)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString());
      
    // Get errors
    const { data: errors } = await this.supabase
      .from('agent_errors')
      .select('*')
      .eq('agent_id', agentType)
      .eq('organization_id', organizationId)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString());
      
    return {
      totalTasks: results?.length || 0,
      successfulTasks: results?.filter(r => r['success']).length || 0,
      failedTasks: results?.filter(r => !r['success']).length || 0,
      totalErrors: errors?.length || 0,
      averageExecutionTime: results?.length 
        ? results.reduce((sum: number, r: any) => sum + (r.execution_time_ms || 0), 0) / results.length
        : 0,
      insights: results?.flatMap(r => r['insights']) || [],
      actions: results?.flatMap(r => r['actions']) || []
    };
  }
  
  // Shutdown all agents
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down all agents...');
    
    this.stopHealthMonitoring();
    
    const stopPromises = Array.from(this.agents.keys()).map(agentId => 
      this.stopAgent(agentId).catch(err => 
        console.error(`Error stopping agent ${agentId}:`, err)
      )
    );
    
    await Promise.all(stopPromises);
    
    console.log('✅ All agents shut down');
  }
}