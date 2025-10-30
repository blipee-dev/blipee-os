/**
 * Energy Dashboard Domain Configuration
 *
 * Defines all Energy-specific settings for the unified dashboard API:
 * - Metric categories: Energy Consumption, Renewable Energy, Non-Renewable Energy
 * - Subcategories: Electricity (renewable) + Gas (fossil)
 * - Prophet forecasting enabled for Electricity + Gas
 * - Unit: kWh (kilowatt-hours)
 */

import { DomainConfig } from '../core/types';

export const energyConfig: DomainConfig = {
  domain: 'energy',
  displayName: 'Energy',
  unit: 'kWh',

  // Energy metric categories from metrics_catalog
  categories: [
    'Energy Consumption',
    'Renewable Energy',
    'Non-Renewable Energy',
  ],

  // Subcategory mapping for aggregation
  // Electricity = "renewable" (clean energy)
  // Gas = "fossil" (non-renewable energy)
  subcategoryMapping: {
    renewable: 'Electricity',
    fossil: 'Gas',
  },

  // Prophet forecast configuration
  prophetConfig: {
    enabled: true,
    category: 'Energy', // Category in ml_predictions.metadata
    subcategories: ['Electricity', 'Gas'], // Subcategories in ml_predictions.metadata
  },

  // Sustainability calculator configuration
  calculatorConfig: {
    domain: 'energy',
  },

  // Insights configuration
  insightsConfig: {
    targetKey: 'energyTarget', // Key in sustainability_targets table
    thresholds: {
      excellentPerformance: 0.8, // ≤80% of target = excellent
      goodPerformance: 0.9, // ≤90% of target = good
      warning: 1.0, // >90% of target = warning
    },
  },
};
