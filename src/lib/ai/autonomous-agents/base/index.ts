/**
 * Base Autonomous Agent Module
 * Re-exports all agent framework types and classes for retail agents
 */

// Use RetailAutonomousAgent as the base class for retail agents
export { RetailAutonomousAgent as AutonomousAgent } from './retail-agent-base';

export {
  type AgentCapability as AgentCapabilityInterface,
  type AgentTask,
  type AgentTask as Task,
  type AgentResult,
  type AgentResult as TaskResult,
  type ExecutedAction,
  type Learning,
  type AgentConfig
} from '../agent-framework';

export { AgentCapability } from './capabilities';