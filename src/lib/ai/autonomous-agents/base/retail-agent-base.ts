/**
 * Retail Agent Base Class
 * Wrapper for AutonomousAgent that provides a simplified constructor for retail agents
 */

import { AutonomousAgent, AgentConfig as BaseAgentConfig } from '../agent-framework';

export interface RetailAgentConfig {
  name: string;
  description: string;
  capabilities: any[];
  requiredPermissions: string[];
  autonomyLevel: number;
  learningEnabled: boolean;
}

export abstract class RetailAutonomousAgent extends AutonomousAgent {
  constructor(config: RetailAgentConfig) {
    // Convert retail config to base agent config
    const baseConfig: BaseAgentConfig = {
      agentId: config.name.toLowerCase().replace(/\s+/g, '-'),
      capabilities: config.capabilities,
      maxAutonomyLevel: config.autonomyLevel,
      executionInterval: 3600000 // Default 1 hour
    };
    
    // Use default organization ID for retail agents
    const organizationId = process.env.DEFAULT_ORG_ID || 'retail-org';
    
    super(organizationId, baseConfig);
  }
}