/**
 * Deep Q-Network (DQN) Agent Implementation
 * For reinforcement learning in ESG optimization scenarios
 */

import * as tf from '@tensorflow/tfjs';

export interface DQNConfig {
  stateSize: number;
  actionSize: number;
  learningRate: number;
  discountFactor?: number;
  epsilon?: number;
  epsilonDecay?: number;
  epsilonMin?: number;
  batchSize?: number;
  memorySize?: number;
  targetUpdateFrequency?: number;
  hiddenLayers?: number[];
}

export interface State {
  features: number[];
  isTerminal?: boolean;
}

export interface Action {
  index: number;
  value: any;
}

export interface Experience {
  state: State;
  action: Action;
  reward: number;
  nextState: State;
  done: boolean;
}

export interface Environment {
  stateSize: number;
  actionSize: number;
  reset(): State;
  step(action: Action): { nextState: State; reward: number; done: boolean; info?: any };
  getActionSpace(): Action[];
}

export interface Policy {
  getAction(state: State): Action;
  updatePolicy(experiences: Experience[]): void;
  save(): Promise<string>;
  load(path: string): Promise<void>;
}

export class ReplayBuffer {
  private buffer: Experience[] = [];
  private maxSize: number;
  private pointer: number = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  add(experience: Experience): void {
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(experience);
    } else {
      this.buffer[this.pointer] = experience;
    }
    this.pointer = (this.pointer + 1) % this.maxSize;
  }

  sample(batchSize: number): Experience[] {
    const indices: number[] = [];
    const batch: Experience[] = [];
    
    // Generate random indices
    for (let i = 0; i < batchSize; i++) {
      let idx: number;
      do {
        idx = Math.floor(Math.random() * this.buffer.length);
      } while (indices.includes(idx));
      indices.push(idx);
      batch.push(this.buffer[idx]);
    }
    
    return batch;
  }

  size(): number {
    return this.buffer.length;
  }

  clear(): void {
    this.buffer = [];
    this.pointer = 0;
  }
}

export class DQNAgent implements Policy {
  private config: DQNConfig;
  private qNetwork: tf.LayersModel;
  private targetNetwork: tf.LayersModel;
  private replayBuffer: ReplayBuffer;
  private epsilon: number;
  private trainStep: number = 0;
  
  constructor(config: DQNConfig) {
    this.config = {
      discountFactor: 0.99,
      epsilon: 1.0,
      epsilonDecay: 0.995,
      epsilonMin: 0.01,
      batchSize: 32,
      memorySize: 10000,
      targetUpdateFrequency: 100,
      hiddenLayers: [128, 64],
      ...config
    };
    
    this.epsilon = this.config.epsilon!;
    this.replayBuffer = new ReplayBuffer(this.config.memorySize!);
    
    // Build Q-network and target network
    this.qNetwork = this.buildNetwork();
    this.targetNetwork = this.buildNetwork();
    this.updateTargetNetwork();
  }

  /**
   * Build the neural network architecture
   */
  private buildNetwork(): tf.LayersModel {
    const model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      units: this.config.hiddenLayers![0],
      activation: 'relu',
      inputShape: [this.config.stateSize]
    }));
    
    // Hidden layers
    for (let i = 1; i < this.config.hiddenLayers!.length; i++) {
      model.add(tf.layers.dense({
        units: this.config.hiddenLayers![i],
        activation: 'relu'
      }));
    }
    
    // Output layer
    model.add(tf.layers.dense({
      units: this.config.actionSize,
      activation: 'linear'
    }));
    
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'meanSquaredError'
    });
    
    return model;
  }

  /**
   * Update target network with Q-network weights
   */
  private updateTargetNetwork(): void {
    const qWeights = this.qNetwork.getWeights();
    this.targetNetwork.setWeights(qWeights);
  }

  /**
   * Choose action using epsilon-greedy policy
   */
  getAction(state: State): Action {
    // Exploration
    if (Math.random() <= this.epsilon) {
      return {
        index: Math.floor(Math.random() * this.config.actionSize),
        value: null
      };
    }
    
    // Exploitation
    const stateTensor = tf.tensor2d([state.features]);
    const qValues = this.qNetwork.predict(stateTensor) as tf.Tensor;
    const qValuesArray = qValues.arraySync() as number[][];
    
    stateTensor.dispose();
    qValues.dispose();
    
    const actionIndex = qValuesArray[0].indexOf(Math.max(...qValuesArray[0]));
    return {
      index: actionIndex,
      value: null
    };
  }

  /**
   * Store experience in replay buffer
   */
  remember(experience: Experience): void {
    this.replayBuffer.add(experience);
  }

  /**
   * Train the agent on a batch of experiences
   */
  async replay(): Promise<void> {
    if (this.replayBuffer.size() < this.config.batchSize!) {
      return;
    }
    
    const batch = this.replayBuffer.sample(this.config.batchSize!);
    
    // Prepare training data
    const states = batch.map(exp => exp.state.features);
    const nextStates = batch.map(exp => exp.nextState.features);
    
    const statesTensor = tf.tensor2d(states);
    const nextStatesTensor = tf.tensor2d(nextStates);
    
    // Get current Q values
    const currentQValues = this.qNetwork.predict(statesTensor) as tf.Tensor;
    const currentQValuesArray = await currentQValues.array() as number[][];
    
    // Get next Q values from target network
    const nextQValues = this.targetNetwork.predict(nextStatesTensor) as tf.Tensor;
    const nextQValuesArray = await nextQValues.array() as number[][];
    
    // Calculate target values
    const targetValues = currentQValuesArray.map((qValues, i) => {
      const exp = batch[i];
      const target = [...qValues];
      
      if (exp.done) {
        target[exp.action.index] = exp.reward;
      } else {
        const maxNextQ = Math.max(...nextQValuesArray[i]);
        target[exp.action.index] = exp.reward + this.config.discountFactor! * maxNextQ;
      }
      
      return target;
    });
    
    // Train the network
    const targetTensor = tf.tensor2d(targetValues);
    await this.qNetwork.fit(statesTensor, targetTensor, {
      epochs: 1,
      verbose: 0
    });
    
    // Clean up tensors
    statesTensor.dispose();
    nextStatesTensor.dispose();
    currentQValues.dispose();
    nextQValues.dispose();
    targetTensor.dispose();
    
    // Update target network periodically
    this.trainStep++;
    if (this.trainStep % this.config.targetUpdateFrequency! === 0) {
      this.updateTargetNetwork();
    }
    
    // Decay epsilon
    if (this.epsilon > this.config.epsilonMin!) {
      this.epsilon *= this.config.epsilonDecay!;
    }
  }

  /**
   * Update policy based on experiences
   */
  updatePolicy(experiences: Experience[]): void {
    // Add experiences to replay buffer
    for (const exp of experiences) {
      this.remember(exp);
    }
    
    // Train on batch
    this.replay();
  }

  /**
   * Train the agent in an environment
   */
  async train(
    environment: Environment,
    options: {
      episodes: number;
      maxSteps: number;
      verbose?: boolean;
      saveFrequency?: number;
    }
  ): Promise<Policy> {
    const rewards: number[] = [];
    
    for (let episode = 0; episode < options.episodes; episode++) {
      let state = environment.reset();
      let totalReward = 0;
      
      for (let step = 0; step < options.maxSteps; step++) {
        // Choose action
        const action = this.getAction(state);
        
        // Take action in environment
        const { nextState, reward, done } = environment.step(action);
        
        // Store experience
        this.remember({
          state,
          action,
          reward,
          nextState,
          done
        });
        
        // Train
        await this.replay();
        
        totalReward += reward;
        state = nextState;
        
        if (done) {
          break;
        }
      }
      
      rewards.push(totalReward);
      
      if (options.verbose && episode % 10 === 0) {
        const avgReward = rewards.slice(-100).reduce((a, b) => a + b, 0) / Math.min(100, rewards.length);
        console.log(`Episode ${episode}, Average Reward: ${avgReward.toFixed(2)}, Epsilon: ${this.epsilon.toFixed(3)}`);
      }
      
      // Save model periodically
      if (options.saveFrequency && episode % options.saveFrequency === 0 && episode > 0) {
        await this.save();
      }
    }
    
    return this;
  }

  /**
   * Save the model
   */
  async save(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `localstorage://dqn-model-${timestamp}`;
    await this.qNetwork.save(path);
    return path;
  }

  /**
   * Load a saved model
   */
  async load(path: string): Promise<void> {
    this.qNetwork = await tf.loadLayersModel(path);
    this.updateTargetNetwork();
  }

  /**
   * Get training statistics
   */
  getStatistics(): {
    epsilon: number;
    bufferSize: number;
    trainStep: number;
  } {
    return {
      epsilon: this.epsilon,
      bufferSize: this.replayBuffer.size(),
      trainStep: this.trainStep
    };
  }
}

/**
 * Example ESG Environment for testing
 */
export class ESGEnvironment implements Environment {
  stateSize: number = 10;
  actionSize: number = 5;
  private currentState: State;
  private stepCount: number = 0;
  private maxSteps: number = 100;
  
  constructor(config?: { stateSize?: number; actionSize?: number; maxSteps?: number }) {
    if (config) {
      this.stateSize = config.stateSize || this.stateSize;
      this.actionSize = config.actionSize || this.actionSize;
      this.maxSteps = config.maxSteps || this.maxSteps;
    }
  }
  
  reset(): State {
    this.stepCount = 0;
    this.currentState = {
      features: Array(this.stateSize).fill(0).map(() => Math.random())
    };
    return this.currentState;
  }
  
  step(action: Action): { nextState: State; reward: number; done: boolean; info?: any } {
    this.stepCount++;
    
    // Simulate state transition
    const nextFeatures = this.currentState.features.map((f, i) => {
      const delta = (action.index === i) ? 0.1 : -0.01;
      return Math.max(0, Math.min(1, f + delta + (Math.random() - 0.5) * 0.05));
    });
    
    const nextState: State = { features: nextFeatures };
    
    // Calculate reward (example: minimize emissions while maintaining efficiency)
    const emissions = nextFeatures.slice(0, 3).reduce((a, b) => a + b, 0);
    const efficiency = nextFeatures.slice(3, 6).reduce((a, b) => a + b, 0);
    const reward = -emissions + efficiency * 0.5;
    
    const done = this.stepCount >= this.maxSteps || emissions < 0.5;
    
    this.currentState = nextState;
    
    return {
      nextState,
      reward,
      done,
      info: { emissions, efficiency }
    };
  }
  
  getActionSpace(): Action[] {
    return Array(this.actionSize).fill(0).map((_, i) => ({ index: i, value: null }));
  }
}