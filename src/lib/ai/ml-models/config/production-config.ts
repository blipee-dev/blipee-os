/**
 * Production Configuration for Stream B ML Pipeline
 * Centralized configuration management for production deployment
 */

export interface ProductionEnvironment {
  name: 'development' | 'staging' | 'production';
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  metricsEnabled: boolean;
  tracingEnabled: boolean;
}

export interface ModelServingConfig {
  maxConcurrentRequests: number;
  requestTimeoutMs: number;
  modelCacheSize: number;
  enableModelVersioning: boolean;
  defaultModelTimeout: number;
  healthCheckInterval: number;
}

export interface AutoMLProductionConfig {
  maxModelsInProduction: number;
  maxOptimizationTimeHours: number;
  enableAutoRetraining: boolean;
  retrainingSchedule: string; // cron format
  minimumAccuracyThreshold: number;
  maxModelAge: number; // days
  enableExperimentTracking: boolean;
}

export interface MonitoringProductionConfig {
  metricsRetentionDays: number;
  alertingEnabled: boolean;
  driftDetectionSensitivity: 'low' | 'medium' | 'high';
  performanceAlertThresholds: {
    latencyP95Ms: number;
    errorRatePercent: number;
    throughputReqPerSec: number;
    accuracyThreshold: number;
  };
  alertChannels: {
    slack?: { webhookUrl: string; channel: string };
    email?: { recipients: string[]; smtpConfig: any };
    pagerduty?: { integrationKey: string };
    webhook?: { url: string; headers: Record<string, string> };
  };
}

export interface HyperparameterOptimizationConfig {
  maxConcurrentOptimizations: number;
  optimizationTimeoutHours: number;
  enableDistributedOptimization: boolean;
  resourceLimits: {
    maxCpuCores: number;
    maxMemoryGb: number;
    maxGpuCount: number;
  };
  storageConfig: {
    resultsCacheEnabled: boolean;
    experimentLoggingEnabled: boolean;
    artifactStoragePath: string;
  };
}

export interface ABTestingProductionConfig {
  maxConcurrentTests: number;
  defaultTestDurationDays: number;
  minimumSampleSize: number;
  significanceLevel: number;
  enableEarlyStoppingRules: boolean;
  trafficAllocationLimits: {
    maxVariantTrafficPercent: number;
    minControlTrafficPercent: number;
  };
  resultStorageConfig: {
    retentionDays: number;
    compressionEnabled: boolean;
  };
}

export interface SecurityConfig {
  enableAuthentication: boolean;
  enableAuthorization: boolean;
  apiKeyRequired: boolean;
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  dataEncryption: {
    encryptAtRest: boolean;
    encryptInTransit: boolean;
    keyRotationDays: number;
  };
  auditLogging: {
    enabled: boolean;
    logAllRequests: boolean;
    retentionDays: number;
  };
}

export interface ScalingConfig {
  autoScaling: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    targetCpuPercent: number;
    targetMemoryPercent: number;
    scaleUpCooldown: number; // seconds
    scaleDownCooldown: number; // seconds
  };
  loadBalancing: {
    strategy: 'round-robin' | 'weighted' | 'least-connections';
    healthCheckEnabled: boolean;
    healthCheckPath: string;
    healthCheckInterval: number;
  };
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxCalls: number;
  };
}

export interface ComplianceConfig {
  dataRetention: {
    userDataDays: number;
    modelMetricsDays: number;
    auditLogsDays: number;
  };
  privacy: {
    enableDataAnonymization: boolean;
    enableRightToBeForgotten: boolean;
    consentTrackingEnabled: boolean;
  };
  regulatory: {
    enableSOC2Compliance: boolean;
    enableGDPRCompliance: boolean;
    enableHIPAACompliance: boolean;
    modelExplainabilityRequired: boolean;
  };
}

export interface ProductionConfig {
  environment: ProductionEnvironment;
  modelServing: ModelServingConfig;
  autoML: AutoMLProductionConfig;
  monitoring: MonitoringProductionConfig;
  hyperparameterOptimization: HyperparameterOptimizationConfig;
  abTesting: ABTestingProductionConfig;
  security: SecurityConfig;
  scaling: ScalingConfig;
  compliance: ComplianceConfig;
}

// Environment-specific configurations
export const productionConfigs: Record<string, ProductionConfig> = {
  development: {
    environment: {
      name: 'development',
      debug: true,
      logLevel: 'debug',
      metricsEnabled: false,
      tracingEnabled: true
    },
    modelServing: {
      maxConcurrentRequests: 10,
      requestTimeoutMs: 30000,
      modelCacheSize: 3,
      enableModelVersioning: false,
      defaultModelTimeout: 5000,
      healthCheckInterval: 30000
    },
    autoML: {
      maxModelsInProduction: 3,
      maxOptimizationTimeHours: 1,
      enableAutoRetraining: false,
      retrainingSchedule: '0 2 * * 0', // Weekly
      minimumAccuracyThreshold: 0.6,
      maxModelAge: 30,
      enableExperimentTracking: true
    },
    monitoring: {
      metricsRetentionDays: 7,
      alertingEnabled: false,
      driftDetectionSensitivity: 'low',
      performanceAlertThresholds: {
        latencyP95Ms: 1000,
        errorRatePercent: 10,
        throughputReqPerSec: 1,
        accuracyThreshold: 0.5
      },
      alertChannels: {}
    },
    hyperparameterOptimization: {
      maxConcurrentOptimizations: 2,
      optimizationTimeoutHours: 2,
      enableDistributedOptimization: false,
      resourceLimits: {
        maxCpuCores: 4,
        maxMemoryGb: 8,
        maxGpuCount: 0
      },
      storageConfig: {
        resultsCacheEnabled: true,
        experimentLoggingEnabled: true,
        artifactStoragePath: './tmp/ml-artifacts'
      }
    },
    abTesting: {
      maxConcurrentTests: 3,
      defaultTestDurationDays: 1,
      minimumSampleSize: 50,
      significanceLevel: 0.05,
      enableEarlyStoppingRules: false,
      trafficAllocationLimits: {
        maxVariantTrafficPercent: 50,
        minControlTrafficPercent: 30
      },
      resultStorageConfig: {
        retentionDays: 30,
        compressionEnabled: false
      }
    },
    security: {
      enableAuthentication: false,
      enableAuthorization: false,
      apiKeyRequired: false,
      rateLimiting: {
        enabled: false,
        requestsPerMinute: 1000,
        burstLimit: 100
      },
      dataEncryption: {
        encryptAtRest: false,
        encryptInTransit: false,
        keyRotationDays: 90
      },
      auditLogging: {
        enabled: true,
        logAllRequests: false,
        retentionDays: 30
      }
    },
    scaling: {
      autoScaling: {
        enabled: false,
        minInstances: 1,
        maxInstances: 3,
        targetCpuPercent: 80,
        targetMemoryPercent: 80,
        scaleUpCooldown: 300,
        scaleDownCooldown: 600
      },
      loadBalancing: {
        strategy: 'round-robin',
        healthCheckEnabled: true,
        healthCheckPath: '/health',
        healthCheckInterval: 30
      },
      circuitBreaker: {
        enabled: false,
        failureThreshold: 5,
        recoveryTimeout: 60,
        halfOpenMaxCalls: 3
      }
    },
    compliance: {
      dataRetention: {
        userDataDays: 30,
        modelMetricsDays: 7,
        auditLogsDays: 30
      },
      privacy: {
        enableDataAnonymization: false,
        enableRightToBeForgotten: false,
        consentTrackingEnabled: false
      },
      regulatory: {
        enableSOC2Compliance: false,
        enableGDPRCompliance: false,
        enableHIPAACompliance: false,
        modelExplainabilityRequired: false
      }
    }
  },

  staging: {
    environment: {
      name: 'staging',
      debug: false,
      logLevel: 'info',
      metricsEnabled: true,
      tracingEnabled: true
    },
    modelServing: {
      maxConcurrentRequests: 50,
      requestTimeoutMs: 15000,
      modelCacheSize: 5,
      enableModelVersioning: true,
      defaultModelTimeout: 3000,
      healthCheckInterval: 15000
    },
    autoML: {
      maxModelsInProduction: 5,
      maxOptimizationTimeHours: 4,
      enableAutoRetraining: true,
      retrainingSchedule: '0 1 * * 0', // Weekly at 1 AM
      minimumAccuracyThreshold: 0.7,
      maxModelAge: 14,
      enableExperimentTracking: true
    },
    monitoring: {
      metricsRetentionDays: 30,
      alertingEnabled: true,
      driftDetectionSensitivity: 'medium',
      performanceAlertThresholds: {
        latencyP95Ms: 500,
        errorRatePercent: 5,
        throughputReqPerSec: 10,
        accuracyThreshold: 0.65
      },
      alertChannels: {
        slack: {
          webhookUrl: process.env.STAGING_SLACK_WEBHOOK || '',
          channel: '#ml-staging-alerts'
        }
      }
    },
    hyperparameterOptimization: {
      maxConcurrentOptimizations: 3,
      optimizationTimeoutHours: 6,
      enableDistributedOptimization: true,
      resourceLimits: {
        maxCpuCores: 8,
        maxMemoryGb: 16,
        maxGpuCount: 1
      },
      storageConfig: {
        resultsCacheEnabled: true,
        experimentLoggingEnabled: true,
        artifactStoragePath: '/opt/ml-artifacts'
      }
    },
    abTesting: {
      maxConcurrentTests: 5,
      defaultTestDurationDays: 7,
      minimumSampleSize: 200,
      significanceLevel: 0.05,
      enableEarlyStoppingRules: true,
      trafficAllocationLimits: {
        maxVariantTrafficPercent: 30,
        minControlTrafficPercent: 50
      },
      resultStorageConfig: {
        retentionDays: 90,
        compressionEnabled: true
      }
    },
    security: {
      enableAuthentication: true,
      enableAuthorization: true,
      apiKeyRequired: true,
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 500,
        burstLimit: 50
      },
      dataEncryption: {
        encryptAtRest: true,
        encryptInTransit: true,
        keyRotationDays: 60
      },
      auditLogging: {
        enabled: true,
        logAllRequests: true,
        retentionDays: 90
      }
    },
    scaling: {
      autoScaling: {
        enabled: true,
        minInstances: 2,
        maxInstances: 8,
        targetCpuPercent: 70,
        targetMemoryPercent: 75,
        scaleUpCooldown: 180,
        scaleDownCooldown: 300
      },
      loadBalancing: {
        strategy: 'weighted',
        healthCheckEnabled: true,
        healthCheckPath: '/health',
        healthCheckInterval: 15
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeout: 30,
        halfOpenMaxCalls: 5
      }
    },
    compliance: {
      dataRetention: {
        userDataDays: 90,
        modelMetricsDays: 30,
        auditLogsDays: 90
      },
      privacy: {
        enableDataAnonymization: true,
        enableRightToBeForgotten: true,
        consentTrackingEnabled: true
      },
      regulatory: {
        enableSOC2Compliance: true,
        enableGDPRCompliance: true,
        enableHIPAACompliance: false,
        modelExplainabilityRequired: true
      }
    }
  },

  production: {
    environment: {
      name: 'production',
      debug: false,
      logLevel: 'warn',
      metricsEnabled: true,
      tracingEnabled: true
    },
    modelServing: {
      maxConcurrentRequests: 200,
      requestTimeoutMs: 10000,
      modelCacheSize: 10,
      enableModelVersioning: true,
      defaultModelTimeout: 2000,
      healthCheckInterval: 10000
    },
    autoML: {
      maxModelsInProduction: 10,
      maxOptimizationTimeHours: 12,
      enableAutoRetraining: true,
      retrainingSchedule: '0 2 * * 1', // Weekly on Monday at 2 AM
      minimumAccuracyThreshold: 0.8,
      maxModelAge: 7,
      enableExperimentTracking: true
    },
    monitoring: {
      metricsRetentionDays: 365,
      alertingEnabled: true,
      driftDetectionSensitivity: 'high',
      performanceAlertThresholds: {
        latencyP95Ms: 200,
        errorRatePercent: 1,
        throughputReqPerSec: 100,
        accuracyThreshold: 0.75
      },
      alertChannels: {
        slack: {
          webhookUrl: process.env.PROD_SLACK_WEBHOOK || '',
          channel: '#ml-prod-alerts'
        },
        pagerduty: {
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || ''
        },
        email: {
          recipients: ['ml-team@blipee.com', 'ops@blipee.com'],
          smtpConfig: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          }
        }
      }
    },
    hyperparameterOptimization: {
      maxConcurrentOptimizations: 5,
      optimizationTimeoutHours: 24,
      enableDistributedOptimization: true,
      resourceLimits: {
        maxCpuCores: 16,
        maxMemoryGb: 32,
        maxGpuCount: 4
      },
      storageConfig: {
        resultsCacheEnabled: true,
        experimentLoggingEnabled: true,
        artifactStoragePath: '/data/ml-artifacts'
      }
    },
    abTesting: {
      maxConcurrentTests: 10,
      defaultTestDurationDays: 14,
      minimumSampleSize: 1000,
      significanceLevel: 0.01,
      enableEarlyStoppingRules: true,
      trafficAllocationLimits: {
        maxVariantTrafficPercent: 20,
        minControlTrafficPercent: 60
      },
      resultStorageConfig: {
        retentionDays: 365,
        compressionEnabled: true
      }
    },
    security: {
      enableAuthentication: true,
      enableAuthorization: true,
      apiKeyRequired: true,
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 1000,
        burstLimit: 100
      },
      dataEncryption: {
        encryptAtRest: true,
        encryptInTransit: true,
        keyRotationDays: 30
      },
      auditLogging: {
        enabled: true,
        logAllRequests: true,
        retentionDays: 365
      }
    },
    scaling: {
      autoScaling: {
        enabled: true,
        minInstances: 5,
        maxInstances: 50,
        targetCpuPercent: 60,
        targetMemoryPercent: 70,
        scaleUpCooldown: 120,
        scaleDownCooldown: 300
      },
      loadBalancing: {
        strategy: 'least-connections',
        healthCheckEnabled: true,
        healthCheckPath: '/health',
        healthCheckInterval: 10
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        recoveryTimeout: 30,
        halfOpenMaxCalls: 10
      }
    },
    compliance: {
      dataRetention: {
        userDataDays: 365,
        modelMetricsDays: 90,
        auditLogsDays: 2555 // 7 years
      },
      privacy: {
        enableDataAnonymization: true,
        enableRightToBeForgotten: true,
        consentTrackingEnabled: true
      },
      regulatory: {
        enableSOC2Compliance: true,
        enableGDPRCompliance: true,
        enableHIPAACompliance: true,
        modelExplainabilityRequired: true
      }
    }
  }
};

/**
 * Get configuration for the current environment
 */
export function getProductionConfig(env?: string): ProductionConfig {
  const environment = env || process.env['NODE_ENV'] || 'development';
  const config = productionConfigs[environment];
  
  if (!config) {
    throw new Error(`No configuration found for environment: ${environment}`);
  }
  
  return config;
}

/**
 * Validate production configuration
 */
export function validateProductionConfig(config: ProductionConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate model serving config
  if (config.modelServing.maxConcurrentRequests <= 0) {
    errors.push('maxConcurrentRequests must be greater than 0');
  }
  
  if (config.modelServing.requestTimeoutMs <= 0) {
    errors.push('requestTimeoutMs must be greater than 0');
  }
  
  // Validate AutoML config
  if (config.autoML.maxModelsInProduction <= 0) {
    errors.push('maxModelsInProduction must be greater than 0');
  }
  
  if (config.autoML.minimumAccuracyThreshold < 0 || config.autoML.minimumAccuracyThreshold > 1) {
    errors.push('minimumAccuracyThreshold must be between 0 and 1');
  }
  
  // Validate A/B testing config
  if (config.abTesting.significanceLevel <= 0 || config.abTesting.significanceLevel >= 1) {
    errors.push('significanceLevel must be between 0 and 1');
  }
  
  if (config.abTesting.trafficAllocationLimits.maxVariantTrafficPercent + 
      config.abTesting.trafficAllocationLimits.minControlTrafficPercent > 100) {
    errors.push('Traffic allocation limits exceed 100%');
  }
  
  // Validate scaling config
  if (config.scaling.autoScaling.minInstances > config.scaling.autoScaling.maxInstances) {
    errors.push('minInstances cannot be greater than maxInstances');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Override configuration with environment variables
 */
export function applyEnvironmentOverrides(config: ProductionConfig): ProductionConfig {
  const overriddenConfig = { ...config };
  
  // Override with environment variables if present
  if (process.env.ML_MAX_CONCURRENT_REQUESTS) {
    overriddenConfig.modelServing.maxConcurrentRequests = parseInt(process.env.ML_MAX_CONCURRENT_REQUESTS);
  }
  
  if (process.env.ML_REQUEST_TIMEOUT_MS) {
    overriddenConfig.modelServing.requestTimeoutMs = parseInt(process.env.ML_REQUEST_TIMEOUT_MS);
  }
  
  if (process.env.ML_ENABLE_AUTO_SCALING) {
    overriddenConfig.scaling.autoScaling.enabled = process.env.ML_ENABLE_AUTO_SCALING === 'true';
  }
  
  if (process.env.ML_MIN_INSTANCES) {
    overriddenConfig.scaling.autoScaling.minInstances = parseInt(process.env.ML_MIN_INSTANCES);
  }
  
  if (process.env.ML_MAX_INSTANCES) {
    overriddenConfig.scaling.autoScaling.maxInstances = parseInt(process.env.ML_MAX_INSTANCES);
  }
  
  if (process.env.ML_DRIFT_SENSITIVITY) {
    overriddenConfig.monitoring.driftDetectionSensitivity = process.env.ML_DRIFT_SENSITIVITY as 'low' | 'medium' | 'high';
  }
  
  return overriddenConfig;
}