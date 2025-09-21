/**
 * Compliance Frameworks Index
 *
 * Central export point for all compliance framework engines.
 * Provides unified access to 7 major compliance frameworks.
 */

export { BaseFrameworkEngine } from './base-framework';
export { SECClimateFrameworkEngine } from './sec-climate';
export { EUCSRDFrameworkEngine } from './eu-csrd';
export { TCFDFrameworkEngine } from './tcfd';
export { GRIFrameworkEngine } from './gri';
export { CDPFrameworkEngine } from './cdp';
export { SBTiFrameworkEngine } from './sbti';
export { ISO14001FrameworkEngine } from './iso-14001';

import { BaseFrameworkEngine } from './base-framework';
import { SECClimateFrameworkEngine } from './sec-climate';
import { EUCSRDFrameworkEngine } from './eu-csrd';
import { TCFDFrameworkEngine } from './tcfd';
import { GRIFrameworkEngine } from './gri';
import { CDPFrameworkEngine } from './cdp';
import { SBTiFrameworkEngine } from './sbti';
import { ISO14001FrameworkEngine } from './iso-14001';

/**
 * Framework Factory for creating framework engine instances
 */
export class FrameworkFactory {
  private static engines: Map<string, new (organizationId: string) => BaseFrameworkEngine> = new Map([
    ['SEC_CLIMATE', SECClimateFrameworkEngine],
    ['EU_CSRD', EUCSRDFrameworkEngine],
    ['TCFD', TCFDFrameworkEngine],
    ['GRI', GRIFrameworkEngine],
    ['CDP', CDPFrameworkEngine],
    ['SBTi', SBTiFrameworkEngine],
    ['ISO_14001', ISO14001FrameworkEngine]
  ]);

  /**
   * Create a framework engine instance
   */
  public static createEngine(frameworkCode: string, organizationId: string): BaseFrameworkEngine {
    const EngineClass = this.engines.get(frameworkCode);

    if (!EngineClass) {
      throw new Error(`Unknown framework code: ${frameworkCode}`);
    }

    return new EngineClass(organizationId);
  }

  /**
   * Get all available framework codes
   */
  public static getAvailableFrameworks(): string[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Check if framework is supported
   */
  public static isSupported(frameworkCode: string): boolean {
    return this.engines.has(frameworkCode);
  }

  /**
   * Get framework metadata
   */
  public static async getFrameworkMetadata(frameworkCode: string, organizationId: string): Promise<any> {
    if (!this.isSupported(frameworkCode)) {
      throw new Error(`Framework ${frameworkCode} is not supported`);
    }

    const engine = this.createEngine(frameworkCode, organizationId);
    return await engine.getFrameworkInfo();
  }

  /**
   * Create multiple framework engines
   */
  public static createMultipleEngines(frameworkCodes: string[], organizationId: string): BaseFrameworkEngine[] {
    return frameworkCodes.map(code => this.createEngine(code, organizationId));
  }
}

/**
 * Framework Registry for managing framework information
 */
export class FrameworkRegistry {
  private static readonly FRAMEWORK_METADATA = {
    SEC_CLIMATE: {
      name: 'SEC Climate Risk Disclosure',
      description: 'US Securities and Exchange Commission climate disclosure requirements',
      jurisdiction: 'US',
      type: 'mandatory',
      industries: ['all'],
      focus: ['governance', 'strategy', 'risk_management', 'metrics']
    },
    EU_CSRD: {
      name: 'EU Corporate Sustainability Reporting Directive',
      description: 'European Union comprehensive sustainability reporting requirements',
      jurisdiction: 'EU',
      type: 'mandatory',
      industries: ['all'],
      focus: ['environment', 'social', 'governance', 'materiality']
    },
    TCFD: {
      name: 'Task Force on Climate-related Financial Disclosures',
      description: 'Global framework for climate-related financial risk disclosures',
      jurisdiction: 'Global',
      type: 'voluntary',
      industries: ['all'],
      focus: ['governance', 'strategy', 'risk_management', 'metrics']
    },
    GRI: {
      name: 'Global Reporting Initiative Universal Standards',
      description: 'Global standards for sustainability reporting',
      jurisdiction: 'Global',
      type: 'voluntary',
      industries: ['all'],
      focus: ['economic', 'environmental', 'social', 'governance']
    },
    CDP: {
      name: 'Carbon Disclosure Project',
      description: 'Global disclosure system for environmental transparency',
      jurisdiction: 'Global',
      type: 'voluntary',
      industries: ['all'],
      focus: ['climate', 'water', 'forests', 'supply_chain']
    },
    SBTi: {
      name: 'Science Based Targets initiative',
      description: 'Science-based emissions reduction targets aligned with climate science',
      jurisdiction: 'Global',
      type: 'voluntary',
      industries: ['all'],
      focus: ['emissions', 'targets', 'net_zero', 'validation']
    },
    ISO_14001: {
      name: 'ISO 14001 Environmental Management System',
      description: 'International standard for environmental management systems',
      jurisdiction: 'Global',
      type: 'voluntary',
      industries: ['all'],
      focus: ['ems', 'continual_improvement', 'legal_compliance', 'environmental_performance']
    }
  };

  /**
   * Get framework metadata
   */
  public static getFrameworkMetadata(frameworkCode: string): any {
    return this.FRAMEWORK_METADATA[frameworkCode as keyof typeof this.FRAMEWORK_METADATA];
  }

  /**
   * Get all framework metadata
   */
  public static getAllFrameworkMetadata(): Record<string, any> {
    return this.FRAMEWORK_METADATA;
  }

  /**
   * Get frameworks by jurisdiction
   */
  public static getFrameworksByJurisdiction(jurisdiction: string): string[] {
    return Object.entries(this.FRAMEWORK_METADATA)
      .filter(([_, metadata]) =>
        metadata.jurisdiction === jurisdiction || metadata.jurisdiction === 'Global'
      )
      .map(([code, _]) => code);
  }

  /**
   * Get frameworks by type
   */
  public static getFrameworksByType(type: 'mandatory' | 'voluntary'): string[] {
    return Object.entries(this.FRAMEWORK_METADATA)
      .filter(([_, metadata]) => metadata.type === type)
      .map(([code, _]) => code);
  }

  /**
   * Get frameworks by focus area
   */
  public static getFrameworksByFocus(focusArea: string): string[] {
    return Object.entries(this.FRAMEWORK_METADATA)
      .filter(([_, metadata]) => metadata.focus.includes(focusArea))
      .map(([code, _]) => code);
  }

  /**
   * Get applicable frameworks for organization
   */
  public static getApplicableFrameworks(criteria: {
    jurisdiction?: string;
    industry?: string;
    companySize?: string;
    publiclyTraded?: boolean;
    revenue?: number;
  }): string[] {
    // This would implement logic to determine applicable frameworks
    // based on organization characteristics
    const applicable: string[] = [];

    Object.entries(this.FRAMEWORK_METADATA).forEach(([code, metadata]) => {
      let isApplicable = true;

      // Check jurisdiction
      if (criteria.jurisdiction && metadata.jurisdiction !== 'Global' &&
          metadata.jurisdiction !== criteria.jurisdiction) {
        isApplicable = false;
      }

      // Add more criteria checks as needed
      // This is a simplified implementation

      if (isApplicable) {
        applicable.push(code);
      }
    });

    return applicable;
  }
}

/**
 * Utility functions for framework management
 */
export const FrameworkUtils = {
  /**
   * Validate framework configuration
   */
  validateFrameworkConfig: (config: any): boolean => {
    // Implement validation logic
    return true;
  },

  /**
   * Get framework priority for organization
   */
  getFrameworkPriority: (frameworkCode: string, organizationContext: any): 'high' | 'medium' | 'low' => {
    const metadata = FrameworkRegistry.getFrameworkMetadata(frameworkCode);

    if (!metadata) return 'low';

    // Mandatory frameworks get high priority
    if (metadata.type === 'mandatory') return 'high';

    // Industry-specific logic could go here
    return 'medium';
  },

  /**
   * Calculate framework complexity score
   */
  calculateComplexityScore: (frameworkCode: string): number => {
    const complexityScores: Record<string, number> = {
      'SEC_CLIMATE': 7,
      'EU_CSRD': 9,
      'TCFD': 6,
      'GRI': 8,
      'CDP': 7,
      'SBTi': 5,
      'ISO_14001': 6
    };

    return complexityScores[frameworkCode] || 5;
  },

  /**
   * Estimate implementation timeline
   */
  estimateImplementationTimeline: (frameworkCode: string): string => {
    const timelines: Record<string, string> = {
      'SEC_CLIMATE': '6-12 months',
      'EU_CSRD': '12-18 months',
      'TCFD': '6-9 months',
      'GRI': '9-12 months',
      'CDP': '6-9 months',
      'SBTi': '9-15 months',
      'ISO_14001': '12-24 months'
    };

    return timelines[frameworkCode] || '6-12 months';
  }
};

export default {
  FrameworkFactory,
  FrameworkRegistry,
  FrameworkUtils
};