/**
 * Phase 7: Advanced ML Ensemble Models
 * XGBoost-like Gradient Boosting, Random Forest, and Advanced Optimization
 */

interface MLModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'timeseries' | 'anomaly';
  train: (data: MLDataset) => Promise<void>;
  predict: (input: number[][]) => Promise<number[]>;
  evaluate: (testData: MLDataset) => Promise<MLMetrics>;
}

interface MLDataset {
  features: number[][];
  targets: number[];
  featureNames?: string[];
  metadata?: Record<string, any>;
}

interface MLMetrics {
  accuracy?: number;
  mse?: number;
  mae?: number;
  r2?: number;
  precision?: number;
  recall?: number;
  f1?: number;
}

interface TreeNode {
  feature?: number;
  threshold?: number;
  prediction?: number;
  left?: TreeNode;
  right?: TreeNode;
  samples?: number;
  impurity?: number;
}

class AdvancedMLEnsemble {
  private models = new Map<string, MLModel>();
  private ensembleWeights = new Map<string, number>();

  /**
   * Build decision tree for gradient boosting
   */
  private buildSimpleDecisionTree(
    features: number[][],
    targets: number[],
    maxDepth: number,
    minSamplesSplit: number,
    depth = 0
  ): TreeNode {
    // Base case: if we've reached max depth or too few samples
    if (depth >= maxDepth || features.length < minSamplesSplit) {
      return {
        prediction: targets.reduce((a, b) => a + b, 0) / targets.length,
        samples: features.length
      };
    }

    // Find best split
    let bestGain = -Infinity;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    const currentVariance = this.calculateVariance(targets);

    for (let feature = 0; feature < features[0].length; feature++) {
      const values = features.map(row => row[feature]);
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;

        const leftIndices: number[] = [];
        const rightIndices: number[] = [];

        features.forEach((row, idx) => {
          if (row[feature] <= threshold) {
            leftIndices.push(idx);
          } else {
            rightIndices.push(idx);
          }
        });

        if (leftIndices.length === 0 || rightIndices.length === 0) continue;

        const leftTargets = leftIndices.map(idx => targets[idx]);
        const rightTargets = rightIndices.map(idx => targets[idx]);

        const leftVariance = this.calculateVariance(leftTargets);
        const rightVariance = this.calculateVariance(rightTargets);

        const weightedVariance =
          (leftTargets.length * leftVariance + rightTargets.length * rightVariance) / targets.length;

        const gain = currentVariance - weightedVariance;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = feature;
          bestThreshold = threshold;
          bestLeftIndices = leftIndices;
          bestRightIndices = rightIndices;
        }
      }
    }

    // If no good split found, return leaf
    if (bestGain <= 0) {
      return {
        prediction: targets.reduce((a, b) => a + b, 0) / targets.length,
        samples: features.length
      };
    }

    // Recursively build left and right subtrees
    const leftFeatures = bestLeftIndices.map(idx => features[idx]);
    const leftTargets = bestLeftIndices.map(idx => targets[idx]);
    const rightFeatures = bestRightIndices.map(idx => features[idx]);
    const rightTargets = bestRightIndices.map(idx => targets[idx]);

    return {
      feature: bestFeature,
      threshold: bestThreshold,
      left: this.buildSimpleDecisionTree(leftFeatures, leftTargets, maxDepth, minSamplesSplit, depth + 1),
      right: this.buildSimpleDecisionTree(rightFeatures, rightTargets, maxDepth, minSamplesSplit, depth + 1),
      samples: features.length
    };
  }

  /**
   * Predict with decision tree
   */
  private predictWithTree(tree: TreeNode, features: number[]): number {
    if (tree.prediction !== undefined) {
      return tree.prediction;
    }

    if (tree.feature !== undefined && tree.threshold !== undefined) {
      if (features[tree.feature] <= tree.threshold) {
        return tree.left ? this.predictWithTree(tree.left, features) : 0;
      } else {
        return tree.right ? this.predictWithTree(tree.right, features) : 0;
      }
    }

    return 0;
  }

  /**
   * Calculate variance for split quality
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * XGBoost-like Gradient Boosting implementation
   */
  createGradientBoostingModel(config: {
    nEstimators?: number;
    learningRate?: number;
    maxDepth?: number;
    subsample?: number;
    regularization?: number;
  }): MLModel {
    const self = this; // Capture reference to the class instance

    return {
      id: 'gradient-boosting',
      name: 'Advanced Gradient Boosting',
      type: 'regression',

      async train(dataset: MLDataset): Promise<void> {
        const { features, targets } = dataset;
        const models: TreeNode[] = [];
        const meanTarget = targets.reduce((a, b) => a + b, 0) / targets.length;
        let predictions = new Array(targets.length).fill(meanTarget);

        for (let i = 0; i < (config.nEstimators || 10); i++) {
          // Calculate residuals (gradients)
          const residuals = targets.map((target, idx) => target - predictions[idx]);

          // Build proper decision tree on residuals
          const tree = self.buildSimpleDecisionTree(
            features,
            residuals,
            config.maxDepth || 6,
            config.minSamplesSplit || 2
          );

          models.push(tree);

          // Update predictions
          for (let j = 0; j < features.length; j++) {
            const treePrediction = self.predictWithTree(tree, features[j]);
            predictions[j] += (config.learningRate || 0.1) * treePrediction;
          }
        }

        // Store trained models and mean
        (this as any).models = models;
        (this as any).meanTarget = meanTarget;
      },

      async predict(inputs: number[][]): Promise<number[]> {
        const models = (this as any).models || [];
        const meanTarget = (this as any).meanTarget || 0;

        return inputs.map(input => {
          let prediction = meanTarget;

          for (const tree of models) {
            prediction += (config.learningRate || 0.1) * self.predictWithTree(tree, input);
          }

          return prediction;
        });
      },

      async evaluate(testData: MLDataset): Promise<MLMetrics> {
        const predictions = await this.predict(testData.features);
        return {
          mse: this.calculateMSE(testData.targets, predictions),
          mae: this.calculateMAE(testData.targets, predictions),
          r2: this.calculateR2(testData.targets, predictions)
        };
      }
    };
  }

  /**
   * Advanced Random Forest implementation
   */
  createRandomForestModel(config: {
    nTrees: number;
    maxDepth: number;
    minSamplesSplit: number;
    maxFeatures: number;
    bootstrap: boolean;
  }): MLModel {
    return {
      id: 'random-forest',
      name: 'Advanced Random Forest',
      type: 'regression',

      async train(dataset: MLDataset): Promise<void> {
        const { features, targets } = dataset;
        const trees: TreeNode[] = [];

        for (let i = 0; i < config.nTrees; i++) {
          // Bootstrap sampling
          let sampledFeatures = features;
          let sampledTargets = targets;

          if (config.bootstrap) {
            const indices = this.bootstrapSample(features.length);
            sampledFeatures = indices.map(idx => features[idx]);
            sampledTargets = indices.map(idx => targets[idx]);
          }

          // Random feature selection
          const featureSubset = this.selectRandomFeatures(
            features[0].length,
            config.maxFeatures
          );

          // Build tree with feature subset
          const tree = this.buildRandomTree(
            sampledFeatures,
            sampledTargets,
            featureSubset,
            config.maxDepth,
            config.minSamplesSplit
          );

          trees.push(tree);
        }

        (this as any).trees = trees;
      },

      async predict(inputs: number[][]): Promise<number[]> {
        const trees = (this as any).trees || [];

        return inputs.map(input => {
          const predictions = trees.map(tree => this.predictWithTree(tree, input));
          return predictions.reduce((a, b) => a + b, 0) / predictions.length;
        });
      },

      async evaluate(testData: MLDataset): Promise<MLMetrics> {
        const predictions = await this.predict(testData.features);
        return {
          mse: this.calculateMSE(testData.targets, predictions),
          mae: this.calculateMAE(testData.targets, predictions),
          r2: this.calculateR2(testData.targets, predictions)
        };
      }
    };
  }

  /**
   * Neural Network with advanced optimization
   */
  createNeuralNetworkModel(config: {
    layers: number[];
    activation: 'relu' | 'sigmoid' | 'tanh';
    optimizer: 'adam' | 'sgd' | 'rmsprop';
    learningRate: number;
    epochs: number;
    batchSize: number;
    dropout: number;
  }): MLModel {
    return {
      id: 'neural-network',
      name: 'Advanced Neural Network',
      type: 'regression',

      async train(dataset: MLDataset): Promise<void> {
        const { features, targets } = dataset;

        // Initialize network weights
        const weights = this.initializeWeights(config.layers);
        const biases = this.initializeBiases(config.layers);

        // Adam optimizer state
        const adamState = this.initializeAdamState(weights, biases);

        for (let epoch = 0; epoch < config.epochs; epoch++) {
          const batches = this.createBatches(features, targets, config.batchSize);

          for (const batch of batches) {
            // Forward pass
            const { predictions, activations } = this.forwardPass(
              batch.features,
              weights,
              biases,
              config.activation,
              config.dropout
            );

            // Backward pass
            const gradients = this.backwardPass(
              batch.features,
              batch.targets,
              predictions,
              activations,
              weights,
              config.activation
            );

            // Update weights with Adam optimizer
            this.updateWeightsAdam(
              weights,
              biases,
              gradients,
              adamState,
              config.learningRate,
              epoch
            );
          }

          // Log progress
          if (epoch % 10 === 0) {
            const { predictions } = this.forwardPass(features, weights, biases, config.activation);
            const loss = this.calculateMSE(targets, predictions);
          }
        }

        (this as any).weights = weights;
        (this as any).biases = biases;
        (this as any).config = config;
      },

      async predict(inputs: number[][]): Promise<number[]> {
        const weights = (this as any).weights;
        const biases = (this as any).biases;
        const config = (this as any).config;

        const { predictions } = this.forwardPass(inputs, weights, biases, config.activation);
        return predictions;
      },

      async evaluate(testData: MLDataset): Promise<MLMetrics> {
        const predictions = await this.predict(testData.features);
        return {
          mse: this.calculateMSE(testData.targets, predictions),
          mae: this.calculateMAE(testData.targets, predictions),
          r2: this.calculateR2(testData.targets, predictions)
        };
      }
    };
  }

  /**
   * Advanced Ensemble Voting
   */
  async createEnsembleModel(models: MLModel[], strategy: 'voting' | 'stacking' | 'blending'): Promise<MLModel> {
    return {
      id: 'ensemble-model',
      name: 'Advanced Ensemble Model',
      type: 'regression',

      async train(dataset: MLDataset): Promise<void> {
        // Train all base models
        for (const model of models) {
          await model.train(dataset);
        }

        if (strategy === 'stacking') {
          // Train meta-learner on base model predictions
          const basePredictions = await Promise.all(
            models.map(model => model.predict(dataset.features))
          );

          const stackedFeatures = dataset.features.map((_, i) =>
            basePredictions.map(predictions => predictions[i])
          );

          const metaLearner = this.createGradientBoostingModel({
            nEstimators: 50,
            learningRate: 0.1,
            maxDepth: 3,
            subsample: 0.8,
            regularization: 0.01
          });

          await metaLearner.train({
            features: stackedFeatures,
            targets: dataset.targets
          });

          (this as any).metaLearner = metaLearner;
        }

        (this as any).baseModels = models;
        (this as any).strategy = strategy;
      },

      async predict(inputs: number[][]): Promise<number[]> {
        const baseModels = (this as any).baseModels;
        const strategy = (this as any).strategy;

        const basePredictions = await Promise.all(
          baseModels.map((model: MLModel) => model.predict(inputs))
        );

        if (strategy === 'voting') {
          // Simple average
          return inputs.map((_, i) =>
            basePredictions.reduce((sum, predictions) => sum + predictions[i], 0) / basePredictions.length
          );
        } else if (strategy === 'stacking') {
          // Use meta-learner
          const metaLearner = (this as any).metaLearner;
          const stackedFeatures = inputs.map((_, i) =>
            basePredictions.map(predictions => predictions[i])
          );

          return metaLearner.predict(stackedFeatures);
        }

        return [];
      },

      async evaluate(testData: MLDataset): Promise<MLMetrics> {
        const predictions = await this.predict(testData.features);
        return {
          mse: this.calculateMSE(testData.targets, predictions),
          mae: this.calculateMAE(testData.targets, predictions),
          r2: this.calculateR2(testData.targets, predictions)
        };
      }
    };
  }

  // Utility methods for ML algorithms
  private buildDecisionTree(
    features: number[][],
    targets: number[],
    maxDepth: number,
    regularization: number,
    depth = 0
  ): TreeNode {
    // Terminal conditions
    if (depth >= maxDepth || features.length < 2) {
      return {
        prediction: this.calculateMean(targets),
        samples: features.length
      };
    }

    // Find best split
    const bestSplit = this.findBestSplit(features, targets, regularization);

    if (!bestSplit) {
      return {
        prediction: this.calculateMean(targets),
        samples: features.length
      };
    }

    // Split data
    const { leftFeatures, leftTargets, rightFeatures, rightTargets } =
      this.splitData(features, targets, bestSplit.feature, bestSplit.threshold);

    return {
      feature: bestSplit.feature,
      threshold: bestSplit.threshold,
      samples: features.length,
      left: this.buildDecisionTree(leftFeatures, leftTargets, maxDepth, regularization, depth + 1),
      right: this.buildDecisionTree(rightFeatures, rightTargets, maxDepth, regularization, depth + 1)
    };
  }

  private findBestSplit(
    features: number[][],
    targets: number[],
    regularization: number
  ): { feature: number; threshold: number; gain: number } | null {
    let bestGain = -Infinity;
    let bestSplit = null;

    const baseVariance = this.calculateVariance(targets);

    for (let featureIdx = 0; featureIdx < features[0].length; featureIdx++) {
      const featureValues = features.map(row => row[featureIdx]);
      const uniqueValues = [...new Set(featureValues)].sort((a, b) => a - b);

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;

        const { leftTargets, rightTargets } = this.splitTargets(
          features,
          targets,
          featureIdx,
          threshold
        );

        if (leftTargets.length === 0 || rightTargets.length === 0) continue;

        // Calculate information gain with regularization
        const leftVariance = this.calculateVariance(leftTargets);
        const rightVariance = this.calculateVariance(rightTargets);

        const weightedVariance =
          (leftTargets.length * leftVariance + rightTargets.length * rightVariance) / targets.length;

        const gain = baseVariance - weightedVariance - regularization * depth;

        if (gain > bestGain) {
          bestGain = gain;
          bestSplit = { feature: featureIdx, threshold, gain };
        }
      }
    }

    return bestSplit;
  }

  private predictWithTree(tree: TreeNode, input: number[]): number {
    if (tree.prediction !== undefined) {
      return tree.prediction;
    }

    if (tree.feature !== undefined && tree.threshold !== undefined) {
      if (input[tree.feature] <= tree.threshold) {
        return tree.left ? this.predictWithTree(tree.left, input) : 0;
      } else {
        return tree.right ? this.predictWithTree(tree.right, input) : 0;
      }
    }

    return 0;
  }

  // Statistical utility methods
  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = this.calculateMean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateMSE(actual: number[], predicted: number[]): number {
    return actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) / actual.length;
  }

  private calculateMAE(actual: number[], predicted: number[]): number {
    return actual.reduce((sum, val, i) => sum + Math.abs(val - predicted[i]), 0) / actual.length;
  }

  private calculateR2(actual: number[], predicted: number[]): number {
    const actualMean = this.calculateMean(actual);
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);

    return 1 - (residualSumSquares / totalSumSquares);
  }

  private subsample(size: number, ratio: number): number[] {
    const sampleSize = Math.floor(size * ratio);
    const indices = Array.from({ length: size }, (_, i) => i);

    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return indices.slice(0, sampleSize);
  }

  private splitData(
    features: number[][],
    targets: number[],
    featureIdx: number,
    threshold: number
  ): {
    leftFeatures: number[][];
    leftTargets: number[];
    rightFeatures: number[][];
    rightTargets: number[];
  } {
    const leftFeatures: number[][] = [];
    const leftTargets: number[] = [];
    const rightFeatures: number[][] = [];
    const rightTargets: number[] = [];

    for (let i = 0; i < features.length; i++) {
      if (features[i][featureIdx] <= threshold) {
        leftFeatures.push(features[i]);
        leftTargets.push(targets[i]);
      } else {
        rightFeatures.push(features[i]);
        rightTargets.push(targets[i]);
      }
    }

    return { leftFeatures, leftTargets, rightFeatures, rightTargets };
  }

  private splitTargets(
    features: number[][],
    targets: number[],
    featureIdx: number,
    threshold: number
  ): { leftTargets: number[]; rightTargets: number[] } {
    const leftTargets: number[] = [];
    const rightTargets: number[] = [];

    for (let i = 0; i < features.length; i++) {
      if (features[i][featureIdx] <= threshold) {
        leftTargets.push(targets[i]);
      } else {
        rightTargets.push(targets[i]);
      }
    }

    return { leftTargets, rightTargets };
  }

  private bootstrapSample(size: number): number[] {
    return Array.from({ length: size }, () => Math.floor(Math.random() * size));
  }

  private selectRandomFeatures(totalFeatures: number, maxFeatures: number): number[] {
    const features = Array.from({ length: totalFeatures }, (_, i) => i);
    const selected = [];

    for (let i = 0; i < Math.min(maxFeatures, totalFeatures); i++) {
      const randomIndex = Math.floor(Math.random() * features.length);
      selected.push(features.splice(randomIndex, 1)[0]);
    }

    return selected;
  }

  private buildRandomTree(
    features: number[][],
    targets: number[],
    featureSubset: number[],
    maxDepth: number,
    minSamplesSplit: number,
    depth = 0
  ): TreeNode {
    if (depth >= maxDepth || features.length < minSamplesSplit) {
      return {
        prediction: this.calculateMean(targets),
        samples: features.length
      };
    }

    // Use only feature subset
    const restrictedFeatures = features.map(row =>
      featureSubset.map(idx => row[idx])
    );

    const bestSplit = this.findBestSplit(restrictedFeatures, targets, 0);

    if (!bestSplit) {
      return {
        prediction: this.calculateMean(targets),
        samples: features.length
      };
    }

    // Map back to original feature index
    const originalFeatureIdx = featureSubset[bestSplit.feature];

    const { leftFeatures, leftTargets, rightFeatures, rightTargets } =
      this.splitData(features, targets, originalFeatureIdx, bestSplit.threshold);

    return {
      feature: originalFeatureIdx,
      threshold: bestSplit.threshold,
      samples: features.length,
      left: this.buildRandomTree(leftFeatures, leftTargets, featureSubset, maxDepth, minSamplesSplit, depth + 1),
      right: this.buildRandomTree(rightFeatures, rightTargets, featureSubset, maxDepth, minSamplesSplit, depth + 1)
    };
  }

  // Neural network utility methods
  private initializeWeights(layers: number[]): number[][][] {
    const weights = [];
    for (let i = 0; i < layers.length - 1; i++) {
      const layerWeights = [];
      for (let j = 0; j < layers[i + 1]; j++) {
        const neuronWeights = [];
        for (let k = 0; k < layers[i]; k++) {
          // Xavier initialization
          neuronWeights.push((Math.random() - 0.5) * 2 * Math.sqrt(6 / (layers[i] + layers[i + 1])));
        }
        layerWeights.push(neuronWeights);
      }
      weights.push(layerWeights);
    }
    return weights;
  }

  private initializeBiases(layers: number[]): number[][] {
    const biases = [];
    for (let i = 1; i < layers.length; i++) {
      biases.push(new Array(layers[i]).fill(0));
    }
    return biases;
  }

  private initializeAdamState(weights: number[][][], biases: number[][]): any {
    return {
      mWeights: weights.map(layer => layer.map(neuron => new Array(neuron.length).fill(0))),
      vWeights: weights.map(layer => layer.map(neuron => new Array(neuron.length).fill(0))),
      mBiases: biases.map(layer => new Array(layer.length).fill(0)),
      vBiases: biases.map(layer => new Array(layer.length).fill(0))
    };
  }

  private forwardPass(
    inputs: number[][],
    weights: number[][][],
    biases: number[][],
    activation: string,
    dropout = 0
  ): { predictions: number[]; activations: number[][][] } {
    const batchSize = inputs.length;
    const activations: number[][][] = [];

    let currentActivations = inputs;
    activations.push(currentActivations);

    for (let layer = 0; layer < weights.length; layer++) {
      const nextActivations: number[][] = [];

      for (let sample = 0; sample < batchSize; sample++) {
        const neuronOutputs: number[] = [];

        for (let neuron = 0; neuron < weights[layer].length; neuron++) {
          let sum = biases[layer][neuron];

          for (let input = 0; input < weights[layer][neuron].length; input++) {
            sum += currentActivations[sample][input] * weights[layer][neuron][input];
          }

          // Apply activation function
          let output = this.applyActivation(sum, activation);

          // Apply dropout during training
          if (dropout > 0 && Math.random() < dropout) {
            output = 0;
          } else if (dropout > 0) {
            output /= (1 - dropout); // Scale remaining neurons
          }

          neuronOutputs.push(output);
        }

        nextActivations.push(neuronOutputs);
      }

      currentActivations = nextActivations;
      activations.push(currentActivations);
    }

    return {
      predictions: currentActivations.map(sample => sample[0]), // Assuming single output
      activations
    };
  }

  private backwardPass(
    inputs: number[][],
    targets: number[],
    predictions: number[],
    activations: number[][][],
    weights: number[][][],
    activation: string
  ): any {
    // Simplified backpropagation - in production, use automatic differentiation
    const gradients = {
      weights: weights.map(layer => layer.map(neuron => new Array(neuron.length).fill(0))),
      biases: weights.map(layer => new Array(layer.length).fill(0))
    };

    // Calculate output layer gradients
    const outputGradients = predictions.map((pred, i) => 2 * (pred - targets[i]) / targets.length);

    // Backpropagate gradients (simplified)
    for (let layer = weights.length - 1; layer >= 0; layer--) {
      for (let neuron = 0; neuron < weights[layer].length; neuron++) {
        for (let input = 0; input < weights[layer][neuron].length; input++) {
          // Simplified gradient calculation
          gradients.weights[layer][neuron][input] = outputGradients[0] * activations[layer][0][input];
        }
        gradients.biases[layer][neuron] = outputGradients[0];
      }
    }

    return gradients;
  }

  private updateWeightsAdam(
    weights: number[][][],
    biases: number[][],
    gradients: any,
    adamState: any,
    learningRate: number,
    epoch: number
  ): void {
    const beta1 = 0.9;
    const beta2 = 0.999;
    const epsilon = 1e-8;

    const bias1Correction = 1 - Math.pow(beta1, epoch + 1);
    const bias2Correction = 1 - Math.pow(beta2, epoch + 1);

    // Update weights
    for (let layer = 0; layer < weights.length; layer++) {
      for (let neuron = 0; neuron < weights[layer].length; neuron++) {
        for (let input = 0; input < weights[layer][neuron].length; input++) {
          const gradient = gradients.weights[layer][neuron][input];

          adamState.mWeights[layer][neuron][input] =
            beta1 * adamState.mWeights[layer][neuron][input] + (1 - beta1) * gradient;

          adamState.vWeights[layer][neuron][input] =
            beta2 * adamState.vWeights[layer][neuron][input] + (1 - beta2) * gradient * gradient;

          const mHat = adamState.mWeights[layer][neuron][input] / bias1Correction;
          const vHat = adamState.vWeights[layer][neuron][input] / bias2Correction;

          weights[layer][neuron][input] -= learningRate * mHat / (Math.sqrt(vHat) + epsilon);
        }
      }
    }

    // Update biases (similar to weights)
    for (let layer = 0; layer < biases.length; layer++) {
      for (let neuron = 0; neuron < biases[layer].length; neuron++) {
        const gradient = gradients.biases[layer][neuron];

        adamState.mBiases[layer][neuron] =
          beta1 * adamState.mBiases[layer][neuron] + (1 - beta1) * gradient;

        adamState.vBiases[layer][neuron] =
          beta2 * adamState.vBiases[layer][neuron] + (1 - beta2) * gradient * gradient;

        const mHat = adamState.mBiases[layer][neuron] / bias1Correction;
        const vHat = adamState.vBiases[layer][neuron] / bias2Correction;

        biases[layer][neuron] -= learningRate * mHat / (Math.sqrt(vHat) + epsilon);
      }
    }
  }

  private applyActivation(x: number, activation: string): number {
    switch (activation) {
      case 'relu':
        return Math.max(0, x);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
        return Math.tanh(x);
      default:
        return x;
    }
  }

  private createBatches(
    features: number[][],
    targets: number[],
    batchSize: number
  ): { features: number[][]; targets: number[] }[] {
    const batches = [];
    for (let i = 0; i < features.length; i += batchSize) {
      batches.push({
        features: features.slice(i, i + batchSize),
        targets: targets.slice(i, i + batchSize)
      });
    }
    return batches;
  }

  /**
   * Register and manage models
   */
  registerModel(model: MLModel, weight = 1.0): void {
    this.models.set(model.id, model);
    this.ensembleWeights.set(model.id, weight);
  }

  /**
   * Get ensemble prediction
   */
  async ensemblePredict(inputs: number[][]): Promise<number[]> {
    const predictions = new Map<string, number[]>();

    for (const [modelId, model] of this.models) {
      predictions.set(modelId, await model.predict(inputs));
    }

    // Weighted ensemble prediction
    return inputs.map((_, i) => {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const [modelId, modelPredictions] of predictions) {
        const weight = this.ensembleWeights.get(modelId) || 1.0;
        weightedSum += weight * modelPredictions[i];
        totalWeight += weight;
      }

      return weightedSum / totalWeight;
    });
  }
}

// Export singleton instance
export const mlEnsemble = new AdvancedMLEnsemble();

// Export model factory functions
export const ModelFactory = {
  createGradientBoosting: (config: any) => mlEnsemble.createGradientBoostingModel(config),
  createRandomForest: (config: any) => mlEnsemble.createRandomForestModel(config),
  createNeuralNetwork: (config: any) => mlEnsemble.createNeuralNetworkModel(config),
  createEnsemble: (models: MLModel[], strategy: any) => mlEnsemble.createEnsembleModel(models, strategy)
};