/**
 * Hyperparameter Optimizer
 * Implements Bayesian optimization for hyperparameter tuning
 */

export interface SearchSpace {
  [param: string]: any[];
}

export interface OptimizationConfig {
  maxTrials: number;
  metric: string;
  mode: 'min' | 'max';
  randomState?: number;
}

interface Trial {
  id: number;
  params: Record<string, any>;
  score: number;
  duration: number;
}

export class HyperparameterOptimizer {
  private trials: Trial[] = [];
  private bestTrial?: Trial;
  private randomState: number;

  constructor(randomState?: number) {
    this.randomState = randomState || Date.now();
  }

  /**
   * Optimize hyperparameters using Bayesian optimization
   */
  async optimize(
    objective: (params: Record<string, any>) => Promise<number>,
    searchSpace: SearchSpace,
    config: OptimizationConfig
  ): Promise<Record<string, any>> {
    console.log('Starting hyperparameter optimization...');
    
    // Reset trials
    this.trials = [];
    this.bestTrial = undefined;
    
    // Initial random exploration
    const initialTrials = Math.min(10, Math.floor(config.maxTrials * 0.3));
    
    for (let i = 0; i < initialTrials; i++) {
      await this.runTrial(i, objective, searchSpace, config, 'random');
    }
    
    // Bayesian optimization
    for (let i = initialTrials; i < config.maxTrials; i++) {
      await this.runTrial(i, objective, searchSpace, config, 'bayesian');
    }
    
    console.log(`Optimization complete. Best score: ${this.bestTrial?.score}`);
    console.log('Best parameters:', this.bestTrial?.params);
    
    return this.bestTrial?.params || this.getDefaultParams(searchSpace);
  }

  /**
   * Run a single trial
   */
  private async runTrial(
    trialId: number,
    objective: (params: Record<string, any>) => Promise<number>,
    searchSpace: SearchSpace,
    config: OptimizationConfig,
    strategy: 'random' | 'bayesian'
  ): Promise<void> {
    const startTime = Date.now();
    
    // Select parameters
    const params = strategy === 'random'
      ? this.randomSample(searchSpace)
      : this.bayesianSample(searchSpace, config);
    
    // Evaluate objective
    try {
      const score = await objective(params);
      const duration = Date.now() - startTime;
      
      const trial: Trial = {
        id: trialId,
        params,
        score,
        duration
      };
      
      this.trials.push(trial);
      
      // Update best trial
      if (this.isBetterTrial(trial, config)) {
        this.bestTrial = trial;
        console.log(`New best trial ${trialId}: score=${score.toFixed(4)}`);
      }
      
    } catch (error) {
      console.error(`Trial ${trialId} failed:`, error);
    }
  }

  /**
   * Random sampling from search space
   */
  private randomSample(searchSpace: SearchSpace): Record<string, any> {
    const params: Record<string, any> = {};
    
    for (const [param, values] of Object.entries(searchSpace)) {
      if (Array.isArray(values)) {
        params[param] = values[Math.floor(Math.random() * values.length)];
      } else if (typeof values === 'object' && 'min' in values && 'max' in values) {
        // Continuous parameter
        params[param] = values.min + Math.random() * (values.max - values.min);
      }
    }
    
    return params;
  }

  /**
   * Bayesian-inspired sampling (simplified)
   */
  private bayesianSample(
    searchSpace: SearchSpace,
    config: OptimizationConfig
  ): Record<string, any> {
    if (this.trials.length < 5) {
      // Not enough data for modeling, use random
      return this.randomSample(searchSpace);
    }
    
    // Simple strategy: explore around best performing trials
    const topTrials = [...this.trials]
      .sort((a, b) => {
        if (config.mode === 'max') {
          return b.score - a.score;
        } else {
          return a.score - b.score;
        }
      })
      .slice(0, Math.ceil(this.trials.length * 0.2));
    
    // Select a top trial to explore around
    const baseTrialIdx = Math.floor(Math.random() * topTrials.length);
    const baseTrial = topTrials[baseTrialIdx];
    const params: Record<string, any> = { ...baseTrial.params };
    
    // Randomly modify some parameters
    const paramsToModify = Object.keys(searchSpace)
      .filter(() => Math.random() < 0.3); // Modify 30% of parameters
    
    for (const param of paramsToModify) {
      const values = searchSpace[param];
      if (Array.isArray(values)) {
        // For discrete parameters, sometimes try adjacent values
        const currentIdx = values.indexOf(params[param]);
        if (currentIdx !== -1 && Math.random() < 0.7) {
          // 70% chance to try adjacent value
          const offset = Math.random() < 0.5 ? -1 : 1;
          const newIdx = Math.max(0, Math.min(values.length - 1, currentIdx + offset));
          params[param] = values[newIdx];
        } else {
          // Random selection
          params[param] = values[Math.floor(Math.random() * values.length)];
        }
      }
    }
    
    return params;
  }

  /**
   * Check if trial is better than current best
   */
  private isBetterTrial(trial: Trial, config: OptimizationConfig): boolean {
    if (!this.bestTrial) return true;
    
    if (config.mode === 'max') {
      return trial.score > this.bestTrial.score;
    } else {
      return trial.score < this.bestTrial.score;
    }
  }

  /**
   * Get default parameters
   */
  private getDefaultParams(searchSpace: SearchSpace): Record<string, any> {
    const params: Record<string, any> = {};
    
    for (const [param, values] of Object.entries(searchSpace)) {
      if (Array.isArray(values) && values.length > 0) {
        // Use middle value as default
        params[param] = values[Math.floor(values.length / 2)];
      }
    }
    
    return params;
  }

  /**
   * Get optimization history
   */
  getHistory(): Trial[] {
    return [...this.trials];
  }

  /**
   * Get best parameters found
   */
  getBestParams(): Record<string, any> | null {
    return this.bestTrial?.params || null;
  }

  /**
   * Get best score
   */
  getBestScore(): number | null {
    return this.bestTrial?.score || null;
  }

  /**
   * Plot optimization progress (returns data for visualization)
   */
  getOptimizationProgress(): {
    trialIds: number[];
    scores: number[];
    bestScores: number[];
  } {
    const trialIds: number[] = [];
    const scores: number[] = [];
    const bestScores: number[] = [];
    
    let currentBest: number | null = null;
    
    for (const trial of this.trials) {
      trialIds.push(trial.id);
      scores.push(trial.score);
      
      if (currentBest === null || 
          (this.bestTrial && trial.score === this.bestTrial.score)) {
        currentBest = trial.score;
      }
      
      bestScores.push(currentBest);
    }
    
    return { trialIds, scores, bestScores };
  }

  /**
   * Get parameter importance (simplified)
   */
  getParameterImportance(): Record<string, number> {
    if (this.trials.length < 10) {
      return {};
    }
    
    const importance: Record<string, number> = {};
    const allParams = new Set<string>();
    
    // Collect all parameter names
    for (const trial of this.trials) {
      Object.keys(trial.params).forEach(p => allParams.add(p));
    }
    
    // Calculate variance in scores when parameter changes
    for (const param of allParams) {
      const scoresByValue: Map<any, number[]> = new Map();
      
      for (const trial of this.trials) {
        const value = trial.params[param];
        const key = JSON.stringify(value);
        
        if (!scoresByValue.has(key)) {
          scoresByValue.set(key, []);
        }
        scoresByValue.get(key)!.push(trial.score);
      }
      
      // Calculate variance across different values
      const meanScores = Array.from(scoresByValue.values())
        .map(scores => scores.reduce((a, b) => a + b, 0) / scores.length);
      
      if (meanScores.length > 1) {
        const overallMean = meanScores.reduce((a, b) => a + b, 0) / meanScores.length;
        const variance = meanScores.reduce((sum, mean) => 
          sum + Math.pow(mean - overallMean, 2), 0) / meanScores.length;
        
        importance[param] = variance;
      } else {
        importance[param] = 0;
      }
    }
    
    // Normalize
    const maxImportance = Math.max(...Object.values(importance));
    if (maxImportance > 0) {
      for (const param of Object.keys(importance)) {
        importance[param] /= maxImportance;
      }
    }
    
    return importance;
  }
}