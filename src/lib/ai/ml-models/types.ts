/**
 * ML Pipeline Types and Interfaces
 */

export interface MLPipelineConfig {
  dataIngestion: DataIngestionConfig;
  featureEngineering: FeatureEngineeringConfig;
  modelTraining: ModelTrainingConfig;
  inference: InferenceConfig;
  monitoring: MonitoringConfig;
}

export interface DataIngestionConfig {
  batchSize: number;
  validationEnabled: boolean;
  preprocessingSteps: PreprocessingStep[];
}

export interface FeatureEngineeringConfig {
  lagPeriods?: number[];
  windowSizes?: number[];
  maxFeatures?: number;
  targetVariable?: string;
  maxInteractionDepth?: number;
}

export interface ModelTrainingConfig {
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
  validationSplit?: number;
  earlyStopping?: boolean;
  patience?: number;
}

export interface InferenceConfig {
  batchPrediction: boolean;
  cacheEnabled: boolean;
  explainability: boolean;
}

export interface MonitoringConfig {
  driftDetection: boolean;
  performanceTracking: boolean;
  alertThresholds: AlertThresholds;
}

export interface Feature {
  name: string;
  value: number;
  type: 'numeric' | 'categorical' | 'binary' | 'time';
}

export interface TrainedModel {
  id: string;
  type: ModelType;
  version: string;
  metrics: ModelMetrics;
  createdAt: Date;
  parameters: any;
}

export interface ModelMetrics {
  accuracy?: number;
  mae?: number;
  mse?: number;
  rmse?: number;
  r2?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  loss?: number;
  improvement?: number;
  feasibility?: number;
}

export interface Prediction {
  value: number | number[];
  confidence: number;
  timestamp: Date;
  modelVersion: string;
  explanation?: PredictionExplanation;
}

export interface PredictionExplanation {
  factors: Array<{ feature: string; impact: number }>;
  reasoning: string;
}

export interface TrainingData {
  features: number[][];
  labels: number[];
  metadata?: any;
}

export interface ProcessedData {
  features: Feature[];
  timestamp: Date;
  metadata: any;
}

export type ModelType = 
  | 'emissions_prediction'
  | 'anomaly_detection'
  | 'optimization'
  | 'regulatory_prediction'
  | 'supply_chain_risk';

export interface PreprocessingStep {
  type: 'normalize' | 'standardize' | 'encode' | 'impute';
  config?: any;
}

export interface AlertThresholds {
  accuracy: number;
  latency: number;
  errorRate: number;
}

export interface ModelRegistry {
  register(model: TrainedModel, metrics: ModelMetrics): Promise<string>;
  getLatest(modelType: ModelType): Promise<TrainedModel>;
  getAllVersions(modelType: ModelType): Promise<TrainedModel[]>;
}

export interface FeatureStore {
  store(features: Feature[]): Promise<void>;
  retrieve(query: FeatureQuery): Promise<Feature[]>;
  getFeatureHistory(featureName: string, limit: number): Promise<Feature[]>;
}

export interface FeatureQuery {
  names?: string[];
  timeRange?: { start: Date; end: Date };
  limit?: number;
}

export interface RawData {
  [key: string]: any;
  timestamp?: Date | string;
}

export interface ESGData {
  emissions?: {
    total: number;
    scope1?: number;
    scope2?: number;
    scope3?: number;
  };
  revenue?: number;
  energy?: {
    consumption: number;
    renewable: number;
    total: number;
  };
  production?: number;
  suppliers?: Array<{
    id: string;
    riskScore: number;
    location: string;
  }>;
  timestamp?: Date | string;
}

export interface EmissionsData {
  timestamp: Date;
  scope1: number;
  scope2: number;
  scope3: number;
  totalEmissions: number;
  energyConsumption: number;
  productionVolume: number;
  temperature: number;
  dayOfWeek: number;
  monthOfYear: number;
  isHoliday: boolean;
  economicIndex: number;
}

export interface MetricData {
  timestamp: Date;
  metricName: string;
  value: number;
  dimensions: Record<string, string>;
}

export interface ExternalFactors {
  weatherData?: any;
  economicIndicators?: any;
  regulatoryChanges?: any;
  marketConditions?: any;
}

export interface EmissionsForecast {
  predictions: number[];
  confidenceIntervals: Array<[number, number]>;
  horizon: number;
  factors: KeyFactor[];
}

export interface KeyFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative';
}

export interface TrainingResult {
  model: any;
  metrics: ModelMetrics;
  history?: any;
}

export interface ModelConfig {
  name: string;
  type: string;
  version?: string;
  hyperparameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EvaluationMetrics {
  accuracy?: number;
  loss?: number;
  mae?: number;
  mse?: number;
  rmse?: number;
  r2?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  confusionMatrix?: number[][];
}

export interface TestData {
  [key: string]: any;
}

export interface ValidationResults {
  [modelName: string]: ModelMetrics;
  cross?: CrossValidationResult;
}

export interface CrossValidationResult {
  meanAccuracy: number;
  stdAccuracy: number;
  folds: number;
}

export interface LoadedModel {
  id: string;
  version: string;
  model: any;
  preprocess: (input: any) => Promise<any>;
  predict: (input: any) => Promise<any>;
  postprocess: (output: any) => Promise<any>;
  batchPredict?: (inputs: any[]) => Promise<any[]>;
}

export interface InferenceOptions {
  batch?: boolean;
  batchSize?: number;
  batchTimeout?: number;
  explain?: boolean;
}

export interface InferenceRequest {
  input: any;
  resolve: (value: any) => void;
}