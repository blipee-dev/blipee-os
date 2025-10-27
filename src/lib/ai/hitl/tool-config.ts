/**
 * Tool Approval Configuration
 *
 * Defines which tools require human-in-the-loop approval before execution.
 */

export interface ToolApprovalConfig {
  requiresApproval: boolean;
  approvalLevel: 'user' | 'admin' | 'owner';
  approvalMessage?: string;
  category: 'critical' | 'medium' | 'low';
  description: string;
}

/**
 * Configuration for tools that require approval
 */
export const TOOL_APPROVAL_CONFIG: Record<string, ToolApprovalConfig> = {
  // Critical tools - Always require approval
  submitESGReport: {
    requiresApproval: true,
    approvalLevel: 'admin',
    category: 'critical',
    description: 'Submit ESG report to regulatory authority',
    approvalMessage: 'This will submit your ESG report to external regulators. This action cannot be undone.'
  },

  purchaseCarbonOffsets: {
    requiresApproval: true,
    approvalLevel: 'admin',
    category: 'critical',
    description: 'Purchase carbon offset credits',
    approvalMessage: 'This will initiate a financial transaction to purchase carbon offsets.'
  },

  updateEmissionTargets: {
    requiresApproval: true,
    approvalLevel: 'admin',
    category: 'critical',
    description: 'Update official emission reduction targets',
    approvalMessage: 'This will update your organization\'s official emission targets. These are used in public reports.'
  },

  fileRegulatoryDisclosure: {
    requiresApproval: true,
    approvalLevel: 'admin',
    category: 'critical',
    description: 'File regulatory disclosure with authorities',
    approvalMessage: 'This will file an official disclosure with regulatory authorities.'
  },

  // Medium tools - Configurable approval
  sendSupplierSurvey: {
    requiresApproval: true,
    approvalLevel: 'user',
    category: 'medium',
    description: 'Send sustainability survey to suppliers',
    approvalMessage: 'This will send an email to your suppliers requesting sustainability data.'
  },

  updateOrganizationData: {
    requiresApproval: true,
    approvalLevel: 'user',
    category: 'medium',
    description: 'Modify organization master data',
    approvalMessage: 'This will update official organization data.'
  },

  scheduleAudit: {
    requiresApproval: true,
    approvalLevel: 'user',
    category: 'medium',
    description: 'Schedule a sustainability audit',
    approvalMessage: 'This will schedule an external audit and send calendar invites.'
  },

  // Low tools - No approval needed (auto-execute)
  analyzeCarbonFootprint: {
    requiresApproval: false,
    approvalLevel: 'user',
    category: 'low',
    description: 'Analyze carbon footprint from data',
  },

  getIndustryBenchmarks: {
    requiresApproval: false,
    approvalLevel: 'user',
    category: 'low',
    description: 'Retrieve industry benchmarking data',
  },

  generateSustainabilityReport: {
    requiresApproval: false,
    approvalLevel: 'user',
    category: 'low',
    description: 'Generate sustainability report document',
  },

  calculateScope3Emissions: {
    requiresApproval: false,
    approvalLevel: 'user',
    category: 'low',
    description: 'Calculate Scope 3 emissions',
  },

  checkESGCompliance: {
    requiresApproval: false,
    approvalLevel: 'user',
    category: 'low',
    description: 'Check ESG compliance status',
  },

  // IoT Device Management - Requires approval
  configureIoTDevice: {
    requiresApproval: true,
    approvalLevel: 'admin',
    category: 'critical',
    description: 'Configure IoT device connection and credentials',
    approvalMessage: 'This will store IoT device credentials and enable automated data collection. The device will begin sending data to your organization.'
  },

  updateIoTDevice: {
    requiresApproval: true,
    approvalLevel: 'admin',
    category: 'critical',
    description: 'Update IoT device configuration or credentials',
    approvalMessage: 'This will modify IoT device settings. Data collection may be interrupted during the update.'
  },

  deleteIoTDevice: {
    requiresApproval: true,
    approvalLevel: 'admin',
    category: 'critical',
    description: 'Remove IoT device from platform',
    approvalMessage: 'This will disconnect the device and permanently stop automated data collection from this device.'
  },

  // Survey Distribution - Requires approval
  distributeSurvey: {
    requiresApproval: true,
    approvalLevel: 'user',
    category: 'medium',
    description: 'Send survey to external stakeholders',
    approvalMessage: 'This will send an email survey to the specified recipients. Please review the recipient list and survey content before proceeding.'
  },

  // Bulk Data Operations - Requires approval
  bulkDeleteMetricData: {
    requiresApproval: true,
    approvalLevel: 'admin',
    category: 'critical',
    description: 'Delete multiple metric data entries',
    approvalMessage: 'This will permanently delete multiple data entries. This action cannot be undone. Please verify the date range and metrics to be deleted.'
  },
};

/**
 * Check if a tool requires approval
 */
export function requiresApproval(toolName: string): boolean {
  const config = TOOL_APPROVAL_CONFIG[toolName];
  return config?.requiresApproval ?? false;
}

/**
 * Get approval configuration for a tool
 */
export function getApprovalConfig(toolName: string): ToolApprovalConfig | null {
  return TOOL_APPROVAL_CONFIG[toolName] || null;
}

/**
 * Get all tools that require approval
 */
export function getToolsRequiringApproval(): string[] {
  return Object.entries(TOOL_APPROVAL_CONFIG)
    .filter(([_, config]) => config.requiresApproval)
    .map(([toolName]) => toolName);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: 'critical' | 'medium' | 'low'): string[] {
  return Object.entries(TOOL_APPROVAL_CONFIG)
    .filter(([_, config]) => config.category === category)
    .map(([toolName]) => toolName);
}
