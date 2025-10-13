/**
 * Emissions Calculator
 *
 * Centralized module for calculating CO2e emissions from activity data
 */

export interface CalculateEmissionsInput {
  activityAmount: number;
  emissionFactor: number;
  scope?: string;
  category?: string;
  unit?: string;
}

export interface CalculateEmissionsResult {
  co2e: number; // Total CO2e in kg
  scope: string;
  category: string;
  unit: string;
}

/**
 * Calculate CO2e emissions from activity data
 *
 * @param input Activity data with emission factor
 * @returns Calculated emissions in kg CO2e
 */
export function calculateEmissionsFromActivity(
  input: CalculateEmissionsInput
): CalculateEmissionsResult {
  const { activityAmount, emissionFactor, scope, category, unit } = input;

  // Calculate emissions (emission factor is typically in kg CO2e per unit)
  const co2e = activityAmount * emissionFactor;

  return {
    co2e: Math.round(co2e * 100) / 100, // Round to 2 decimal places
    scope: scope || 'unknown',
    category: category || 'unknown',
    unit: unit || 'kg CO2e'
  };
}

/**
 * Calculate emissions for multiple activities
 */
export function calculateBulkEmissions(
  activities: CalculateEmissionsInput[]
): CalculateEmissionsResult[] {
  return activities.map(activity => calculateEmissionsFromActivity(activity));
}

/**
 * Calculate total emissions from multiple activities
 */
export function calculateTotalEmissions(
  activities: CalculateEmissionsInput[]
): number {
  return activities.reduce((total, activity) => {
    const result = calculateEmissionsFromActivity(activity);
    return total + result.co2e;
  }, 0);
}
