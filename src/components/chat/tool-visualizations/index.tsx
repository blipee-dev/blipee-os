'use client';

/**
 * Tool Visualizations Index
 *
 * Central component for rendering tool-specific visualizations
 * Automatically selects the appropriate visualization based on tool name
 */

import { CarbonEmissionsChart } from './CarbonEmissionsChart';
import { ESGComplianceStatus } from './ESGComplianceStatus';
import { BenchmarkComparison } from './BenchmarkComparison';
import { GoalsTracking } from './GoalsTracking';

interface ToolVisualizationProps {
  toolName: string;
  result: any;
}

/**
 * Main Tool Visualization Renderer
 *
 * Automatically renders the appropriate visualization component
 * based on the tool name and result data
 */
export function ToolVisualization({ toolName, result }: ToolVisualizationProps) {
  // Return null if no result or error
  if (!result || result.error) {
    return null;
  }

  // Parse result if it's a string
  const parsedResult = typeof result === 'string'
    ? tryParseJSON(result)
    : result;

  // Select appropriate visualization based on tool name
  switch (toolName) {
    case 'analyzeCarbonFootprint':
      return <CarbonEmissionsChart data={parsedResult} />;

    case 'checkESGCompliance':
      return <ESGComplianceStatus data={parsedResult} />;

    case 'benchmarkPerformance':
      return <BenchmarkComparison data={parsedResult} />;

    case 'trackSustainabilityGoals':
      return <GoalsTracking data={parsedResult} />;

    // For other tools, return null (they'll show as text only)
    default:
      return null;
  }
}

/**
 * Helper function to safely parse JSON
 */
function tryParseJSON(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// Export individual components for direct use
export {
  CarbonEmissionsChart,
  ESGComplianceStatus,
  BenchmarkComparison,
  GoalsTracking
};
