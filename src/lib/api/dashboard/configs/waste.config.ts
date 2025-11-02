/**
 * Waste Dashboard Domain Configuration
 *
 * Defines all Waste-specific settings for the unified dashboard API:
 * - Metric categories: Recycling, Composting, Disposal, E-Waste, Incineration
 * - Prophet forecasting enabled for all waste subcategories
 * - Unit: kg (kilograms)
 */

import { DomainConfig } from '../core/types';

export const wasteConfig: DomainConfig = {
  domain: 'waste',
  displayName: 'Waste',
  unit: 'kg',

  // Waste metric categories from metrics_catalog
  categories: [
    'Recycling',
    'Composting',
    'Disposal',
    'E-Waste',
    'Incineration',
  ],

  // Subcategory mapping for aggregation
  // Recycling + Composting = "renewable" (diverted from landfill)
  // Disposal + Incineration + E-Waste = "fossil" (not diverted)
  subcategoryMapping: {
    renewable: ['Recycling', 'Composting'],
    fossil: ['Disposal', 'Incineration', 'E-Waste'],
  },

  // Prophet forecast configuration
  prophetConfig: {
    enabled: true,
    category: 'Waste', // Category in ml_predictions.metadata
    subcategories: ['Recycling', 'Composting', 'Disposal', 'E-Waste', 'Incineration'], // Subcategories in ml_predictions.metadata
  },

  // Sustainability calculator configuration
  calculatorConfig: {
    domain: 'waste',
  },

  // Insights configuration
  insightsConfig: {
    targetKey: 'wasteTarget', // Key in sustainability_targets table
    thresholds: {
      excellentPerformance: 0.8, // ≤80% of target = excellent (lower waste = better)
      goodPerformance: 0.9, // ≤90% of target = good
      warning: 1.0, // >90% of target = warning
    },
  },
};
