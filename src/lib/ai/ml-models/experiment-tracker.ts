/**
 * Experiment Tracker
 * Tracks ML experiments and model performance
 */

export interface Experiment {
  id?: string;
  modelType: string;
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  timestamp: Date;
  duration?: number;
  status?: 'running' | 'completed' | 'failed';
  notes?: string;
}

export class ExperimentTracker {
  private experiments: Experiment[] = [];
  private currentExperiment?: Experiment;

  /**
   * Start a new experiment
   */
  startExperiment(modelType: string, parameters: Record<string, any>): string {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentExperiment = {
      id,
      modelType,
      parameters,
      metrics: {},
      timestamp: new Date(),
      status: 'running'
    };
    
    this.experiments.push(this.currentExperiment);
    return id;
  }

  /**
   * Log metrics for current experiment
   */
  logMetrics(metrics: Record<string, number>): void {
    if (!this.currentExperiment) {
      throw new Error('No active experiment');
    }
    
    this.currentExperiment.metrics = {
      ...this.currentExperiment.metrics,
      ...metrics
    };
  }

  /**
   * Complete current experiment
   */
  completeExperiment(finalMetrics?: Record<string, number>): void {
    if (!this.currentExperiment) {
      throw new Error('No active experiment');
    }
    
    if (finalMetrics) {
      this.logMetrics(finalMetrics);
    }
    
    this.currentExperiment.status = 'completed';
    this.currentExperiment.duration = 
      Date.now() - this.currentExperiment.timestamp.getTime();
    
    this.currentExperiment = undefined;
  }

  /**
   * Log a complete experiment
   */
  async logExperiment(experiment: Experiment): Promise<void> {
    experiment.id = experiment.id || 
      `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.experiments.push(experiment);
  }

  /**
   * Get best experiment for a model type
   */
  getBestExperiment(
    modelType: string,
    metric: string,
    mode: 'min' | 'max' = 'max'
  ): Experiment | null {
    const modelExperiments = this.experiments.filter(
      exp => exp.modelType === modelType && exp.status === 'completed'
    );
    
    if (modelExperiments.length === 0) return null;
    
    return modelExperiments.reduce((best, current) => {
      const bestValue = best.metrics[metric] || (mode === 'max' ? -Infinity : Infinity);
      const currentValue = current.metrics[metric] || (mode === 'max' ? -Infinity : Infinity);
      
      if (mode === 'max') {
        return currentValue > bestValue ? current : best;
      } else {
        return currentValue < bestValue ? current : best;
      }
    });
  }

  /**
   * Get experiment history
   */
  getExperimentHistory(modelType?: string): Experiment[] {
    if (modelType) {
      return this.experiments.filter(exp => exp.modelType === modelType);
    }
    return [...this.experiments];
  }

  /**
   * Compare experiments
   */
  compareExperiments(
    experimentIds: string[]
  ): Array<{ id: string; parameters: any; metrics: any }> {
    return experimentIds
      .map(id => this.experiments.find(exp => exp.id === id))
      .filter(exp => exp !== undefined)
      .map(exp => ({
        id: exp!.id!,
        parameters: exp!.parameters,
        metrics: exp!.metrics
      }));
  }

  /**
   * Save report
   */
  async saveReport(report: any): Promise<void> {
    // In production, this would save to a database or file system
    
    try {
      const fs = require('fs').promises;
      const path = `./reports/training_report_${Date.now()}.json`;
      await fs.mkdir('./reports', { recursive: true });
      await fs.writeFile(path, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  }

  /**
   * Get experiment statistics
   */
  getStatistics(): {
    totalExperiments: number;
    byModelType: Record<string, number>;
    averageMetrics: Record<string, number>;
    successRate: number;
  } {
    const stats = {
      totalExperiments: this.experiments.length,
      byModelType: {} as Record<string, number>,
      averageMetrics: {} as Record<string, number>,
      successRate: 0
    };
    
    // Count by model type
    for (const exp of this.experiments) {
      stats.byModelType[exp.modelType] = 
        (stats.byModelType[exp.modelType] || 0) + 1;
    }
    
    // Calculate average metrics
    const allMetrics: Record<string, number[]> = {};
    let completedCount = 0;
    
    for (const exp of this.experiments) {
      if (exp.status === 'completed') {
        completedCount++;
        
        for (const [key, value] of Object.entries(exp.metrics)) {
          if (!allMetrics[key]) allMetrics[key] = [];
          allMetrics[key].push(value);
        }
      }
    }
    
    for (const [key, values] of Object.entries(allMetrics)) {
      stats.averageMetrics[key] = 
        values.reduce((a, b) => a + b, 0) / values.length;
    }
    
    stats.successRate = this.experiments.length > 0 
      ? completedCount / this.experiments.length 
      : 0;
    
    return stats;
  }

  /**
   * Clear experiment history
   */
  clearHistory(): void {
    this.experiments = [];
    this.currentExperiment = undefined;
  }
}