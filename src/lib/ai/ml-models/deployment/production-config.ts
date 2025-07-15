/**
 * Production ML Deployment Configuration
 * Handles model deployment, scaling, and monitoring in production
 */

import { ModelConfig, DeploymentStrategy, ScalingPolicy } from '../types';

export interface ProductionDeploymentConfig {
  // Model deployment settings
  model: {
    id: string;
    version: string;
    framework: 'tensorflow' | 'pytorch' | 'onnx' | 'sklearn';
    artifactPath: string;
    requirements: {
      cpu: number;
      memory: string;
      gpu?: boolean;
      accelerator?: 'nvidia' | 'tpu';
    };
  };

  // Serving configuration
  serving: {
    replicas: {
      min: number;
      max: number;
      target: number;
    };
    batchConfig?: {
      maxBatchSize: number;
      batchTimeout: number;
    };
    endpoints: {
      predict: string;
      health: string;
      metrics: string;
    };
    authentication: {
      enabled: boolean;
      method: 'api-key' | 'oauth' | 'jwt';
    };
  };

  // Auto-scaling policies
  scaling: {
    policy: ScalingPolicy;
    metrics: {
      targetCPU?: number;
      targetMemory?: number;
      targetRPS?: number;
      targetLatency?: number;
    };
    behavior: {
      scaleUp: {
        stabilizationWindow: number;
        policies: {
          type: 'Pods' | 'Percent';
          value: number;
          periodSeconds: number;
        }[];
      };
      scaleDown: {
        stabilizationWindow: number;
        policies: {
          type: 'Pods' | 'Percent';
          value: number;
          periodSeconds: number;
        }[];
      };
    };
  };

  // Monitoring and observability
  monitoring: {
    metrics: {
      enabled: boolean;
      interval: number;
      exporters: ('prometheus' | 'cloudwatch' | 'stackdriver')[];
    };
    logging: {
      level: 'debug' | 'info' | 'warn' | 'error';
      format: 'json' | 'text';
      destinations: ('stdout' | 'file' | 'elasticsearch' | 'cloudwatch')[];
    };
    tracing: {
      enabled: boolean;
      samplingRate: number;
      exporter: 'jaeger' | 'zipkin' | 'otlp';
    };
    alerts: {
      enabled: boolean;
      rules: AlertRule[];
    };
  };

  // Deployment strategy
  deployment: {
    strategy: DeploymentStrategy;
    canary?: {
      steps: number;
      interval: string;
      threshold: number;
      analysis: {
        metrics: string[];
        successCriteria: Record<string, number>;
      };
    };
    blueGreen?: {
      autoPromote: boolean;
      promotionDelay: string;
      scaleDownDelay: string;
    };
    rollback: {
      automatic: boolean;
      failureThreshold: number;
      successThreshold: number;
    };
  };

  // Security configuration
  security: {
    tls: {
      enabled: boolean;
      certPath?: string;
      keyPath?: string;
    };
    networkPolicies: {
      ingress: NetworkPolicy[];
      egress: NetworkPolicy[];
    };
    secrets: {
      provider: 'kubernetes' | 'vault' | 'aws-secrets' | 'azure-keyvault';
      path: string;
    };
  };
}

interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: 'critical' | 'warning' | 'info';
  annotations: Record<string, string>;
}

interface NetworkPolicy {
  from?: {
    namespaceSelector?: Record<string, string>;
    podSelector?: Record<string, string>;
  }[];
  to?: {
    namespaceSelector?: Record<string, string>;
    podSelector?: Record<string, string>;
  }[];
  ports?: {
    protocol: 'TCP' | 'UDP';
    port: number;
  }[];
}

// Production deployment presets
export const PRODUCTION_PRESETS = {
  // High-throughput batch prediction
  batchPrediction: {
    model: {
      requirements: {
        cpu: 4,
        memory: '8Gi',
        gpu: true,
        accelerator: 'nvidia' as const
      }
    },
    serving: {
      replicas: {
        min: 2,
        max: 10,
        target: 4
      },
      batchConfig: {
        maxBatchSize: 128,
        batchTimeout: 100
      },
      endpoints: {
        predict: '/v1/models/:model/predict',
        health: '/health',
        metrics: '/metrics'
      },
      authentication: {
        enabled: true,
        method: 'api-key' as const
      }
    },
    scaling: {
      policy: 'reactive' as ScalingPolicy,
      metrics: {
        targetCPU: 70,
        targetRPS: 1000,
        targetLatency: 200
      },
      behavior: {
        scaleUp: {
          stabilizationWindow: 60,
          policies: [
            { type: 'Percent', value: 100, periodSeconds: 15 },
            { type: 'Pods', value: 4, periodSeconds: 15 }
          ]
        },
        scaleDown: {
          stabilizationWindow: 300,
          policies: [
            { type: 'Percent', value: 10, periodSeconds: 60 }
          ]
        }
      }
    },
    monitoring: {
      metrics: {
        enabled: true,
        interval: 15,
        exporters: ['prometheus', 'cloudwatch']
      },
      logging: {
        level: 'info',
        format: 'json',
        destinations: ['stdout', 'elasticsearch']
      },
      tracing: {
        enabled: true,
        samplingRate: 0.1,
        exporter: 'jaeger'
      },
      alerts: {
        enabled: true,
        rules: [
          {
            name: 'high-latency',
            condition: 'p95_latency > 500',
            threshold: 500,
            duration: '5m',
            severity: 'warning',
            annotations: {
              summary: 'High prediction latency detected',
              description: 'P95 latency is above 500ms for 5 minutes'
            }
          },
          {
            name: 'error-rate',
            condition: 'error_rate > 0.05',
            threshold: 0.05,
            duration: '2m',
            severity: 'critical',
            annotations: {
              summary: 'High error rate detected',
              description: 'Error rate is above 5% for 2 minutes'
            }
          }
        ]
      }
    },
    deployment: {
      strategy: 'canary' as DeploymentStrategy,
      canary: {
        steps: 5,
        interval: '5m',
        threshold: 0.95,
        analysis: {
          metrics: ['success_rate', 'latency_p95', 'error_rate'],
          successCriteria: {
            success_rate: 0.98,
            latency_p95: 300,
            error_rate: 0.02
          }
        }
      },
      rollback: {
        automatic: true,
        failureThreshold: 0.9,
        successThreshold: 0.98
      }
    },
    security: {
      tls: {
        enabled: true
      },
      networkPolicies: {
        ingress: [{
          from: [{ podSelector: { app: 'api-gateway' } }],
          ports: [{ protocol: 'TCP', port: 8080 }]
        }],
        egress: [{
          to: [{ podSelector: { app: 'model-storage' } }],
          ports: [{ protocol: 'TCP', port: 5432 }]
        }]
      },
      secrets: {
        provider: 'kubernetes',
        path: 'ml-models'
      }
    }
  },

  // Real-time inference
  realtimeInference: {
    model: {
      requirements: {
        cpu: 2,
        memory: '4Gi',
        gpu: false
      }
    },
    serving: {
      replicas: {
        min: 3,
        max: 20,
        target: 5
      },
      endpoints: {
        predict: '/v1/models/:model/predict:real-time',
        health: '/health',
        metrics: '/metrics'
      },
      authentication: {
        enabled: true,
        method: 'jwt' as const
      }
    },
    scaling: {
      policy: 'predictive' as ScalingPolicy,
      metrics: {
        targetCPU: 50,
        targetLatency: 50
      },
      behavior: {
        scaleUp: {
          stabilizationWindow: 30,
          policies: [
            { type: 'Percent', value: 200, periodSeconds: 30 }
          ]
        },
        scaleDown: {
          stabilizationWindow: 180,
          policies: [
            { type: 'Pods', value: 1, periodSeconds: 60 }
          ]
        }
      }
    },
    monitoring: {
      metrics: {
        enabled: true,
        interval: 10,
        exporters: ['prometheus']
      },
      logging: {
        level: 'info',
        format: 'json',
        destinations: ['stdout']
      },
      tracing: {
        enabled: true,
        samplingRate: 0.01,
        exporter: 'otlp'
      },
      alerts: {
        enabled: true,
        rules: [
          {
            name: 'sla-violation',
            condition: 'latency_p99 > 100',
            threshold: 100,
            duration: '1m',
            severity: 'critical',
            annotations: {
              summary: 'SLA violation - latency too high',
              description: 'P99 latency exceeds 100ms SLA'
            }
          }
        ]
      }
    },
    deployment: {
      strategy: 'blue-green' as DeploymentStrategy,
      blueGreen: {
        autoPromote: true,
        promotionDelay: '10m',
        scaleDownDelay: '5m'
      },
      rollback: {
        automatic: true,
        failureThreshold: 0.95,
        successThreshold: 0.99
      }
    },
    security: {
      tls: {
        enabled: true
      },
      networkPolicies: {
        ingress: [{
          from: [{ namespaceSelector: { name: 'ingress' } }],
          ports: [{ protocol: 'TCP', port: 443 }]
        }],
        egress: []
      },
      secrets: {
        provider: 'vault',
        path: 'secret/ml-models'
      }
    }
  }
} as const;

// Helper to validate deployment config
export function validateDeploymentConfig(config: ProductionDeploymentConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate model config
  if (!config.model.id) errors.push('Model ID is required');
  if (!config.model.version) errors.push('Model version is required');
  if (!config.model.artifactPath) errors.push('Model artifact path is required');

  // Validate serving config
  if (config.serving.replicas.min > config.serving.replicas.max) {
    errors.push('Minimum replicas cannot exceed maximum replicas');
  }
  if (config.serving.replicas.target < config.serving.replicas.min ||
      config.serving.replicas.target > config.serving.replicas.max) {
    errors.push('Target replicas must be between min and max');
  }

  // Validate scaling config
  if (config.scaling.metrics.targetCPU && 
      (config.scaling.metrics.targetCPU < 0 || config.scaling.metrics.targetCPU > 100)) {
    errors.push('Target CPU must be between 0 and 100');
  }

  // Validate monitoring config
  if (config.monitoring.tracing.samplingRate < 0 || 
      config.monitoring.tracing.samplingRate > 1) {
    errors.push('Sampling rate must be between 0 and 1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Generate Kubernetes manifests from config
export function generateK8sManifests(config: ProductionDeploymentConfig): {
  deployment: any;
  service: any;
  hpa: any;
  configMap: any;
  networkPolicy?: any;
} {
  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: `ml-model-${config.model.id}`,
      labels: {
        app: `ml-model-${config.model.id}`,
        version: config.model.version
      }
    },
    spec: {
      replicas: config.serving.replicas.target,
      selector: {
        matchLabels: {
          app: `ml-model-${config.model.id}`
        }
      },
      template: {
        metadata: {
          labels: {
            app: `ml-model-${config.model.id}`,
            version: config.model.version
          }
        },
        spec: {
          containers: [{
            name: 'model-server',
            image: `ml-models/${config.model.id}:${config.model.version}`,
            ports: [{ containerPort: 8080 }],
            resources: {
              requests: {
                cpu: `${config.model.requirements.cpu}`,
                memory: config.model.requirements.memory
              },
              limits: {
                cpu: `${config.model.requirements.cpu * 2}`,
                memory: config.model.requirements.memory
              }
            },
            env: [
              { name: 'MODEL_PATH', value: config.model.artifactPath },
              { name: 'LOG_LEVEL', value: config.monitoring.logging.level },
              { name: 'METRICS_ENABLED', value: String(config.monitoring.metrics.enabled) }
            ],
            livenessProbe: {
              httpGet: {
                path: config.serving.endpoints.health,
                port: 8080
              },
              initialDelaySeconds: 30,
              periodSeconds: 10
            },
            readinessProbe: {
              httpGet: {
                path: config.serving.endpoints.health,
                port: 8080
              },
              initialDelaySeconds: 10,
              periodSeconds: 5
            }
          }]
        }
      }
    }
  };

  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: `ml-model-${config.model.id}`,
      labels: {
        app: `ml-model-${config.model.id}`
      }
    },
    spec: {
      selector: {
        app: `ml-model-${config.model.id}`
      },
      ports: [{
        port: 80,
        targetPort: 8080,
        protocol: 'TCP'
      }],
      type: 'ClusterIP'
    }
  };

  const hpa = {
    apiVersion: 'autoscaling/v2',
    kind: 'HorizontalPodAutoscaler',
    metadata: {
      name: `ml-model-${config.model.id}`
    },
    spec: {
      scaleTargetRef: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        name: `ml-model-${config.model.id}`
      },
      minReplicas: config.serving.replicas.min,
      maxReplicas: config.serving.replicas.max,
      metrics: [
        ...(config.scaling.metrics.targetCPU ? [{
          type: 'Resource',
          resource: {
            name: 'cpu',
            target: {
              type: 'Utilization',
              averageUtilization: config.scaling.metrics.targetCPU
            }
          }
        }] : []),
        ...(config.scaling.metrics.targetLatency ? [{
          type: 'Pods',
          pods: {
            metric: {
              name: 'latency_p95'
            },
            target: {
              type: 'AverageValue',
              averageValue: `${config.scaling.metrics.targetLatency}m`
            }
          }
        }] : [])
      ],
      behavior: config.scaling.behavior
    }
  };

  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: `ml-model-${config.model.id}-config`
    },
    data: {
      'model-config.json': JSON.stringify({
        model: config.model,
        serving: config.serving,
        monitoring: config.monitoring
      })
    }
  };

  return {
    deployment,
    service,
    hpa,
    configMap
  };
}