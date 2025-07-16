/**
 * Agent Capability Constants
 * Defines standard capability types for retail agents
 */

export const AgentCapability = {
  ANALYZE: {
    name: 'analyze',
    description: 'Analyze data and patterns',
    requiredPermissions: ['read:data'],
    maxAutonomyLevel: 4
  },
  PREDICT: {
    name: 'predict',
    description: 'Make predictions based on data',
    requiredPermissions: ['read:data', 'read:analytics'],
    maxAutonomyLevel: 3
  },
  RECOMMEND: {
    name: 'recommend',
    description: 'Generate recommendations',
    requiredPermissions: ['read:data', 'read:analytics'],
    maxAutonomyLevel: 3
  },
  LEARN: {
    name: 'learn',
    description: 'Learn from patterns and outcomes',
    requiredPermissions: ['read:data', 'write:models'],
    maxAutonomyLevel: 4
  },
  ALERT: {
    name: 'alert',
    description: 'Send alerts and notifications',
    requiredPermissions: ['read:data', 'write:notifications'],
    maxAutonomyLevel: 2
  },
  OPTIMIZE: {
    name: 'optimize',
    description: 'Optimize processes and resources',
    requiredPermissions: ['read:data', 'write:configurations'],
    maxAutonomyLevel: 3
  },
  EXECUTE: {
    name: 'execute',
    description: 'Execute automated actions',
    requiredPermissions: ['read:data', 'write:actions'],
    maxAutonomyLevel: 2
  }
} as const;