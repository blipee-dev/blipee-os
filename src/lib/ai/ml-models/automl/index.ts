/**
 * AutoML Package Exports
 * Comprehensive automated machine learning capabilities
 */

export { AutoMLPipeline } from './automl-pipeline';
export { BayesianOptimizer } from '../hyperopt/bayesian-optimizer';
export { HyperparameterOptimizer } from '../hyperopt/hyperparameter-optimizer';

export type {
  AutoMLConfig,
  AutoMLResult,
  ModelCandidate,
  ModelResult,
  FeatureImportance,
  DataInsights
} from './automl-pipeline';

export type {
  SearchSpace,
  OptimizationConfig,
  OptimizationResult,
  ObjectiveFunction
} from '../hyperopt/bayesian-optimizer';

export type {
  ModelOptimizationConfig,
  OptimizedModel,
  ModelComparison
} from '../hyperopt/hyperparameter-optimizer';

// AutoML utility functions
export const AutoMLUtils = {
  /**
   * Create quick AutoML configuration for common use cases
   */
  createQuickConfig(taskType: 'classification' | 'regression' | 'text_analysis' | 'optimization'): any {
    const baseConfig = {
      taskType,
      maxModels: 3,
      maxOptimizationTime: 300, // 5 minutes
      crossValidationFolds: 3,
      featureEngineering: true,
      ensembleStrategy: 'voting' as const
    };

    switch (taskType) {
      case 'classification':
        return {
          ...baseConfig,
          objective: 'accuracy' as const
        };
      case 'regression':
        return {
          ...baseConfig,
          objective: 'mae' as const
        };
      case 'text_analysis':
        return {
          ...baseConfig,
          objective: 'f1Score' as const,
          featureEngineering: false // Text data doesn't need standard feature engineering
        };
      case 'optimization':
        return {
          ...baseConfig,
          objective: 'custom' as const,
          customObjective: (metrics: any) => metrics.fitness || metrics.objective || 0,
          ensembleStrategy: 'none' as const // Optimization problems typically use single best solution
        };
      default:
        return baseConfig;
    }
  },

  /**
   * Create production-ready AutoML configuration
   */
  createProductionConfig(taskType: 'classification' | 'regression' | 'text_analysis' | 'optimization'): any {
    const baseConfig = {
      taskType,
      maxModels: 10,
      maxOptimizationTime: 3600, // 1 hour
      crossValidationFolds: 5,
      featureEngineering: true,
      dataAugmentation: true,
      ensembleStrategy: 'stacking' as const,
      earlyStoppingPatience: 10
    };

    switch (taskType) {
      case 'classification':
        return {
          ...baseConfig,
          objective: 'f1Score' as const
        };
      case 'regression':
        return {
          ...baseConfig,
          objective: 'mae' as const
        };
      case 'text_analysis':
        return {
          ...baseConfig,
          objective: 'f1Score' as const,
          featureEngineering: false,
          maxOptimizationTime: 7200 // 2 hours for text models
        };
      case 'optimization':
        return {
          ...baseConfig,
          objective: 'custom' as const,
          customObjective: (metrics: any) => metrics.fitness || metrics.objective || 0,
          ensembleStrategy: 'none' as const,
          maxOptimizationTime: 1800 // 30 minutes for optimization problems
        };
      default:
        return baseConfig;
    }
  },

  /**
   * Validate AutoML configuration
   */
  validateConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.taskType) {
      errors.push('taskType is required');
    }

    if (!config.objective) {
      errors.push('objective is required');
    }

    if (config.maxModels && config.maxModels < 1) {
      errors.push('maxModels must be at least 1');
    }

    if (config.maxOptimizationTime && config.maxOptimizationTime < 60) {
      errors.push('maxOptimizationTime should be at least 60 seconds');
    }

    if (config.crossValidationFolds && config.crossValidationFolds < 2) {
      errors.push('crossValidationFolds must be at least 2');
    }

    if (config.objective === 'custom' && !config.customObjective) {
      errors.push('customObjective function is required when objective is "custom"');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Estimate AutoML runtime
   */
  estimateRuntime(
    config: any,
    sampleCount: number,
    featureCount: number
  ): { estimatedMinutes: number; factors: string[] } {
    const factors: string[] = [];
    let baseTime = 5; // 5 minutes base time

    // Data size factor
    if (sampleCount > 10000) {
      baseTime *= 2;
      factors.push('Large dataset detected');
    }
    if (featureCount > 100) {
      baseTime *= 1.5;
      factors.push('High-dimensional data detected');
    }

    // Model count factor
    const modelCount = config.maxModels || 5;
    baseTime *= Math.log(modelCount + 1);
    factors.push(`${modelCount} models to evaluate`);

    // Cross-validation factor
    const cvFolds = config.crossValidationFolds || 3;
    baseTime *= Math.sqrt(cvFolds);
    factors.push(`${cvFolds}-fold cross-validation`);

    // Feature engineering factor
    if (config.featureEngineering) {
      baseTime *= 1.3;
      factors.push('Feature engineering enabled');
    }

    // Ensemble factor
    if (config.ensembleStrategy && config.ensembleStrategy !== 'none') {
      baseTime *= 1.4;
      factors.push(`${config.ensembleStrategy} ensemble strategy`);
    }

    // Apply maximum time limit
    if (config.maxOptimizationTime) {
      const maxMinutes = config.maxOptimizationTime / 60;
      baseTime = Math.min(baseTime, maxMinutes);
      factors.push(`Limited by ${maxMinutes} minute time cap`);
    }

    return {
      estimatedMinutes: Math.round(baseTime),
      factors
    };
  },

  /**
   * Format AutoML results for display
   */
  formatResults(results: any): {
    summary: string;
    detailedResults: string;
    recommendations: string;
  } {
    const summary = `
AutoML Results Summary:
• Best Model: ${results.bestModel?.getModelName() || 'Unknown'}
• Best Score: ${results.bestScore?.toFixed(4) || 'N/A'}
• Models Evaluated: ${results.modelsEvaluated || 0}
• Total Time: ${((results.totalTime || 0) / 1000 / 60).toFixed(1)} minutes
• Data Quality: ${((results.dataInsights?.dataQuality || 0) * 100).toFixed(1)}%
`.trim();

    const detailedResults = results.allResults?.map((result: any, index: number) => 
      `${index + 1}. ${result.modelName}: ${result.score.toFixed(4)} (${result.improvement.toFixed(1)}% improvement)`
    ).join('\n') || 'No detailed results available';

    const recommendations = results.recommendations?.map((rec: string, index: number) => 
      `${index + 1}. ${rec}`
    ).join('\n') || 'No recommendations available';

    return {
      summary,
      detailedResults,
      recommendations
    };
  },

  /**
   * Generate performance report
   */
  generateReport(results: any): string {
    const formatted = this.formatResults(results);
    
    return `
# AutoML Performance Report

## ${formatted.summary}

## Model Rankings
${formatted.detailedResults}

## Feature Importance
${results.featureImportance?.slice(0, 5).map((feature: any, index: number) => 
  `${index + 1}. ${feature.featureName}: ${(feature.importance * 100).toFixed(1)}%`
).join('\n') || 'Feature importance not available'}

## Data Insights
• Samples: ${results.dataInsights?.sampleCount || 'Unknown'}
• Features: ${results.dataInsights?.featureCount || 'Unknown'}  
• Missing Data: ${results.dataInsights?.missingDataPercentage?.toFixed(1) || 'Unknown'}%
• Complexity: ${results.dataInsights?.dataComplexity || 'Unknown'}

## Recommendations
${formatted.recommendations}

---
*Report generated on ${new Date().toISOString()}*
    `.trim();
  }
};