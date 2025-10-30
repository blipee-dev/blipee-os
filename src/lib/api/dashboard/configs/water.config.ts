/**
 * Water Dashboard Domain Configuration
 *
 * Defines all Water-specific settings for the unified dashboard API:
 * - Metric categories: Water Consumption, Water Withdrawal, Water Discharge, Recycled Water
 * - Subcategories: Potable (renewable) + Residual (fossil)
 * - Prophet forecasting enabled for Potable + Residual
 * - Unit: m³ (cubic meters)
 */

import { DomainConfig } from '../core/types';

export const waterConfig: DomainConfig = {
  domain: 'water',
  displayName: 'Water',
  unit: 'm³',

  // Water metric categories from metrics_catalog
  categories: [
    'Water Consumption',
    'Water Withdrawal',
    'Water Discharge',
    'Recycled Water',
  ],

  // Subcategory mapping for aggregation
  // Potable = "renewable" (clean/fresh water)
  // Residual = "fossil" (wastewater/residual)
  subcategoryMapping: {
    renewable: 'Potable',
    fossil: 'Residual',
  },

  // Prophet forecast configuration
  prophetConfig: {
    enabled: true,
    category: 'Water', // Category in ml_predictions.metadata
    subcategories: ['Potable', 'Residual'], // Subcategories in ml_predictions.metadata
  },

  // Sustainability calculator configuration
  calculatorConfig: {
    domain: 'water',
  },

  // Insights configuration
  insightsConfig: {
    targetKey: 'waterTarget', // Key in sustainability_targets table
    thresholds: {
      excellentPerformance: 0.8, // ≤80% of target = excellent
      goodPerformance: 0.9, // ≤90% of target = good
      warning: 1.0, // >90% of target = warning
    },
  },
};
