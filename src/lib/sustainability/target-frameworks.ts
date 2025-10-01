/**
 * Dynamic sustainability target frameworks configuration
 * All target frameworks and standards should be configurable here
 * to support different organizations, regions, and evolving standards
 */

export interface TargetFramework {
  id: string;
  name: string;
  description: string;
  reductionTargets: {
    nearTerm: {
      percentage: number;
      year: number;
      minAnnualRate: number;
    };
    longTerm?: {
      percentage: number;
      year: number;
    };
  };
  scopes: {
    scope1: boolean;
    scope2: boolean;
    scope3: boolean;
    scope3Threshold?: number; // % of total emissions that requires Scope 3
  };
  sectors?: string[]; // Specific sectors this applies to
  region?: string[]; // Regions where this framework applies
}

// Get current year dynamically
const currentYear = new Date().getFullYear();

// Default frameworks - can be overridden by organization settings
export const DEFAULT_FRAMEWORKS: TargetFramework[] = [
  {
    id: 'sbti_15c',
    name: 'SBTi 1.5°C',
    description: 'Science Based Targets initiative 1.5°C pathway',
    reductionTargets: {
      nearTerm: {
        percentage: 42,
        year: currentYear + 5 <= 2030 ? 2030 : currentYear + 5, // Min 5 years out
        minAnnualRate: 4.2
      },
      longTerm: {
        percentage: 90,
        year: 2050
      }
    },
    scopes: {
      scope1: true,
      scope2: true,
      scope3: true,
      scope3Threshold: 40 // Require Scope 3 if >40% of emissions
    }
  },
  {
    id: 'sbti_2c',
    name: 'SBTi Well-Below 2°C',
    description: 'Science Based Targets initiative Well-Below 2°C pathway',
    reductionTargets: {
      nearTerm: {
        percentage: 25,
        year: currentYear + 5 <= 2030 ? 2030 : currentYear + 5,
        minAnnualRate: 2.5
      },
      longTerm: {
        percentage: 90,
        year: 2050
      }
    },
    scopes: {
      scope1: true,
      scope2: true,
      scope3: true,
      scope3Threshold: 40
    }
  },
  {
    id: 'eu_fit55',
    name: 'EU Fit for 55',
    description: 'European Union climate package',
    reductionTargets: {
      nearTerm: {
        percentage: 55,
        year: 2030,
        minAnnualRate: 5.5
      },
      longTerm: {
        percentage: 100,
        year: 2050
      }
    },
    scopes: {
      scope1: true,
      scope2: true,
      scope3: true
    },
    region: ['EU', 'Europe']
  },
  {
    id: 'race_to_zero',
    name: 'Race to Zero',
    description: 'UN-backed global campaign',
    reductionTargets: {
      nearTerm: {
        percentage: 50,
        year: 2030,
        minAnnualRate: 5.0
      },
      longTerm: {
        percentage: 100,
        year: 2050
      }
    },
    scopes: {
      scope1: true,
      scope2: true,
      scope3: true
    }
  },
  {
    id: 'custom',
    name: 'Custom Target',
    description: 'Organization-specific target',
    reductionTargets: {
      nearTerm: {
        percentage: 30, // Default, can be customized
        year: currentYear + 5,
        minAnnualRate: 3.0
      }
    },
    scopes: {
      scope1: true,
      scope2: true,
      scope3: false // Optional by default
    }
  }
];

// Get framework by ID
export function getFramework(id: string): TargetFramework | undefined {
  return DEFAULT_FRAMEWORKS.find(f => f.id === id);
}

// Get applicable frameworks for an organization
export function getApplicableFrameworks(
  region?: string,
  sector?: string,
  organizationSize?: 'small' | 'medium' | 'large'
): TargetFramework[] {
  return DEFAULT_FRAMEWORKS.filter(framework => {
    // Filter by region if specified
    if (region && framework.region && !framework.region.includes(region)) {
      return false;
    }

    // Filter by sector if specified
    if (sector && framework.sectors && !framework.sectors.includes(sector)) {
      return false;
    }

    // All frameworks pass if no filters
    return true;
  });
}

// Calculate target year based on framework and current date
export function calculateTargetYear(
  framework: TargetFramework,
  minYearsOut: number = 5
): number {
  const currentYear = new Date().getFullYear();
  const minimumTarget = currentYear + minYearsOut;

  // Use framework's target year if it's far enough in the future
  if (framework.reductionTargets.nearTerm.year > minimumTarget) {
    return framework.reductionTargets.nearTerm.year;
  }

  // Otherwise use minimum years out
  return minimumTarget;
}

// Calculate required reduction percentage for a given timeline
export function calculateRequiredReduction(
  framework: TargetFramework,
  targetYear: number
): number {
  const currentYear = new Date().getFullYear();
  const yearsToTarget = targetYear - currentYear;

  // If using the standard timeline, use standard percentage
  if (targetYear === framework.reductionTargets.nearTerm.year) {
    return framework.reductionTargets.nearTerm.percentage;
  }

  // Otherwise calculate based on annual rate
  const annualRate = framework.reductionTargets.nearTerm.minAnnualRate;
  const totalReduction = annualRate * yearsToTarget;

  // Cap at 100%
  return Math.min(totalReduction, 100);
}

// Check if targets meet framework requirements
export function validateTargets(
  actualReduction: number,
  targetYear: number,
  framework: TargetFramework
): {
  isValid: boolean;
  message: string;
  gap?: number;
} {
  const requiredReduction = calculateRequiredReduction(framework, targetYear);

  if (actualReduction >= requiredReduction) {
    return {
      isValid: true,
      message: `Meets ${framework.name} requirements`
    };
  }

  const gap = requiredReduction - actualReduction;
  return {
    isValid: false,
    message: `Below ${framework.name} requirement by ${gap.toFixed(1)}%`,
    gap
  };
}

// Get organization-specific target configuration
export interface OrganizationTargetConfig {
  preferredFramework: string;
  customTargets?: {
    nearTermYear?: number;
    nearTermPercentage?: number;
    longTermYear?: number;
    longTermPercentage?: number;
  };
  includeScope3: boolean;
  offsetLimit?: number; // Max % of offsets allowed
  region?: string;
  sector?: string;
}

// Load organization settings (would come from database)
export async function loadOrganizationTargetConfig(
  organizationId: string
): Promise<OrganizationTargetConfig> {
  // This would fetch from database
  // For now, return defaults
  return {
    preferredFramework: 'sbti_15c',
    includeScope3: true,
    offsetLimit: 10, // Max 10% offsets
    region: 'Global',
    sector: 'General'
  };
}