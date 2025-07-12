/**
 * Isolation Forest Algorithm
 * For anomaly detection in ESG metrics
 */

export interface IsolationForestConfig {
  nEstimators?: number;
  maxSamples?: number;
  contamination?: number;
  maxDepth?: number;
  randomState?: number;
}

interface IsolationTree {
  left?: IsolationTree;
  right?: IsolationTree;
  splitFeature?: number;
  splitValue?: number;
  pathLength?: number;
  isLeaf: boolean;
}

export class IsolationForest {
  private trees: IsolationTree[] = [];
  private config: IsolationForestConfig;
  private threshold: number = 0;
  private maxSamples: number;
  private trainingSamples?: number[][];

  constructor(config: IsolationForestConfig = {}) {
    this.config = {
      nEstimators: config.nEstimators || 100,
      maxSamples: config.maxSamples || 256,
      contamination: config.contamination || 0.1,
      maxDepth: config.maxDepth || Math.ceil(Math.log2(config.maxSamples || 256)),
      randomState: config.randomState || Date.now()
    };
    this.maxSamples = Math.min(this.config.maxSamples!, 256);
  }

  /**
   * Fit the isolation forest on training data
   */
  async fit(data: any[]): Promise<void> {
    const samples = this.extractFeatures(data);
    this.trainingSamples = samples;
    
    // Build isolation trees
    this.trees = [];
    for (let i = 0; i < this.config.nEstimators!; i++) {
      const subsample = this.getSubsample(samples);
      const tree = this.buildTree(subsample, 0);
      this.trees.push(tree);
    }
    
    // Calculate threshold based on contamination
    const scores = await this.scoreAll(data);
    scores.sort((a, b) => b - a);
    const cutoffIndex = Math.floor(scores.length * this.config.contamination!);
    this.threshold = scores[cutoffIndex];
  }

  /**
   * Detect anomalies in new data
   */
  async detect(data: any[]): Promise<Array<{
    index: number;
    score: number;
    isAnomaly: boolean;
    data: any;
  }>> {
    const results = [];
    
    for (let i = 0; i < data.length; i++) {
      const score = await this.anomalyScore(data[i]);
      results.push({
        index: i,
        score,
        isAnomaly: score > this.threshold,
        data: data[i]
      });
    }
    
    return results;
  }

  /**
   * Calculate anomaly score for all samples
   */
  async scoreAll(data: any[]): Promise<number[]> {
    const scores: number[] = [];
    
    for (const sample of data) {
      const score = await this.anomalyScore(sample);
      scores.push(score);
    }
    
    return scores;
  }

  /**
   * Calculate anomaly score for a single sample
   */
  private async anomalyScore(sample: any): Promise<number> {
    const features = this.extractSingleFeatures(sample);
    const pathLengths: number[] = [];
    
    for (const tree of this.trees) {
      const pathLength = this.getPathLength(features, tree, 0);
      pathLengths.push(pathLength);
    }
    
    const avgPathLength = pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length;
    const c = this.averagePathLength(this.maxSamples);
    
    // Anomaly score: higher score means more anomalous
    return Math.pow(2, -avgPathLength / c);
  }

  /**
   * Build an isolation tree
   */
  private buildTree(samples: number[][], currentDepth: number): IsolationTree {
    const n = samples.length;
    
    // Base cases
    if (currentDepth >= this.config.maxDepth! || n <= 1) {
      return {
        isLeaf: true,
        pathLength: currentDepth + this.averagePathLength(n)
      };
    }
    
    // Select random feature and split value
    const numFeatures = samples[0].length;
    const splitFeature = Math.floor(Math.random() * numFeatures);
    
    const featureValues = samples.map(s => s[splitFeature]);
    const min = Math.min(...featureValues);
    const max = Math.max(...featureValues);
    
    if (min === max) {
      return {
        isLeaf: true,
        pathLength: currentDepth + this.averagePathLength(n)
      };
    }
    
    const splitValue = min + Math.random() * (max - min);
    
    // Split samples
    const leftSamples = samples.filter(s => s[splitFeature] < splitValue);
    const rightSamples = samples.filter(s => s[splitFeature] >= splitValue);
    
    return {
      isLeaf: false,
      splitFeature,
      splitValue,
      left: this.buildTree(leftSamples, currentDepth + 1),
      right: this.buildTree(rightSamples, currentDepth + 1)
    };
  }

  /**
   * Get path length for a sample in a tree
   */
  private getPathLength(sample: number[], tree: IsolationTree, currentDepth: number): number {
    if (tree.isLeaf) {
      return tree.pathLength || currentDepth;
    }
    
    if (sample[tree.splitFeature!] < tree.splitValue!) {
      return this.getPathLength(sample, tree.left!, currentDepth + 1);
    } else {
      return this.getPathLength(sample, tree.right!, currentDepth + 1);
    }
  }

  /**
   * Calculate average path length for n samples
   */
  private averagePathLength(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    
    // Harmonic number approximation
    const H = Math.log(n - 1) + 0.5772156649;
    return 2 * H - (2 * (n - 1) / n);
  }

  /**
   * Get random subsample
   */
  private getSubsample(samples: number[][]): number[][] {
    const n = Math.min(samples.length, this.maxSamples);
    const indices = new Set<number>();
    
    while (indices.size < n) {
      indices.add(Math.floor(Math.random() * samples.length));
    }
    
    return Array.from(indices).map(i => samples[i]);
  }

  /**
   * Extract features from data
   */
  private extractFeatures(data: any[]): number[][] {
    return data.map(d => this.extractSingleFeatures(d));
  }

  /**
   * Extract features from a single data point
   */
  private extractSingleFeatures(data: any): number[] {
    // Extract numeric features relevant for anomaly detection
    const features: number[] = [];
    
    if (typeof data === 'number') {
      features.push(data);
    } else if (data.value !== undefined) {
      features.push(data.value);
    } else {
      // Extract common ESG metrics
      if (data.emissions) features.push(data.emissions);
      if (data.energyConsumption) features.push(data.energyConsumption);
      if (data.waterUsage) features.push(data.waterUsage);
      if (data.wasteGenerated) features.push(data.wasteGenerated);
      if (data.temperature) features.push(data.temperature);
      if (data.productionVolume) features.push(data.productionVolume);
    }
    
    // If no features extracted, use all numeric values
    if (features.length === 0) {
      for (const key of Object.keys(data)) {
        if (typeof data[key] === 'number') {
          features.push(data[key]);
        }
      }
    }
    
    return features;
  }

  /**
   * Get contamination rate
   */
  getContamination(): number {
    return this.config.contamination || 0.1;
  }

  /**
   * Set contamination rate and recalculate threshold
   */
  async setContamination(contamination: number): Promise<void> {
    this.config.contamination = contamination;
    
    if (this.trainingSamples) {
      const scores = await this.scoreAll(this.trainingSamples);
      scores.sort((a, b) => b - a);
      const cutoffIndex = Math.floor(scores.length * contamination);
      this.threshold = scores[cutoffIndex];
    }
  }
}