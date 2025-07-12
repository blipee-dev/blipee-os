/**
 * Data Validator
 * Validates and cleans incoming data for ML pipeline
 */

import { RawData, DataIngestionConfig } from './types';

export class DataValidator {
  private config: DataIngestionConfig;

  constructor(config: DataIngestionConfig) {
    this.config = config;
  }

  /**
   * Validate raw data
   */
  async validate(data: RawData): Promise<RawData> {
    if (!this.config.validationEnabled) {
      return data;
    }

    // Check for required fields
    this.checkRequiredFields(data);
    
    // Validate data types
    this.validateDataTypes(data);
    
    // Check ranges
    this.validateRanges(data);
    
    // Apply preprocessing steps
    const processed = await this.preprocess(data);
    
    return processed;
  }

  /**
   * Check for required fields
   */
  private checkRequiredFields(data: RawData): void {
    const requiredFields = ['timestamp'];
    
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Validate data types
   */
  private validateDataTypes(data: RawData): void {
    const typeValidations: Record<string, (value: any) => boolean> = {
      timestamp: (v) => v instanceof Date || !isNaN(Date.parse(v)),
      scope1: (v) => typeof v === 'number' && !isNaN(v),
      scope2: (v) => typeof v === 'number' && !isNaN(v),
      scope3: (v) => typeof v === 'number' && !isNaN(v),
      energyConsumption: (v) => typeof v === 'number' && v >= 0,
      productionVolume: (v) => typeof v === 'number' && v >= 0
    };
    
    for (const [field, validator] of Object.entries(typeValidations)) {
      if (field in data && !validator(data[field])) {
        throw new Error(`Invalid data type for field: ${field}`);
      }
    }
  }

  /**
   * Validate value ranges
   */
  private validateRanges(data: RawData): void {
    const rangeValidations: Record<string, { min?: number; max?: number }> = {
      scope1: { min: 0 },
      scope2: { min: 0 },
      scope3: { min: 0 },
      temperature: { min: -50, max: 50 },
      humidity: { min: 0, max: 100 },
      percentage: { min: 0, max: 100 }
    };
    
    for (const [field, range] of Object.entries(rangeValidations)) {
      if (field in data) {
        const value = data[field];
        if (typeof value === 'number') {
          if (range.min !== undefined && value < range.min) {
            throw new Error(`Value for ${field} is below minimum: ${value} < ${range.min}`);
          }
          if (range.max !== undefined && value > range.max) {
            throw new Error(`Value for ${field} is above maximum: ${value} > ${range.max}`);
          }
        }
      }
    }
  }

  /**
   * Apply preprocessing steps
   */
  private async preprocess(data: RawData): Promise<RawData> {
    let processed = { ...data };
    
    for (const step of this.config.preprocessingSteps) {
      processed = await this.applyPreprocessingStep(processed, step);
    }
    
    return processed;
  }

  /**
   * Apply a single preprocessing step
   */
  private async applyPreprocessingStep(data: RawData, step: any): Promise<RawData> {
    switch (step.type) {
      case 'normalize':
        return this.normalize(data, step.config);
      case 'standardize':
        return this.standardize(data, step.config);
      case 'impute':
        return this.impute(data, step.config);
      default:
        return data;
    }
  }

  /**
   * Normalize numeric fields
   */
  private normalize(data: RawData, config: any): RawData {
    const normalized = { ...data };
    const fields = config?.fields || ['scope1', 'scope2', 'scope3'];
    
    for (const field of fields) {
      if (field in normalized && typeof normalized[field] === 'number') {
        const min = config?.min || 0;
        const max = config?.max || 1000;
        normalized[field] = (normalized[field] - min) / (max - min);
      }
    }
    
    return normalized;
  }

  /**
   * Standardize numeric fields
   */
  private standardize(data: RawData, config: any): RawData {
    const standardized = { ...data };
    const fields = config?.fields || ['energyConsumption', 'productionVolume'];
    
    for (const field of fields) {
      if (field in standardized && typeof standardized[field] === 'number') {
        const mean = config?.mean?.[field] || 0;
        const std = config?.std?.[field] || 1;
        standardized[field] = (standardized[field] - mean) / std;
      }
    }
    
    return standardized;
  }

  /**
   * Impute missing values
   */
  private impute(data: RawData, config: any): RawData {
    const imputed = { ...data };
    const strategy = config?.strategy || 'mean';
    const defaults = config?.defaults || {};
    
    for (const [field, defaultValue] of Object.entries(defaults)) {
      if (!(field in imputed) || imputed[field] === null || imputed[field] === undefined) {
        imputed[field] = defaultValue;
      }
    }
    
    return imputed;
  }

  /**
   * Get validation statistics
   */
  async getValidationStats(): Promise<{
    totalValidations: number;
    passedValidations: number;
    failedValidations: number;
    commonErrors: string[];
  }> {
    // Placeholder for validation statistics
    return {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      commonErrors: []
    };
  }
}