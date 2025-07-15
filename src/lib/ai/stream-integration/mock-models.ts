/**
 * Mock Models for Stream B & C Integration Testing
 */

import { BaseModel } from '../ml-models/base-model';
import { TrainingData } from '../ml-models/types';

export class MockSustainabilityModel extends BaseModel {
  getModelName(): string {
    return 'mock-sustainability-model';
  }

  async train(data: TrainingData): Promise<void> {
    // Mock training
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  async predict(input: any): Promise<any> {
    const score = 70 + Math.random() * 25;
    return {
      score,
      emissionsScore: score,
      riskLevel: score > 80 ? 'low' : score > 60 ? 'medium' : 'high',
      confidence: 0.85 + Math.random() * 0.1,
      recommendations: [
        'Implement energy efficiency measures',
        'Consider renewable energy sources'
      ]
    };
  }

  async serialize(): Promise<any> {
    return { type: 'mock-sustainability-model' };
  }

  async deserialize(data: any): Promise<void> {
    // Mock deserialization
  }
}

export class MockAnomalyDetectionModel extends BaseModel {
  getModelName(): string {
    return 'mock-anomaly-detection-model';
  }

  async train(data: TrainingData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  async predict(input: any): Promise<any> {
    const currentValue = input.current_consumption || input.current_emissions || 0;
    const normalValue = input.historical_average || input.normal_range?.max || 100;
    const deviation = Math.abs(currentValue - normalValue) / normalValue;
    
    return {
      anomalyScore: Math.min(1, deviation),
      deviationPercent: deviation * 100,
      estimatedCost: deviation > 0.5 ? 1000 + Math.random() * 2000 : 0,
      excessEmissions: deviation > 0.5 ? deviation * 5 : 0
    };
  }

  async serialize(): Promise<any> {
    return { type: 'mock-anomaly-detection-model' };
  }

  async deserialize(data: any): Promise<void> {
    // Mock deserialization
  }
}

export class MockOptimizationModel extends BaseModel {
  getModelName(): string {
    return 'mock-optimization-model';
  }

  async train(data: TrainingData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 15));
  }

  async predict(input: any): Promise<any> {
    const currentEmissions = input.current_emissions?.scope1 + input.current_emissions?.scope2 + input.current_emissions?.scope3 || 1000;
    const targetReduction = input.target_reduction || 30;
    
    return {
      estimatedSavings: currentEmissions * targetReduction * 50, // $50 per tCO2e
      risks: [
        'Technology adoption challenges',
        'Supply chain dependencies',
        'Regulatory uncertainty'
      ],
      recommendations: [
        'Prioritize energy efficiency improvements',
        'Implement renewable energy systems',
        'Optimize operational processes'
      ]
    };
  }

  async serialize(): Promise<any> {
    return { type: 'mock-optimization-model' };
  }

  async deserialize(data: any): Promise<void> {
    // Mock deserialization
  }
}

export class MockComplianceModel extends BaseModel {
  getModelName(): string {
    return 'mock-compliance-model';
  }

  async train(data: TrainingData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 8));
  }

  async predict(input: any): Promise<any> {
    const frameworks = input.frameworks || [];
    const overallScore = 70 + Math.random() * 25;
    
    const frameworkScores: Record<string, number> = {};
    frameworks.forEach((framework: string) => {
      frameworkScores[framework] = 60 + Math.random() * 35;
    });

    return {
      overallScore,
      frameworkScores,
      riskAreas: [
        'Scope 3 emissions reporting',
        'Board diversity disclosure'
      ],
      recommendations: [
        'Improve data collection processes',
        'Enhance disclosure transparency',
        'Implement automated reporting systems'
      ]
    };
  }

  async serialize(): Promise<any> {
    return { type: 'mock-compliance-model' };
  }

  async deserialize(data: any): Promise<void> {
    // Mock deserialization
  }
}

export class MockSupplyChainModel extends BaseModel {
  getModelName(): string {
    return 'mock-supply-chain-model';
  }

  async train(data: TrainingData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 12));
  }

  async predict(input: any): Promise<any> {
    const suppliers = input.suppliers || [];
    const supplierScores: Record<string, number> = {};
    
    suppliers.forEach((supplier: any) => {
      // Score based on location, certifications, emissions
      let score = 50;
      if (supplier.certifications?.includes('ISO14001')) score += 20;
      if (supplier.certifications?.includes('B_Corp')) score += 15;
      if (supplier.location === 'Germany') score += 10;
      supplierScores[supplier.supplierId] = Math.min(100, score + Math.random() * 20);
    });

    const avgScore = Object.values(supplierScores).reduce((sum, score) => sum + score, 0) / suppliers.length || 75;
    
    return {
      overallRisk: avgScore > 80 ? 'low' : avgScore > 60 ? 'medium' : 'high',
      supplierScores,
      recommendations: [
        'Diversify supplier base',
        'Require sustainability certifications',
        'Implement supplier auditing program'
      ],
      alternatives: [
        { supplierId: 'alt-001', location: 'Denmark', score: 95 },
        { supplierId: 'alt-002', location: 'Netherlands', score: 88 }
      ]
    };
  }

  async serialize(): Promise<any> {
    return { type: 'mock-supply-chain-model' };
  }

  async deserialize(data: any): Promise<void> {
    // Mock deserialization
  }
}